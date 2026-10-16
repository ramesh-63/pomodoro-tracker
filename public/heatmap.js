const HM_WEEKS = 53;
const HM_DAYS = HM_WEEKS * 7;

function hmPad(n) {
  return String(n).padStart(2, '0');
}

function hmKey(d) {
  return `${d.getFullYear()}-${hmPad(d.getMonth() + 1)}-${hmPad(d.getDate())}`;
}

function hmLevel(minutes) {
  if (!minutes) return 0;
  if (minutes < 25) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

async function loadHeatmap() {
  const container = document.getElementById('heatmap');
  if (!container) return;

  try {
    const res = await fetch('/api/sessions/daily');
    if (!res.ok) throw new Error('Request failed');
    const rows = await res.json();

    const totals = new Map();
    rows.forEach(row => {
      const d = typeof row.study_date === 'string' && row.study_date.length === 10
        ? new Date(`${row.study_date}T00:00`)
        : new Date(row.study_date);
      totals.set(hmKey(d), Number(row.total_minutes));
    });

    renderHeatmap(container, totals);
  } catch (err) {
    container.textContent = 'Could not load activity.';
  }
}

function renderHeatmap(container, totals) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start on the Sunday that begins the first column
  const start = new Date(today);
  start.setDate(today.getDate() - (HM_DAYS - 1) - today.getDay());

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  let activeDays = 0;
  let totalMinutes = 0;

  // Month labels row
  const months = document.createElement('div');
  months.className = 'hm-months';

  // Grid of day cells (column = week, row = weekday)
  const grid = document.createElement('div');
  grid.className = 'hm-grid';

  for (let col = 0; col < HM_WEEKS; col++) {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + col * 7);

    if (weekStart.getDate() <= 7) {
      const label = document.createElement('span');
      label.textContent = monthNames[weekStart.getMonth()];
      label.style.gridColumn = `${col + 1}`;
      months.appendChild(label);
    }
  }

  for (let i = 0; i < HM_DAYS; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);

    const cell = document.createElement('div');
    cell.className = 'hm-cell';

    if (d > today) {
      cell.classList.add('future');
    } else {
      const minutes = totals.get(hmKey(d)) || 0;
      cell.classList.add(`l${hmLevel(minutes)}`);

      if (minutes > 0) {
        activeDays++;
        totalMinutes += minutes;
      }

      const label = `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}: ${minutes} min`;
      cell.title = label;
      cell.setAttribute('aria-label', label);
    }

    grid.appendChild(cell);
  }

  // Weekday labels on the left (Mon, Wed, Fri)
  const days = document.createElement('div');
  days.className = 'hm-days';
  dayNames.forEach((name, idx) => {
    const span = document.createElement('span');
    span.textContent = idx % 2 === 1 ? name : '';
    days.appendChild(span);
  });

  const main = document.createElement('div');
  main.className = 'hm-main';
  main.append(months, grid);

  const inner = document.createElement('div');
  inner.className = 'hm-inner';
  inner.append(days, main);

  const wrap = document.createElement('div');
  wrap.className = 'hm-wrap';
  wrap.appendChild(inner);

  const footer = document.createElement('div');
  footer.className = 'hm-footer';

  const summary = document.createElement('span');
  summary.textContent = `${activeDays} active day${activeDays === 1 ? '' : 's'} · ${totalMinutes} min in the last year`;

  const legend = document.createElement('div');
  legend.className = 'hm-legend';
  legend.append('Less ');
  for (let l = 0; l <= 4; l++) {
    const box = document.createElement('div');
    box.className = `hm-cell l${l}`;
    legend.appendChild(box);
  }
  legend.append(' More');

  footer.append(summary, legend);
  container.innerHTML = '';
  container.append(wrap, footer);
}