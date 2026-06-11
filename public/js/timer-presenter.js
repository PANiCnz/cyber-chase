const timerValue =
    document.getElementById('timerValue');
const timerStatus =
    document.getElementById('timerStatus');

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
            ? 'Question active'
            : 'Waiting for question';
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

setInterval(refreshTimer, 250);
refreshTimer();
