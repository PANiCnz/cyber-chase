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

test("presenter owns match configuration and launch", () => {
    for (const id of [
        "setupTeamName",
        "setupTeamMember1",
        "setupTeamMember2",
        "setupTeamMember3",
        "setupTeamMember4",
        "setupContestantDifficulty",
        "setupChaserDifficulty",
        "setupChaser",
        "launchMatchBtn",
        "setupChaserProfile"
    ]) {
        assert.match(
            presenterHtml,
            new RegExp(`id="${id}"`)
        );
    }

    assert.match(
        presenter,
        /RANDOM_CHASER_ID\s*=\s*'random'/
    );
    assert.match(
        presenter,
        /Math\.floor\(\s*Math\.random\(\)\s*\*\s*availableChasers\.length/
    );
    assert.match(
        presenter,
        /fetch\(\s*'\/api\/match\/start-match'/
    );
    assert.match(
        presenter,
        /teamName,/
    );
    assert.match(
        presenter,
        /teamMembers,/
    );
    assert.match(
        presenter,
        /Enter all four team member names/
    );
    assert.match(
        presenter,
        /fetch\(\s*'\/api\/question\/difficulties'/
    );
    assert.match(
        presenter,
        /contestantDifficulty:\s*setupContestantDifficulty\.value/
    );
    assert.match(
        presenter,
        /chaserDifficulty:\s*setupChaserDifficulty\.value/
    );
    assert.match(
        presenter,
        /chaserId:\s*chaser\.id/
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

test("presenter launch moves the audience into the intro", () => {
    assert.match(
        presenter,
        /socket\.emit\('matchStarted'\)/
    );
    assert.match(
        server,
        /socket\.on\("matchStarted"/
    );
    assert.match(
        server,
        /io\.emit\("matchStarted"\)/
    );
});

test("display and intro return to setup while presenter keeps monitoring", () => {
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

    for (const script of [display, intro]) {
        assert.match(
            script,
            /window\.location = '\/setup\.html'/
        );
    }

    assert.doesNotMatch(
        presenter,
        /window\.location = '\/setup\.html'/
    );
    assert.match(
        presenter,
        /showWaitingState\(\)/
    );
    assert.match(
        presenter,
        /setInterval\(loadQuestion, 2000\)/
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

test("presenter provides a waiting state until a match exists", () => {
    assert.match(
        presenterHtml,
        /id="presenterWaiting"/
    );
    assert.match(
        presenter,
        /if \(!state\) \{[\s\S]*showWaitingState\(\)/
    );
    assert.match(
        presenter,
        /showGameState\(\)/
    );
});
