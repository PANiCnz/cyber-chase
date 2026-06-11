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
const presenterHtml = read("public/presenter.html");
const presenter = read("public/js/presenter.js");
const display = read("public/js/display.js");
const introHtml = read("public/intro.html");
const intro = read("public/js/intro.js");

test("presenter exposes new-match controls", () => {
    assert.match(presenterHtml, /id="newMatchBtn"/);
    assert.match(
        presenterHtml,
        /id="winnerNewMatchBtn"/
    );
    assert.match(
        presenterHtml,
        /id="presenterWinnerText"/
    );
});

test("presenter confirms active resets and calls coordinated API", () => {
    assert.match(
        presenter,
        /window\.confirm/
    );
    assert.match(
        presenter,
        /fetch\(\s*'\/api\/match\/reset'/
    );
    assert.match(
        presenter,
        /socket\.emit\('newMatch'\)/
    );
});

test("server broadcasts new-match navigation", () => {
    assert.match(
        server,
        /socket\.on\("newMatch"/
    );
    assert.match(
        server,
        /io\.emit\("newMatch"\)/
    );
});

test("presenter display and intro return to setup", () => {
    assert.match(
        presenter,
        /socket\.on\('newMatch'/
    );
    assert.match(
        display,
        /socket\.on\('newMatch'/
    );
    assert.match(
        intro,
        /socket\.on\('newMatch'/
    );

    for (const script of [
        presenter,
        display,
        intro
    ]) {
        assert.match(
            script,
            /window\.location = '\/setup\.html'/
        );
    }

    assert.match(
        presenter,
        /if \(!state\) \{[\s\S]*window\.location = '\/setup\.html'/
    );
    assert.match(
        display,
        /if \(!state\) \{[\s\S]*window\.location = '\/setup\.html'/
    );
    assert.match(
        intro,
        /if\(!state\) \{[\s\S]*window\.location = '\/setup\.html'/
    );

    assert.match(
        introHtml,
        /\/socket\.io\/socket\.io\.js/
    );
});
