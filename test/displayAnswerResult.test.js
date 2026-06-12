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

const server = read("src/server.js");
const presenter = read("public/js/presenter.js");
const displayHtml = read("public/display.html");
const displayScript = read("public/js/display.js");
const displayCss = read("public/css/display.css");

test("server relays presenter answer results to displays", () => {
    assert.match(
        server,
        /socket\.on\("answerResult"/
    );
    assert.match(
        server,
        /io\.emit\("answerResult"/
    );
    assert.match(
        presenter,
        /socket\.emit\('answerResult'/
    );
});

test("display provides correct and incorrect result messaging", () => {
    for (const id of [
        "answerResultOverlay",
        "answerResultPlayer",
        "answerResultMessage",
        "answerResultCorrect"
    ]) {
        assert.match(
            displayHtml,
            new RegExp(`id="${id}"`)
        );
    }

    assert.match(
        displayScript,
        /socket\.on\('answerResult'/
    );
    assert.match(displayScript, /CORRECT!/);
    assert.match(displayScript, /INCORRECT/);
    assert.match(
        displayCss,
        /\.answer-result-overlay\.correct/
    );
    assert.match(
        displayCss,
        /\.answer-result-overlay\.incorrect/
    );
    assert.match(
        displayScript,
        /state\.lastRoundResult/
    );
    assert.match(
        displayScript,
        /ANSWER_RESULT_DURATION = 1500/
    );
    assert.match(
        displayScript,
        /}, ANSWER_RESULT_DURATION\)/
    );
    assert.doesNotMatch(
        displayScript,
        /state\.roundActive && resultVisible[\s\S]*hideAnswerResult/
    );
    assert.doesNotMatch(
        displayScript,
        /}, 1800\);\s*}\s*socket\.on\('answerResult'/
    );
});

test("display updates stable answer nodes without opacity flashing", () => {
    for (const id of [
        "displayAnswerA",
        "displayAnswerB",
        "displayAnswerC",
        "displayAnswerD"
    ]) {
        assert.match(
            displayHtml,
            new RegExp(`id="${id}"`)
        );
    }

    assert.doesNotMatch(
        displayScript,
        /questionPanel\.style\.opacity/
    );
    assert.doesNotMatch(
        displayScript,
        /answers\.innerHTML/
    );
    assert.doesNotMatch(
        displayCss,
        /transition:opacity/
    );
});
