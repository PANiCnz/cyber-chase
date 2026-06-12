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
            "chaserTitle"
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
            "chaserTitle"
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

test("intro presents the selected chaser image with a fallback", () => {
    const html = read("public/intro.html");
    const script = read("public/js/intro.js");
    const css = read("public/css/intro.css");

    assert.match(html, /id="chaserPhoto"/);
    assert.match(html, /id="contestantInitials"/);
    assert.match(script, /chaser\?\.image/);
    assert.match(
        script,
        /chaser-photo-placeholder/
    );
    assert.match(
        css,
        /--contestant:#00aef3/
    );
    assert.match(css, /--chaser:#f02b2f/);
    assert.match(
        css,
        /\.versus-panel\{[^}]*grid-template-columns:minmax\(0,1fr\) 220px minmax\(0,1fr\)/
    );
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
        if (screen.name === "presenter") {
            assert.match(
                screen.script,
                /state\.chaser\?\.bio/
            );
        }
        assert.match(
            screen.script,
            /textContent/
        );
        if (screen.name === "presenter") {
            assert.match(
                screen.script,
                /Information Security/
            );
        }
    });
}

test("intro omits the chaser department and bio", () => {
    const html = read("public/intro.html");
    const script = read("public/js/intro.js");

    assert.doesNotMatch(
        html,
        /id="chaserDepartment"/
    );
    assert.doesNotMatch(html, /id="chaserBio"/);
    assert.doesNotMatch(
        script,
        /state\.chaser\?\.department/
    );
    assert.doesNotMatch(
        script,
        /state\.chaser\?\.bio/
    );
});
