
const questionService = require("./questionService");

let match = null;

function startMatch(contestantName, chaserName, contestantDepartment = "") {

    const questions = questionService.createMatchQuestions();

    match = {
        started: true,

        contestant: {
            name: contestantName,
            department: contestantDepartment,
            score: 0
        },

        chaser: {
            name: chaserName,
            department: "Information Security",
            score: 0
        },

        currentPlayer: "contestant",

        contestantQuestions: questions.contestantQuestions,
        chaserQuestions: questions.chaserQuestions,

        contestantQuestionIndex: 0,
        chaserQuestionIndex: 0,

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

function processAnswer(submittedAnswer) {

    const question = getCurrentQuestion();

    if (!question) {
        return {
            correct: false,
            error: "No active question"
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

    return {
        correct: isCorrect,
        submittedAnswer: answer,
        correctAnswer: correctAnswer,
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
    getUpcomingQuestion,
    markCorrect,
    markIncorrect,
    processAnswer,
    resetMatch
};
