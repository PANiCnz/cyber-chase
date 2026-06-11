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

const html = read("public/display.html");
const css = read("public/css/display.css");
const script = read("public/js/display.js");

test("display aligns both progress bars below equal detail regions", () => {
    assert.equal(
        (html.match(/class="player-details"/g) || [])
            .length,
        2
    );
    assert.match(
        css,
        /\.player-details\{[^}]*height:135px/
    );
});

test("display renders five visible progress segments", () => {
    assert.equal(
        (html.match(/role="progressbar"/g) || [])
            .length,
        2
    );
    assert.match(
        css,
        /\.progress::after\{[^}]*repeating-linear-gradient/
    );
    assert.match(css, /calc\(20% - 2px\)/);
});

test("display keeps progress accessibility values in sync", () => {
    assert.match(
        script,
        /contestantProgress\.setAttribute/
    );
    assert.match(
        script,
        /chaserProgress\.setAttribute/
    );
    assert.match(script, /'aria-valuenow'/);
});

test("display consistently maps blue to contestant and red to chaser", () => {
    assert.match(
        html,
        /class="player-card contestant-card"[\s\S]*id="contestantBar"/
    );
    assert.match(
        html,
        /class="player-card chaser-card"[\s\S]*id="chaserBar"/
    );
    assert.match(
        css,
        /--contestant:#00aef3/
    );
    assert.match(
        css,
        /--chaser:#f02b2f/
    );
    assert.match(
        css,
        /\.contestant-card \.bar\{[^}]*var\(--contestant\)/
    );
    assert.match(
        css,
        /\.chaser-card \.bar\{[^}]*var\(--chaser\)/
    );
    assert.match(
        script,
        /'chaser-question'[\s\S]*state\.currentPlayer === 'chaser'/
    );
});

test("display uses a compact 1080p question-first layout", () => {
    assert.match(html, /class="brand-header"/);
    assert.match(html, /class="timer-stage"/);
    assert.equal(
        (html.match(/class="answer-option"/g) || [])
            .length,
        4
    );
    assert.match(
        css,
        /\.display-shell\{[^}]*height:100vh/
    );
    assert.match(
        css,
        /#answers\{[^}]*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/
    );
});
