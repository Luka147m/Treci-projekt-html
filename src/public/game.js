const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Početne postavke igre
let ROWS = 8;
let COLUMNS = 8;
let BALL_RADIUS = 10;
let MAX_SPEED = 4;
let PADDLE_SENSITIVITY = 3;
let PADDLE_SPEED = 10;

// Parametri igre
const COLORS = ['#FF0000', '#FFA500', '#00FF00', '#FFFF00'];

// Veličina i pozicija cigli
const BRICK_GAP = 10;
let BRICK_WIDTH = Math.floor(
  (canvas.width - 4 - 40 - (COLUMNS + 1) * BRICK_GAP) / COLUMNS
); // 20 + 20 + 4 padding + border
let BRICK_HEIGHT = Math.floor((canvas.height * 0.3) / ROWS); // 0.3 otprilike
let TOTAL_BRICK_WIDTH = COLUMNS * BRICK_WIDTH + (COLUMNS - 1) * BRICK_GAP;

let OFFSET = (canvas.width - TOTAL_BRICK_WIDTH) / 2;
const TOP_OFFSET = 64;

const PADDLE_HEIGHT = 10;
const PADDLE_WIDTH = 100;

let paddle_x = (canvas.width - PADDLE_WIDTH) / 2;

let right = false;
let left = false;

let bricks = [];

let score = 0;
let max_score = localStorage.getItem('maxScore') || 0;

let ball_x = canvas.width / 2;
let ball_y = canvas.height - PADDLE_HEIGHT - 10;

let ball_x_direction;
let ball_y_direction;

let game_running = false;
let animation_frame;

// Postavke igre
const settingsButton = document.getElementById('settingsButton');
const settingsDiv = document.getElementById('settingsDiv');
const closeSettingsButton = document.getElementById('closeSettings');
const applySettingsButton = document.getElementById('applySettings');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');

const rowsInput = document.getElementById('rows');
const columnsInput = document.getElementById('columns');
const ballRadiusInput = document.getElementById('ballRadius');
const maxSpeedInput = document.getElementById('maxSpeed');
const paddleSpeedInput = document.getElementById('paddleSpeed');
const paddleSensitivityInput = document.getElementById('paddleSensitivity');

// Kada se učita izračunaj dimenzije i nacrtaj igru
window.onload = () => {
  calculateSizes();
  bricks = [];
  createBricks();
  drawElements();
};

startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', restartGame);

// Prikaz postavki
settingsButton.addEventListener('click', () => {
  settingsDiv.style.display = 'flex';

  rowsInput.value = ROWS;
  columnsInput.value = COLUMNS;
  ballRadiusInput.value = BALL_RADIUS;
  maxSpeedInput.value = MAX_SPEED;
  paddleSpeedInput.value = PADDLE_SPEED;
  paddleSensitivityInput.value = PADDLE_SENSITIVITY;
});

// Zatvori postavke
closeSettingsButton.addEventListener('click', () => {
  settingsDiv.style.display = 'none';
});

// Primjeni postavke i ponovno nacrtaj igru
applySettingsButton.addEventListener('click', () => {
  const rows_new = parseInt(rowsInput.value);
  const columns_new = parseInt(columnsInput.value);
  const radius_new = parseInt(ballRadiusInput.value);
  const speed_new = parseInt(maxSpeedInput.value);
  const sensitivity_new = parseInt(paddleSensitivityInput.value);
  const paddle_speed_new = parseInt(paddleSpeedInput.value);

  // Provjera vrijednost i postavljanje istih
  if (
    rows_new >= 1 &&
    rows_new <= 8 &&
    columns_new >= 1 &&
    columns_new <= 14 &&
    radius_new >= 5 &&
    radius_new <= 10 &&
    speed_new >= 1 &&
    speed_new <= 10 &&
    paddle_speed_new >= 5 &&
    paddle_speed_new <= 20 &&
    sensitivity_new >= 1 &&
    sensitivity_new <= 6
  ) {
    ROWS = rows_new;
    COLUMNS = columns_new;
    BALL_RADIUS = radius_new;
    MAX_SPEED = speed_new;
    PADDLE_SENSITIVITY = sensitivity_new;
    PADDLE_SPEED = paddle_speed_new;

    calculateSizes();

    bricks = [];
    createBricks();

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawElements();

    settingsDiv.style.display = 'none';
  } else {
    alert('Unos nije valjan! Provjerite vrijednosti.');
  }
});

