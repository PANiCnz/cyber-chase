const fs = require("fs");
const path = require("path");

const CHASERS_FILE = path.resolve(
    __dirname,
    "../../data/chasers.json"
);

let chasers = null;
let catalogFile = CHASERS_FILE;

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
        ...(typeof chaser.image === "string" &&
        chaser.image.trim() !== ""
            ? { image: chaser.image.trim() }
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
    let activeCount = 0;

    for (const chaser of normalized) {
        if (ids.has(chaser.id)) {
            throw new Error(
                `Duplicate chaser id: ${chaser.id}`
            );
        }

        ids.add(chaser.id);

        if (chaser.active) {
            activeCount++;
        }
    }

    if (activeCount > 4) {
        throw new Error(
            "A maximum of four chasers can be active"
        );
    }

    return normalized;
}

function loadChasers(file = catalogFile) {
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
    catalogFile = file;

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

function listAllChasers() {
    return getCatalog().map(toPublicChaser);
}

function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function createUniqueId(name, catalog) {
    const base = slugify(name) || "chaser";
    let id = base;
    let suffix = 2;

    while (
        catalog.some(chaser => chaser.id === id)
    ) {
        id = `${base}-${suffix}`;
        suffix++;
    }

    return id;
}

function writeCatalog(catalog) {
    const validated = validateChasers(catalog);
    const temporaryFile =
        `${catalogFile}.${process.pid}.tmp`;

    fs.writeFileSync(
        temporaryFile,
        `${JSON.stringify(validated, null, 2)}\n`,
        "utf8"
    );
    fs.renameSync(temporaryFile, catalogFile);
    chasers = validated;

    return listAllChasers();
}

function createChaser(input) {
    const catalog = getCatalog();
    const candidate = {
        ...input,
        id: createUniqueId(input?.name || "", catalog)
    };
    const normalized =
        normalizeChaser(candidate, catalog.length);

    writeCatalog([...catalog, normalized]);
    return toPublicChaser(normalized);
}

function updateChaser(id, input = {}) {
    if (typeof id !== "string") {
        return null;
    }

    const catalog = getCatalog();
    const index = catalog.findIndex(
        chaser =>
            chaser.id === id.trim().toLowerCase()
    );

    if (index === -1) {
        return null;
    }

    const updated = normalizeChaser(
        {
            ...catalog[index],
            name:
                input.name ??
                catalog[index].name,
            department:
                input.department ??
                catalog[index].department,
            bio:
                input.bio ??
                catalog[index].bio,
            image:
                input.image ??
                catalog[index].image,
            active:
                typeof input.active === "boolean"
                    ? input.active
                    : catalog[index].active,
            id: catalog[index].id,
            title:
                input.nickname ??
                input.title ??
                catalog[index].title
        },
        index
    );
    const nextCatalog = [...catalog];
    nextCatalog[index] = updated;
    writeCatalog(nextCatalog);

    return toPublicChaser(updated);
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
            : {}),
        ...(chaser.image
            ? { image: chaser.image }
            : {})
    };
}

function resetCatalog() {
    chasers = null;
    catalogFile = CHASERS_FILE;
}

module.exports = {
    loadChasers,
    listActiveChasers,
    listAllChasers,
    createChaser,
    updateChaser,
    getChaserById,
    findChaserByName,
    createMatchSnapshot,
    resetCatalog
};
