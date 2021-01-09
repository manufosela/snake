import { ModalLayer } from 'vanilla-modal-layer';
import 'animation-explosion';

function init() {
  drawSnakeAndElements();
  snakeGroup = [...document.querySelectorAll('.snake')];
  snakeGroup.forEach((snakeCell) => {
    fixPosition(snakeCell);
  });
  apple = document.querySelector('.apple');
  fixPosition(apple);
  const message = phaseMessage[phase].map(msg => `<p>${msg}</p>`).join('');
  modalToStartGame(message);
  showPoints();

  const style = document.createElement('style');
  style.innerHTML = `
    body { --board-size: ${boardSize}px; --num-cells: ${numCells}; --cell-size: ${cellSize}; }
    .shadow-wall { border: ${cellSize}px inset #999; width: ${boardSize + cellSize*2}px; height: ${boardSize + cellSize*2}px; }
    .wall { width: ${boardSize + cellSize*4}px; height: ${boardSize + cellSize*4}px; }
  `;
  document.head.appendChild(style);

  boardLayer = document.querySelector(".board-layer");
  tailHead = document.querySelector('[data-id="0"]');
  pointsLayer = document.getElementById('points');
  phasePointsLayer = document.getElementById('phasePoints');
  totalPointsLayer = document.getElementById('totalPoints');

  window.addEventListener("keydown", changeOrientation);
}

function drawSnakeAndElements() {
  const appleHTML = getElementToCaptureHTML('apple');
  const lengthSnake = 3;
  const snakeHTML = getSnakeHTML(lengthSnake);
  document.querySelector('.board-layer').innerHTML = appleHTML + snakeHTML;
}

function getSnakeHTML() {
  let snakeHTML = '';
  for (let i=0; i < initialSize; i++) {
    snakeHTML += `<div class="snake${(i===0)?' head':''}" data-id="${i}" data-row="20" data-col="${20-i}" data-orientation="E"></div>\n`;
  }
  return snakeHTML;
}

function getExplosionDOMObj() {
  const animationExplosion = document.createElement('animation-explosion');
  animationExplosion.id = "snake-explosion";
  animationExplosion.bubles="20";
  animationExplosion.size="100";
  return animationExplosion;
}

function startGame() {
  lastTime = new Date().getTime();
  moveTic = setInterval(move, 5);
  modalLayer.hideModal();
}

function stopGame() {
  clearInterval(moveTic);
}

function modalToStartGame(message) {
  modalLayer.contentHTML = `
    <div part="modal" class="modal">
      ${message}
      <button part="button">PLAY</button>
    </div>
  `;
  modalLayer.openModal();
  modalLayer.modalHTML.shadowRoot.querySelector('button').addEventListener('click', startGame);
}

