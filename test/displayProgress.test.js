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
