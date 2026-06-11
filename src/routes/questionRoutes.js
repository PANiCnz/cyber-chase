
const express = require("express");
const router = express.Router();

const matchService =
    require("../services/matchService");
const timerService =
    require("../services/timerService");

router.get("/current", (req, res) => {
    res.json(
        matchService.getCurrentQuestion()
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

    const { answer } = req.body;

    const result =
        matchService.processAnswer(
            answer
        );

    if (result.error) {
        const status =
            result.error === "No active question"
                ? 404
                : 400;

        return res.status(status).json(result);
    }

    if (result.match.winner) {
        timerService.pause();
    }

    res.json(result);
});

module.exports = router;
