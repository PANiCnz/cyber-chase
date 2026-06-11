const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const chaserService =
    require("../services/chaserService");

const router = express.Router();
const IMAGE_DIRECTORY = path.resolve(
    __dirname,
    "../../data/chaser-images"
);
const IMAGE_TYPES = {
    "image/jpeg": {
        extension: "jpg",
        matches: buffer =>
            buffer.length >= 3 &&
            buffer[0] === 0xff &&
            buffer[1] === 0xd8 &&
            buffer[2] === 0xff
    },
    "image/png": {
        extension: "png",
        matches: buffer =>
            buffer.length >= 8 &&
            buffer.subarray(0, 8).equals(
                Buffer.from([
                    0x89, 0x50, 0x4e, 0x47,
                    0x0d, 0x0a, 0x1a, 0x0a
                ])
            )
    },
    "image/webp": {
        extension: "webp",
        matches: buffer =>
            buffer.length >= 12 &&
            buffer.toString("ascii", 0, 4) === "RIFF" &&
            buffer.toString("ascii", 8, 12) === "WEBP"
    }
};

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

router.post(
    "/upload-image",
    express.raw({
        type: [
            "image/jpeg",
            "image/png",
            "image/webp"
        ],
        limit: "5mb"
    }),
    (req, res) => {
        const imageType =
            IMAGE_TYPES[req.get("content-type")];

        if (
            !imageType ||
            !Buffer.isBuffer(req.body) ||
            !imageType.matches(req.body)
        ) {
            return res.status(400).json({
                error:
                    "Upload a valid JPEG, PNG, or WebP image"
            });
        }

        fs.mkdirSync(IMAGE_DIRECTORY, {
            recursive: true
        });

        const fileName =
            `${crypto.randomUUID()}.${imageType.extension}`;
        fs.writeFileSync(
            path.join(IMAGE_DIRECTORY, fileName),
            req.body
        );

        res.status(201).json({
            image:
                `/chaser-images/${fileName}`
        });
    }
);

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

router.use((error, req, res, next) => {
    if (error?.type === "entity.too.large") {
        return res.status(413).json({
            error:
                "The image must be 5 MB or smaller"
        });
    }

    next(error);
});

module.exports = router;
