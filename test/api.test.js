const test = require("node:test");
const assert = require("node:assert/strict");

const { server } = require("../src/server");
const matchService =
    require("../src/services/matchService");
const timerService =
    require("../src/services/timerService");

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
                chaserName: "Rob"
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
    assert.equal(match.chaser.id, "rob");
    assert.equal(match.chaser.name, "Rob");
    assert.equal(
        match.chaser.title,
        "The Firewall"
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
                chaserId: "julian",
                chaserName: "Rob"
            })
        }
    );
    const match = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(match.chaser, {
        id: "julian",
        name: "Julian",
        title: "The Analyst",
        department: "Information Security",
        bio: "Finds the signal hidden inside the noise.",
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
                chaserName: "Rob"
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

test("preserves question endpoint shapes", async () => {
    matchService.startMatch("Alex", "Rob");

    const startResponse = await fetch(
        `${baseUrl}/api/question/start`,
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
    matchService.startRound();

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
    assert.equal(chasers[0].id, "rob");

    const profileResponse = await fetch(
        `${baseUrl}/api/chasers/rob`
    );
    const profile =
        await profileResponse.json();

    assert.equal(profileResponse.status, 200);
    assert.equal(profile.name, "Rob");
    assert.equal(
        profile.department,
        "Information Security"
    );
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
                chaserId: "rob"
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
        `${baseUrl}/api/question/start`,
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
    matchService.startRound();
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
        `${baseUrl}/api/question/start`,
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

test("does not restart an already active round", async () => {
    matchService.startMatch("Alex", "Rob");

    const firstResponse = await fetch(
        `${baseUrl}/api/question/start`,
        { method: "POST" }
    );
    const first = await firstResponse.json();
    const secondResponse = await fetch(
        `${baseUrl}/api/question/start`,
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
        `${baseUrl}/api/question/start`,
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
        matchService.startRound()
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
        matchService.startRound()
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
