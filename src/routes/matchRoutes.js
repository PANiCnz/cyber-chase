
const router = require("express").Router();
const matchService =
    require("../services/matchService");
const chaserService =
    require("../services/chaserService");
const timerService =
    require("../services/timerService");

router.post("/start-match", (req, res) => {
    const {
        teamName,
        teamMembers,
        contestantName,
        contestantDepartment,
        chaserId,
        chaserName,
        contestantDifficulty,
        chaserDifficulty
    } = req.body;
    const matchName =
        typeof teamName === "string"
            ? teamName
            : contestantName;

    if (
        typeof matchName !== "string" ||
        matchName.trim() === ""
    ) {
        return res.status(400).json({
            error: "Team name is required"
        });
    }

    if (typeof teamName === "string") {
        const validTeamMembers =
            Array.isArray(teamMembers) &&
            teamMembers.length === 4 &&
            teamMembers.every(
                member =>
                    typeof member === "string" &&
                    member.trim() !== ""
            );

        if (!validTeamMembers) {
            return res.status(400).json({
                error:
                    "Four team member names are required"
            });
        }
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
            matchName.trim(),
            chaserSnapshot,
            typeof contestantDepartment === "string"
                ? contestantDepartment.trim()
                : "",
            {
                contestant:
                    contestantDifficulty,
                chaser:
                    chaserDifficulty
            },
            Array.isArray(teamMembers)
                ? teamMembers.map(member =>
                    typeof member === "string"
                        ? member.trim()
                        : ""
                )
                : []
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
