const displayTimer =
    document.getElementById('timer');

let timerRefreshRunning = false;

function renderDisplayTimer(timer) {
    const remaining =
        Number.isFinite(timer?.remaining)
            ? timer.remaining
            : 60;

    displayTimer.textContent = remaining;
    displayTimer.classList.toggle(
        'urgent',
        remaining <= 10
    );
    displayTimer.setAttribute(
        'aria-label',
        `${remaining} seconds remaining`
    );
}

async function refreshDisplayTimer() {
    if (timerRefreshRunning) {
        return;
    }

    timerRefreshRunning = true;

    try {
        const response = await fetch(
            '/api/timer/state'
        );

        if (!response.ok) {
            return;
        }

        renderDisplayTimer(
            await response.json()
        );
    } catch {
        // Keep the last visible value during a transient connection failure.
    } finally {
        timerRefreshRunning = false;
    }
}

setInterval(refreshDisplayTimer, 250);
refreshDisplayTimer();
