
const router = require("express").Router();
const matchService =
    require("../services/matchService");
const chaserService =
    require("../services/chaserService");
const timerService =
    require("../services/timerService");

router.post("/start-match", (req, res) => {
    const {
        contestantName,
        contestantDepartment,
        chaserId,
        chaserName,
        contestantDifficulty,
        chaserDifficulty
    } = req.body;

    if (
        typeof contestantName !== "string" ||
        contestantName.trim() === ""
    ) {
        return res.status(400).json({
            error: "Contestant name is required"
        });
    }

    if (
        typeof chaserId !== "string" &&
        typeof chaserName !== "string"
    ) {
        return res.status(400).json({
            error: "Chaser selection is required"
        });
    }

    const chaser = typeof chaserId === "string"
        ? chaserService.getChaserById(chaserId)
        : chaserService.findChaserByName(
            chaserName
        );

    if (!chaser) {
        return res.status(404).json({
            error: "Chaser not found"
        });
    }

    const chaserSnapshot =
        chaserService.createMatchSnapshot(chaser);

    let match;

    try {
        match = matchService.startMatch(
            contestantName.trim(),
            chaserSnapshot,
            typeof contestantDepartment === "string"
                ? contestantDepartment.trim()
                : "",
            {
                contestant:
                    contestantDifficulty,
                chaser:
                    chaserDifficulty
            }
        );
    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }

    timerService.reset();
    res.json(match);
});

router.get("/state", (req, res) => {
    res.json(matchService.getMatch());
});

router.post("/reset", (req, res) => {
    matchService.resetMatch();
    timerService.reset();

    res.json({
        match: matchService.getMatch(),
        timer: timerService.state()
    });
});

module.exports = router;
