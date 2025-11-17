const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

  // --- Raqueta ---
  let paddleWidth = 60;
  let paddleHeight = 10;
  let paddleX = (canvas.width - paddleWidth) / 2;
  let paddleY = canvas.height - paddleHeight - 10;
  let paddleSpeed = 5;
  let rightPressed = false;
  let leftPressed = false;

  document.addEventListener("keydown", e => {
    if (e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "ArrowLeft") leftPressed = true;
  });
  document.addEventListener("keyup", e => {
    if (e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "ArrowLeft") leftPressed = false;
  });

  // --- Pelota ---
  let ballX = canvas.width / 2;
  let ballY = canvas.height - 30;
  let ballRadius = 12;
  let speedX = 2;
  let speedY = -2;

  // --- Ladrillos ---
  let brickRowCount = 5;
  let brickColumnCount = 7;
  let brickWidth = 55;
  let brickHeight = 20;
  let brickPadding = 10;
  let brickOffsetTop = 30;
  let totalBricksWidth = brickColumnCount * (brickWidth + brickPadding) - brickPadding;
  let brickOffsetLeft = (canvas.width - totalBricksWidth) / 2;

  let rowColors = ["#ff00ff", "#00ffff", "#39ff14", "#ff6f00", "#ffff00"];
  let rowPoints = [50, 40, 30, 20, 10];

  let bricks = [];
  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1, color: rowColors[r], points: rowPoints[r] };
    }
  }

  // --- Score y vidas ---
  let score = 0;
  let lives = 3;

  // --- Partículas ---
  let particles = [];

  function createParticles(x, y, color) {
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: x,
        y: y,
        dx: (Math.random() - 0.5) * 4,
        dy: (Math.random() - 0.5) * 4,
        radius: Math.random() * 3 + 2,
        color: color,
        life: 60 // frames de vida
      });
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      let p = particles[i];
      p.x += p.dx;
      p.y += p.dy;
      p.life--;
      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  }

  function drawParticles() {
    for (let p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 60; // desvanecer
      ctx.fill();
      ctx.closePath();
      ctx.globalAlpha = 1;
    }
  }

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
      speedX = hitPoint * 4;
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
        ballY = canvas.height - 30;
        speedX = 2;
        speedY = -2;
        paddleX = (canvas.width - paddleWidth) / 2;
      }
    }

    updateParticles();
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

    // pelota con degradado neón
    let gradient = ctx.createRadialGradient(ballX, ballY, ballRadius/4, ballX, ballY, ballRadius);
    gradient.addColorStop(0, "#ff00ff");
    gradient.addColorStop(0.5, "#00ffff");
    gradient.addColorStop(1, "#39ff14");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();

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
    ctx.font = "16px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText("Score: " + score, 8, 20);
    ctx.fillText("Lives: " + lives, canvas.width - 65, 20);
  }

  // --- Loop ---
  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  loop();