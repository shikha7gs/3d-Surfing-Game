const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const clock = new THREE.Clock();

const oceanWidth = 2000;
const oceanLength = 2000;
const numOceanSegmentsX = 5;
const numOceanSegmentsZ = 5;
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

const ambientLight = new THREE.AmbientLight(0x404040, 15);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(1, 1, 1).normalize();
scene.add(directionalLight);

let surfboard;
let mixer;
const loader = new THREE.GLTFLoader();
let modelLoaded = false;
const obstacles = [];
const numObstacles = 8;
const obstacleSpacing = 10;
const preLoadDistance = 60;

let rockModel, bushModel, sandModel, boatModel;
loader.load('assets/obstacles/rock.glb', (gltf) => {
  rockModel = gltf.scene;
  rockModel.scale.set(0.8, 0.8, 0.8);
  rockModel.position.y = 0;
}, undefined, (error) => {
  console.error('Error loading rock model:', error);
});

loader.load('assets/obstacles/bush.glb', (gltf) => {
  bushModel = gltf.scene;
  bushModel.scale.set(2, 2, 2);
  bushModel.position.y = 1;
}, undefined, (error) => {
  console.error('Error loading bush model:', error);
});

loader.load('assets/obstacles/sand.glb', (gltf) => {
  sandModel = gltf.scene;
  sandModel.scale.set(1, 1, 1);
  sandModel.position.y = 1;
}, undefined, (error) => {
  console.error('Error loading sand model:', error);
});

loader.load('assets/obstacles/boat.glb', (gltf) => {
  boatModel = gltf.scene;
  boatModel.scale.set(0.03, 0.03, 0.03);
  boatModel.position.y = 1;
}, undefined, (error) => {
  console.error('Error loading boat model:', error);
});

loader.load('assets/player.glb', (gltf) => {
  surfboard = gltf.scene;
  surfboard.scale.set(0.8, 0.8, 0.8);
  surfboard.position.y = 1;
  surfboard.rotation.y = Math.PI / 2;
  scene.add(surfboard);

  mixer = new THREE.AnimationMixer(surfboard);

  if (gltf.animations.length > 0) {
    const action = mixer.clipAction(gltf.animations[0]);
    action.loop = THREE.LoopRepeat;
    action.play();
  }

  modelLoaded = true;
  document.getElementById('start-screen').style.display = 'block';
}, undefined, (error) => {
  console.error('Error loading model:', error);
});

function createObstacle() {
  if (!surfboard || !modelLoaded || !rockModel || !bushModel || !sandModel || !boatModel) return;

  const obstacle = Math.random() < 0.25 ? rockModel.clone() :
    Math.random() < 0.5 ? bushModel.clone() :
    Math.random() < 0.75 ? sandModel.clone() : boatModel.clone();

  const radius = 30;
  const randomX = surfboard.position.x + (Math.random() - 0.5) * radius * 2;
  const randomY = 0.5;
  const randomZ = surfboard.position.z + preLoadDistance + Math.random() * 50;
  obstacle.position.set(randomX, randomY, randomZ);
  obstacles.push(obstacle);
  scene.add(obstacle);
}

function startGame() {
  document.getElementById('start-screen').style.display = 'none';
  if (!modelLoaded) {
    alert("Model not loaded yet!");
    return;
  }

  backgroundMusic.play();
  gameStarted = true;
  score = 0;
  scoreElement.innerHTML = `Score: ${score}`;

  for (let i = 0; i < numObstacles; i++) {
    createObstacle();
  }
}

function endGame() {
  gameStarted = false;
  surfboardSpeed = 0;
  backgroundMusic.pause();
  gameOverSound.play();
  document.getElementById('game-over-screen').style.display = 'block';
}

camera.position.z = -10;
camera.position.y = 5;

let surfboardSpeed = 0.5;
let surfboardSideSpeed = 0.5;
const keys = { left: false, right: false };
let gameStarted = false;
let score = 0;

const scoreElement = document.getElementById('score');
const backgroundMusic = new Audio('assets/sounds/background.mp3');
const startSound = new Audio('assets/sounds/start.mp3');
const gameOverSound = new Audio('assets/sounds/game-over.mp3');

backgroundMusic.loop = true;

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'a') {
    keys.left = true;
    if (surfboard) {
      surfboard.rotation.y = Math.PI / 2 + Math.PI / 5;
    }
  }
  if (event.key === 'ArrowRight' || event.key === 'd') {
    keys.right = true;
    if (surfboard) {
      surfboard.rotation.y = Math.PI / 2 - Math.PI / 5;
    }
  }
  if (event.key === ' ' && !gameStarted && modelLoaded) {
    startGame();
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key === 'ArrowLeft' || event.key === 'a') {
    keys.left = false;
    if (surfboard) {
      surfboard.rotation.y = Math.PI / 2;
    }
  }
  if (event.key === 'ArrowRight' || event.key === 'd') {
    keys.right = false;
    if (surfboard) {
      surfboard.rotation.y = Math.PI / 2;
    }
  }
});

let touchStartX = null;

window.addEventListener('touchstart', (event) => {
  if (!gameStarted && modelLoaded) startGame();
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

document.getElementById('restart-button').addEventListener('click', () => {
  document.location.reload();
});

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);

  if (!gameStarted || !surfboard) return;

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
      endGame();
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