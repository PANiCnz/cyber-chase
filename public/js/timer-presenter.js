const timerValue =
    document.getElementById('timerValue');
const timerStatus =
    document.getElementById('timerStatus');
const startTimerBtn =
    document.getElementById('startTimerBtn');
const pauseTimerBtn =
    document.getElementById('pauseTimerBtn');
const resetTimerBtn =
    document.getElementById('resetTimerBtn');

let timerRequestRunning = false;

function renderTimer(timer) {
    const remaining =
        Number.isFinite(timer?.remaining)
            ? timer.remaining
            : 60;
    const running = timer?.running === true;

    timerValue.textContent = remaining;
    timerValue.classList.toggle(
        'urgent',
        remaining <= 10
    );
    timerStatus.textContent = remaining === 0
        ? 'Time up'
        : running
            ? 'Running'
            : 'Paused';
    startTimerBtn.disabled =
        running || remaining === 0;
    pauseTimerBtn.disabled = !running;
}

async function refreshTimer() {
    if (timerRequestRunning) {
        return;
    }

    timerRequestRunning = true;

    try {
        const response = await fetch(
            '/api/timer/state'
        );

        if (!response.ok) {
            throw new Error();
        }

        renderTimer(await response.json());
    } catch {
        timerStatus.textContent =
            'Timer unavailable';
    } finally {
        timerRequestRunning = false;
    }
}

async function timerAction(action) {
    startTimerBtn.disabled = true;
    pauseTimerBtn.disabled = true;
    resetTimerBtn.disabled = true;

    try {
        const response = await fetch(
            `/api/timer/${action}`,
            { method: 'POST' }
        );

        if (!response.ok) {
            throw new Error();
        }

        renderTimer(await response.json());
    } catch {
        timerStatus.textContent =
            'Timer unavailable';
    } finally {
        resetTimerBtn.disabled = false;
    }
}

startTimerBtn.addEventListener(
    'click',
    () => timerAction('start')
);
pauseTimerBtn.addEventListener(
    'click',
    () => timerAction('pause')
);
resetTimerBtn.addEventListener(
    'click',
    () => timerAction('reset')
);

setInterval(refreshTimer, 500);
refreshTimer();
