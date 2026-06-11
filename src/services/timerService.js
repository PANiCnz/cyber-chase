const DEFAULT_DURATION = 60;

let remaining = DEFAULT_DURATION;
let interval = null;
let running = false;
let activeQuestionToken = null;
let expirationHandler = null;

function state() {
    return { remaining, running };
}

function clearTimer() {
    clearInterval(interval);
    interval = null;
    running = false;
}

function start() {
    if (running || remaining <= 0) {
        return state();
    }

    running = true;
    interval = setInterval(tick, 1000);
    return state();
}

function pause() {
    clearTimer();
    return state();
}

function reset() {
    clearTimer();
    remaining = DEFAULT_DURATION;
    activeQuestionToken = null;
    return state();
}

function tick() {
    remaining--;

    if (remaining > 0) {
        return;
    }

    remaining = 0;
    clearTimer();

    const expiredQuestionToken =
        activeQuestionToken;
    activeQuestionToken = null;

    if (
        expiredQuestionToken &&
        expirationHandler
    ) {
        expirationHandler(
            expiredQuestionToken
        );
    }
}

function setExpirationHandler(handler) {
    expirationHandler =
        typeof handler === "function"
            ? handler
            : null;
}

function startQuestion(
    questionToken,
    duration = DEFAULT_DURATION
) {
    if (
        typeof questionToken !== "string" ||
        !questionToken
    ) {
        return state();
    }

    if (
        activeQuestionToken === questionToken
    ) {
        return state();
    }

    clearTimer();
    activeQuestionToken = questionToken;
    remaining = duration;
    return start();
}

function completeQuestion(questionToken) {
    if (
        activeQuestionToken !== questionToken
    ) {
        return false;
    }

    clearTimer();
    activeQuestionToken = null;
    remaining = DEFAULT_DURATION;
    return true;
}

module.exports = {
    start,
    pause,
    reset,
    state,
    setExpirationHandler,
    startQuestion,
    completeQuestion
};
