import { ModalLayer } from 'vanilla-modal-layer';

function init() {
  newDot();
  snakeGroup = [...document.querySelectorAll('.snake')];
  snakeGroup.forEach((snakeCell) => {
    fixPosition(snakeCell);
  });
  modalToStartGame();
  showPoints();
  //showButtons();

  const style = document.createElement('style');
  style.innerHTML = `
    body {
      --board-size: ${boardSize}px;
      --num-cells: ${numCells};
      --cell-size: ${cellSize};
    }
    .shadow-wall {
      border: ${cellSize}px inset #999;
      width: ${boardSize + cellSize*2}px;
      height: ${boardSize + cellSize*2}px;
    }
    .wall {
      width: ${boardSize + cellSize*4}px;
      height: ${boardSize + cellSize*4}px;
    }
  `;
  document.head.appendChild(style);

  boardLayer = document.querySelector(".board-layer");
  tailHead = document.querySelector('[data-id="0"]');
  pointsLayer = document.getElementById('points');

  window.addEventListener("keydown", changeOrientation);
}

function startGame() {
  lastTime = new Date().getTime();
  moveTic = setInterval(move, 5);
  modalLayer.hideModal();
}

function stopGame() {
  clearInterval(moveTic);
}

function modalToStartGame() {
  modalLayer.contentHTML = `
    <div part="modal" class="modal">
      <button part="button">PLAY</button>
    </div>
  `;
  modalLayer.openModal();
  modalLayer.modalHTML.shadowRoot.querySelector('button').addEventListener('click', startGame);
}

function showPoints() {
  const wall = document.querySelector('.wall');
  const nav = document.createElement('nav');
  nav.id = 'pointsLayer';
  nav.innerHTML = `
    <input id="points" type="text" class="points" value="0" size="4" length="4" /><label for="points"> points</label>
  `;
  wall.parentNode.insertBefore(nav, wall);
}

function showButtons() {
  const wall = document.querySelector('.wall');
  const nav = document.createElement('nav');
  nav.id = 'botonera';
  nav.innerHTML = `
    <button id="start">Start</button>
    <button id="stop">Pause</button><br>
    <label for="speed">Speed: </label><input id="speed" type="text" value="1" size="3"/><button id="changeSpeed">Change Speed</button>
    <button id="growUp">Grow Up</button>
  `;
  wall.parentNode.insertBefore(nav, wall);
  addButtonListeners();
}

function addButtonListeners() {
  document.getElementById("start").addEventListener("click", startGame);
  document.getElementById("stop").addEventListener("click", stopGame);
  document.getElementById("growUp").addEventListener("click", () => {
    growUp();
  });
  document.getElementById("changeSpeed").addEventListener("click", () => {
    const speedValue = document.getElementById("speed").value;
    speed = parseFloat(speedValue);
  });
}

function changeOrientation(ev) {
  const key = ev.key;
  const headOrientation = tailHead.dataset.orientation;
  if (notAllowedOrientation[headOrientation] != tailOrientation[key]) {
    console.log(key);
    steps = 0;
    changeDirPosition[`${tailHead.dataset.col}-${tailHead.dataset.row}`] = tailOrientation[key];
  }
}

function capture(x, y) {
  const isCaptured = (x == dotX && y == dotY);
  if (isCaptured) { 
    points += 1;
    pointsLayer.value = points;
    console.log('Dot is captured'); 
  }
  return isCaptured;
}

function fixPosition(element) {
  element.style.gridColumn = element.dataset.col;
  element.style.gridRow = element.dataset.row;
}

function growUp() {
  const tail = document.querySelector(`[data-id="${size - 1}"]`);
  const tailX = parseInt(tail.dataset.col);
  const tailY = parseInt(tail.dataset.row);
  const tailOrientation = tail.dataset.orientation;
  size += 1;
  const newTail = document.createElement("div");
  newTail.classList.add('snake');
  newTail.dataset.id = size - 1;
  newTail.dataset.row = tailY + (-dirY[tailOrientation]);
  newTail.dataset.col = tailX + (-dirX[tailOrientation]);
  newTail.dataset.orientation = tailOrientation;
  boardLayer.appendChild(newTail);
  fixPosition(newTail);
  snakeGroup = [...document.querySelectorAll('.snake')];
  speed += 0.2;
}

function newDot() {
  dotX = parseInt(Math.random() * numCells) + 1;
  dotY = parseInt(Math.random() * numCells) + 1;
  const dot = document.querySelector('.dot');
  dot.dataset.col = dotX;
  dot.dataset.row = dotY;
  fixPosition(dot);
}

function collision(x, y) {
  const snakeGroupWithoutFirst = [...snakeGroup];
  snakeGroupWithoutFirst.shift();
  const col = tailHead.dataset.col;
  const row = tailHead.dataset.row;
  const headCellCollision = (snakeDot) => snakeDot.dataset.col === col && snakeDot.dataset.row === row;
  const selfCollision = snakeGroupWithoutFirst.some(headCellCollision);
  return x > numCells || x < 1 || y > numCells || y < 1 || selfCollision;
}

function manageCollision() {
  clearInterval(moveTic);
  console.log("collision!!");
}

function movesnake() {
  snakeGroup.forEach((snakeCell) => {
    const col = snakeCell.dataset.col;
    const row = snakeCell.dataset.row;
    if (changeDirPosition[`${col}-${row}`] !== undefined) {
      snakeCell.dataset.orientation = changeDirPosition[`${col}-${row}`];
      changeDir = 'dirty';
    }
    const cellOrientation = snakeCell.dataset.orientation;
    snakeCell.dataset.col = parseInt(snakeCell.dataset.col) + dirX[cellOrientation];
    snakeCell.dataset.row = parseInt(snakeCell.dataset.row) + dirY[cellOrientation];
  });
  const setOrientations = [...snakeGroup.reduce((acum, elem) => {
    acum.add(elem.dataset.orientation);
    return acum;
  }, new Set())];
  if (setOrientations.length === 1 && changeDir === 'dirty') {
    console.log('clean change dir');
    changeDir = 'clean';
    changeDirPosition = {};
  } 

  steps += 1;
  const x = tailHead.dataset.col;
  const y = tailHead.dataset.row;
  if (collision(x, y)) {
    manageCollision();
  } else {
    if (capture(x, y)) {
      growUp();
      newDot();
    }
    snakeGroup.forEach((snakeCell) => {
      fixPosition(snakeCell);
    });
  }
}

function move() {
  const time = new Date().getTime();
  const step = timeBase / speed;
  if (time - lastTime > step) {
    lastTime = time;
    movesnake();
  }
}

const numCells = 50;
const maxY = 50;
const cellSize = 10; // px
const boardSize = 500; //px
const dirX = { N: 0, S: 0, E: 1, O: -1 };
const dirY = { N: -1, S: 1, E: 0, O: 0 };
const tailOrientation = { 'ArrowUp': 'N', 'ArrowDown': 'S', 'ArrowRight': 'E', 'ArrowLeft': 'O' };
const notAllowedOrientation = {'N': 'S', 'S': 'N', 'E': 'O', 'O': 'E' };
let dotX;
let dotY;
let changeDirPosition = {};
let changeDir = 'clean';
let size = 3;
let steps = 0;
let points = 0;
let timeBase = 500; // miliSECONDS
let lastTime = new Date().getTime();
let speed = 1;
let moveTic;
let snakeGroup;
let boardLayer;
let tailHead;
let pointsLayer;
const modalLayer = new ModalLayer({heightModal:'200px', widthModal:'300px'}); 

window.onload = init();
