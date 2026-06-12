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

function startContestantPhase() {
    return matchService.startRound({
        automatic: true
    });
}

function wrongAnswer(question) {
    return ["a", "b", "c", "d"].find(
        answer => answer !== question.correct
    );
}

test("starts a Final Chase match waiting for the contestant", () => {
    const match = matchService.startMatch(
        "Alex",
        "Rob",
        "Finance"
    );

    assert.equal(match.gameMode, "final-chase");
    assert.equal(match.currentPlayer, "contestant");
    assert.equal(match.phaseStatus, "pending");
    assert.equal(match.roundActive, false);
    assert.equal(match.firstRoundPending, true);
    assert.equal(match.targetScore, null);
    assert.equal(match.contestant.score, 0);
    assert.equal(match.chaser.score, 0);
    assert.equal(match.winner, null);
});

test("preserves profile snapshots and difficulty filters", () => {
    const match = matchService.startMatch(
        "Alex",
        {
            id: "rob",
            name: "Rob",
            department: "Information Security",
            title: "The Firewall",
            bio: "Profile text"
        },
        "Finance",
        {
            contestant: "Easy",
            chaser: "Expert"
        }
    );

    assert.equal(match.chaser.title, "The Firewall");
    assert.equal(match.difficulty.contestant, "Easy");
    assert.equal(match.difficulty.chaser, "Expert");
    assert.ok(
        match.contestantQuestions.every(
            question =>
                question.difficulty === "Easy"
        )
    );
    assert.ok(
        match.chaserQuestions.every(
            question =>
                question.difficulty === "Expert"
        )
    );
});

test("contestant answers rapid-fire without ending the phase", () => {
    const match = matchService.startMatch(
        "Alex",
        "Rob"
    );
    startContestantPhase();
    const firstToken =
        matchService.getCurrentQuestionToken();
    const correct =
        matchService.getCurrentQuestion().correct;
    const first =
        matchService.processAnswer(
            correct,
            firstToken
        );

    assert.equal(first.correct, true);
    assert.equal(match.contestant.score, 1);
    assert.equal(match.currentPlayer, "contestant");
    assert.equal(match.roundActive, true);
    assert.equal(match.contestantQuestionIndex, 1);
    assert.equal(
        first.nextQuestionToken,
        "contestant:1"
    );

    const secondQuestion =
        matchService.getCurrentQuestion();
    matchService.processAnswer(
        wrongAnswer(secondQuestion),
        first.nextQuestionToken
    );

    assert.equal(match.contestant.score, 1);
    assert.equal(match.contestantQuestionIndex, 2);
    assert.equal(match.roundActive, true);
});

test("contestant timeout fixes the target and waits for the Chaser", () => {
    const match = matchService.startMatch(
        "Alex",
        "Rob"
    );
    startContestantPhase();

    for (let index = 0; index < 3; index++) {
        matchService.processAnswer(
            matchService.getCurrentQuestion().correct,
            matchService.getCurrentQuestionToken()
        );
    }

    const result =
        matchService.processPhaseTimeout(
            matchService.getActivePhaseToken()
        );

    assert.equal(result.timeout, true);
    assert.equal(match.targetScore, 3);
    assert.equal(match.currentPlayer, "chaser");
    assert.equal(match.phaseStatus, "waiting");
    assert.equal(match.roundActive, false);
    assert.equal(match.winner, null);
});

test("Chaser must be started manually after the target is set", () => {
    const match = matchService.startMatch(
        "Alex",
        "Rob"
    );

    assert.equal(
        matchService.startRound().error,
        "Contestant phase starts after the opening countdown"
    );

    startContestantPhase();
    matchService.processAnswer(
        matchService.getCurrentQuestion().correct
    );
    matchService.processPhaseTimeout(
        matchService.getActivePhaseToken()
    );

    const chase = matchService.startRound();

    assert.equal(chase.questionToken, "chaser:0");
    assert.equal(chase.phaseToken, "phase:chaser");
    assert.equal(match.roundActive, true);
    assert.equal(match.phaseStatus, "active");
});

test("Chaser wins immediately on reaching the target", () => {
    const match = matchService.startMatch(
        "Alex",
        "Rob"
    );
    startContestantPhase();

    for (let index = 0; index < 2; index++) {
        matchService.processAnswer(
            matchService.getCurrentQuestion().correct
        );
    }

    matchService.processPhaseTimeout(
        matchService.getActivePhaseToken()
    );
    matchService.startRound();

    matchService.processAnswer(
        matchService.getCurrentQuestion().correct
    );
    const result = matchService.processAnswer(
        matchService.getCurrentQuestion().correct
    );

    assert.equal(match.chaser.score, 2);
    assert.equal(match.winner, "Rob");
    assert.equal(match.roundActive, false);
    assert.equal(match.phaseStatus, "complete");
    assert.equal(result.match.winner, "Rob");
});

test("contestant wins if the Chaser timer expires short of the target", () => {
    const match = matchService.startMatch(
        "Alex",
        "Rob"
    );
    startContestantPhase();

    for (let index = 0; index < 3; index++) {
        matchService.processAnswer(
            matchService.getCurrentQuestion().correct
        );
    }

    matchService.processPhaseTimeout(
        matchService.getActivePhaseToken()
    );
    matchService.startRound();
    matchService.processAnswer(
        matchService.getCurrentQuestion().correct
    );
    const result =
        matchService.processPhaseTimeout(
            matchService.getActivePhaseToken()
        );

    assert.equal(match.chaser.score, 1);
    assert.equal(match.winner, "Alex");
    assert.equal(match.phaseStatus, "complete");
    assert.equal(result.winner, "Alex");
});

test("a zero contestant target is caught when contestant time expires", () => {
    const match = matchService.startMatch(
        "Alex",
        "Rob"
    );
    startContestantPhase();
    matchService.processPhaseTimeout(
        matchService.getActivePhaseToken()
    );

    assert.equal(match.targetScore, 0);
    assert.equal(match.winner, "Rob");
    assert.equal(match.phaseStatus, "complete");
});

test("rejects stale question and phase tokens", () => {
    matchService.startMatch("Alex", "Rob");
    startContestantPhase();
    const questionToken =
        matchService.getCurrentQuestionToken();
    const phaseToken =
        matchService.getActivePhaseToken();

    matchService.processAnswer(
        matchService.getCurrentQuestion().correct,
        questionToken
    );

    assert.equal(
        matchService.processAnswer(
            "a",
            questionToken
        ).stale,
        true
    );
    assert.equal(
        matchService.processPhaseTimeout(
            "phase:chaser"
        ).stale,
        true
    );
    assert.equal(
        matchService.getActivePhaseToken(),
        phaseToken
    );
});
