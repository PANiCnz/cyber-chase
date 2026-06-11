
const express = require("express");
const router = express.Router();

const matchService =
    require("../services/matchService");
const timerService =
    require("../services/timerService");

router.get("/current", (req, res) => {
    const question =
        matchService.getCurrentQuestion();
    const questionToken =
        matchService.getCurrentQuestionToken();

    if (question && questionToken) {
        timerService.startQuestion(
            questionToken
        );
    }

    res.json(
        question
            ? { ...question, questionToken }
            : null
    );
});

router.get("/upcoming", (req, res) => {
    res.json(
        matchService.getUpcomingQuestion()
    );
});

router.get("/answer", (req, res) => {

    const q =
        matchService.getCurrentQuestion();

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
