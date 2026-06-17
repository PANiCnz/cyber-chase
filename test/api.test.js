const test = require("node:test");
const assert = require("node:assert/strict");

const { server } = require("../src/server");
const matchService =
    require("../src/services/matchService");
const timerService =
    require("../src/services/timerService");
const chaserService =
    require("../src/services/chaserService");
const tournamentService =
    require("../src/services/tournamentService");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

let baseUrl;

function loadEmptyTournamentStore() {
    const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), "cyber-chase-api-tournament-")
    );
    const file = path.join(
        directory,
        "tournaments.json"
    );
    fs.writeFileSync(
        file,
        JSON.stringify({ tournaments: [] })
    );
    tournamentService.loadTournaments(file);
}

test.before(async () => {
    await new Promise(resolve => {
        server.listen(0, "127.0.0.1", resolve);
    });

    const address = server.address();
    baseUrl =
        `http://127.0.0.1:${address.port}`;
});

test.beforeEach(() => {
    matchService.resetMatch();
    timerService.reset();
    chaserService.resetCatalog();
    tournamentService.resetTournaments();
    loadEmptyTournamentStore();
});

test.after(async () => {
    await new Promise((resolve, reject) => {
        server.close(error => {
            if (error) {
                reject(error);
                return;
            }

            resolve();
        });
    });
});

test("preserves match start and state response fields", async () => {
    const startResponse = await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                teamName: "Blue Team",
                teamMembers: [
                    "Alex",
                    "Sam",
                    "Jordan",
                    "Taylor"
                ],
                chaserName: "Maya Voss"
            })
        }
    );
    const match = await startResponse.json();

    assert.equal(startResponse.status, 200);
    assert.equal(match.started, true);
    assert.equal(
        match.contestant.name,
        "Blue Team"
    );
    assert.deepEqual(
        match.contestant.members,
        ["Alex", "Sam", "Jordan", "Taylor"]
    );
    assert.equal(match.chaser.id, "maya-voss");
    assert.equal(match.chaser.name, "Maya Voss");
    assert.equal(
        match.chaser.title,
        "The Cipher"
    );
    assert.equal(match.currentPlayer, "contestant");
    assert.ok(
        Array.isArray(match.contestantQuestions)
    );
    assert.ok(
        Array.isArray(match.chaserQuestions)
    );

    const stateResponse = await fetch(
        `${baseUrl}/api/match/state`
    );
    const state = await stateResponse.json();

    assert.equal(stateResponse.status, 200);
    assert.equal(
        state.contestant.name,
        "Blue Team"
    );
});

test("requires four team member names for team matches", async () => {
    const response = await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                teamName: "Blue Team",
                teamMembers: [
                    "Alex",
                    "Sam",
                    "Jordan",
                    ""
                ],
                chaserId: "maya-voss"
            })
        }
    );
    const result = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        result.error,
        "Four team member names are required"
    );
    assert.equal(matchService.getMatch(), null);
});

test("manages one live tournament and enrolls created teams", async () => {
    const createResponse = await fetch(
        `${baseUrl}/api/tournament`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                name: "Cyber Smart Week"
            })
        }
    );
    const created = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(created.status, "open");

    const duplicateResponse = await fetch(
        `${baseUrl}/api/tournament`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                name: "Second Tournament"
            })
        }
    );
    assert.equal(duplicateResponse.status, 400);

    const startResponse = await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                teamName: "Blue Team",
                teamMembers: [
                    "Alex",
                    "Sam",
                    "Jordan",
                    "Taylor"
                ],
                chaserId: "maya-voss"
            })
        }
    );
    const match = await startResponse.json();

    assert.equal(startResponse.status, 200);
    assert.equal(
        match.tournament.tournamentName,
        "Cyber Smart Week"
    );

    const live = await (
        await fetch(
            `${baseUrl}/api/tournament/live`
        )
    ).json();

    assert.equal(live.name, "Cyber Smart Week");
    assert.deepEqual(
        live.teams.map(team => team.name),
        ["Blue Team"]
    );
    assert.equal(live.teams[0].score, null);
});

