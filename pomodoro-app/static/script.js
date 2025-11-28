// Pomodoro Timer JavaScript Application

class PomodoroTimer {
    constructor() {
        // Timer settings (in seconds)
        this.settings = {
            workDuration: 1500,     // 25 minutes
            shortBreak: 300,        // 5 minutes
            longBreak: 900,         // 15 minutes
            sessionsUntilLongBreak: 4
        };

        // Timer state
        this.state = {
            currentSession: 'work',    // 'work', 'short-break', 'long-break'
            timeRemaining: this.settings.workDuration,
            isRunning: false,
            isPaused: false,
            cycleCount: 1,
            sessionCount: 1,
            totalSessions: 0,
            completedSessions: 0,
            startTime: null,
            interval: null
        };

        // DOM elements
        this.elements = {
            timerDisplay: document.getElementById('timer-display'),
            sessionType: document.getElementById('session-type'),
            cycleCount: document.getElementById('cycle-count'),
            sessionCount: document.getElementById('session-count'),
            timerStatus: document.getElementById('timer-status'),
            nextSession: document.getElementById('next-session'),
            progressCircle: document.getElementById('progress-circle'),
            startBtn: document.getElementById('start-btn'),
            pauseBtn: document.getElementById('pause-btn'),
            stopBtn: document.getElementById('stop-btn'),
            skipBtn: document.getElementById('skip-btn'),
            workDuration: document.getElementById('work-duration'),
            breakDuration: document.getElementById('break-duration'),
            longBreakDuration: document.getElementById('long-break-duration'),
            historyToggleBtn: document.getElementById('history-toggle-btn'),
            sessionHistory: document.getElementById('session-history'),
            totalSessionsEl: document.getElementById('total-sessions'),
            completedSessionsEl: document.getElementById('completed-sessions'),
            totalTimeEl: document.getElementById('total-time'),
            historyItems: document.getElementById('history-items')
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateDisplay();
        this.loadSettings();
        this.loadSessionHistory();
        this.updateBodyClass();
    }

    bindEvents() {
        // Control buttons
        this.elements.startBtn.addEventListener('click', () => this.start());
        this.elements.pauseBtn.addEventListener('click', () => this.pause());
        this.elements.stopBtn.addEventListener('click', () => this.stop());
        this.elements.skipBtn.addEventListener('click', () => this.skip());

        // Settings
        this.elements.workDuration.addEventListener('change', (e) => {
            this.settings.workDuration = parseInt(e.target.value);
            if (this.state.currentSession === 'work' && !this.state.isRunning) {
                this.state.timeRemaining = this.settings.workDuration;
                this.updateDisplay();
            }
        });

        this.elements.breakDuration.addEventListener('change', (e) => {
            this.settings.shortBreak = parseInt(e.target.value);
            if (this.state.currentSession === 'short-break' && !this.state.isRunning) {
                this.state.timeRemaining = this.settings.shortBreak;
                this.updateDisplay();
            }
        });

        this.elements.longBreakDuration.addEventListener('change', (e) => {
            this.settings.longBreak = parseInt(e.target.value);
            if (this.state.currentSession === 'long-break' && !this.state.isRunning) {
                this.state.timeRemaining = this.settings.longBreak;
                this.updateDisplay();
            }
        });

        // History toggle
        this.elements.historyToggleBtn.addEventListener('click', () => this.toggleHistory());

        // Page visibility API for tab switching
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.state.isRunning) {
                // Handle tab switching - could implement notifications here
                this.handleTabSwitch();
            }
        });
    }

    start() {
        if (this.state.isPaused) {
            // Resume from pause
            this.resume();
        } else {
            // Start new session
            this.startNewSession();
        }
    }

    startNewSession() {
        this.state.isRunning = true;
        this.state.isPaused = false;
        this.state.startTime = Date.now();

        // Log session start
        this.logSessionEvent('start');

        // Start countdown
        this.interval = setInterval(() => {
            this.tick();
        }, 1000);

        this.updateButtonStates();
        this.updateStatus('Running');
    }

    resume() {
        this.state.isRunning = true;
        this.state.isPaused = false;

        this.interval = setInterval(() => {
            this.tick();
        }, 1000);

        this.updateButtonStates();
        this.updateStatus('Running');

        // Log resume event
        this.logSessionEvent('resume');
    }

    pause() {
        this.state.isRunning = false;
        this.state.isPaused = true;

        clearInterval(this.interval);
        this.updateButtonStates();
        this.updateStatus('Paused');

        // Log pause event
        this.logSessionEvent('pause');
    }

    stop() {
        this.state.isRunning = false;
        this.state.isPaused = false;

        clearInterval(this.interval);

        // Reset timer to current session duration
        this.resetCurrentSession();

        this.updateButtonStates();
        this.updateStatus('Stopped');
        this.updateDisplay();

        // Log stop event
        this.logSessionEvent('stop');
    }

    skip() {
        // Log skip event before changing session
        this.logSessionEvent('skip');

        // Move to next session
        this.nextSession();

        if (this.state.isRunning) {
            // Continue to next session
            this.startNewSession();
        } else {
            this.updateButtonStates();
            this.updateDisplay();
        }
    }

    tick() {
        if (this.state.timeRemaining > 0) {
            this.state.timeRemaining--;
            this.updateDisplay();
        } else {
            // Session completed
            this.sessionComplete();
        }
    }

    sessionComplete() {
        clearInterval(this.interval);
        this.state.isRunning = false;

        // Log session completion
        this.logSessionEvent('complete');

        // Increment completed sessions
        this.state.completedSessions++;

        // Show notification (visual feedback)
        this.showSessionCompleteNotification();

        // Move to next session type
        this.nextSession();

        // Auto-start next session (optional - can be made configurable)
        // For now, we'll stop and let user manually start
        this.updateButtonStates();
        this.updateDisplay();
        this.updateStatus('Session Complete!');
    }

    nextSession() {
        if (this.state.currentSession === 'work') {
            // Increment session count
            this.state.sessionCount++;

            // Check if it's time for long break
            if (this.state.sessionCount > this.settings.sessionsUntilLongBreak) {
                this.state.currentSession = 'long-break';
                this.state.timeRemaining = this.settings.longBreak;
                this.state.cycleCount++;
                this.state.sessionCount = 1;
            } else {
                this.state.currentSession = 'short-break';
                this.state.timeRemaining = this.settings.shortBreak;
            }
        } else {
            // From break back to work
            this.state.currentSession = 'work';
            this.state.timeRemaining = this.settings.workDuration;
        }

        this.state.totalSessions++;
        this.updateBodyClass();
        this.updateNextSessionDisplay();
    }

    resetCurrentSession() {
        switch (this.state.currentSession) {
            case 'work':
                this.state.timeRemaining = this.settings.workDuration;
                break;
            case 'short-break':
                this.state.timeRemaining = this.settings.shortBreak;
                break;
            case 'long-break':
                this.state.timeRemaining = this.settings.longBreak;
                break;
        }
    }

    updateDisplay() {
        // Update timer display
        const minutes = Math.floor(this.state.timeRemaining / 60);
        const seconds = this.state.timeRemaining % 60;
        this.elements.timerDisplay.textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update progress circle
        this.updateProgressCircle();

        // Update session info
        this.updateSessionDisplay();
    }

    updateProgressCircle() {
        const sessionDuration = this.getSessionDuration();
        const progress = 1 - (this.state.timeRemaining / sessionDuration);
        const circumference = 2 * Math.PI * 140; // radius = 140
        const offset = circumference - (progress * circumference);

        this.elements.progressCircle.style.strokeDashoffset = offset;

        // Update circle color based on session type
        this.elements.progressCircle.className = `timer-progress ${this.state.currentSession}`;
    }

    getSessionDuration() {
        switch (this.state.currentSession) {
            case 'work':
                return this.settings.workDuration;
            case 'short-break':
                return this.settings.shortBreak;
            case 'long-break':
                return this.settings.longBreak;
            default:
                return this.settings.workDuration;
        }
    }

    updateSessionDisplay() {
        // Update session type
        const sessionNames = {
            'work': 'Work Session',
            'short-break': 'Short Break',
            'long-break': 'Long Break'
        };
        this.elements.sessionType.textContent = sessionNames[this.state.currentSession];

        // Update cycle and session counts
        this.elements.cycleCount.textContent = this.state.cycleCount;
        this.elements.sessionCount.textContent = this.state.sessionCount;
    }

    updateNextSessionDisplay() {
        let nextSession = '';
        if (this.state.currentSession === 'work') {
            if (this.state.sessionCount > this.settings.sessionsUntilLongBreak) {
                nextSession = 'Long Break';
            } else {
                nextSession = 'Short Break';
            }
        } else {
            nextSession = 'Work Session';
        }
        this.elements.nextSession.textContent = nextSession;
    }

    updateButtonStates() {
        if (this.state.isRunning) {
            this.elements.startBtn.disabled = true;
            this.elements.pauseBtn.disabled = false;
            this.elements.stopBtn.disabled = false;
            this.elements.skipBtn.disabled = false;
            this.elements.startBtn.textContent = 'Running';
        } else if (this.state.isPaused) {
            this.elements.startBtn.disabled = false;
            this.elements.pauseBtn.disabled = true;
            this.elements.stopBtn.disabled = false;
            this.elements.skipBtn.disabled = false;
            this.elements.startBtn.textContent = 'Resume';
        } else {
            this.elements.startBtn.disabled = false;
            this.elements.pauseBtn.disabled = true;
            this.elements.stopBtn.disabled = true;
            this.elements.skipBtn.disabled = true;
            this.elements.startBtn.textContent = 'Start';
        }
    }

    updateStatus(status) {
        this.elements.timerStatus.textContent = status;
    }

    updateBodyClass() {
        // Remove existing session classes
        document.body.classList.remove('session-work', 'session-short-break', 'session-long-break');
        // Add current session class
        document.body.classList.add(`session-${this.state.currentSession}`);
    }

    showSessionCompleteNotification() {
        // Visual notification
        this.elements.timerDisplay.classList.add('flash');
        setTimeout(() => {
            this.elements.timerDisplay.classList.remove('flash');
        }, 1000);

        // Browser notification (if supported and permitted)
        this.showBrowserNotification();
    }

    showBrowserNotification() {
        if ('Notification' in window && Notification.permission === 'granted') {
            const sessionNames = {
                'work': 'Work session',
                'short-break': 'Short break',
                'long-break': 'Long break'
            };

            new Notification('Pomodoro Timer', {
                body: `${sessionNames[this.state.currentSession]} completed!`,
                icon: '/static/favicon.ico' // Add favicon if available
            });
        }
    }

    handleTabSwitch() {
        // Could implement additional logic for when user switches tabs
        // For example, showing more prominent notifications
        console.log('Tab switched while timer running');
    }

    loadSettings() {
        // Load settings from localStorage if available
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.settings = { ...this.settings, ...settings };

            // Update select elements
            this.elements.workDuration.value = this.settings.workDuration;
            this.elements.breakDuration.value = this.settings.shortBreak;
            this.elements.longBreakDuration.value = this.settings.longBreak;
        }
    }

    saveSettings() {
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
    }

    toggleHistory() {
        const isHidden = this.elements.sessionHistory.classList.contains('hidden');
        if (isHidden) {
            this.elements.sessionHistory.classList.remove('hidden');
            this.elements.historyToggleBtn.textContent = 'Hide History';
            this.loadSessionHistory();
        } else {
            this.elements.sessionHistory.classList.add('hidden');
            this.elements.historyToggleBtn.textContent = 'Show History';
        }
    }

    async loadSessionHistory() {
        try {
            const response = await fetch('/sessions');
            if (response.ok) {
                const sessions = await response.json();
                this.displaySessionHistory(sessions);
                this.updateHistoryStats(sessions);
            }
        } catch (error) {
            console.error('Error loading session history:', error);
        }
    }

    displaySessionHistory(sessions) {
        this.elements.historyItems.innerHTML = '';

        if (sessions.length === 0) {
            this.elements.historyItems.innerHTML = '<li class="history-item">No sessions recorded yet.</li>';
            return;
        }

        // Show last 10 sessions
        const recentSessions = sessions.slice(-10).reverse();

        recentSessions.forEach(session => {
            const li = document.createElement('li');
            li.className = 'history-item';

            const sessionType = session.session_type.replace('-', ' ');
            const timestamp = new Date(session.timestamp).toLocaleString();
            const duration = session.duration ? this.formatDuration(session.duration) : 'N/A';

            li.innerHTML = `
                <div class="history-item-info">
                    <span class="history-session-type">${sessionType}</span>
                    <span class="history-timestamp">${timestamp}</span>
                </div>
                <span class="history-duration">${duration}</span>
            `;

            this.elements.historyItems.appendChild(li);
        });
    }

    updateHistoryStats(sessions) {
        const completedSessions = sessions.filter(s => s.action === 'complete').length;
        const totalTime = sessions
            .filter(s => s.action === 'complete' && s.duration)
            .reduce((sum, s) => sum + s.duration, 0);

        this.elements.totalSessionsEl.textContent = sessions.length;
        this.elements.completedSessionsEl.textContent = completedSessions;
        this.elements.totalTimeEl.textContent = this.formatDuration(totalTime);
    }

    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    }

    // This will be implemented in Step 6
    async logSessionEvent(action) {
        const sessionData = {
            session_type: this.state.currentSession,
            action: action,
            timestamp: new Date().toISOString(),
            duration: action === 'complete' ? this.getSessionDuration() : this.getSessionDuration() - this.state.timeRemaining,
            cycle_count: this.state.cycleCount,
            session_count: this.state.sessionCount
        };

        try {
            await this.sendToBackend(sessionData);
        } catch (error) {
            console.error('Error logging session event:', error);
            // Continue operation even if logging fails
        }
    }

    async sendToBackend(sessionData) {
        const response = await fetch('/log_session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Session logged successfully:', result);
        return result;
    }

    // Request notification permission on first interaction
    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

// Initialize the timer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.pomodoroTimer = new PomodoroTimer();

    // Request notification permission on first user interaction
    document.addEventListener('click', () => {
        window.pomodoroTimer.requestNotificationPermission();
    }, { once: true });
});