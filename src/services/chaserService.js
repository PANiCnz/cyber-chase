const fs = require("fs");
const path = require("path");

const CHASERS_FILE = path.resolve(
    __dirname,
    "../../data/chasers.json"
);

let chasers = null;

function requireString(value, field, index) {
    if (
        typeof value !== "string" ||
        value.trim() === ""
    ) {
        throw new Error(
            `Chaser at index ${index} requires ${field}`
        );
    }

    return value.trim();
}

function normalizeChaser(chaser, index) {
    if (
        !chaser ||
        typeof chaser !== "object" ||
        Array.isArray(chaser)
    ) {
        throw new Error(
            `Chaser at index ${index} must be an object`
        );
    }

    const id = requireString(
        chaser.id,
        "id",
        index
    ).toLowerCase();

    if (!/^[a-z0-9-]+$/.test(id)) {
        throw new Error(
            `Chaser at index ${index} has an invalid id`
        );
    }

    return {
        id,
        name: requireString(
            chaser.name,
            "name",
            index
        ),
        department: requireString(
            chaser.department,
            "department",
            index
        ),
        ...(typeof chaser.title === "string" &&
        chaser.title.trim() !== ""
            ? { title: chaser.title.trim() }
            : {}),
        ...(typeof chaser.bio === "string" &&
        chaser.bio.trim() !== ""
            ? { bio: chaser.bio.trim() }
            : {}),
        active: chaser.active !== false
    };
}

function validateChasers(value) {
    if (!Array.isArray(value)) {
        throw new Error(
            "Chaser catalog must be an array"
        );
    }

    const normalized =
        value.map(normalizeChaser);

    const ids = new Set();

    for (const chaser of normalized) {
        if (ids.has(chaser.id)) {
            throw new Error(
                `Duplicate chaser id: ${chaser.id}`
            );
        }

        ids.add(chaser.id);
    }

    return normalized;
}

function loadChasers(file = CHASERS_FILE) {
    let parsed;

    try {
        parsed = JSON.parse(
            fs.readFileSync(file, "utf8")
        );
    } catch (error) {
        throw new Error(
            `Unable to load chaser catalog: ${error.message}`
        );
    }

    chasers = validateChasers(parsed);

    return chasers;
}

function getCatalog() {
    if (!chasers) {
        loadChasers();
    }

    return chasers;
}

function toPublicChaser(chaser) {
    return { ...chaser };
}

function listActiveChasers() {
    return getCatalog()
        .filter(chaser => chaser.active)
        .map(toPublicChaser);
}

function getChaserById(id) {
    if (typeof id !== "string") {
        return null;
    }

    const normalizedId =
        id.trim().toLowerCase();

    const chaser = getCatalog().find(
        item =>
            item.active &&
            item.id === normalizedId
    );

    return chaser
        ? toPublicChaser(chaser)
        : null;
}

function findChaserByName(name) {
    if (typeof name !== "string") {
        return null;
    }

    const normalizedName =
        name.trim().toLowerCase();

    const chaser = getCatalog().find(
        item =>
            item.active &&
            item.name.toLowerCase() ===
                normalizedName
    );

    return chaser
        ? toPublicChaser(chaser)
        : null;
}

function createMatchSnapshot(chaser) {
    if (!chaser) {
        return null;
    }

    return {
        id: chaser.id,
        name: chaser.name,
        department: chaser.department,
        ...(chaser.title
            ? { title: chaser.title }
            : {}),
        ...(chaser.bio
            ? { bio: chaser.bio }
            : {})
    };
}

function resetCatalog() {
    chasers = null;
}

module.exports = {
    loadChasers,
    listActiveChasers,
    getChaserById,
    findChaserByName,
    createMatchSnapshot,
    resetCatalog
};