test("can reset a tournament and skip enrolling a match", async () => {
    const createResponse = await fetch(
        `${baseUrl}/api/tournament`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                name: "Cyber Smart Week"
            })
        }
    );
    const tournament =
        await createResponse.json();

    await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                teamName: "Blue Team",
                teamMembers: [
                    "Alex",
                    "Sam",
                    "Jordan",
                    "Taylor"
                ],
                chaserId: "maya-voss"
            })
        }
    );

    let live = await (
        await fetch(
            `${baseUrl}/api/tournament/live`
        )
    ).json();
    assert.equal(live.teams.length, 1);

    const resetResponse = await fetch(
        `${baseUrl}/api/tournament/${tournament.id}/reset`,
        { method: "POST" }
    );
    const reset =
        await resetResponse.json();

    assert.equal(resetResponse.status, 200);
    assert.equal(reset.status, "open");
    assert.deepEqual(reset.teams, []);

    const skippedResponse = await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                teamName: "Practice Team",
                teamMembers: [
                    "Ari",
                    "Blair",
                    "Casey",
                    "Dev"
                ],
                chaserId: "maya-voss",
                enrollInTournament: false
            })
        }
    );
    const skipped =
        await skippedResponse.json();

    assert.equal(skippedResponse.status, 200);
    assert.equal(skipped.tournament, undefined);
    live = await (
        await fetch(
            `${baseUrl}/api/tournament/live`
        )
    ).json();
    assert.deepEqual(live.teams, []);
});

test("records tournament scores only when the team beats the chaser", async () => {
    await fetch(`${baseUrl}/api/tournament`, {
        method: "POST",
        headers: {
            "content-type": "application/json"
        },
        body: JSON.stringify({
            name: "Cyber Smart Week"
        })
    });
    await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                teamName: "Blue Team",
                teamMembers: [
                    "Alex",
                    "Sam",
                    "Jordan",
                    "Taylor"
                ],
                chaserId: "maya-voss"
            })
        }
    );
    const opening = await (
        await fetch(
            `${baseUrl}/api/question/start-opening`,
            { method: "POST" }
        )
    ).json();
    await fetch(
        `${baseUrl}/api/question/respond`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                answer: opening.question.correct,
                questionToken:
                    opening.question.questionToken
            })
        }
    );
    await fetch(
        `${baseUrl}/api/timer/end`,
        { method: "POST" }
    );
    await fetch(
        `${baseUrl}/api/question/start`,
        { method: "POST" }
    );
    await fetch(
        `${baseUrl}/api/timer/end`,
        { method: "POST" }
    );

    const live = await (
        await fetch(
            `${baseUrl}/api/tournament/live`
        )
    ).json();

    assert.equal(live.teams[0].name, "Blue Team");
    assert.equal(live.teams[0].score, 1);
});

test("starts a match by chaser id and snapshots the catalog profile", async () => {
    const response = await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                contestantName: "Alex",
                contestantDepartment: "Finance",
                chaserId: "elias-trent",
                chaserName: "Maya Voss"
            })
        }
    );
    const match = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(match.chaser, {
        id: "elias-trent",
        name: "Elias Trent",
        title: "The Firewall",
        department: "Network Defence",
        bio: "Blocks weak answers at the perimeter and gives nothing away.",
        image: "/images/chasers/elias-trent.jpg",
        score: 0
    });
});

test("returns 404 for an unknown chaser id without falling back to name", async () => {
    const response = await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                contestantName: "Alex",
                chaserId: "unknown",
                chaserName: "Maya Voss"
            })
        }
    );
    const result = await response.json();

    assert.equal(response.status, 404);
    assert.equal(
        result.error,
        "Chaser not found"
    );
    assert.equal(matchService.getMatch(), null);
});

