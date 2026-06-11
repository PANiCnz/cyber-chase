const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const setupHtml = fs.readFileSync(
    path.resolve(__dirname, "../public/setup.html"),
    "utf8"
);
const setupScript = fs.readFileSync(
    path.resolve(
        __dirname,
        "../public/js/setup.js"
    ),
    "utf8"
);

test("setup page provides profile and status regions", () => {
    for (const id of [
        "chaserName",
        "chaserProfile",
        "chaserTitle",
        "chaserDepartment",
        "chaserBio",
        "startBtn",
        "status"
    ]) {
        assert.match(
            setupHtml,
            new RegExp(`id="${id}"`)
        );
    }

    assert.match(
        setupHtml,
        /id="startBtn" disabled/
    );
});

test("setup script loads profiles and submits id plus legacy name", () => {
    assert.match(
        setupScript,
        /fetch\('\/api\/chasers'\)/
    );
    assert.match(
        setupScript,
        /chaserId:\s*chaser\.id/
    );
    assert.match(
        setupScript,
        /chaserName:\s*chaser\.name/
    );
    assert.match(
        setupScript,
        /textContent/
    );
});
