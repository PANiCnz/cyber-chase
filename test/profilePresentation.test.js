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

test("setup presents every chaser with image fallback support", () => {
    const html = read("public/setup.html");
    const script = read("public/js/setup.js");

    assert.match(html, /id="chaserGallery"/);
    assert.match(script, /chaser\.image/);
    assert.match(
        script,
        /profile-photo-placeholder/
    );
    assert.match(script, /chaser\.title/);
    assert.match(script, /chaser\.department/);
    assert.match(script, /chaser\.bio/);
});

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
