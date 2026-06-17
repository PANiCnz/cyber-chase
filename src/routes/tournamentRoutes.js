const router = require("express").Router();
const tournamentService =
    require("../services/tournamentService");

function emitTournamentUpdate(req) {
    req.app.get("io")?.emit(
        "tournamentUpdated",
        { timestamp: Date.now() }
    );
}

router.get("/", (req, res) => {
    res.json({
        live: tournamentService.getLiveTournament(),
        tournaments:
            tournamentService.listTournaments()
    });
});

router.get("/live", (req, res) => {
    res.json(tournamentService.getLiveTournament());
});

router.post("/", (req, res) => {
    try {
        const tournament =
            tournamentService.createTournament(
                req.body?.name
            );
        emitTournamentUpdate(req);
        res.status(201).json(tournament);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

router.post("/:id/open", (req, res) => {
    try {
        const tournament =
            tournamentService.openTournament(
                req.params.id
            );

        if (!tournament) {
            return res.status(404).json({
                error: "Tournament not found"
            });
        }

        emitTournamentUpdate(req);
        res.json(tournament);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

router.post("/:id/close", (req, res) => {
    const tournament =
        tournamentService.closeTournament(
            req.params.id
        );

    if (!tournament) {
        return res.status(404).json({
            error: "Tournament not found"
        });
    }

    emitTournamentUpdate(req);
    res.json(tournament);
});

module.exports = router;
