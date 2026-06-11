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

const screens = [
    {
        name: "intro",
        html: read("public/intro.html"),
        script: read("public/js/intro.js"),
        ids: [
            "chaserName",
            "chaserTitle",
            "chaserDepartment",
            "chaserBio"
        ]
    },
    {
        name: "presenter",
        html: read("public/presenter.html"),
        script: read("public/js/presenter.js"),
        ids: [
            "presenterChaserName",
            "presenterChaserTitle",
            "presenterChaserDepartment",
            "presenterChaserBio"
        ]
    },
    {
        name: "display",
        html: read("public/display.html"),
        script: read("public/js/display.js"),
        ids: [
            "chaserName",
            "chaserTitle",
            "chaserDepartment",
            "chaserBio"
        ]
    }
];

for (const screen of screens) {
    test(`${screen.name} presents optional chaser profile fields`, () => {
        for (const id of screen.ids) {
            assert.match(
                screen.html,
                new RegExp(`id="${id}"`)
            );
        }

        assert.match(
            screen.script,
            /state\.chaser\?\.title/
        );
        assert.match(
            screen.script,
            /state\.chaser\?\.bio/
        );
        assert.match(
            screen.script,
            /textContent/
        );
        assert.match(
            screen.script,
            /Information Security/
        );
    });
}