function showPoints() {
  const information = document.querySelector('.information');
  information.innerHTML = `
    <input id="totalPoints" type="text" class="points" value="${totalPoints}" size="4" length="4" /><label for="totalPoints"> total points </label>   
    <input id="points" type="text" class="points" value="${points}" size="4" length="4" /><label for="points"> green apples</label>
    <input id="phasePoints" type="text" class="points" value="${phasePoints[phase]}" /><label for="phasePoints"> green apples to reach</label>
  `;
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

function isPhaseComplete() {
  return (points === phasePoints[phase]);
}

function capture(x, y, elem) {
  const isCaptured = (x == elem.dataset.col && y == elem.dataset.row);
  if (isCaptured) { 
    points += 1;
    totalPoints += 1;
    pointsLayer.value = points;
    totalPointsLayer.value = totalPoints;
    phasePointsLayer.value = phasePoints[phase] - points;
    console.log(`${elem.title} is captured`); 
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

function getRandomElementPosition() {
  return [parseInt(Math.random() * numCells) + 1, parseInt(Math.random() * numCells) + 1];
}

function getElementToCaptureHTML(cssClass = 'apple') {
  const [ elemPosX, elemPosY ] = getRandomElementPosition();
  const apple = `<div class="${cssClass}" title="apple" data-col="${elemPosX}" data-row="${elemPosY}"></div>`
  return apple;
}

function drawElem(elem) {
  const [ elemX, elemY ] = getRandomElementPosition();
  elem.dataset.col = elemX;
  elem.dataset.row = elemY;
  fixPosition(elem);
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
  const explosionObj = getExplosionDOMObj();
  tailHead.appendChild(explosionObj);
  explosionObj.showExplosion();
  playAgain('YOU LOSE!');
  console.log("collision!!");
}

function cleanChangeDirection() {
  if (changeDir === 'dirty') {
    const setOrientations = [...snakeGroup.reduce((acum, elem) => {
      acum.add(elem.dataset.orientation);
      return acum;
    }, new Set())];
    if (setOrientations.length === 1) {
      console.log('clean change dir');
      changeDir = 'clean';
      changeDirPosition = {};
    } 
  }
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
  cleanChangeDirection();

  steps += 1;
  const x = tailHead.dataset.col;
  const y = tailHead.dataset.row;
  if (collision(x, y)) {
    manageCollision();
  } else {
    if (capture(x, y, apple)) {
      if (!isPhaseComplete()) {
        growUp();
        drawElem(document.querySelector('.apple'));
      } else {
        stopGame();
        newPhase();
        drawElem(document.querySelector('.apple'));
      }
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

function reset() {
  document.querySelector('.board-layer').innerHTML = '';
  points = 0;
  totalPoints = 0;
  size = initialSize;
  phase = 1;
  speed = 1;
}

function playAgain(msg) {
  modalLayer.contentHTML = `
    <div part="modal" class="modal">
      <h4>GAME OVER!<h4>
      <h3>${msg}</h3>
      <button>PLAY AGAIN</button>
    </div>
  `;
  modalLayer.openModal();
  modalLayer.modalHTML.shadowRoot.querySelector('button').addEventListener('click', () => {
    reset();
    init();
  });
}

function newPhase() {
  phase += 1;
  points = 0;
  if (phase >= phasePoints.length) {
    playAgain('YOU WIN!!');
  } else {
    // SHOW NEXT PHASE
    const message = phaseMessage[phase].map(msg => `<p>${msg}</p>`).join('');
    modalToStartGame(message);
  }
}

const numCells = 50;
const cellSize = 10; // px
const boardSize = 500; //px
const dirX = { N: 0, S: 0, E: 1, O: -1 };
const dirY = { N: -1, S: 1, E: 0, O: 0 };
const tailOrientation = { 'ArrowUp': 'N', 'ArrowDown': 'S', 'ArrowRight': 'E', 'ArrowLeft': 'O' };
const notAllowedOrientation = {'N': 'S', 'S': 'N', 'E': 'O', 'O': 'E' };
let apple;
let changeDirPosition = {};
let changeDir = 'clean';
let initialSize = 3;
let size = initialSize;
let steps = 0;
let points = 0;
let totalPoints = 0;
const phasePoints = [0, 5, 10, 15, 20, 30, 40, 50];
let phase = 1;
let timeBase = 500; // miliSECONDS
let lastTime = new Date().getTime();
let speed = 1;
let moveTic;
let snakeGroup;
let boardLayer;
let tailHead;
const phaseMessage = [
  [],
  ['Use arrow cursors to move the snake.', `Reach ${phasePoints[1]} apples to change of phase.`, 'Every apple eated increase the snake length and its speed.'],
  ['Phase 1 complete', 'Good!!!', `Reach ${phasePoints[2]} apples to change of phase.`, 'Every apple eated increase the snake length and its speed.'],
  ['Phase 2 complete', 'Well Done!!!', `Reach ${phasePoints[3]} apples to change of phase.`, 'Every apple eated increase the snake length and its speed.'],
  ['Phase 3 complete', 'Your are an incredible player!!!', `Reach ${phasePoints[4]} apples to change of phase.`, 'Every apple eated increase the snake length and its speed.'],
  ['Phase 4 complete', 'Fantastic!!!', `Reach ${phasePoints[5]} apples to change of phase.`, 'Every apple eated increase the snake length and its speed.'],
  ['Phase 5 complete', 'Your are awesome!!!', `Reach ${phasePoints[6]} apples to change of phase.`, 'Every apple eated increase the snake length and its speed.'],
  ['Phase 6 complete', `Really? It's impossible!!!`, `Reach ${phasePoints[7]} apples to change of phase.`, 'Every apple eated increase the snake length and its speed.']
];
let pointsLayer;
let phasePointsLayer;
let totalPointsLayer;
let modalLayer = new ModalLayer({heightModal:'300px', widthModal:'400px'}); 

window.onload = init();
