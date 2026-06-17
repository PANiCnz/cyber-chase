const router = require("express").Router();
const matchService =
    require("../services/matchService");
const timerService =
    require("../services/timerService");

router.get("/state", (req, res) => {
    res.json(timerService.state());
});

router.post("/start", (req, res) => {
    const questionToken =
        matchService.getActivePhaseToken();

    if (!questionToken) {
        return res.status(409).json({
            error: "No active round"
        });
    }

    res.json(
        timerService.resumeQuestion(
            questionToken
        )
    );
});

router.post("/pause", (req, res) => {
    if (!matchService.getActivePhaseToken()) {
        return res.status(409).json({
            error: "No active round"
        });
    }

    res.json(timerService.pause());
});

router.post("/reset", (req, res) => {
    const questionToken =
        matchService.getActivePhaseToken();

    if (!questionToken) {
        return res.status(409).json({
            error: "No active round"
        });
    }

    res.json(
        timerService.resetQuestion(
            questionToken
        )
    );
});

router.post("/end", (req, res) => {
    const questionToken =
        matchService.getActivePhaseToken();

    if (!questionToken) {
        return res.status(409).json({
            error: "No active round"
        });
    }

    timerService.expireQuestion(
        questionToken
    );
    res.json(timerService.state());
});

module.exports = router;
