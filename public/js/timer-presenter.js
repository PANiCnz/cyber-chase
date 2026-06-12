const timerValue =
    document.getElementById('timerValue');
const timerStatus =
    document.getElementById('timerStatus');
const pauseTimerBtn =
    document.getElementById('pauseTimerBtn');
const resetTimerBtn =
    document.getElementById('resetTimerBtn');

let timerRequestRunning = false;

function renderTimer(timer) {
    const remaining =
        Number.isFinite(timer?.remaining)
            ? timer.remaining
            : 120;
    const running = timer?.running === true;
    const active = timer?.active === true;

    timerValue.textContent = remaining;
    timerValue.classList.toggle(
        'urgent',
        remaining <= 10
    );
    timerStatus.textContent = !active
        ? 'Waiting for phase'
        : remaining === 0
            ? 'Time up'
            : running
                ? 'Rapid-fire phase active'
                : 'Timer paused';
    pauseTimerBtn.textContent =
        running ? 'PAUSE' : 'RESUME';
    pauseTimerBtn.disabled =
        !active || remaining === 0;
    resetTimerBtn.disabled = !active;
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
    pauseTimerBtn.disabled = true;
    resetTimerBtn.disabled = true;

    try {
        const response = await fetch(
            `/api/timer/${action}`,
            { method: 'POST' }
        );
        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.error ||
                'Timer unavailable'
            );
        }

        renderTimer(result);
    } catch (error) {
        timerStatus.textContent =
            error.message;
    }
}

pauseTimerBtn.addEventListener(
    'click',
    async () => {
        const action =
            pauseTimerBtn.textContent === 'PAUSE'
                ? 'pause'
                : 'start';
        await timerAction(action);
    }
);
resetTimerBtn.addEventListener(
    'click',
    () => timerAction('reset')
);
window.addEventListener(
    'roundStateChanged',
    refreshTimer
);

setInterval(refreshTimer, 250);
refreshTimer();
