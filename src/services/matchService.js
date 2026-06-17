const questionService = require("./questionService");

let match = null;

function createChaserState(chaser) {
    if (
        chaser &&
        typeof chaser === "object" &&
        !Array.isArray(chaser)
    ) {
        return {
            ...chaser,
            score: 0
        };
    }

    return {
        name: chaser,
        department: "Information Security",
        score: 0
    };
}

function startMatch(
    contestantName,
    chaser,
    contestantDepartment = "",
    difficulty = {},
    teamMembers = []
) {
    const questions =
        questionService.createMatchQuestions({
            contestantDifficulty:
                difficulty.contestant,
            chaserDifficulty:
                difficulty.chaser
        });

    match = {
        started: true,
        gameMode: "final-chase",
        contestant: {
            name: contestantName,
            department: contestantDepartment,
            members: teamMembers,
            score: 0
        },
        chaser: createChaserState(chaser),
        difficulty: {
            contestant:
                difficulty.contestant || "all",
            chaser:
                difficulty.chaser || "all"
        },
        currentPlayer: "contestant",
        contestantQuestions:
            questions.contestantQuestions,
        chaserQuestions:
            questions.chaserQuestions,
        contestantQuestionIndex: 0,
        chaserQuestionIndex: 0,
        targetScore: null,
        roundActive: false,
        phaseStatus: "pending",
        firstRoundPending: true,
        lastRoundResult: null,
        winner: null
    };

    return match;
}

function assignTournamentEntry(entry) {
    if (!match || !entry) {
        return match;
    }

    match.tournament = entry;
    return match;
}

function getMatch() {
    return match;
}

function getQuestionPool(player) {
    return player === "chaser"
        ? match?.chaserQuestions
        : match?.contestantQuestions;
}

function getQuestionIndex(player) {
    return player === "chaser"
        ? match?.chaserQuestionIndex
        : match?.contestantQuestionIndex;
}

function getCurrentQuestion() {
    if (!match) return null;

    const pool =
        getQuestionPool(match.currentPlayer);
    const index =
        getQuestionIndex(match.currentPlayer);

    if (!pool?.length) return null;

    return pool[index % pool.length];
}

function getCurrentQuestionToken() {
    if (
        !match ||
        match.winner ||
        !match.roundActive
    ) {
        return null;
    }

    return `${match.currentPlayer}:${getQuestionIndex(match.currentPlayer)}`;
}

function getActivePhaseToken() {
    if (
        !match ||
        match.winner ||
        !match.roundActive
    ) {
        return null;
    }

    return `phase:${match.currentPlayer}`;
}

function startRound(options = {}) {
    const automatic =
        options.automatic === true;

    if (!match) {
        return { error: "No active match" };
    }

    if (match.winner) {
        return { error: "Match is complete" };
    }

    if (match.roundActive) {
        return { error: "Round is already active" };
    }

    if (
        match.firstRoundPending &&
        !automatic
    ) {
        return {
            error:
                "Contestant phase starts after the opening countdown"
        };
    }

    if (
        automatic &&
        !match.firstRoundPending
    ) {
        return {
            error:
                "Contestant phase has already started"
        };
    }

    if (
        !automatic &&
        (
            match.currentPlayer !== "chaser" ||
            match.phaseStatus !== "waiting"
        )
    ) {
        return {
            error: "Chaser phase is not ready"
        };
    }

    const question = getCurrentQuestion();

    if (!question) {
        return { error: "No active question" };
    }

    match.roundActive = true;
    match.phaseStatus = "active";
    match.firstRoundPending = false;
    match.lastRoundResult = null;

    return {
        match,
        question,
        questionToken:
            getCurrentQuestionToken(),
        phaseToken:
            getActivePhaseToken()
    };
}

function getUpcomingQuestion() {
    if (!match) return null;

    const pool =
        getQuestionPool(match.currentPlayer);
    const nextIndex =
        getQuestionIndex(match.currentPlayer) + 1;

    if (!pool?.length) return null;

    return pool[nextIndex % pool.length];
}

