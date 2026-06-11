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

const presenterHtml = read("public/presenter.html");
const presenterScript = read("public/js/presenter.js");
const presenterCss = read("public/css/presenter.css");
const displayHtml = read("public/display.html");
const displayScript = read("public/js/display.js");
const displayCss = read("public/css/display.css");

test("presenter shows completion and disables answer controls", () => {
    assert.match(
        presenterHtml,
        /id="presenterWinner"/
    );
    assert.match(
        presenterScript,
        /state\.winner/
    );
    assert.match(
        presenterScript,
        /setAnswerButtonsDisabled\(true\)/
    );
});

test("presenter renders stable answer rows without replacing HTML", () => {
    for (const id of [
        "answerTextA",
        "answerTextB",
        "answerTextC",
        "answerTextD"
    ]) {
        assert.match(
            presenterHtml,
            new RegExp(`id="${id}"`)
        );
    }

    assert.doesNotMatch(
        presenterScript,
        /answers\.innerHTML/
    );
    assert.match(
        presenterCss,
        /\.controls button \{[^}]*background:#1b5f8a/
    );
});

test("display shows a safe match-complete winner message", () => {
    assert.match(displayHtml, /id="winnerName"/);
    assert.match(displayHtml, /id="winnerRole"/);
    assert.match(displayHtml, /MATCH COMPLETE/);
    assert.match(
        displayScript,
        /winnerName\.textContent = state\.winner/
    );
    assert.match(
        displayScript,
        /CONTESTANT VICTORY/
    );
    assert.match(
        displayScript,
        /CHASER VICTORY/
    );
    assert.match(
        displayScript,
        /MATCH COMPLETE/
    );
    assert.match(
        displayCss,
        /\.winner-card\{/
    );
    assert.match(
        displayCss,
        /\.winner-name\{[^}]*font-size:7rem/
    );
    assert.doesNotMatch(
        displayScript,
        /winnerScreen\.innerHTML/
    );
});
