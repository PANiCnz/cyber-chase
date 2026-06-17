
const express = require("express");
const router = express.Router();

const matchService =
    require("../services/matchService");
const timerService =
    require("../services/timerService");
const questionService =
    require("../services/questionService");

function emitQuestionUpdate(req) {
    req.app.get("io")?.emit(
        "questionsUpdated",
        { timestamp: Date.now() }
    );
}

router.get("/difficulties", (req, res) => {
    res.json(
        questionService.getAvailableDifficulties()
    );
});

router.get("/manage", (req, res) => {
    try {
        res.json(
            questionService.getQuestionBankStatus()
        );
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

router.post(
    "/manage/:bank/upload",
    express.raw({
        type: [
            "text/csv",
            "application/csv",
            "application/vnd.ms-excel",
            "application/octet-stream"
        ],
        limit: "3mb"
    }),
    (req, res) => {
        try {
            const summary =
                questionService.replaceQuestionBank(
                    req.params.bank,
                    req.body
                );

            emitQuestionUpdate(req);
            res.status(201).json(summary);
        } catch (error) {
            res.status(400).json({
                error: error.message
            });
        }
    }
);

router.delete("/manage/:bank", (req, res) => {
    try {
        const summary =
            questionService.clearQuestionBank(
                req.params.bank
            );

        emitQuestionUpdate(req);
        res.json(summary);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

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

function startRound(req, res, automatic) {
    const result =
        matchService.startRound({
            automatic
        });

    if (result.error) {
        const status =
            result.error === "No active match"
                ? 404
                : 409;

        return res.status(status).json(result);
    }

    const timer = timerService.startQuestion(
        result.phaseToken,
        120
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
}

router.post("/start", (req, res) => {
    startRound(req, res, false);
});

router.post("/start-opening", (req, res) => {
    startRound(req, res, true);
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

    if (result.match.winner) {
        timerService.completePhase(
            result.phaseToken
        );
    }

    res.json(result);
});

module.exports = router;
