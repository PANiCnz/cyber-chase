
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const matchRoutes = require("./routes/matchRoutes");
const questionRoutes = require("./routes/questionRoutes");
const timerRoutes = require("./routes/timerRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*" }
});

app.use(express.json());
app.use(express.static("public"));

app.use("/api/match", matchRoutes);
app.use("/api/question", questionRoutes);
app.use("/api/timer", timerRoutes);

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        version: "3.3.1"
    });
});

io.on("connection", socket => {

    console.log(`Client connected: ${socket.id}`);

    socket.on("refreshGame", () => {
        io.emit("gameState", {
            timestamp: Date.now()
        });
    });

    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Cyber Chase listening on port ${PORT}`);
});
