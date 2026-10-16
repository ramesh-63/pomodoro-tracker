# Pomodoro Study Tracker

A simple study timer that uses the Pomodoro technique to help you focus in timed sessions, then tracks your study time by day and by subject so you can see your progress over time.

## Features

- **Pomodoro timer:** Set a focus session by dragging the circular dial, using the `+5` / `−5` buttons, or picking a preset (15, 25, 45, or 60 minutes). Start, pause, and reset the timer as needed.
- **Subject tagging:** Optionally label each session (for example, "Math", "React", or "SQL") to see what you're spending time on.
- **Today's total:** The header shows how many minutes you've studied today.
- **Daily routine:** A summary of each day's total study time and number of sessions.
- **Yearly activity heatmap:** A GitHub-style grid showing your study days across the past year, with darker squares for more active days and a summary of active days and total minutes.
- **Recent sessions:** A scrollable list of your latest sessions with the subject, start and end times, and duration.

## Screenshot

<img width="1917" height="990" alt="image" src="https://github.com/user-attachments/assets/419c6d98-48b5-4603-971e-5f4ab6b51133" />


## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) [version]
- npm or yarn

### Installation

```bash
git clone https://github.com/[your-username]/[repo-name].git
cd [repo-name]
npm install
```

### Running the App

```bash
npm run dev
```

Then open [http://localhost:[port]](http://localhost:[port]) in your browser.

## How to Use

1. Type a subject (optional).
2. Set the duration by dragging the dial, pressing `+5` / `−5`, or choosing a preset.
3. Press **Start** to begin your focus session.
4. Use **Pause** to take a break mid-session, or **Reset** to clear the timer.
5. Check the **Daily routine**, **Yearly activity**, and **Recent sessions** panels to review your progress.

## Project Structure

```
[repo-name]/
├── src/
│   ├── components/   # Timer, dial, session list, activity heatmap
│   └── ...
├── screenshot.png
└── README.md
```

## Roadmap

- [ ] Browser notifications when a session ends
- [ ] Export session history as CSV
- [ ] Custom Pomodoro and break durations
- [ ] Filter statistics by subject

## Contributing

Contributions are welcome. Fork the repository, create a branch, make your changes, and open a pull request.
