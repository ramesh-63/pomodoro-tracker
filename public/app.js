const MAX_MINUTES = 120;
const STEP_MINUTES = 5;
const DIAL_RADIUS = 100;
const CENTER = 120;
const CIRCUMFERENCE = 2 * Math.PI * DIAL_RADIUS;

let durationMinutes = 25;
let remainingSeconds = durationMinutes * 60;
let intervalId = null;
let isSaving = false;
let isDragging = false;

const display = document.getElementById('display');
const dialLabel = document.getElementById('dial-label');
const dial = document.getElementById('dial');
const dialArc = document.getElementById('dial-arc');
const dialKnob = document.getElementById('dial-knob');
const subjectInput = document.getElementById('subject');
const startBtn = document.getElementById('start');
const pauseBtn = document.getElementById('pause');
const resetBtn = document.getElementById('reset');
const minusBtn = document.getElementById('minus');
const plusBtn = document.getElementById('plus');
const presetBtns = document.querySelectorAll('.chip');
const message = document.getElementById('message');
const progressBar = document.getElementById('progress-bar');
const todayTotal = document.getElementById('today-total');
const dailyList = document.getElementById('daily-list');
const sessionList = document.getElementById('session-list');

// ---------- Helpers ----------

function isLocked() {
  return intervalId !== null || isSaving;
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function formatMinutes(total) {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDate(date) {
  return date.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

function setMessage(text, type = '') {
  message.textContent = text;
  message.className = `message ${type}`.trim();
}

// ---------- Timer and dial rendering ----------

function render() {
  const minutes = pad(Math.floor(remainingSeconds / 60));
  const seconds = pad(remainingSeconds % 60);
  const time = `${minutes}:${seconds}`;

  display.textContent = time;
  document.title = `${time} - Pomodoro Study Tracker`;

  // Dial shows remaining time as a fraction of the max (120 minutes)
  const fraction = remainingSeconds / (MAX_MINUTES * 60);
  dialArc.style.strokeDashoffset = CIRCUMFERENCE * (1 - fraction);

  const angle = fraction * 2 * Math.PI - Math.PI / 2;
  dialKnob.setAttribute('cx', CENTER + DIAL_RADIUS * Math.cos(angle));
  dialKnob.setAttribute('cy', CENTER + DIAL_RADIUS * Math.sin(angle));

  // Progress bar shows elapsed part of the session
  const totalSeconds = durationMinutes * 60;
  progressBar.style.width = `${((totalSeconds - remainingSeconds) / totalSeconds) * 100}%`;
}

function setDuration(minutes) {
  if (isLocked()) return;
  durationMinutes = Math.min(MAX_MINUTES, Math.max(1, Math.round(minutes)));
  remainingSeconds = durationMinutes * 60;
  render();
  updatePresets();
  updateButtons();
}

function updatePresets() {
  presetBtns.forEach(btn => {
    btn.classList.toggle('active', Number(btn.dataset.minutes) === durationMinutes);
  });
}

function updateButtons() {
  const running = intervalId !== null;
  const locked = isLocked();
  const atFullDuration = remainingSeconds === durationMinutes * 60;

  startBtn.disabled = locked;
  pauseBtn.disabled = !running;
  minusBtn.disabled = locked || durationMinutes <= 1;
  plusBtn.disabled = locked || durationMinutes >= MAX_MINUTES;
  presetBtns.forEach(btn => { btn.disabled = locked; });
  subjectInput.disabled = running;

  dial.classList.toggle('locked', locked);
  dialLabel.textContent = running ? 'remaining' : 'drag to set';
  startBtn.textContent = atFullDuration ? 'Start' : 'Resume';
}

// ---------- Dial dragging ----------

function pointerToMinutes(e) {
  const rect = dial.getBoundingClientRect();
  const x = e.clientX - rect.left - rect.width / 2;
  const y = e.clientY - rect.top - rect.height / 2;

  // Angle measured clockwise from the top of the dial
  let angle = Math.atan2(y, x) + Math.PI / 2;
  if (angle < 0) angle += 2 * Math.PI;

  return (angle / (2 * Math.PI)) * MAX_MINUTES;
}

dial.addEventListener('pointerdown', e => {
  if (isLocked()) return;
  isDragging = true;
  dial.setPointerCapture(e.pointerId);
  setDuration(pointerToMinutes(e));
});

dial.addEventListener('pointermove', e => {
  if (!isDragging) return;
  setDuration(pointerToMinutes(e));
});

function stopDragging() {
  isDragging = false;
}

dial.addEventListener('pointerup', stopDragging);
dial.addEventListener('pointercancel', stopDragging);

// ---------- Timer controls ----------

function start() {
  if (isLocked()) return;
  setMessage('');
  intervalId = setInterval(tick, 1000);
  updateButtons();
}

function pause() {
  clearInterval(intervalId);
  intervalId = null;
  updateButtons();
}

function reset() {
  pause();
  remainingSeconds = durationMinutes * 60;
  setMessage('');
  render();
  updateButtons();
}

async function tick() {
  remainingSeconds--;
  render();

  if (remainingSeconds <= 0) {
    pause();
    await saveSession();
    remainingSeconds = durationMinutes * 60;
    render();
    updateButtons();
  }
}

async function saveSession() {
  isSaving = true;
  updateButtons();
  setMessage('Saving session...');

  const payload = {
    subject: subjectInput.value.trim() || null,
    duration_minutes: durationMinutes,
    completed: true
  };

  try {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unknown error');
    }

    setMessage('Session saved. Time for a break!', 'success');
    loadHistory();
  } catch (err) {
    setMessage(`Could not save session: ${err.message}`, 'error');
  } finally {
    isSaving = false;
    updateButtons();
  }
}

// ---------- History: sessions and daily totals ----------

function makeItem(titleText, metaText, valueText) {
  const li = document.createElement('li');

  const left = document.createElement('div');
  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = titleText;

  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = metaText;

  left.append(title, meta);

  const value = document.createElement('span');
  value.className = 'value';
  value.textContent = valueText;

  li.append(left, value);
  return li;
}

function showEmpty(listEl, text) {
  listEl.innerHTML = '';
  const li = document.createElement('li');
  const span = document.createElement('span');
  span.className = 'empty';
  span.textContent = text;
  li.appendChild(span);
  listEl.appendChild(li);
}

function renderSessions(rows) {
  sessionList.innerHTML = '';

  if (rows.length === 0) {
    showEmpty(sessionList, 'No sessions yet. Finish one to see it here.');
    return;
  }

  rows.forEach(row => {
    // started_at is saved when the session finishes, so subtract the duration to get the start time
    const end = new Date(row.started_at);
    const start = new Date(end.getTime() - row.duration_minutes * 60000);

    const card = document.createElement('li');
    card.className = 'session-card';

    // Top row: subject and duration badge
    const top = document.createElement('div');
    top.className = 'session-top';

    const subject = document.createElement('span');
    subject.className = 'session-subject';
    subject.textContent = row.subject || 'Untitled session';
    subject.title = row.subject || 'Untitled session';

    const duration = document.createElement('span');
    duration.className = 'session-duration';
    duration.textContent = `${row.duration_minutes}m`;

    top.append(subject, duration);

    // Time range
    const time = document.createElement('div');
    time.className = 'session-time';
    time.textContent = `${formatTime(start)} – ${formatTime(end)}`;

    // Date
    const date = document.createElement('div');
    date.className = 'session-date';
    date.textContent = formatDate(end);

    card.append(top, time, date);
    sessionList.appendChild(card);
  });
}

function renderDaily(rows) {
  dailyList.innerHTML = '';
  const todayKey = new Date().toLocaleDateString();
  let todayMinutes = 0;

  if (rows.length === 0) {
    showEmpty(dailyList, 'No completed sessions yet.');
    todayTotal.textContent = '0m';
    return;
  }

  rows.forEach(row => {
    // DATE() comes back as a date string or a timestamp, so handle both
    const day = typeof row.study_date === 'string' && row.study_date.length === 10
      ? new Date(`${row.study_date}T00:00`)
      : new Date(row.study_date);

    const isToday = day.toLocaleDateString() === todayKey;
    const total = Number(row.total_minutes);
    if (isToday) todayMinutes = total;

    const label = isToday ? `${formatDate(day)} (today)` : formatDate(day);
    const meta = `${row.session_count} session${row.session_count == 1 ? '' : 's'}`;

    dailyList.appendChild(makeItem(label, meta, formatMinutes(total)));
  });

  todayTotal.textContent = formatMinutes(todayMinutes);
}

async function loadHistory() {
  try {
    const [sessionsRes, dailyRes] = await Promise.all([
      fetch('/api/sessions'),
      fetch('/api/sessions/daily')
    ]);

    if (!sessionsRes.ok || !dailyRes.ok) {
      throw new Error('Request failed');
    }

    const sessions = await sessionsRes.json();
    const daily = await dailyRes.json();

    renderSessions(sessions.slice(0, 10));
    renderDaily(daily);
    if (typeof loadHeatmap === 'function') loadHeatmap();
  } catch (err) {
    showEmpty(sessionList, 'Could not load sessions.');
    showEmpty(dailyList, 'Could not load daily totals.');
  }
}

// ---------- Event listeners ----------

startBtn.addEventListener('click', start);
pauseBtn.addEventListener('click', pause);
resetBtn.addEventListener('click', reset);
minusBtn.addEventListener('click', () => setDuration(durationMinutes - STEP_MINUTES));
plusBtn.addEventListener('click', () => setDuration(durationMinutes + STEP_MINUTES));

presetBtns.forEach(btn => {
  btn.addEventListener('click', () => setDuration(Number(btn.dataset.minutes)));
});

// ---------- Init ----------

render();
updatePresets();
updateButtons();
loadHistory();