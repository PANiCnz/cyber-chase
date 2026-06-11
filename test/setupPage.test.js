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

const setupHtml = read("public/setup.html");
const setupScript = read("public/js/setup.js");
const setupCss = read("public/css/setup.css");

test("setup is a non-interactive chaser showcase", () => {
    assert.match(
        setupHtml,
        /id="chaserGallery"/
    );
    assert.match(
        setupHtml,
        /MEET THE CHASERS/
    );
    assert.doesNotMatch(setupHtml, /<input\b/);
    assert.doesNotMatch(setupHtml, /<select\b/);
    assert.doesNotMatch(setupHtml, /<button\b/);
    assert.doesNotMatch(
        setupScript,
        /\/api\/match\/start-match/
    );
});

test("setup renders image-ready profiles with placeholders", () => {
    assert.match(
        setupScript,
        /fetch\('\/api\/chasers'\)/
    );
    assert.match(
        setupScript,
        /chaser\.image/
    );
    assert.match(
        setupScript,
        /profile-photo-placeholder/
    );
    assert.match(
        setupScript,
        /createProfileCard/
    );
    assert.match(
        setupCss,
        /grid-template-columns:repeat\(4/
    );
    assert.match(
        setupCss,
        /height:100vh/
    );
});

test("setup opens the intro when the presenter launches", () => {
    assert.match(
        setupHtml,
        /\/socket\.io\/socket\.io\.js/
    );
    assert.match(
        setupScript,
        /socket\.on\('matchStarted', openMatch\)/
    );
    assert.match(
        setupScript,
        /window\.location = '\/intro\.html'/
    );
    assert.match(
        setupScript,
        /state\.firstRoundPending[\s\S]*'\/intro\.html'[\s\S]*'\/display\.html'/
    );
    assert.match(
        setupScript,
        /setInterval\(syncMatchState, 2000\)/
    );
});

test("setup refreshes automatically when chasers change", () => {
    assert.match(
        setupScript,
        /socket\.on\('chasersUpdated', loadChasers\)/
    );
    assert.match(
        setupScript,
        /No chasers are currently available/
    );
});
