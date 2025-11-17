// --- Inicialización del canvas ---
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// --- Variables globales ---
let scale;
let paddleWidth, paddleHeight, paddleX, paddleY, paddleSpeed;
let ballX, ballY, ballRadius, speedX, speedY;
let brickRowCount = 5, brickColumnCount = 7;
let brickWidth, brickHeight, brickPadding, brickOffsetTop, brickOffsetLeft;
let bricks = [];
let score = 0, lives = 3;

// --- Colores y puntos por fila (cyberpunk) ---
const rowColors = ["#ff00ff", "#00ffff", "#39ff14", "#ff6f00", "#ffff00"];
const rowPoints = [50, 40, 30, 20, 10];

// --- Partículas ---
let particles = [];
function createParticles(x, y, color) {
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: x,
      y: y,
      dx: (Math.random() - 0.5) * 6 * scale,
      dy: (Math.random() - 0.5) * 6 * scale,
      radius: Math.random() * 3 * scale + 2 * scale,
      color: color,
      life: 60
    });
  }
}
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.dx;
    p.y += p.dy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }
}
function drawParticles() {
  for (let p of particles) {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.life / 60;
    ctx.fill();
    ctx.closePath();
    ctx.globalAlpha = 1;
  }
}

// --- Sprite de la bola ---
const ballSprite = new Image();
ballSprite.src = "img/billar.png"; // ajusta la ruta si está en otra carpeta

let frameCount = 8; // número de frames horizontales
let currentFrame = 0;
let frameWidth, frameHeight;

ballSprite.onload = () => {
  frameWidth = ballSprite.width / frameCount;
  frameHeight = ballSprite.height;
};

// actualizar frame en cada ciclo
function updateSpriteFrame() {
  currentFrame = (currentFrame + 1) % frameCount;
}

// dibujar la bola como sprite
function drawBall() {
  if (ballSprite.complete && frameWidth) {
    ctx.drawImage(
      ballSprite,
      currentFrame * frameWidth, 0, frameWidth, frameHeight, // recorte del sprite
      ballX - ballRadius, ballY - ballRadius, ballRadius * 2, ballRadius * 2 // posición y tamaño en canvas
    );
  } else {
    // fallback: círculo neón si el sprite no está cargado
    let gradient = ctx.createRadialGradient(ballX, ballY, ballRadius / 4, ballX, ballY, ballRadius);
    gradient.addColorStop(0, "#ff00ff");
    gradient.addColorStop(0.5, "#00ffff");
    gradient.addColorStop(1, "#39ff14");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
  }
}

// --- Ajuste dinámico del juego ---
function resizeGame() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  scale = canvas.width / 480;

  // Raqueta
  paddleWidth = 60 * scale;
  paddleHeight = 10 * scale;
  paddleX = (canvas.width - paddleWidth) / 2;
  paddleY = canvas.height - paddleHeight - 20 * scale;
  paddleSpeed = 5 * scale;

  // Pelota
  ballX = canvas.width / 2;
  ballY = canvas.height - 30 * scale;
  ballRadius = 12 * scale;
  speedX = 2 * scale;
  speedY = -2 * scale;

  // Ladrillos
  brickWidth = 55 * scale;
  brickHeight = 20 * scale;
  brickPadding = 10 * scale;
  brickOffsetTop = 30 * scale;
  let totalBricksWidth = brickColumnCount * (brickWidth + brickPadding) - brickPadding;
  brickOffsetLeft = (canvas.width - totalBricksWidth) / 2;

  // Reiniciar ladrillos
  bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1, color: rowColors[r], points: rowPoints[r] };
    }
  }
}
resizeGame();
window.addEventListener("resize", resizeGame);

// --- Controles teclado ---
let rightPressed = false, leftPressed = false;
document.addEventListener("keydown", e => {
  if (e.key === "ArrowRight") rightPressed = true;
  else if (e.key === "ArrowLeft") leftPressed = true;
});
document.addEventListener("keyup", e => {
  if (e.key === "ArrowRight") rightPressed = false;
  else if (e.key === "ArrowLeft") leftPressed = false;
});

// --- Controles táctiles ---
canvas.addEventListener("touchmove", function(e) {
  let touch = e.touches[0];
  let relativeX = touch.clientX - canvas.offsetLeft;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
  e.preventDefault();
}, { passive: false });

// --- Update ---
function update() {
  if (rightPressed && paddleX + paddleWidth < canvas.width) paddleX += paddleSpeed;
  if (leftPressed && paddleX > 0) paddleX -= paddleSpeed;

  ballX += speedX;
  ballY += speedY;

  if (ballX + ballRadius > canvas.width || ballX - ballRadius < 0) speedX = -speedX;
  if (ballY - ballRadius < 0) speedY = -speedY;

  if (ballY + ballRadius > paddleY &&
      ballX > paddleX && ballX < paddleX + paddleWidth) {
    ballY = paddleY - ballRadius;
    let hitPoint = ballX - (paddleX + paddleWidth / 2);
    hitPoint = hitPoint / (paddleWidth / 2);
    speedX = hitPoint * 4 * scale;
    speedY = -speedY;
  }

  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      let b = bricks[c][r];
      if (b.status === 1) {
        if (ballX > b.x && ballX < b.x + brickWidth &&
            ballY > b.y && ballY < b.y + brickHeight) {
          speedY = -speedY;
          b.status = 0;
          score += b.points;
          createParticles(b.x + brickWidth/2, b.y + brickHeight/2, b.color);
        }
      }
    }
  }

  if (ballY + ballRadius > canvas.height) {
    lives--;
    if (!lives) {
      alert("Game Over 😢 Score: " + score);
      document.location.reload();
    } else {
      ballX = canvas.width / 2;
      ballY = canvas.height - 30 * scale;
      speedX = 2 * scale;
      speedY = -2 * scale;
      paddleX = (canvas.width - paddleWidth) / 2;
    }
  }

  updateParticles();
  updateSpriteFrame();
}

// --- Draw ---
function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        let brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
        let brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.fillStyle = bricks[c][r].color;
        ctx.shadowColor = bricks[c][r].color;
        ctx.shadowBlur = 10;
        ctx.fillRect(brickX, brickY, brickWidth, brickHeight);
        ctx.shadowBlur = 0;
      }
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // pelota (sprite o fallback neón)
  drawBall();

  // raqueta con glow
  ctx.fillStyle = "#00ffff";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 15;
  ctx.fillRect(paddleX, paddleY, paddleWidth, paddleHeight);
  ctx.shadowBlur = 0;

  // ladrillos
  drawBricks();

  // partículas
  drawParticles();

  // marcador
  ctx.font = `${16 * scale}px Arial`;
  ctx.fillStyle = "white";
  ctx.fillText("Score: " + score, 8, 20 * scale);
  ctx.fillText("Lives: " + lives, canvas.width - 80 * scale, 20 * scale);
}

// --- Loop principal ---
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
