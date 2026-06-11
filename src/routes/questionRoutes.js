
const express = require("express");
const router = express.Router();

const matchService =
    require("../services/matchService");
const timerService =
    require("../services/timerService");

router.get("/current", (req, res) => {
    const questionToken =
        matchService.getCurrentQuestionToken();
    const question = questionToken
        ? matchService.getCurrentQuestion()
        : null;

    res.json(
        question
            ? { ...question, questionToken }
            : null
    );
});

router.post("/start", (req, res) => {
    const result =
        matchService.startRound();

    if (result.error) {
        const status =
            result.error === "No active match"
                ? 404
                : 409;

        return res.status(status).json(result);
    }

    const timer = timerService.startQuestion(
        result.questionToken
    );

    res.json({
        match: result.match,
        question: {
            ...result.question,
            questionToken:
                result.questionToken
        },
        timer
    });
});

router.get("/upcoming", (req, res) => {
    res.json(
        matchService.getUpcomingQuestion()
    );
});

router.get("/answer", (req, res) => {

    const questionToken =
        matchService.getCurrentQuestionToken();
    const q = questionToken
        ? matchService.getCurrentQuestion()
        : null;

    if (!q) {
        return res.status(404).json({
            error: "No active question"
        });
    }

    res.json({
        correct: q.correct
    });
});

router.post("/respond", (req, res) => {

    const {
        answer,
        questionToken
    } = req.body;

    const result =
        matchService.processAnswer(
            answer,
            questionToken
        );

    if (result.error) {
        const status = result.stale
            ? 409
            : result.error === "No active round"
                ? 409
            : result.error === "No active question"
                ? 404
                : 400;

        return res.status(status).json(result);
    }

    timerService.completeQuestion(
        result.questionToken
    );

    if (result.match.winner) {
        timerService.pause();
    }

    res.json(result);
});

module.exports = router;
