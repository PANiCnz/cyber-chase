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
        running: false
    });
    assert.equal(matchService.getMatch(), null);
    assert.equal(
        matchService.getCurrentQuestion(),
        null
    );
    assert.deepEqual(timerService.state(), {
        remaining: 60,
        running: false
    });
});
