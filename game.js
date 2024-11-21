const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const oceanWidth = 2000;
const oceanLength = 2000;
const numOceanSegmentsX = 5;
const numOceanSegmentsZ = 5;
const segmentLength = 800;
const oceanMaterial = new THREE.MeshLambertMaterial({ color: 0x1e90ff, emissive: 0x00aaff });

const oceanSegments = [];

function createOceanSegment(x, z) {
  const oceanGeometry = new THREE.PlaneGeometry(oceanWidth, oceanLength, 10, 10);
  const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.set(x, 0, z);
  oceanSegments.push(ocean);
  scene.add(ocean);
}

for (let i = 0; i < numOceanSegmentsX; i++) {
  for (let j = 0; j < numOceanSegmentsZ; j++) {
    createOceanSegment(i * oceanWidth, j * oceanLength);
  }
}

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

const surfboardGeometry = new THREE.BoxGeometry(1, 0.1, 2);
const surfboardMaterial = new THREE.MeshLambertMaterial({ color: 0xff6347 });
const surfboard = new THREE.Mesh(surfboardGeometry, surfboardMaterial);
surfboard.position.y = 1;
scene.add(surfboard);

const obstacleGeometry = new THREE.BoxGeometry(1, 1, 1);
const obstacleMaterial = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
const obstacles = [];
const numObstacles = 8;
const obstacleSpacing = 10;
const preLoadDistance = 60;

function createObstacle() {
  const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
  const radius = 30;
  const randomX = surfboard.position.x + (Math.random() - 0.5) * radius * 2;
  const randomY = 0.5;
  const randomZ = surfboard.position.z + preLoadDistance + Math.random() * 50;
  obstacle.position.set(randomX, randomY, randomZ);
  obstacles.push(obstacle);
  scene.add(obstacle);
}

for (let i = 0; i < numObstacles; i++) {
  createObstacle();
}

camera.position.z = -10;
camera.position.y = 5;
camera.lookAt(surfboard.position);

let surfboardSpeed = 0.5;
let surfboardSideSpeed = 0.5;
const keys = { left: false, right: false };

let gameStarted = false;
let score = 0;

const scoreElement = document.getElementById('score');
const backgroundMusic = new Audio('background.mp3');
const startSound = new Audio('start.mp3');
const gameOverSound = new Audio('game-over.mp3');

backgroundMusic.loop = true;

const screenWidth = window.innerWidth;
if (screenWidth < 768) {
  surfboardSpeed = 0.3;
  surfboardSideSpeed = 0.3;
}

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'a') keys.left = true;
  if (event.key === 'ArrowRight' || event.key === 'd') keys.right = true;
  if (event.key === ' ' && !gameStarted) {
    startGame();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'a') keys.left = false;
  if (event.key === 'ArrowRight' || event.key === 'd') keys.right = false;
});

let touchStartX = null;

window.addEventListener('touchstart', (event) => {
  if (!gameStarted) startGame();
  touchStartX = event.touches[0].clientX;
});

window.addEventListener('touchmove', (event) => {
  if (touchStartX !== null) {
    const touchEndX = event.touches[0].clientX;
    const touchDeltaX = touchEndX - touchStartX;

    if (touchDeltaX > 30) {
      keys.left = false;
      keys.right = true;
    } else if (touchDeltaX < -30) {
      keys.right = false;
      keys.left = true;
    }
  }
});

window.addEventListener('touchend', () => {
  keys.left = false;
  keys.right = false;
  touchStartX = null;
});

function startGame() {
  gameStarted = true;
  startSound.play();
  backgroundMusic.play();
  document.getElementById('start-screen').style.display = 'none';
}

function animate() {
  requestAnimationFrame(animate);

  if (!gameStarted) return;

  surfboard.position.z += surfboardSpeed;
  score = Math.floor(surfboard.position.z / 10);
  scoreElement.innerHTML = `Score: ${score}`;

  if (keys.left) surfboard.position.x += surfboardSideSpeed;
  if (keys.right) surfboard.position.x -= surfboardSideSpeed;

  obstacles.forEach((obstacle, index) => {
    obstacle.position.z -= surfboardSpeed;

    if (obstacle.position.z < surfboard.position.z - obstacleSpacing) {
      scene.remove(obstacle);
      obstacles.splice(index, 1);
      createObstacle();
    }

    if (surfboard.position.distanceTo(obstacle.position) < 2) {
      surfboardSpeed = 0;
      backgroundMusic.pause();
      gameOverSound.play();
      setTimeout(() => {
        document.location.reload();
      }, 2000);
    }
  });

  oceanSegments.forEach((segment) => {
    if (segment.position.z < surfboard.position.z - oceanLength / 2) {
      segment.position.z += oceanLength * numOceanSegmentsZ;
    }
    if (segment.position.x < surfboard.position.x - oceanWidth / 2) {
      segment.position.x += oceanWidth * numOceanSegmentsX;
    }
  });

  camera.position.x = surfboard.position.x;
  camera.position.z = surfboard.position.z - 10;
  camera.position.y = surfboard.position.y + 5;
  camera.lookAt(surfboard.position);

  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

animate();
