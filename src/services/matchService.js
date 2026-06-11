
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

function startMatch(contestantName, chaser, contestantDepartment = "") {

    const questions = questionService.createMatchQuestions();

    match = {
        started: true,

        contestant: {
            name: contestantName,
            department: contestantDepartment,
            score: 0
        },

        chaser: createChaserState(chaser),

        currentPlayer: "contestant",

        contestantQuestions: questions.contestantQuestions,
        chaserQuestions: questions.chaserQuestions,

        contestantQuestionIndex: 0,
        chaserQuestionIndex: 0,

        roundActive: false,
        winner: null
    };

    return match;
}

function getMatch() {
    return match;
}

function getCurrentQuestion() {

    if (!match) return null;

    if (match.currentPlayer === "contestant") {
        return match.contestantQuestions[
            match.contestantQuestionIndex
        ];
    }

    return match.chaserQuestions[
        match.chaserQuestionIndex
    ];
}

function getCurrentQuestionToken() {
    if (
        !match ||
        match.winner ||
        !match.roundActive
    ) {
        return null;
    }

    const index = match.currentPlayer === "contestant"
        ? match.contestantQuestionIndex
        : match.chaserQuestionIndex;

    return `${match.currentPlayer}:${index}`;
}

function startRound() {
    if (!match) {
        return {
            error: "No active match"
        };
    }

    if (match.winner) {
        return {
            error: "Match is complete"
        };
    }

    if (match.roundActive) {
        return {
            error: "Round is already active"
        };
    }

    const question = getCurrentQuestion();

    if (!question) {
        return {
            error: "No active question"
        };
    }

    match.roundActive = true;

    return {
        match,
        question,
        questionToken:
            getCurrentQuestionToken()
    };
}

function getUpcomingQuestion() {

    if (!match) return null;

    if (match.currentPlayer === "contestant") {
        return match.contestantQuestions[
            match.contestantQuestionIndex + 1
        ];
    }

    return match.chaserQuestions[
        match.chaserQuestionIndex + 1
    ];
}

function advanceTurn() {

    if (match.currentPlayer === "contestant") {

        match.contestantQuestionIndex++;
        match.currentPlayer = "chaser";

    } else {

        match.chaserQuestionIndex++;
        match.currentPlayer = "contestant";
    }
}

function checkWinner() {

    if (match.contestant.score >= 5) {
        match.winner = match.contestant.name;
    }

    if (match.chaser.score >= 5) {
        match.winner = match.chaser.name;
    }
}

function markCorrect() {

    if (!match) return null;

    if (match.currentPlayer === "contestant") {
        match.contestant.score++;
    } else {
        match.chaser.score++;
    }

    checkWinner();

    if (!match.winner) {
        advanceTurn();
    }

    return match;
}

function markIncorrect() {

    if (!match) return null;

    if (!match.winner) {
        advanceTurn();
    }

    return match;
}

function processAnswer(
    submittedAnswer,
    expectedQuestionToken
) {

    if (!match?.roundActive) {
        if (expectedQuestionToken) {
            return {
                correct: false,
                error: "Question is no longer active",
                stale: true
            };
        }

        return {
            correct: false,
            error: "No active round"
        };
    }

    const question = getCurrentQuestion();
    const questionToken =
        getCurrentQuestionToken();

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
            error: "Current question has no valid correct answer"
        };
    }

    const correctAnswer =
        question.correct.toLowerCase();

    const answer =
        submittedAnswer.toLowerCase();

    const isCorrect =
        answer === correctAnswer;

    if (isCorrect) {
        markCorrect();
    } else {
        markIncorrect();
    }
    match.roundActive = false;

    return {
        correct: isCorrect,
        submittedAnswer: answer,
        correctAnswer: correctAnswer,
        questionToken,
        match
    };
}

function processTimeout(expectedQuestionToken) {
    if (!match?.roundActive) {
        return {
            correct: false,
            error: "Question is no longer active",
            stale: true
        };
    }

    const question = getCurrentQuestion();
    const questionToken =
        getCurrentQuestionToken();

    if (
        !question ||
        expectedQuestionToken !== questionToken
    ) {
        return {
            correct: false,
            error: "Question is no longer active",
            stale: true
        };
    }

    const player = match.currentPlayer;
    const playerName = player === "chaser"
        ? match.chaser.name
        : match.contestant.name;
    const correctAnswer =
        typeof question.correct === "string"
            ? question.correct.toLowerCase()
            : "";

    markIncorrect();
    match.roundActive = false;

    return {
        correct: false,
        correctAnswer,
        questionToken,
        timeout: true,
        player,
        playerName,
        match
    };
}

function resetMatch() {
    match = null;
}

module.exports = {
    startMatch,
    getMatch,
    getCurrentQuestion,
    getCurrentQuestionToken,
    startRound,
    getUpcomingQuestion,
    markCorrect,
    markIncorrect,
    processAnswer,
    processTimeout,
    resetMatch
};
