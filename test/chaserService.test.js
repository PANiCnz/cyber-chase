const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const chaserService =
    require("../src/services/chaserService");

function writeCatalog(value) {
    const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), "cyber-chase-")
    );
    const file =
        path.join(directory, "chasers.json");

    fs.writeFileSync(
        file,
        JSON.stringify(value)
    );

    return file;
}

test.afterEach(() => {
    chaserService.resetCatalog();
});

test("loads the four active V3.5 chasers", () => {
    chaserService.loadChasers();

    assert.deepEqual(
        chaserService
            .listActiveChasers()
            .map(chaser => chaser.id),
        ["rob", "julian", "albert", "noel"]
    );
});

test("resolves active chasers by id and legacy name", () => {
    chaserService.loadChasers();

    assert.equal(
        chaserService.getChaserById("ROB").name,
        "Rob"
    );
    assert.equal(
        chaserService
            .findChaserByName(" julian ")
            .id,
        "julian"
    );
});

test("creates a whitelisted match snapshot", () => {
    const snapshot =
        chaserService.createMatchSnapshot({
            id: "rob",
            name: "Rob",
            department: "Information Security",
            title: "The Firewall",
            bio: "Profile text",
            active: true,
            internalNote: "Do not expose"
        });

    assert.deepEqual(snapshot, {
        id: "rob",
        name: "Rob",
        department: "Information Security",
        title: "The Firewall",
        bio: "Profile text"
    });
});

test("preserves an optional profile image in match snapshots", () => {
    const snapshot =
        chaserService.createMatchSnapshot({
            id: "image-test",
            name: "Image Test",
            department: "Security",
            image: "/images/chasers/image-test.jpg"
        });

    assert.equal(
        snapshot.image,
        "/images/chasers/image-test.jpg"
    );
});

test("filters inactive chasers", () => {
    const file = writeCatalog([
        {
            id: "active",
            name: "Active",
            department: "Security"
        },
        {
            id: "inactive",
            name: "Inactive",
            department: "Security",
            active: false
        }
    ]);

    chaserService.loadChasers(file);

    assert.deepEqual(
        chaserService
            .listActiveChasers()
            .map(chaser => chaser.id),
        ["active"]
    );
    assert.equal(
        chaserService.getChaserById(
            "inactive"
        ),
        null
    );
});

test("rejects duplicate ids", () => {
    const file = writeCatalog([
        {
            id: "same",
            name: "One",
            department: "Security"
        },
        {
            id: "same",
            name: "Two",
            department: "Security"
        }
    ]);

    assert.throws(
        () => chaserService.loadChasers(file),
        /Duplicate chaser id/
    );
});

test("rejects missing required fields", () => {
    const file = writeCatalog([
        {
            id: "missing-name",
            department: "Security"
        }
    ]);

    assert.throws(
        () => chaserService.loadChasers(file),
        /requires name/
    );
});
