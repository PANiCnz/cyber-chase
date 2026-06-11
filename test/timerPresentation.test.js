const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

function read(relativePath) {
    return fs.readFileSync(
        path.resolve(__dirname, "..", relativePath),
        "utf8"
    );
}

const presenterHtml =
    read("public/presenter.html");
const presenterScript =
    read("public/js/timer-presenter.js");
const presenterCss =
    read("public/css/presenter.css");
const displayHtml =
    read("public/display.html");
const displayScript =
    read("public/js/timer-display.js");
const displayCss =
    read("public/css/display.css");
const timerService =
    read("src/services/timerService.js");

test("presenter provides active timer controls and status", () => {
    for (const id of [
        "timerValue",
        "timerStatus",
        "startTimerBtn",
        "pauseTimerBtn",
        "resetTimerBtn"
    ]) {
        assert.match(
            presenterHtml,
            new RegExp(`id="${id}"`)
        );
    }

    assert.match(
        presenterHtml,
        /\/js\/timer-presenter\.js/
    );
    assert.match(
        presenterScript,
        /\/api\/timer\/\$\{action\}/
    );
    assert.match(
        presenterScript,
        /setInterval\(refreshTimer, 500\)/
    );
    assert.match(
        presenterCss,
        /\.timer-value\.urgent/
    );
});

test("audience display loads and announces timer updates", () => {
    assert.match(
        displayHtml,
        /\/js\/timer-display\.js/
    );
    assert.match(
        displayHtml,
        /role="timer"/
    );
    assert.match(
        displayScript,
        /\/api\/timer\/state/
    );
    assert.match(
        displayScript,
        /setAttribute\(\s*'aria-label'/
    );
    assert.match(
        displayCss,
        /\.timer\.urgent/
    );
});

test("timer stops cleanly when the countdown reaches zero", () => {
    assert.match(
        timerService,
        /if \(remaining <= 0\) \{[\s\S]*remaining = 0;[\s\S]*pause\(\)/
    );
    assert.match(
        timerService,
        /running \|\| remaining <= 0/
    );
});
