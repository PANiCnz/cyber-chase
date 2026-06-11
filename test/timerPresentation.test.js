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
const presenter =
    read("public/js/presenter.js");
const presenterTimer =
    read("public/js/timer-presenter.js");
const presenterCss =
    read("public/css/presenter.css");
const displayHtml =
    read("public/display.html");
const display =
    read("public/js/display.js");
const displayTimer =
    read("public/js/timer-display.js");
const displayCss =
    read("public/css/display.css");
const timerService =
    read("src/services/timerService.js");
const questionRoutes =
    read("src/routes/questionRoutes.js");
const server =
    read("src/server.js");

test("presenter provides round and timer controls", () => {
    assert.match(
        presenterHtml,
        /QUESTION TIMER/
    );
    assert.match(
        presenterHtml,
        /id="timerValue"/
    );
    assert.match(
        presenterHtml,
        /id="startRoundBtn"/
    );
    assert.match(
        presenterHtml,
        /id="pauseTimerBtn"/
    );
    assert.match(
        presenterHtml,
        /id="resetTimerBtn"/
    );
    assert.match(
        presenterHtml,
        /\/js\/timer-presenter\.js/
    );
    assert.match(
        presenterTimer,
        /\/api\/timer\/state/
    );
    assert.match(
        presenterTimer,
        /\/api\/timer\/\$\{action\}/
    );
    assert.match(
        presenterCss,
        /\.timer-value\.urgent/
    );
});

test("presenter submits the active question token", () => {
    assert.match(
        presenter,
        /currentQuestionToken =\s*q\.questionToken/
    );
    assert.match(
        presenter,
        /questionToken:\s*currentQuestionToken/
    );
    assert.match(
        presenter,
        /response\.status === 409/
    );
    assert.match(
        presenter,
        /fetch\(\s*'\/api\/question\/start'/
    );
    assert.match(
        presenter,
        /roundWaiting\.classList\.toggle/
    );
});

test("audience display announces timer updates and timeouts", () => {
    assert.match(
        displayHtml,
        /\/js\/timer-display\.js/
    );
    assert.match(
        displayHtml,
        /role="timer"/
    );
    assert.match(
        displayTimer,
        /\/api\/timer\/state/
    );
    assert.match(
        displayTimer,
        /setAttribute\(\s*'aria-label'/
    );
    assert.match(
        display,
        /result\.timeout[\s\S]*'TIME UP!'/
    );
    assert.match(
        display,
        /'WAITING FOR NEXT ROUND'/
    );
    assert.match(
        displayCss,
        /\.timer\.urgent/
    );
});

test("only the start-round endpoint arms the question timer", () => {
    assert.match(
        questionRoutes,
        /router\.post\("\/start"/
    );
    assert.match(
        questionRoutes,
        /timerService\.startQuestion/
    );
    assert.match(
        questionRoutes,
        /questionToken/
    );
    assert.match(
        timerService,
        /activeQuestionToken === questionToken/
    );
    assert.match(
        timerService,
        /expirationHandler/
    );
});

test("server converts expiry into an incorrect realtime result", () => {
    assert.match(
        server,
        /setExpirationHandler/
    );
    assert.match(
        server,
        /matchService\.processTimeout/
    );
    assert.match(
        server,
        /timeout: true/
    );
    assert.match(
        server,
        /io\.emit\("gameState"/
    );
});
