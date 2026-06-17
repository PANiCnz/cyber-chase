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
        /aria-expanded/
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
