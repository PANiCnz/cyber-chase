const express = require("express");
const chaserService =
    require("../services/chaserService");

const router = express.Router();

function notifyCatalogChanged(req) {
    const io = req.app.get("io");

    if (io) {
        io.emit("chasersUpdated", {
            timestamp: Date.now()
        });
    }
}

router.get("/", (req, res) => {
    res.json(
        chaserService.listActiveChasers()
    );
});

router.get("/manage/all", (req, res) => {
    res.json(
        chaserService.listAllChasers()
    );
});

router.post("/", (req, res) => {
    try {
        const chaser =
            chaserService.createChaser({
                name: req.body.name,
                department: req.body.department,
                title:
                    req.body.nickname ??
                    req.body.title,
                bio: req.body.bio,
                image: req.body.image,
                active: req.body.active === true
            });

        notifyCatalogChanged(req);
        res.status(201).json(chaser);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
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

router.put("/:id", (req, res) => {
    try {
        const chaser =
            chaserService.updateChaser(
                req.params.id,
                req.body
            );

        if (!chaser) {
            return res.status(404).json({
                error: "Chaser not found"
            });
        }

        notifyCatalogChanged(req);
        res.json(chaser);
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
});

module.exports = router;
