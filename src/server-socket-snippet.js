
// Add to your existing server.js

io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("refreshGame", async () => {
        io.emit("gameState", {
            timestamp: Date.now()
        });
    });
});
