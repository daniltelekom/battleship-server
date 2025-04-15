
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("."));

let players = [];

io.on("connection", (socket) => {
  if (players.length >= 2) return;

  players.push({ id: socket.id, socket, ready: false, ships: [] });

  socket.on("ready", ({ ships }) => {
    const player = players.find(p => p.id === socket.id);
    if (player) {
      player.ready = true;
      player.ships = ships;
    }
    if (players.every(p => p.ready)) {
      players.forEach(p => p.socket.emit("start"));
    }
  });

  socket.on("shoot", ({ index }) => {
    const shooter = players.find(p => p.id === socket.id);
    const opponent = players.find(p => p.id !== socket.id);
    let hit = false;
    opponent.ships.forEach(ship => {
      if (ship.includes(index)) hit = true;
    });
    shooter.socket.emit("shot-result", { index, result: hit });
  });

  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server started on http://localhost:3000");
});
