const fs = require("fs");
const path = require("path");

const TOURNAMENTS_FILE = path.resolve(
    __dirname,
    "../../data/tournaments.json"
);

let state = null;
let dataFile = TOURNAMENTS_FILE;

function now() {
    return new Date().toISOString();
}

function slugify(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

function createUniqueId(name, items, fallback) {
    const base = slugify(name) || fallback;
    let id = base;
    let suffix = 2;

    while (items.some(item => item.id === id)) {
        id = `${base}-${suffix}`;
        suffix++;
    }

    return id;
}

function normalizeMember(member) {
    return typeof member === "string"
        ? member.trim()
        : "";
}

function normalizeTeam(team, index) {
    if (
        !team ||
        typeof team !== "object" ||
        Array.isArray(team)
    ) {
        throw new Error(
            `Team at index ${index} must be an object`
        );
    }

    const name =
        typeof team.name === "string"
            ? team.name.trim()
            : "";

    if (!name) {
        throw new Error(
            `Team at index ${index} requires a name`
        );
    }

    return {
        id:
            typeof team.id === "string" &&
            team.id.trim()
                ? team.id.trim()
                : slugify(name),
        name,
        members: Array.isArray(team.members)
            ? team.members.map(normalizeMember)
            : [],
        score:
            Number.isFinite(team.score) &&
            team.score >= 0
                ? team.score
                : null,
        enrolledAt:
            typeof team.enrolledAt === "string"
                ? team.enrolledAt
                : now(),
        completedAt:
            typeof team.completedAt === "string"
                ? team.completedAt
                : null
    };
}

function normalizeTournament(tournament, index) {
    if (
        !tournament ||
        typeof tournament !== "object" ||
        Array.isArray(tournament)
    ) {
        throw new Error(
            `Tournament at index ${index} must be an object`
        );
    }

    const name =
        typeof tournament.name === "string"
            ? tournament.name.trim()
            : "";

    if (!name) {
        throw new Error(
            `Tournament at index ${index} requires a name`
        );
    }

    return {
        id:
            typeof tournament.id === "string" &&
            tournament.id.trim()
                ? tournament.id.trim()
                : slugify(name),
        name,
        status:
            tournament.status === "open"
                ? "open"
                : "closed",
        createdAt:
            typeof tournament.createdAt === "string"
                ? tournament.createdAt
                : now(),
        closedAt:
            typeof tournament.closedAt === "string"
                ? tournament.closedAt
                : null,
        teams: Array.isArray(tournament.teams)
            ? tournament.teams.map(normalizeTeam)
            : []
    };
}

function normalizeState(value) {
    const tournaments = Array.isArray(value)
        ? value
        : Array.isArray(value?.tournaments)
            ? value.tournaments
            : [];
    const normalized =
        tournaments.map(normalizeTournament);
    const openCount = normalized.filter(
        tournament => tournament.status === "open"
    ).length;

    if (openCount > 1) {
        throw new Error(
            "Only one tournament can be open"
        );
    }

    return { tournaments: normalized };
}

function loadTournaments(file = dataFile) {
    let parsed;

    try {
        parsed = JSON.parse(
            fs.readFileSync(file, "utf8")
        );
    } catch (error) {
        throw new Error(
            `Unable to load tournaments: ${error.message}`
        );
    }

    dataFile = file;
    state = normalizeState(parsed);
    return state;
}

function getState() {
    if (!state) {
        loadTournaments();
    }

    return state;
}

function writeState(nextState) {
    const normalized =
        normalizeState(nextState);
    const temporaryFile =
        `${dataFile}.${process.pid}.tmp`;

    fs.writeFileSync(
        temporaryFile,
        `${JSON.stringify(normalized, null, 2)}\n`,
        "utf8"
    );
    fs.renameSync(temporaryFile, dataFile);
    state = normalized;

    return state;
}

function sortTeams(teams) {
    return [...teams].sort((a, b) => {
        const scoreA =
            Number.isFinite(a.score) ? a.score : -1;
        const scoreB =
            Number.isFinite(b.score) ? b.score : -1;

        if (scoreB !== scoreA) {
            return scoreB - scoreA;
        }

        return a.enrolledAt.localeCompare(
            b.enrolledAt
        );
    });
}

function toPublicTournament(tournament) {
    if (!tournament) {
        return null;
    }

    return {
        ...tournament,
        teams: sortTeams(tournament.teams).map(
            team => ({ ...team })
        )
    };
}

function listTournaments() {
    return getState().tournaments.map(
        toPublicTournament
    );
}

function getLiveTournament() {
    return toPublicTournament(
        getState().tournaments.find(
            tournament =>
                tournament.status === "open"
        )
    );
}

function createTournament(name) {
    const tournamentName =
        typeof name === "string"
            ? name.trim()
            : "";

    if (!tournamentName) {
        throw new Error(
            "Tournament name is required"
        );
    }

    const current = getState();

    if (
        current.tournaments.some(
            tournament =>
                tournament.status === "open"
        )
    ) {
        throw new Error(
            "Close the live tournament before creating another"
        );
    }

    const tournament = {
        id: createUniqueId(
            tournamentName,
            current.tournaments,
            "tournament"
        ),
        name: tournamentName,
        status: "open",
        createdAt: now(),
        closedAt: null,
        teams: []
    };

    writeState({
        tournaments: [
            ...current.tournaments,
            tournament
        ]
    });

    return toPublicTournament(tournament);
}

function findTournament(id) {
    if (typeof id !== "string") {
        return null;
    }

    return getState().tournaments.find(
        tournament => tournament.id === id.trim()
    );
}

function updateTournament(id, updater) {
    const current = getState();
    const index =
        current.tournaments.findIndex(
            tournament => tournament.id === id
        );

    if (index === -1) {
        return null;
    }

    const nextTournaments = [
        ...current.tournaments
    ];
    nextTournaments[index] = updater(
        nextTournaments[index]
    );
    const nextState = writeState({
        tournaments: nextTournaments
    });

    return toPublicTournament(
        nextState.tournaments[index]
    );
}

function closeTournament(id) {
    const tournament = findTournament(id);

    if (!tournament) {
        return null;
    }

    return updateTournament(id, current => ({
        ...current,
        status: "closed",
        closedAt: now()
    }));
}

function openTournament(id) {
    const tournament = findTournament(id);

    if (!tournament) {
        return null;
    }

    if (
        getState().tournaments.some(
            item =>
                item.status === "open" &&
                item.id !== id
        )
    ) {
        throw new Error(
            "Close the live tournament before opening another"
        );
    }

    return updateTournament(id, current => ({
        ...current,
        status: "open",
        closedAt: null
    }));
}

function enrollTeam(name, members = []) {
    const live = getState().tournaments.find(
        tournament =>
            tournament.status === "open"
    );

    if (!live) {
        return null;
    }

    const teamName =
        typeof name === "string"
            ? name.trim()
            : "";

    if (!teamName) {
        return null;
    }

    const existing = live.teams.find(
        team =>
            team.name.toLowerCase() ===
            teamName.toLowerCase()
    );

    if (existing) {
        return {
            tournamentId: live.id,
            tournamentName: live.name,
            teamId: existing.id
        };
    }

    const team = {
        id: createUniqueId(
            teamName,
            live.teams,
            "team"
        ),
        name: teamName,
        members: Array.isArray(members)
            ? members.map(normalizeMember)
            : [],
        score: null,
        enrolledAt: now(),
        completedAt: null
    };

    updateTournament(live.id, tournament => ({
        ...tournament,
        teams: [...tournament.teams, team]
    }));

    return {
        tournamentId: live.id,
        tournamentName: live.name,
        teamId: team.id
    };
}

function recordWin(match) {
    const enrollment = match?.tournament;

    if (
        !enrollment?.tournamentId ||
        !enrollment?.teamId ||
        !match?.contestant ||
        match.winner !== match.contestant.name
    ) {
        return null;
    }

    return updateTournament(
        enrollment.tournamentId,
        tournament => ({
            ...tournament,
            teams: tournament.teams.map(team =>
                team.id === enrollment.teamId
                    ? {
                        ...team,
                        score:
                            match.contestant.score,
                        completedAt: now()
                    }
                    : team
            )
        })
    );
}

function resetTournaments() {
    state = null;
    dataFile = TOURNAMENTS_FILE;
}

module.exports = {
    loadTournaments,
    listTournaments,
    getLiveTournament,
    createTournament,
    closeTournament,
    openTournament,
    enrollTeam,
    recordWin,
    resetTournaments
};
