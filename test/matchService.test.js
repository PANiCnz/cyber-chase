const test = require("node:test");
const assert = require("node:assert/strict");

const matchService =
    require("../src/services/matchService");

test.beforeEach(() => {
    matchService.resetMatch();
});

test("starts a match with existing state fields", () => {
    const match = matchService.startMatch(
        "Alex",
        "Rob",
        "Finance"
    );

    assert.deepEqual(match.contestant, {
        name: "Alex",
        department: "Finance",
        score: 0
    });
    assert.deepEqual(match.chaser, {
        name: "Rob",
        department: "Information Security",
        score: 0
    });
    assert.equal(match.currentPlayer, "contestant");
    assert.equal(match.contestantQuestions.length, 5);
    assert.equal(match.chaserQuestions.length, 5);
    assert.equal(match.winner, null);
});

test("starts a match with a profile snapshot", () => {
    const match = matchService.startMatch(
        "Alex",
        {
            id: "rob",
            name: "Rob",
            department: "Information Security",
            title: "The Firewall",
            bio: "Profile text"
        },
        "Finance"
    );

    assert.deepEqual(match.chaser, {
        id: "rob",
        name: "Rob",
        department: "Information Security",
        title: "The Firewall",
        bio: "Profile text",
        score: 0
    });
});

test("correct answers score and advance the turn", () => {
    matchService.startMatch(
        "Alex",
        "Rob"
    );

    const answer =
        matchService.getCurrentQuestion().correct;
    const result =
        matchService.processAnswer(answer);

    assert.equal(result.correct, true);
    assert.equal(
        result.match.contestant.score,
        1
    );
    assert.equal(
        result.match.currentPlayer,
        "chaser"
    );
});

test("incorrect answers preserve score and advance", () => {
    matchService.startMatch(
        "Alex",
        "Rob"
    );

    const correct =
        matchService.getCurrentQuestion().correct;
    const answer =
        ["a", "b", "c", "d"].find(
            item => item !== correct
        );
    const result =
        matchService.processAnswer(answer);

    assert.equal(result.correct, false);
    assert.equal(
        result.match.contestant.score,
        0
    );
    assert.equal(
        result.match.currentPlayer,
        "chaser"
    );
});

test("invalid answers return an error without changing state", () => {
    const match = matchService.startMatch(
        "Alex",
        "Rob"
    );

    const result =
        matchService.processAnswer();

    assert.equal(result.correct, false);
    assert.equal(
        result.error,
        "Answer must be A, B, C, or D"
    );
    assert.equal(match.contestant.score, 0);
    assert.equal(
        match.currentPlayer,
        "contestant"
    );
});
