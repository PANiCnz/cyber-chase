
const DEFAULT_DURATION = 60;

let remaining = DEFAULT_DURATION;
let interval = null;
let running = false;

function start() {
    if (running || remaining <= 0) {
        return state();
    }

    running = true;
    interval = setInterval(() => {
        remaining--;

        if (remaining <= 0) {
            remaining = 0;
            pause();
        }
    }, 1000);

    return state();
}

function pause() {
    running = false;
    clearInterval(interval);
    interval = null;

    return state();
}

function reset() {
    pause();
    remaining = DEFAULT_DURATION;

    return state();
}

function state() {
    return { remaining, running };
}

module.exports = { start, pause, reset, state };