test("returns 400 when no chaser selection is supplied", async () => {
    const response = await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                contestantName: "Alex"
            })
        }
    );
    const result = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        result.error,
        "Chaser selection is required"
    );
    assert.equal(matchService.getMatch(), null);
});

test("requires a team or contestant name before creating a match", async () => {
    const response = await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                contestantName: "   ",
                chaserId: "maya-voss"
            })
        }
    );
    const result = await response.json();

    assert.equal(response.status, 400);
    assert.equal(
        result.error,
        "Team name is required"
    );
    assert.equal(matchService.getMatch(), null);
});

test("lists the available difficulties for each question bank", async () => {
    const response = await fetch(
        `${baseUrl}/api/question/difficulties`
    );
    const difficulties = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(
        difficulties.contestant,
        ["Easy", "Medium", "Hard"]
    );
    assert.deepEqual(
        difficulties.chaser,
        ["Hard", "Expert"]
    );
});

test("starts a match with independent question difficulties", async () => {
    const response = await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                contestantName: "Alex",
                chaserId: "maya-voss",
                contestantDifficulty: "Medium",
                chaserDifficulty: "Expert"
            })
        }
    );
    const match = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(match.difficulty, {
        contestant: "Medium",
        chaser: "Expert"
    });
    assert.ok(
        match.contestantQuestions.every(
            question =>
                question.difficulty === "Medium"
        )
    );
    assert.ok(
        match.chaserQuestions.every(
            question =>
                question.difficulty === "Expert"
        )
    );
});

test("rejects an unavailable question difficulty", async () => {
    const response = await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                contestantName: "Alex",
                chaserId: "maya-voss",
                chaserDifficulty: "Easy"
            })
        }
    );
    const result = await response.json();

    assert.equal(response.status, 400);
    assert.match(
        result.error,
        /No chaser questions are available/
    );
    assert.equal(matchService.getMatch(), null);
});

test("preserves question endpoint shapes", async () => {
    matchService.startMatch("Alex", "Rob");

    const startResponse = await fetch(
        `${baseUrl}/api/question/start-opening`,
        { method: "POST" }
    );
    assert.equal(startResponse.status, 200);

    const currentResponse = await fetch(
        `${baseUrl}/api/question/current`
    );
    const current =
        await currentResponse.json();

    assert.equal(currentResponse.status, 200);
    for (const field of [
        "id",
        "category",
        "difficulty",
        "question",
        "a",
        "b",
        "c",
        "d",
        "correct"
    ]) {
        assert.ok(field in current);
    }

    const answerResponse = await fetch(
        `${baseUrl}/api/question/answer`
    );
    const answer = await answerResponse.json();

    assert.equal(answerResponse.status, 200);
    assert.deepEqual(
        Object.keys(answer),
        ["correct"]
    );
});

test("returns 400 for invalid answers without changing the turn", async () => {
    matchService.startMatch("Alex", "Rob");
    matchService.startRound({
        automatic: true
    });

    const response = await fetch(
        `${baseUrl}/api/question/respond`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({})
        }
    );
    const result = await response.json();

    assert.equal(response.status, 400);
    assert.equal(result.correct, false);
    assert.match(result.error, /A, B, C, or D/);
    assert.equal(
        matchService.getMatch().currentPlayer,
        "contestant"
    );
});

test("lists chasers and returns a profile by id", async () => {
    const listResponse = await fetch(
        `${baseUrl}/api/chasers`
    );
    const chasers = await listResponse.json();

    assert.equal(listResponse.status, 200);
    assert.equal(chasers.length, 4);
    assert.equal(chasers[0].id, "maya-voss");

    const profileResponse = await fetch(
        `${baseUrl}/api/chasers/maya-voss`
    );
    const profile =
        await profileResponse.json();

    assert.equal(profileResponse.status, 200);
    assert.equal(profile.name, "Maya Voss");
    assert.equal(
        profile.department,
        "Cryptography and Identity"
    );
});

