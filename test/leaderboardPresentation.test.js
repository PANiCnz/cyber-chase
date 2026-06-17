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

const html = read("public/leaderboard.html");
const script = read("public/js/leaderboard.js");
const css = read("public/css/leaderboard.css");

test("leaderboard page presents live tournament standings", () => {
    assert.match(
        html,
        /TOURNAMENT LEADERBOARD/
    );
    assert.match(
        html,
        /id="leaderboardTeams"/
    );
    assert.match(
        script,
        /fetch\(\s*'\/api\/tournament\/live'/
    );
    assert.match(
        script,
        /socket\.on\('tournamentUpdated', loadLeaderboard\)/
    );
    assert.match(
        css,
        /\.leaderboard-shell\{[^}]*height:100vh/
    );
});

test("leaderboard exposes expandable team members", () => {
    assert.match(
        script,
        /className = 'team-toggle'/
    );
    assert.match(
        script,
        /toggle\.textContent = '\+'/
    );
    assert.match(
        script,
        /toggle\.textContent = expanded \? '\+' : '-'/
    );
    assert.match(
        script,
        /aria-expanded/
    );
    assert.match(
        script,
        /aria-label/
    );
    assert.match(
        script,
        /members\.classList\.toggle\('hidden'/
    );
    assert.match(
        css,
        /\.team-members\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/
    );
});

test("leaderboard labels team scores clearly", () => {
    assert.match(
        script,
        /scoreLabel\.textContent = 'Score'/
    );
    assert.match(
        script,
        /score\.append\(scoreLabel, scoreValue\)/
    );
    assert.match(
        css,
        /\.team-score-label\{[^}]*text-transform:uppercase/
    );
    assert.match(
        css,
        /\.team-row\{[^}]*grid-template-columns:80px 1fr 180px 72px/
    );
    assert.match(
        css,
        /\.team-toggle\{[^}]*width:52px/
    );
});

test("leaderboard keeps fixed rows and shows only visible leaders", () => {
    assert.match(
        css,
        /--leaderboard-row-height:118px/
    );
    assert.match(
        css,
        /\.leaderboard-teams\{[^}]*grid-auto-rows:var\(--leaderboard-row-height\)/
    );
    assert.match(
        css,
        /\.leaderboard-teams\{[^}]*overflow:hidden/
    );
    assert.match(
        script,
        /function getVisibleTeamLimit\(\)/
    );
    assert.match(
        script,
        /teams\.slice\(0, visibleLimit\)/
    );
    assert.match(
        script,
        /Showing top \$\{visibleTeams\.length\} of \$\{teams\.length\} teams/
    );
});