function advanceQuestion() {
    if (match.currentPlayer === "contestant") {
        match.contestantQuestionIndex++;
    } else {
        match.chaserQuestionIndex++;
    }
}

function markCorrect() {
    if (!match) return null;

    if (match.currentPlayer === "contestant") {
        match.contestant.score++;
    } else {
        match.chaser.score++;

        if (
            match.chaser.score >=
            match.targetScore
        ) {
            match.winner = match.chaser.name;
            match.roundActive = false;
            match.phaseStatus = "complete";
        }
    }

    advanceQuestion();
    return match;
}

function markIncorrect() {
    if (!match) return null;

    advanceQuestion();
    return match;
}

function processAnswer(
    submittedAnswer,
    expectedQuestionToken
) {
    if (!match?.roundActive) {
        return {
            correct: false,
            error: expectedQuestionToken
                ? "Question is no longer active"
                : "No active round",
            ...(expectedQuestionToken
                ? { stale: true }
                : {})
        };
    }

    const question = getCurrentQuestion();
    const questionToken =
        getCurrentQuestionToken();
    const phaseToken =
        getActivePhaseToken();

    if (!question) {
        return {
            correct: false,
            error: "No active question"
        };
    }

    if (
        expectedQuestionToken &&
        expectedQuestionToken !== questionToken
    ) {
        return {
            correct: false,
            error: "Question is no longer active",
            stale: true
        };
    }

    if (
        typeof submittedAnswer !== "string" ||
        !["a", "b", "c", "d"].includes(
            submittedAnswer.toLowerCase()
        )
    ) {
        return {
            correct: false,
            error: "Answer must be A, B, C, or D"
        };
    }

    if (
        typeof question.correct !== "string" ||
        !["a", "b", "c", "d"].includes(
            question.correct.toLowerCase()
        )
    ) {
        return {
            correct: false,
            error:
                "Current question has no valid correct answer"
        };
    }

    const correctAnswer =
        question.correct.toLowerCase();
    const answer =
        submittedAnswer.toLowerCase();
    const isCorrect =
        answer === correctAnswer;
    const player = match.currentPlayer;
    const playerName = player === "chaser"
        ? match.chaser.name
        : match.contestant.name;

    if (isCorrect) {
        markCorrect();
    } else {
        markIncorrect();
    }

    match.lastRoundResult = {
        correct: isCorrect,
        correctAnswer,
        player,
        playerName,
        timeout: false
    };

    return {
        correct: isCorrect,
        submittedAnswer: answer,
        correctAnswer,
        questionToken,
        phaseToken,
        nextQuestionToken:
            getCurrentQuestionToken(),
        match
    };
}

function processPhaseTimeout(expectedPhaseToken) {
    if (
        !match?.roundActive ||
        expectedPhaseToken !==
            getActivePhaseToken()
    ) {
        return {
            error: "Round is no longer active",
            stale: true
        };
    }

    const completedPlayer =
        match.currentPlayer;
    match.roundActive = false;
    match.lastRoundResult = null;

    if (completedPlayer === "contestant") {
        match.targetScore =
            match.contestant.score;

        if (match.targetScore === 0) {
            match.winner = match.chaser.name;
            match.phaseStatus = "complete";
        } else {
            match.currentPlayer = "chaser";
            match.phaseStatus = "waiting";
        }
    } else {
        match.winner = match.contestant.name;
        match.phaseStatus = "complete";
    }

    return {
        timeout: true,
        player: completedPlayer,
        playerName:
            completedPlayer === "chaser"
                ? match.chaser.name
                : match.contestant.name,
        winner: match.winner,
        match
    };
}

function processTimeout(expectedPhaseToken) {
    return processPhaseTimeout(
        expectedPhaseToken
    );
}

function resetMatch() {
    match = null;
}

module.exports = {
    startMatch,
    assignTournamentEntry,
    getMatch,
    getCurrentQuestion,
    getCurrentQuestionToken,
    getActivePhaseToken,
    startRound,
    getUpcomingQuestion,
    markCorrect,
    markIncorrect,
    processAnswer,
    processPhaseTimeout,
    processTimeout,
    resetMatch
};