test("manages persisted chaser profiles and availability", async () => {
    const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), "cyber-chase-api-")
    );
    const file = path.join(
        directory,
        "chasers.json"
    );
    fs.writeFileSync(
        file,
        JSON.stringify([
            {
                id: "available",
                name: "Available",
                department: "Security",
                active: true
            }
        ])
    );
    chaserService.loadChasers(file);

    const createResponse = await fetch(
        `${baseUrl}/api/chasers`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                name: "New Person",
                nickname: "The Newcomer",
                department: "Risk",
                bio: "New bio",
                active: true
            })
        }
    );
    const created = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(created.id, "new-person");
    assert.equal(created.title, "The Newcomer");

    const updateResponse = await fetch(
        `${baseUrl}/api/chasers/${created.id}`,
        {
            method: "PUT",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                name: "Updated Person",
                nickname: "The Updated",
                department: "Operations",
                bio: "Updated bio",
                active: false
            })
        }
    );
    const updated = await updateResponse.json();
    assert.equal(updateResponse.status, 200);
    assert.equal(updated.active, false);

    const all = await (
        await fetch(
            `${baseUrl}/api/chasers/manage/all`
        )
    ).json();
    const active = await (
        await fetch(`${baseUrl}/api/chasers`)
    ).json();

    assert.equal(all.length, 2);
    assert.deepEqual(
        active.map(chaser => chaser.id),
        ["available"]
    );
    assert.equal(
        JSON.parse(
            fs.readFileSync(file, "utf8")
        )[1].name,
        "Updated Person"
    );
});

test("uploads and serves a persistent chaser image", async () => {
    const webpHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46,
        0x04, 0x00, 0x00, 0x00,
        0x57, 0x45, 0x42, 0x50
    ]);
    const response = await fetch(
        `${baseUrl}/api/chasers/upload-image`,
        {
            method: "POST",
            headers: {
                "content-type": "image/webp"
            },
            body: webpHeader
        }
    );
    const result = await response.json();

    assert.equal(response.status, 201);
    assert.match(
        result.image,
        /^\/chaser-images\/[a-f0-9-]+\.webp$/
    );

    const imageResponse = await fetch(
        `${baseUrl}${result.image}`
    );
    const bytes = Buffer.from(
        await imageResponse.arrayBuffer()
    );

    assert.equal(imageResponse.status, 200);
    assert.equal(
        imageResponse.headers.get("content-type"),
        "image/webp"
    );
    assert.deepEqual(bytes, webpHeader);

    fs.unlinkSync(
        path.resolve(
            __dirname,
            "..",
            "data",
            result.image.replace(
                "/chaser-images/",
                "chaser-images/"
            )
        )
    );
});

test("rejects invalid chaser image content", async () => {
    const response = await fetch(
        `${baseUrl}/api/chasers/upload-image`,
        {
            method: "POST",
            headers: {
                "content-type": "image/png"
            },
            body: Buffer.from("not an image")
        }
    );
    const result = await response.json();

    assert.equal(response.status, 400);
    assert.match(
        result.error,
        /valid JPEG, PNG, or WebP/
    );
});

test("catalog edits do not change an active match snapshot", async () => {
    const directory = fs.mkdtempSync(
        path.join(os.tmpdir(), "cyber-chase-snapshot-")
    );
    const file = path.join(
        directory,
        "chasers.json"
    );
    fs.writeFileSync(
        file,
        JSON.stringify([
            {
                id: "snapshot",
                name: "Original Name",
                title: "Original Nickname",
                department: "Security",
                active: true
            }
        ])
    );
    chaserService.loadChasers(file);

    await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                contestantName: "Alex",
                chaserId: "snapshot"
            })
        }
    );
    await fetch(
        `${baseUrl}/api/chasers/snapshot`,
        {
            method: "PUT",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                name: "Future Name",
                nickname: "Future Nickname",
                department: "Risk",
                active: true
            })
        }
    );

    const state = await (
        await fetch(`${baseUrl}/api/match/state`)
    ).json();
    const catalog = await (
        await fetch(
            `${baseUrl}/api/chasers/manage/all`
        )
    ).json();

    assert.equal(
        state.chaser.name,
        "Original Name"
    );
    assert.equal(
        state.chaser.title,
        "Original Nickname"
    );
    assert.equal(catalog[0].name, "Future Name");
});

