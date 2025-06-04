const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startBtn      = document.getElementById('startButton');
const stopBtn       = document.getElementById('stopButton');
const levelDisplay  = document.getElementById('levelDisplay');
const healthDisplay = document.getElementById('healthDisplay');
const resultsList   = document.getElementById('resultsList');
const playerNameInput = document.getElementById('playerName');

let balls = [];
let player = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  radius: parseInt(document.getElementById('playerSize').value)
};
let currentLevel = 0;
let gameActive = false;
let startTime = 0;
let playerHealth = parseInt(document.getElementById('playerHealth').value);
let targetColor = document.getElementById('targetColor').value;


const zigzagAmplitude = 20;
const zigzagFrequency = 0.02; 

function updateResults() {
  let results = JSON.parse(localStorage.getItem('gameResults') || '[]');
  resultsList.innerHTML = '';
  results.forEach(result => {
    const li = document.createElement('li');
    li.textContent = `${result.name} - Рівень: ${result.level}, Час: ${result.time}s`;
    resultsList.appendChild(li);
  });
}

function saveResult() {
  const name = playerNameInput.value || 'Анонім';
  const timeSec = ((Date.now() - startTime) / 1000).toFixed(1);
  let results = JSON.parse(localStorage.getItem('gameResults') || '[]');
  results.push({ name: name, level: currentLevel, time: timeSec });
  localStorage.setItem('gameResults', JSON.stringify(results));
  updateResults();
}

function createBalls(num) {
  balls = [];
  const minSize = parseInt(document.getElementById('ballMinSize').value);
  const maxSize = parseInt(document.getElementById('ballMaxSize').value);
  const maxSpeed = parseFloat(document.getElementById('maxSpeed').value);

  const possibleColors = ['#e53e3e', '#3182ce', '#38b2ac'];

  for (let i = 0; i < num; i++) {
    const radius = Math.random() * (maxSize - minSize) + minSize;
    let x = Math.random() * (canvas.width - 2 * radius) + radius;
    let y = Math.random() * (canvas.height - 2 * radius) + radius;
    let baseDx = (Math.random() * 2 - 1) * maxSpeed;
    let baseDy = (Math.random() * 2 - 1) * maxSpeed;
    let color = possibleColors[Math.floor(Math.random() * possibleColors.length)];

    let initialPhase = Math.random() * 1000;

    balls.push({ 
      x, 
      y, 
      dx: baseDx, 
      dy: baseDy, 
      radius, 
      color, 
      phase: initialPhase 
    });
  }
}

canvas.addEventListener('mousemove', function(event) {
  const rect = canvas.getBoundingClientRect();
  player.x = event.clientX - rect.left;
  player.y = event.clientY - rect.top;
});

function animate() {
  if (!gameActive) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  balls.forEach((ball, index) => {
    if (ball.color === '#3182ce') {
      ball.phase += zigzagFrequency;
      const offsetY = Math.sin(ball.phase) * zigzagAmplitude;
      ball.x += ball.dx;
      ball.y += ball.dy + offsetY;
    } else if (ball.color === '#38b2ac') {
      const jitterX = (Math.random() * 2 - 1) * 1.5; 
      const jitterY = (Math.random() * 2 - 1) * 1.5;
      ball.x += ball.dx + jitterX;
      ball.y += ball.dy + jitterY;
    } else {
      ball.x += ball.dx;
      ball.y += ball.dy;
    }

    if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
      ball.dx = -ball.dx;
      ball.x = Math.min(Math.max(ball.x, ball.radius), canvas.width - ball.radius);
    }
    if (ball.y + ball.radius > canvas.height || ball.y - ball.radius < 0) {
      ball.dy = -ball.dy;
      ball.y = Math.min(Math.max(ball.y, ball.radius), canvas.height - ball.radius);
    }

    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, 2 * Math.PI);
    ctx.fillStyle = ball.color;
    ctx.fill();

    const dx = ball.x - player.x;
    const dy = ball.y - player.y;
    const dist = Math.hypot(dx, dy);

    if (dist < ball.radius + player.radius) {
      if (ball.color === targetColor) {
        balls.splice(index, 1);
      } else {
        playerHealth--;
        updateHealthDisplay();
        balls.splice(index, 1);

        if (playerHealth <= 0) {
          gameActive = false;
          saveResult();
          alert('Гру завершено! Життя закінчилися.');
          return; 
        }
      }
    }
  });

  const remainingTargets = balls.filter(b => b.color === targetColor).length;

  if (remainingTargets === 0) {
    currentLevel++;
    levelDisplay.textContent = currentLevel;

    const baseCount = parseInt(document.getElementById('ballCount').value);
    createBalls(baseCount + currentLevel * 2);
  }

  ctx.beginPath();
  ctx.arc(player.x, player.y, player.radius, 0, 2 * Math.PI);
  ctx.fillStyle = 'blue';
  ctx.fill();

  requestAnimationFrame(animate);
}

startBtn.addEventListener('click', function() {
  if (gameActive) return;

  currentLevel = 1;
  levelDisplay.textContent = currentLevel;

  playerHealth = parseInt(document.getElementById('playerHealth').value);
  updateHealthDisplay();

  const baseCount = parseInt(document.getElementById('ballCount').value);
  createBalls(baseCount);

  player.radius = parseInt(document.getElementById('playerSize').value);
  targetColor = document.getElementById('targetColor').value;

  startTime = Date.now();
  gameActive = true;
  animate();
});

stopBtn.addEventListener('click', function() {
  if (!gameActive) return;
  gameActive = false;
  saveResult();
});

function updateHealthDisplay() {
  healthDisplay.textContent = playerHealth;
}

updateResults();
updateHealthDisplay();