let resizeTimeout;

window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);

  // Pozovi ponovno crtanje
  resizeTimeout = setTimeout(() => {
    calculateSizes();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawElements();
  }, 200);
});

// Funkcija koja dinamički izračuna određene veličine
function calculateSizes() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  BRICK_WIDTH = Math.floor(
    (canvas.width - 4 - 40 - (COLUMNS + 1) * BRICK_GAP) / COLUMNS
  );
  BRICK_HEIGHT = Math.floor((canvas.height * 0.3) / ROWS);
  TOTAL_BRICK_WIDTH = COLUMNS * BRICK_WIDTH + (COLUMNS - 1) * BRICK_GAP;
  OFFSET = (canvas.width - TOTAL_BRICK_WIDTH) / 2;
  paddle_x = (canvas.width - PADDLE_WIDTH) / 2;
  ball_x = canvas.width / 2;
  ball_y = canvas.height - PADDLE_HEIGHT - 10;
}

// Poziva ostale elemente i crta ih
function drawElements() {
  drawScore();
  drawBorder();
  drawBricks();
  drawBall();
  drawPaddle();
}

// Funkcija za rezultat igre
function drawScore() {
  ctx.font = '32px "Arcade", Arial, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'left';
  ctx.fillText('Breakout', 0, 32);
  ctx.textAlign = 'right';
  ctx.fillText('Rekord: ' + max_score + ' Bodovi: ' + score, canvas.width, 32);
}

// Funckija za okvir igre, granice odbijanja
function drawBorder() {
  ctx.beginPath();
  ctx.rect(
    0,
    TOP_OFFSET - BRICK_GAP,
    canvas.width,
    canvas.height - TOP_OFFSET + PADDLE_HEIGHT
  );
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#FFFFFF';
  ctx.stroke();
  ctx.closePath();
}

// Funkcija za kreiranje cigli 2d array, tako pratimo koja cigla je pogodena
function createBricks() {
  for (let c = 0; c < COLUMNS; c++) {
    bricks[c] = [];
    for (let r = 0; r < ROWS; r++) {
      bricks[c][r] = { x: 0, y: 0, hit: 0 }; // hit 0 nije pogođena
    }
  }
}

// Funkcija za crtanje cigli
function drawBricks() {
  for (let c = 0; c < COLUMNS; c++) {
    for (let r = 0; r < ROWS; r++) {
      if (bricks[c][r].hit == 0) {
        // Računamo pozicije svake cigli uzimajući u obzir razmake
        let x = c * (BRICK_WIDTH + BRICK_GAP) + OFFSET;
        let y = r * (BRICK_HEIGHT + BRICK_GAP) + TOP_OFFSET;

        bricks[c][r].x = x;
        bricks[c][r].y = y;

        let brickColor = COLORS[Math.floor(r / 2) % COLORS.length];
        // Za svaku ciglu posebni path
        ctx.beginPath();
        ctx.shadowColor = darken(brickColor, 155);
        ctx.shadowBlur = 1;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 4;
        ctx.rect(x, y, BRICK_WIDTH, BRICK_HEIGHT);
        ctx.fillStyle = brickColor;
        ctx.fill();
        ctx.closePath();
      }
    }
  }

  // Resetiramo da se ne primjeni na ostale elemente
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

// Pomoćna funkcija za sjenčanje cigli, uzme boju i potamni je
function darken(hex, amount) {
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);

  r = Math.max(0, r - amount);
  g = Math.max(0, g - amount);
  b = Math.max(0, b - amount);
  return `rgba(${r}, ${g}, ${b}, 1)`;
}