test("returns 404 for an unknown chaser", async () => {
    const response = await fetch(
        `${baseUrl}/api/chasers/unknown`
    );
    const result = await response.json();

    assert.equal(response.status, 404);
    assert.equal(
        result.error,
        "Chaser not found"
    );
});

test("resets match and two-minute phase timer together", async () => {
    matchService.startMatch("Alex", "Rob");
    timerService.start();

    const response = await fetch(
        `${baseUrl}/api/match/reset`,
        { method: "POST" }
    );
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.match, null);
    assert.deepEqual(result.timer, {
        remaining: 120,
        running: false,
        active: false
    });
});

test("starts each match with a waiting two-minute timer", async () => {
    const response = await fetch(
        `${baseUrl}/api/match/start-match`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                contestantName: "Alex",
                chaserId: "maya-voss"
            })
        }
    );
    const match = await response.json();

    assert.equal(response.status, 200);
    assert.equal(match.gameMode, "final-chase");
    assert.deepEqual(timerService.state(), {
        remaining: 120,
        running: false,
        active: false
    });
});

test("timer endpoints pause resume and reset an active phase", async () => {
    matchService.startMatch("Alex", "Rob");
    await fetch(
        `${baseUrl}/api/question/start-opening`,
        { method: "POST" }
    );

    const paused = await (
        await fetch(
            `${baseUrl}/api/timer/pause`,
            { method: "POST" }
        )
    ).json();
    assert.equal(paused.running, false);
    assert.equal(paused.active, true);

    const resumed = await (
        await fetch(
            `${baseUrl}/api/timer/start`,
            { method: "POST" }
        )
    ).json();
    assert.equal(resumed.running, true);

    const reset = await (
        await fetch(
            `${baseUrl}/api/timer/reset`,
            { method: "POST" }
        )
    ).json();
    assert.deepEqual(reset, {
        remaining: 120,
        running: false,
        active: true
    });
});

test("ending the team round follows the normal timeout transition", async () => {
    matchService.startMatch("Blue Team", "Rob");
    const started = await (
        await fetch(
            `${baseUrl}/api/question/start-opening`,
            { method: "POST" }
        )
    ).json();

    await fetch(
        `${baseUrl}/api/question/respond`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                answer:
                    started.question.correct,
                questionToken:
                    started.question.questionToken
            })
        }
    );

    const response = await fetch(
        `${baseUrl}/api/timer/end`,
        { method: "POST" }
    );
    const timer = await response.json();
    const match = matchService.getMatch();

    assert.equal(response.status, 200);
    assert.deepEqual(timer, {
        remaining: 120,
        running: false,
        active: false
    });
    assert.equal(match.targetScore, 1);
    assert.equal(match.currentPlayer, "chaser");
    assert.equal(match.phaseStatus, "waiting");
    assert.equal(match.roundActive, false);
    assert.equal(match.winner, null);
});

test("ending the chaser round follows the normal timeout transition", async () => {
    matchService.startMatch("Blue Team", "Rob");
    const started = await (
        await fetch(
            `${baseUrl}/api/question/start-opening`,
            { method: "POST" }
        )
    ).json();

    await fetch(
        `${baseUrl}/api/question/respond`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                answer:
                    started.question.correct,
                questionToken:
                    started.question.questionToken
            })
        }
    );
    await fetch(
        `${baseUrl}/api/timer/end`,
        { method: "POST" }
    );
    await fetch(
        `${baseUrl}/api/question/start`,
        { method: "POST" }
    );

    const response = await fetch(
        `${baseUrl}/api/timer/end`,
        { method: "POST" }
    );
    const timer = await response.json();
    const match = matchService.getMatch();

    assert.equal(response.status, 200);
    assert.deepEqual(timer, {
        remaining: 120,
        running: false,
        active: false
    });
    assert.equal(match.winner, "Blue Team");
    assert.equal(match.phaseStatus, "complete");
    assert.equal(match.roundActive, false);
});

