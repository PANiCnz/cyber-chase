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
        /id="tournamentScorePanel"/
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
    assert.match(
        setupCss,
        /--chaser:#f02b2f/
    );
    assert.match(
        setupCss,
        /\.chaser-card\{[^}]*var\(--chaser\)/
    );
});

test("setup shortens portraits for the five-panel layout", () => {
    assert.match(
        setupCss,
        /--profile-image-height:39vh/
    );
    assert.match(
        setupCss,
        /--profile-content-height:205px/
    );
    assert.match(
        setupCss,
        /\.chaser-card\{[^}]*grid-template-rows:\s*var\(--profile-image-height\)\s*var\(--profile-content-height\)/
    );
    assert.match(
        setupCss,
        /\.chaser-gallery\{[^}]*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/
    );
    assert.match(
        setupCss,
        /\.brand-kicker\{[^}]*font-size:1\.1rem/
    );
    assert.match(
        setupCss,
        /h1\{[^}]*font-size:5\.1875rem/
    );
    assert.match(
        setupCss,
        /\.showcase-title\{[^}]*font-size:1\.525rem/
    );
    assert.match(
        setupCss,
        /\.showcase-intro\{[^}]*font-size:1\.125rem/
    );
    assert.match(
        setupCss,
        /\.showcase-intro strong\{[^}]*font-size:1\.3rem/
    );
});

test("setup includes a fifth live tournament scoreboard panel", () => {
    assert.match(setupHtml, /LIVE TOURNAMENT/);
    assert.match(setupHtml, /id="tournamentName"/);
    assert.match(setupHtml, /id="tournamentTeams"/);
    assert.match(
        setupCss,
        /\.showcase-main\{[^}]*grid-template-columns:minmax\(0,4fr\) minmax\(250px,1fr\)/
    );
    assert.match(
        setupCss,
        /\.tournament-score-panel\{[^}]*var\(--contestant\)/
    );
    assert.match(
        setupScript,
        /fetch\(\s*'\/api\/tournament\/live'/
    );
    assert.match(
        setupScript,
        /socket\.on\('tournamentUpdated', loadTournament\)/
    );
});

test("setup uses fictional seeded personas and generated portraits", () => {
    const catalog = JSON.parse(
        read("data/chasers.json")
    );

    assert.equal(catalog.length, 4);
    assert.deepEqual(
        catalog.map(chaser => chaser.name),
        [
            "Maya Voss",
            "Elias Trent",
            "Nia Calder",
            "Marcus Vale"
        ]
    );
    assert.ok(
        catalog.every(
            chaser =>
                chaser.image.startsWith(
                    "/images/chasers/"
                )
        )
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

test("setup uses slow outward-pulsing waiting indicators", () => {
    assert.equal(
        (setupHtml.match(/class="status-dot /g) || [])
            .length,
        6
    );
    assert.match(
        setupHtml,
        /status-dots-left[\s\S]*pulse-step-3[\s\S]*pulse-step-2[\s\S]*pulse-step-1/
    );
    assert.match(
        setupHtml,
        /status-dots-right[\s\S]*pulse-step-1[\s\S]*pulse-step-2[\s\S]*pulse-step-3/
    );
    assert.match(
        setupCss,
        /\.showcase-status\{[^}]*font-size:1\.15rem/
    );
    assert.match(
        setupCss,
        /\.status-dot\{[^}]*animation:status-pulse 4\.8s/
    );
    assert.match(
        setupCss,
        /\.pulse-step-2\{animation-delay:1\.2s\}/
    );
    assert.match(
        setupCss,
        /\.pulse-step-3\{animation-delay:2\.4s\}/
    );
    assert.match(
        setupCss,
        /@media\(prefers-reduced-motion:reduce\)/
    );
});
