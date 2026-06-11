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

const presenterHtml = read("public/presenter.html");
const presenter = read("public/js/presenter.js");
const presenterCss = read("public/css/presenter.css");
const setup = read("public/js/setup.js");
const routes = read("src/routes/chaserRoutes.js");
const server = read("src/server.js");

test("presenter provides a complete chaser management screen", () => {
    for (const id of [
        "manageChasersBtn",
        "chaserManager",
        "managerChaserList",
        "addChaserBtn",
        "chaserEditor",
        "editorChaserName",
        "editorChaserNickname",
        "editorChaserDepartment",
        "editorChaserBio",
        "editorChaserImage",
        "editorChaserActive",
        "saveChaserBtn"
    ]) {
        assert.match(
            presenterHtml,
            new RegExp(`id="${id}"`)
        );
    }

    assert.match(
        presenterCss,
        /\.chaser-manager\{[^}]*position:fixed/
    );
});

test("presenter can add and update persisted profiles", () => {
    assert.match(
        presenter,
        /\/api\/chasers\/manage\/all/
    );
    assert.match(
        presenter,
        /method: id \? 'PUT' : 'POST'/
    );
    assert.match(
        presenter,
        /nickname:/
    );
    assert.match(
        presenter,
        /active: editorChaserActive\.checked/
    );
    assert.match(
        presenter,
        /of 4 chasers active/
    );
});

test("catalog updates refresh the audience showcase", () => {
    assert.match(
        routes,
        /io\.emit\("chasersUpdated"/
    );
    assert.match(
        server,
        /app\.set\("io", io\)/
    );
    assert.match(
        setup,
        /socket\.on\('chasersUpdated', loadChasers\)/
    );
    assert.match(
        presenter,
        /socket\.on\('chasersUpdated'/
    );
});
