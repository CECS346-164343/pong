const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const playerScoreEl = document.getElementById("playerScore");
const cpuScoreEl = document.getElementById("cpuScore");
const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");

const winningScore = 7;
const paddleWidth = 14;
const paddleHeight = 100;
const paddleMargin = 28;
const ballSize = 14;

const player = {
  x: paddleMargin,
  y: canvas.height / 2 - paddleHeight / 2,
  speed: 520,
};

const cpu = {
  x: canvas.width - paddleMargin - paddleWidth,
  y: canvas.height / 2 - paddleHeight / 2,
  speed: 390,
};

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  vx: 420,
  vy: 220,
  size: ballSize,
};

const keys = new Set();
let playerScore = 0;
let cpuScore = 0;
let isRunning = false;
let isPaused = false;
let gameOver = false;
let lastTime = 0;

function resetBall(direction = Math.random() > 0.5 ? 1 : -1) {
  ball.x = canvas.width / 2 - ballSize / 2;
  ball.y = canvas.height / 2 - ballSize / 2;
  const angle = (Math.random() * 0.8 - 0.4) * Math.PI;
  const speed = 430;
  ball.vx = Math.cos(angle) * speed * direction;
  ball.vy = Math.sin(angle) * speed;
}

function resetGame() {
  playerScore = 0;
  cpuScore = 0;
  player.y = canvas.height / 2 - paddleHeight / 2;
  cpu.y = canvas.height / 2 - paddleHeight / 2;
  playerScoreEl.textContent = "0";
  cpuScoreEl.textContent = "0";
  isRunning = false;
  isPaused = false;
  gameOver = false;
  resetBall();
  pauseButton.textContent = "Pause";
  pauseButton.disabled = true;
  startButton.disabled = false;
  startButton.textContent = "Start";
  draw();
}

function startGame() {
  if (gameOver) resetGame();
  isRunning = true;
  isPaused = false;
  lastTime = performance.now();
  startButton.disabled = true;
  pauseButton.disabled = false;
  pauseButton.textContent = "Pause";
}

function togglePause() {
  if (!isRunning) return;
  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
  lastTime = performance.now();
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function intersectsBall(paddle) {
  return (
    ball.x < paddle.x + paddleWidth &&
    ball.x + ball.size > paddle.x &&
    ball.y < paddle.y + paddleHeight &&
    ball.y + ball.size > paddle.y
  );
}

function update(delta) {
  if (keys.has("w") || keys.has("arrowup")) {
    player.y -= player.speed * delta;
  }
  if (keys.has("s") || keys.has("arrowdown")) {
    player.y += player.speed * delta;
  }
  player.y = clamp(player.y, 0, canvas.height - paddleHeight);

  const cpuTarget = ball.y + ball.size / 2 - paddleHeight / 2;
  const cpuDelta = cpuTarget - cpu.y;
  cpu.y += clamp(cpuDelta, -cpu.speed * delta, cpu.speed * delta);
  cpu.y = clamp(cpu.y, 0, canvas.height - paddleHeight);

  ball.x += ball.vx * delta;
  ball.y += ball.vy * delta;

  if (ball.y <= 0) {
    ball.y = 0;
    ball.vy = Math.abs(ball.vy);
  } else if (ball.y + ball.size >= canvas.height) {
    ball.y = canvas.height - ball.size;
    ball.vy = -Math.abs(ball.vy);
  }

  if (intersectsBall(player) && ball.vx < 0) {
    ball.x = player.x + paddleWidth;
    const hit = (ball.y + ball.size / 2 - (player.y + paddleHeight / 2)) / (paddleHeight / 2);
    ball.vx = Math.abs(ball.vx) * 1.05;
    ball.vy = hit * 380;
  }

  if (intersectsBall(cpu) && ball.vx > 0) {
    ball.x = cpu.x - ball.size;
    const hit = (ball.y + ball.size / 2 - (cpu.y + paddleHeight / 2)) / (paddleHeight / 2);
    ball.vx = -Math.abs(ball.vx) * 1.05;
    ball.vy = hit * 380;
  }

  if (ball.x + ball.size < 0) {
    cpuScore++;
    cpuScoreEl.textContent = cpuScore;
    scorePoint();
  } else if (ball.x > canvas.width) {
    playerScore++;
    playerScoreEl.textContent = playerScore;
    scorePoint();
  }
}

function scorePoint() {
  if (playerScore >= winningScore || cpuScore >= winningScore) {
    isRunning = false;
    gameOver = true;
    pauseButton.disabled = true;
    startButton.disabled = false;
    startButton.textContent = "Play Again";
  } else {
    resetBall(playerScore > cpuScore ? -1 : 1);
  }
}

function drawPaddle(paddle) {
  ctx.fillStyle = "#f4f7fb";
  ctx.fillRect(paddle.x, paddle.y, paddleWidth, paddleHeight);
}

function draw() {
  ctx.fillStyle = "#0d111a";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#667085";
  ctx.setLineDash([14, 18]);
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.strokeStyle = "#667085";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.setLineDash([]);

  drawPaddle(player);
  drawPaddle(cpu);
  ctx.fillStyle = "#f4f7fb";
  ctx.fillRect(ball.x, ball.y, ball.size, ball.size);

  if (isPaused) drawCenterMessage("PAUSED");
  if (gameOver) {
    drawCenterMessage(playerScore >= winningScore ? "YOU WIN!" : "CPU WINS");
  }
}

function drawCenterMessage(message) {
  ctx.fillStyle = "rgba(13, 17, 26, 0.82)";
  ctx.fillRect(canvas.width / 2 - 150, canvas.height / 2 - 38, 300, 76);
  ctx.fillStyle = "#f4f7fb";
  ctx.font = "bold 36px Courier New";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
  ctx.textAlign = "start";
}

function loop(time) {
  const delta = Math.min((time - lastTime) / 1000, 0.025);
  lastTime = time;

  if (isRunning && !isPaused) update(delta);
  draw();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  if (["w", "s", "arrowup", "arrowdown", " "].includes(key)) event.preventDefault();
  if (key === " ") {
    if (isRunning) togglePause();
    else startGame();
  }
  keys.add(key);
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

canvas.addEventListener("pointermove", (event) => {
  if (!isRunning) return;
  const rect = canvas.getBoundingClientRect();
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  player.y = clamp(y - paddleHeight / 2, 0, canvas.height - paddleHeight);
});

startButton.addEventListener("click", startGame);
pauseButton.addEventListener("click", togglePause);
resetButton.addEventListener("click", resetGame);

resetGame();
requestAnimationFrame(loop);
