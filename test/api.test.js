const test = require("node:test");
const assert = require("node:assert/strict");

const { server } = require("../src/server");
const matchService =
    require("../src/services/matchService");
const timerService =
    require("../src/services/timerService");
const chaserService =
    require("../src/services/chaserService");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

let baseUrl;

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
                contestantName: "Alex",
                contestantDepartment: "Finance",
                chaserName: "Maya Voss"
            })
        }
    );
    const match = await startResponse.json();

    assert.equal(startResponse.status, 200);
    assert.equal(match.started, true);
    assert.equal(
        match.contestant.department,
        "Finance"
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
        "Alex"
    );
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

test("requires a contestant name before creating a match", async () => {
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
        "Contestant name is required"
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

test("resets match and timer state together", async () => {
    matchService.startMatch("Alex", "Rob");
    matchService.markCorrect();
    timerService.start();

    const response = await fetch(
        `${baseUrl}/api/match/reset`,
        { method: "POST" }
    );
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.match, null);
    assert.deepEqual(result.timer, {
        remaining: 60,
        running: false,
        active: false
    });
    assert.equal(matchService.getMatch(), null);
    assert.equal(
        matchService.getCurrentQuestion(),
        null
    );
    assert.deepEqual(timerService.state(), {
        remaining: 60,
        running: false,
        active: false
    });
});

test("starts each valid match with a waiting question timer", async () => {
    timerService.start();

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

    assert.equal(response.status, 200);
    assert.deepEqual(timerService.state(), {
        remaining: 60,
        running: false,
        active: false
    });
});

test("timer endpoints pause resume and reset the active question", async () => {
    matchService.startMatch("Alex", "Rob");

    const roundResponse = await fetch(
        `${baseUrl}/api/question/start-opening`,
        { method: "POST" }
    );
    assert.equal(roundResponse.status, 200);

    const pauseResponse = await fetch(
        `${baseUrl}/api/timer/pause`,
        { method: "POST" }
    );

    const pausedTimer =
        await pauseResponse.json();

    assert.equal(pausedTimer.running, false);
    assert.equal(pausedTimer.active, true);

    const resumeResponse = await fetch(
        `${baseUrl}/api/timer/start`,
        { method: "POST" }
    );
    const resumedTimer =
        await resumeResponse.json();

    assert.equal(resumedTimer.running, true);
    assert.equal(resumedTimer.active, true);

    const resetResponse = await fetch(
        `${baseUrl}/api/timer/reset`,
        { method: "POST" }
    );

    assert.deepEqual(
        await resetResponse.json(),
        {
            remaining: 60,
            running: false,
            active: true
        }
    );
});

test("pauses the timer when an answer produces a winner", async () => {
    matchService.startMatch("Alex", "Rob");
    const match = matchService.getMatch();
    match.contestant.score = 4;
    match.currentPlayer = "contestant";
    matchService.startRound({
        automatic: true
    });
    timerService.startQuestion(
        matchService.getCurrentQuestionToken()
    );

    const questionResponse = await fetch(
        `${baseUrl}/api/question/answer`
    );
    const question =
        await questionResponse.json();
    const response = await fetch(
        `${baseUrl}/api/question/respond`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                answer: question.correct
            })
        }
    );
    const result = await response.json();

    assert.equal(response.status, 200);
    assert.equal(result.match.winner, "Alex");
    assert.equal(
        timerService.state().running,
        false
    );
});

test("starting a round displays its question and starts its timer", async () => {
    matchService.startMatch("Alex", "Rob");

    const waitingResponse = await fetch(
        `${baseUrl}/api/question/current`
    );
    assert.equal(
        await waitingResponse.json(),
        null
    );

    const startResponse = await fetch(
        `${baseUrl}/api/question/start-opening`,
        { method: "POST" }
    );
    const started = await startResponse.json();

    assert.equal(startResponse.status, 200);
    assert.equal(
        started.question.questionToken,
        "contestant:0"
    );

    const response = await fetch(
        `${baseUrl}/api/question/current`
    );
    const question = await response.json();

    assert.equal(response.status, 200);
    assert.equal(
        question.questionToken,
        "contestant:0"
    );
    assert.equal(
        timerService.state().running,
        true
    );
});

