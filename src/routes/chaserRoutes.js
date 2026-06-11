const express = require("express");
const chaserService =
    require("../services/chaserService");

const router = express.Router();

router.get("/", (req, res) => {
    res.json(
        chaserService.listActiveChasers()
    );
});

router.get("/:id", (req, res) => {
    const chaser =
        chaserService.getChaserById(
            req.params.id
        );

    if (!chaser) {
        return res.status(404).json({
            error: "Chaser not found"
        });
    }

    res.json(chaser);
});

module.exports = router;
