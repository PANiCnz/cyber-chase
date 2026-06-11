const test = require("node:test");
const assert = require("node:assert/strict");

const matchService =
    require("../src/services/matchService");
const questionService =
    require("../src/services/questionService");

test.beforeEach(() => {
    matchService.resetMatch();
    questionService.resetQuestionBanks();
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
    assert.ok(match.contestantQuestions.length > 5);
    assert.ok(match.chaserQuestions.length > 5);
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

test("times out only the expected active question", () => {
    const match = matchService.startMatch(
        "Alex",
        "Rob"
    );
    const token =
        matchService.getCurrentQuestionToken();
    const result =
        matchService.processTimeout(token);

    assert.equal(result.timeout, true);
    assert.equal(result.player, "contestant");
    assert.equal(result.playerName, "Alex");
    assert.equal(match.currentPlayer, "chaser");
    assert.equal(
        match.contestantQuestionIndex,
        1
    );

    const duplicate =
        matchService.processTimeout(token);

    assert.equal(duplicate.stale, true);
    assert.equal(match.currentPlayer, "chaser");
    assert.equal(match.chaserQuestionIndex, 0);
});

test("rejects a stale question token without answering the next turn", () => {
    const match = matchService.startMatch(
        "Alex",
        "Rob"
    );
    const token =
        matchService.getCurrentQuestionToken();
    matchService.processTimeout(token);

    const result =
        matchService.processAnswer("a", token);

    assert.equal(result.stale, true);
    assert.equal(match.currentPlayer, "chaser");
    assert.equal(match.chaserQuestionIndex, 0);
});

test("alternates beyond five questions until a player reaches five", () => {
    const match = matchService.startMatch(
        "Alex",
        "Rob"
    );

    for (let round = 0; round < 5; round++) {
        const contestantQuestion =
            matchService.getCurrentQuestion();
        const contestantWrong =
            ["a", "b", "c", "d"].find(
                answer =>
                    answer !==
                    contestantQuestion.correct
            );

        matchService.processAnswer(
            contestantWrong
        );

        const chaserQuestion =
            matchService.getCurrentQuestion();
        const chaserWrong =
            ["a", "b", "c", "d"].find(
                answer =>
                    answer !== chaserQuestion.correct
            );

        matchService.processAnswer(chaserWrong);
    }

    assert.equal(
        match.contestantQuestionIndex,
        5
    );
    assert.equal(match.chaserQuestionIndex, 5);
    assert.equal(match.winner, null);
    assert.ok(matchService.getCurrentQuestion());

    while (!match.winner) {
        matchService.processAnswer(
            matchService.getCurrentQuestion().correct
        );

        if (
            !match.winner &&
            match.currentPlayer === "chaser"
        ) {
            const question =
                matchService.getCurrentQuestion();
            const wrong =
                ["a", "b", "c", "d"].find(
                    answer =>
                        answer !== question.correct
                );
            matchService.processAnswer(wrong);
        }
    }

    assert.equal(match.winner, "Alex");
    assert.equal(match.contestant.score, 5);
});
