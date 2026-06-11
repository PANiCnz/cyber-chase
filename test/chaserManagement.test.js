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
const redeploy = read("redeploy.sh");

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
        "editorChaserImageUpload",
        "editorImagePreview",
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
    assert.match(
        presenterHtml,
        /Portrait 4:5 aspect ratio/
    );
    assert.match(
        presenterHtml,
        /1200 × 1500 px/
    );
    assert.match(
        presenterHtml,
        /800 × 1000 px/
    );
    assert.match(
        presenterHtml,
        /maximum 5 MB/
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
    assert.match(
        presenter,
        /\/api\/chasers\/upload-image/
    );
    assert.match(
        presenter,
        /Math\.abs\(ratio - 0\.8\)/
    );
    assert.match(
        presenter,
        /image\.naturalWidth < 800/
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

test("redeployment preserves uploaded chaser images", () => {
    assert.match(
        redeploy,
        /cp -a "\$BACKUP_DIR\/data\/\." "\$REPOSITORY_DIR\/data\/"/
    );
});
