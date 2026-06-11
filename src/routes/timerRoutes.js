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
        matchService.getCurrentQuestionToken();

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
    if (
        !matchService.getCurrentQuestionToken()
    ) {
        return res.status(409).json({
            error: "No active round"
        });
    }

    res.json(timerService.pause());
});

router.post("/reset", (req, res) => {
    const questionToken =
        matchService.getCurrentQuestionToken();

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

module.exports = router;
