
let remaining = 60;
let interval = null;
let running = false;

function start() {
    if (running) return;
    running = true;
    interval = setInterval(() => {
        if (remaining > 0) remaining--;
    }, 1000);
}

function pause() {
    running = false;
    clearInterval(interval);
}

function reset() {
    remaining = 60;
    pause();
}

function state() {
    return { remaining, running };
}

module.exports = { start, pause, reset, state };