// Funkcija za nasumični početak prema gore
function startAngle() {
  // Vektor kojim će se kretati
  let random_x = Math.random() * 2 - 1;
  let random_y = Math.random() * 2 - 1;

  // Mora ići prema gore
  if (random_y > 0) random_y = -random_y;

  // Da kut ne bude previše tup
  random_x = Math.max(Math.min(random_x, 0.5), -0.5);

  // Računamo normu vektora tako da je brzina uvijek konstantna
  const norm = Math.sqrt(random_x ** 2 + random_y ** 2);

  let x = (random_x / norm) * MAX_SPEED;
  let y = (random_y / norm) * MAX_SPEED;

  return [x, y];
}

// Funkcija za crtanje loptice
function drawBall() {
  ctx.beginPath();

  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 1;
  ctx.shadowOffsetX = 3;
  ctx.shadowOffsetY = 4;

  ctx.arc(ball_x, ball_y, BALL_RADIUS, 0, 2 * Math.PI);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();

  ctx.closePath();

  // Resetiramo da se ne primjeni na ostale elemente
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

// Funkcija za crtanje palice
function drawPaddle() {
  ctx.beginPath();

  ctx.rect(
    paddle_x,
    canvas.height - PADDLE_HEIGHT,
    PADDLE_WIDTH,
    PADDLE_HEIGHT
  );

  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 1;
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;

  ctx.fillStyle = '#FF0000';
  ctx.fill();
  ctx.closePath();

  // Resetiramo da se ne primjeni na ostale elemente
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
}

// Funkcije za kretanje strelice i a d
document.addEventListener('keydown', keyPress, false);
document.addEventListener('keyup', keyRelease, false);

function keyPress(e) {
  if (e.key == 'Right' || e.key == 'ArrowRight' || e.key == 'd') {
    right = true;
  } else if (e.key == 'Left' || e.key == 'ArrowLeft' || e.key == 'a') {
    left = true;
  }
}

function keyRelease(e) {
  if (e.key == 'Right' || e.key == 'ArrowRight' || e.key == 'd') {
    right = false;
  } else if (e.key == 'Left' || e.key == 'ArrowLeft' || e.key == 'a') {
    left = false;
  }
}

const beep_wav = new Audio('/sounds/beep.wav');
const border_paddle_hit = new Audio('/sounds/borderPaddleHit.wav');
const game_end = new Audio('/sounds/gameEnd.wav');

function beep() {
  beep_wav.currentTime = 0;
  beep_wav.play();
}

function borderPaddleHit() {
  border_paddle_hit.currentTime = 0;
  border_paddle_hit.play();
}

function gameEnd() {
  game_end.currentTime = 0;
  game_end.play();
}

// Funkcija za detekciju kolizije između loptice i cigli
function isCollision() {
  for (let c = 0; c < COLUMNS; c++) {
    for (let r = 0; r < ROWS; r++) {
      let b = bricks[c][r];
      // Za svaku ciglu ako nije već pogođena
      if (b.hit == 0) {
        // Uvjeti ako je lopta pogodila ciglu
        if (
          ball_x + BALL_RADIUS > b.x &&
          ball_x - BALL_RADIUS < b.x + BRICK_WIDTH &&
          ball_y + BALL_RADIUS > b.y &&
          ball_y - BALL_RADIUS < b.y + BRICK_HEIGHT
        ) {
          // Ako je pogodila ciglu na gornjoj ili donjoj strani
          if (
            ball_y - BALL_RADIUS < b.y ||
            ball_y + BALL_RADIUS > b.y + BRICK_HEIGHT
          ) {
            ball_y_direction = -ball_y_direction;
          }
          // Pogodilo sastrane
          else if (
            ball_x + BALL_RADIUS > b.x + BRICK_WIDTH ||
            ball_x - BALL_RADIUS < b.x
          ) {
            ball_x_direction = -ball_x_direction;
          }

          b.hit = 1;
          score++;
          beep();

          // Uništio sve cigle, pobjeda
          if (score == ROWS * COLUMNS) {
            stopGame('Pobjeda!');
          }

          if (score > max_score) {
            max_score = score;
            localStorage.setItem('maxScore', max_score);
          }
        }
      }
    }
  }
}

// Funkcija za crtanje cijele igre
function draw() {
  if (!game_running) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawElements();
  isCollision();

  // Lijeva i desna granica, zidovi
  if (
    ball_x + ball_x_direction > canvas.width - BALL_RADIUS ||
    ball_x + ball_x_direction < BALL_RADIUS
  ) {
    // promjeni samo x smjer, inverz
    ball_x_direction = -ball_x_direction;
    borderPaddleHit();
  }
  // Gornja granica
  if (ball_y + ball_y_direction < TOP_OFFSET - BRICK_GAP + BALL_RADIUS) {
    // Promjeni samo y smjer
    ball_y_direction = -ball_y_direction;
    borderPaddleHit();
  }
  // Visinska granica palice
  else if (
    ball_y + ball_y_direction >
    canvas.height - BALL_RADIUS - PADDLE_HEIGHT
  ) {
    // Da li je dirao palicu
    if (
      ball_x + BALL_RADIUS > paddle_x &&
      ball_x - BALL_RADIUS < paddle_x + PADDLE_WIDTH
    ) {
      // Vrati nazad
      ball_y_direction = -ball_y_direction;
      borderPaddleHit();
      // Palica će odbijati svaki put malo drugačije ovisno kojim dijelom smo lupili palicu
      // Iz razloga da možemo kontrolirati lopticu, zabavnije za igranje :)
      let paddle_hit_position =
        (ball_x - (paddle_x + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);

      ball_x_direction += paddle_hit_position * PADDLE_SENSITIVITY;

      // Opet moramo ograničiti da brzina bude konstantna, pomoću norme vektora
      const norm = Math.sqrt(ball_x_direction ** 2 + ball_y_direction ** 2);
      ball_x_direction = (ball_x_direction / norm) * MAX_SPEED;
      ball_y_direction = (ball_y_direction / norm) * MAX_SPEED;
    }
    // Promašili smo palicu kraj igre
    else {
      gameEnd();
      stopGame('Game over');
    }
  }

  // Pomicanje palice
  if (right && paddle_x < canvas.width - PADDLE_WIDTH) {
    paddle_x += PADDLE_SPEED;
  } else if (left && paddle_x > 0) {
    paddle_x -= PADDLE_SPEED;
  }

  ball_x += ball_x_direction;
  ball_y += ball_y_direction;
  animation_frame = requestAnimationFrame(draw);
}

// Funkcija za početak igre
function startGame() {
  game_running = true;
  document.getElementById('popup').style.visibility = 'hidden';
  document.getElementById('startButton').style.visibility = 'hidden';

  [ball_x_direction, ball_y_direction] = startAngle();
  draw();
}

// Funkcija za zaustavljanje igre pobjeda ili gubitak
function stopGame(message) {
  game_running = false;
  // Zaustavljamo animacije
  cancelAnimationFrame(animation_frame);
  document.getElementById('popupText').textContent = message;
  document.getElementById('popup').style.visibility = 'visible';
  document.getElementById('restartButton').style.display = 'inline-block';
}

// Funkcija za ponovno igranje
function restartGame() {
  game_running = true;
  score = 0;
  ball_x = canvas.width / 2;
  ball_y = canvas.height - PADDLE_HEIGHT - 10;
  paddle_x = (canvas.width - PADDLE_WIDTH) / 2;
  bricks = [];
  createBricks();
  document.getElementById('popup').style.visibility = 'hidden';
  draw();
}
