
const playerBoard = document.getElementById("player-board");
const opponentBoard = document.getElementById("opponent-board");
const toggleButton = document.getElementById("toggle-button");
const readyButton = document.getElementById("ready-button");

let direction = 'horizontal';
let playerShips = [];
let placedShips = 0;
let socket = io();

const shipConfig = [
  { size: 4, count: 1 },
  { size: 3, count: 2 },
  { size: 2, count: 3 },
  { size: 1, count: 4 },
];

let currentShipType = 0;
let currentPlaced = 0;

function createBoard(board) {
  for (let i = 0; i < 100; i++) {
    const cell = document.createElement("div");
    cell.classList.add("cell");
    cell.dataset.index = i;
    board.appendChild(cell);
  }
}

createBoard(playerBoard);
createBoard(opponentBoard);

function getAdjacentCells(index) {
  const offsets = [-11, -10, -9, -1, 1, 9, 10, 11];
  return offsets.map(offset => index + offset).filter(i => i >= 0 && i < 100);
}

function isValidPlacement(index, length, direction) {
  let ship = [];
  for (let i = 0; i < length; i++) {
    const cellIndex = direction === 'horizontal' ? index + i : index + i * 10;
    if (cellIndex >= 100) return null;
    const cell = playerBoard.querySelector(`[data-index="\${cellIndex}"]`);
    if (!cell || cell.classList.contains("ship")) return null;
    const rowStart = Math.floor(index / 10);
    const rowCurrent = Math.floor(cellIndex / 10);
    if (direction === "horizontal" && rowStart !== rowCurrent) return null;
    ship.push(cellIndex);
  }
  for (let i of ship) {
    const adj = getAdjacentCells(i);
    for (let j of adj) {
      const c = playerBoard.querySelector(`[data-index="\${j}"]`);
      if (c && c.classList.contains("ship")) return null;
    }
  }
  return ship;
}

function placeShip(index) {
  if (currentShipType >= shipConfig.length) return;
  const config = shipConfig[currentShipType];
  const ship = isValidPlacement(index, config.size, direction);
  if (ship) {
    ship.forEach(i => {
      const cell = playerBoard.querySelector(`[data-index="\${i}"]`);
      cell.classList.add("ship");
    });
    playerShips.push(ship);
    currentPlaced++;
    if (currentPlaced >= config.count) {
      currentPlaced = 0;
      currentShipType++;
    }
  } else {
    alert("Нельзя сюда ставить корабль");
  }
}

playerBoard.addEventListener("click", e => {
  const index = parseInt(e.target.dataset.index);
  placeShip(index);
});

toggleButton.addEventListener("click", () => {
  direction = direction === "horizontal" ? "vertical" : "horizontal";
});

readyButton.addEventListener("click", () => {
  if (playerShips.length === 10) {
    socket.emit("ready", { ships: playerShips });
    alert("Ожидание соперника...");
  } else {
    alert("Нужно расставить все корабли!");
  }
});

opponentBoard.addEventListener("click", e => {
  const index = parseInt(e.target.dataset.index);
  socket.emit("shoot", { index });
});

socket.on("shot-result", ({ index, result }) => {
  const cell = opponentBoard.querySelector(`[data-index="\${index}"]`);
  cell.classList.add(result ? "hit" : "miss");
});