test("opening countdown starts the contestant rapid-fire phase", async () => {
    matchService.startMatch("Alex", "Rob");

    const waiting = await (
        await fetch(
            `${baseUrl}/api/question/current`
        )
    ).json();
    assert.equal(waiting, null);

    const response = await fetch(
        `${baseUrl}/api/question/start-opening`,
        { method: "POST" }
    );
    const started = await response.json();

    assert.equal(response.status, 200);
    assert.equal(
        started.question.questionToken,
        "contestant:0"
    );
    assert.equal(started.timer.remaining, 120);
    assert.equal(started.timer.running, true);
});

test("submitting an answer advances immediately while timer continues", async () => {
    matchService.startMatch("Alex", "Rob");
    const started = await (
        await fetch(
            `${baseUrl}/api/question/start-opening`,
            { method: "POST" }
        )
    ).json();

    await new Promise(resolve => {
        setTimeout(resolve, 1100);
    });
    const beforeAnswer =
        timerService.state().remaining;
    const response = await fetch(
        `${baseUrl}/api/question/respond`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                answer:
                    started.question.correct,
                questionToken:
                    started.question.questionToken
            })
        }
    );
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.match.roundActive, true);
    assert.equal(
        result.nextQuestionToken,
        "contestant:1"
    );
    assert.equal(
        timerService.state().running,
        true
    );
    assert.ok(
        timerService.state().remaining <=
        beforeAnswer
    );
});

test("contestant expiry sets a target and enables the Chaser phase", async () => {
    matchService.startMatch("Alex", "Rob");
    const opening = matchService.startRound({
        automatic: true
    });
    matchService.processAnswer(
        opening.question.correct,
        opening.questionToken
    );
    timerService.startQuestion(
        matchService.getActivePhaseToken(),
        1
    );

    await new Promise(resolve => {
        setTimeout(resolve, 1100);
    });

    const match = matchService.getMatch();
    assert.equal(match.targetScore, 1);
    assert.equal(match.currentPlayer, "chaser");
    assert.equal(match.phaseStatus, "waiting");
    assert.equal(match.roundActive, false);

    const response = await fetch(
        `${baseUrl}/api/question/start`,
        { method: "POST" }
    );
    const chase = await response.json();

    assert.equal(response.status, 200);
    assert.equal(
        chase.question.questionToken,
        "chaser:0"
    );
    assert.equal(chase.timer.remaining, 120);
});

test("Chaser catch ends the phase and pauses the timer", async () => {
    matchService.startMatch("Alex", "Rob");
    matchService.startRound({
        automatic: true
    });
    matchService.processAnswer(
        matchService.getCurrentQuestion().correct
    );
    matchService.processPhaseTimeout(
        matchService.getActivePhaseToken()
    );

    const chase = await (
        await fetch(
            `${baseUrl}/api/question/start`,
            { method: "POST" }
        )
    ).json();
    const response = await fetch(
        `${baseUrl}/api/question/respond`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                answer: chase.question.correct,
                questionToken:
                    chase.question.questionToken
            })
        }
    );
    const result = await response.json();

    assert.equal(result.match.winner, "Rob");
    assert.equal(
        timerService.state().running,
        false
    );
    assert.equal(
        timerService.state().active,
        false
    );
});

test("rejects timer controls between phases", async () => {
    matchService.startMatch("Alex", "Rob");

    for (const action of [
        "start",
        "pause",
        "reset",
        "end"
    ]) {
        const response = await fetch(
            `${baseUrl}/api/timer/${action}`,
            { method: "POST" }
        );
        assert.equal(response.status, 409);
    }
});