test("automates only round one and requires manual later rounds", async () => {
    matchService.startMatch("Alex", "Rob");

    const earlyManualResponse = await fetch(
        `${baseUrl}/api/question/start`,
        { method: "POST" }
    );
    const earlyManual =
        await earlyManualResponse.json();

    assert.equal(earlyManualResponse.status, 409);
    assert.equal(
        earlyManual.error,
        "First round starts after the opening countdown"
    );

    const openingResponse = await fetch(
        `${baseUrl}/api/question/start-opening`,
        { method: "POST" }
    );
    const opening = await openingResponse.json();

    assert.equal(openingResponse.status, 200);
    assert.equal(
        opening.question.questionToken,
        "contestant:0"
    );

    const answerResponse = await fetch(
        `${baseUrl}/api/question/respond`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                answer:
                    opening.question.correct,
                questionToken:
                    opening.question.questionToken
            })
        }
    );

    assert.equal(answerResponse.status, 200);

    const secondOpeningResponse = await fetch(
        `${baseUrl}/api/question/start-opening`,
        { method: "POST" }
    );
    assert.equal(
        secondOpeningResponse.status,
        409
    );

    const manualResponse = await fetch(
        `${baseUrl}/api/question/start`,
        { method: "POST" }
    );
    const manual = await manualResponse.json();

    assert.equal(manualResponse.status, 200);
    assert.equal(
        manual.question.questionToken,
        "chaser:0"
    );
});

test("does not restart an already active round", async () => {
    matchService.startMatch("Alex", "Rob");

    const firstResponse = await fetch(
        `${baseUrl}/api/question/start-opening`,
        { method: "POST" }
    );
    const first = await firstResponse.json();
    const secondResponse = await fetch(
        `${baseUrl}/api/question/start-opening`,
        { method: "POST" }
    );
    const second = await secondResponse.json();

    assert.equal(firstResponse.status, 200);
    assert.equal(
        first.question.questionToken,
        "contestant:0"
    );
    assert.equal(secondResponse.status, 409);
    assert.equal(
        second.error,
        "Round is already active"
    );
});

test("rejects timer controls between rounds", async () => {
    matchService.startMatch("Alex", "Rob");

    for (const action of [
        "start",
        "pause",
        "reset"
    ]) {
        const response = await fetch(
            `${baseUrl}/api/timer/${action}`,
            { method: "POST" }
        );
        const result = await response.json();

        assert.equal(response.status, 409);
        assert.equal(
            result.error,
            "No active round"
        );
    }
});

test("submitting an answer pauses before the next round", async () => {
    matchService.startMatch("Alex", "Rob");

    const startResponse = await fetch(
        `${baseUrl}/api/question/start-opening`,
        { method: "POST" }
    );
    const started = await startResponse.json();
    const question = started.question;
    await new Promise(resolve => {
        setTimeout(resolve, 1100);
    });
    assert.ok(
        timerService.state().remaining < 60
    );
    const response = await fetch(
        `${baseUrl}/api/question/respond`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                answer: question.correct,
                questionToken:
                    question.questionToken
            })
        }
    );

    assert.equal(response.status, 200);
    assert.deepEqual(timerService.state(), {
        remaining: 60,
        running: false,
        active: false
    });
    assert.equal(
        matchService.getMatch().roundActive,
        false
    );

    const nextResponse = await fetch(
        `${baseUrl}/api/question/current`
    );
    assert.equal(await nextResponse.json(), null);
    assert.equal(
        timerService.state().running,
        false
    );

    const nextStartResponse = await fetch(
        `${baseUrl}/api/question/start`,
        { method: "POST" }
    );
    const nextStarted =
        await nextStartResponse.json();

    assert.equal(
        nextStarted.question.questionToken,
        "chaser:0"
    );
    assert.equal(nextStarted.timer.running, true);
});

test("question expiry counts as an incorrect answer", async () => {
    matchService.startMatch("Alex", "Rob");
    const questionToken =
        matchService.startRound({
            automatic: true
        })
            .questionToken;

    timerService.startQuestion(
        questionToken,
        1
    );
    await new Promise(resolve => {
        setTimeout(resolve, 1100);
    });

    const match = matchService.getMatch();

    assert.equal(match.contestant.score, 0);
    assert.equal(match.currentPlayer, "chaser");
    assert.equal(
        match.contestantQuestionIndex,
        1
    );
    assert.deepEqual(timerService.state(), {
        remaining: 60,
        running: false,
        active: false
    });
    assert.equal(match.roundActive, false);
});

test("rejects an answer for a question that has already expired", async () => {
    matchService.startMatch("Alex", "Rob");
    const expiredToken =
        matchService.startRound({
            automatic: true
        })
            .questionToken;
    matchService.processTimeout(expiredToken);

    const response = await fetch(
        `${baseUrl}/api/question/respond`,
        {
            method: "POST",
            headers: {
                "content-type":
                    "application/json"
            },
            body: JSON.stringify({
                answer: "a",
                questionToken: expiredToken
            })
        }
    );
    const result = await response.json();

    assert.equal(response.status, 409);
    assert.equal(result.stale, true);
    assert.equal(
        matchService.getMatch().currentPlayer,
        "chaser"
    );
});
