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

test("display aligns both segmented scores below equal detail regions", () => {
    assert.equal(
        (html.match(/class="player-details"/g) || [])
            .length,
        2
    );
    assert.match(
        css,
        /\.player-details\{[^}]*height:86px/
    );
});

test("display renders five discrete score segments per player", () => {
    assert.equal(
        (html.match(/role="progressbar"/g) || [])
            .length,
        2
    );
    assert.equal(
        (html.match(/class="score-segment"/g) || [])
            .length,
        10
    );
    assert.match(
        css,
        /\.score-segments\{[^}]*grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/
    );
    assert.match(
        script,
        /segment\.classList\.toggle\(\s*'filled'/
    );
});

test("display keeps progress accessibility values in sync", () => {
    assert.match(
        script,
        /contestantBar\.setAttribute/
    );
    assert.match(
        script,
        /chaserBar\.setAttribute/
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
        /\.contestant-card \.score-segment\{[^}]*var\(--contestant\)/
    );
    assert.match(
        css,
        /\.chaser-card \.score-segment\{[^}]*var\(--chaser\)/
    );
    assert.match(
        script,
        /'chaser-question'[\s\S]*state\.currentPlayer === 'chaser'/
    );
});

test("display presents only the chaser nickname", () => {
    assert.match(html, /id="chaserTitle"/);
    assert.doesNotMatch(html, /id="chaserName"/);
    assert.doesNotMatch(
        html,
        /id="chaserDepartment"/
    );
    assert.doesNotMatch(html, /id="chaserBio"/);
    assert.match(
        script,
        /state\.chaser\?\.title \|\| 'The Chaser'/
    );
    assert.doesNotMatch(
        script,
        /state\.chaser\?\.department/
    );
    assert.doesNotMatch(
        script,
        /state\.chaser\?\.bio/
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
    assert.match(
        css,
        /\.answer-option\{[^}]*font-size:clamp\(1\.7rem,2vw,2\.35rem\)/
    );
    assert.match(
        css,
        /\.answer-key\{[^}]*font-size:2\.15rem/
    );
});
