// Game state variables
let scene, camera, renderer, player, floor, obstacles = [];
let controls, mixer, playerModel;
let score = 0;
let gameActive = false;
let clock = new THREE.Clock();
let spawnRate = 1200; // Decreased from 1500 - obstacles spawn faster
let lastSpawnTime = 0;
let playerSpeed = 0.3; // Increased from 0.25 for better control at even higher speeds
let gameSpeed = 0.7; // Increased from 0.6 for faster initial speed
let gameSpeedIncrement = 0.0004; // Increased from 0.0003 for faster acceleration
let maxGameSpeed = 3.0; // Increased from 2.0 for even higher top speed
let playerVelocity = new THREE.Vector3();
let playerDirection = new THREE.Vector3();
let moveLeft = false;
let moveRight = false;
let moveForward = false;
let moveBackward = false;

// Sound effects
let audioContext;
let soundsInitialized = false;

// Jumping variables
let isJumping = false;
let jumpHeight = 4.0; // Increased from 3.5 for even higher jumps
let jumpSpeed = 0.35; // Increased from 0.3 for faster jumps
let gravity = 0.02; // Increased from 0.018 for faster falls
let verticalVelocity = 0;
let defaultPlayerHeight = 1; // Y position when on the ground
// Track distance
let distanceTraveled = 0;
let lastObstacleType = -1; // To avoid consecutive same obstacles

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const startButton = document.getElementById('start-button');
const restartButton = document.getElementById('restart-button');
const scoreValue = document.getElementById('score-value');
const finalScore = document.getElementById('final-score');
// Mobile control elements
const leftButton = document.getElementById('left-button');
const rightButton = document.getElementById('right-button');
const jumpButton = document.getElementById('jump-button');

// Initialize the game
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 20, 10);
    scene.add(directionalLight);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('game-container').appendChild(renderer.domElement);
    
    // Initialize audio
    initAudio();
    
    // Create office environment
    createOffice();
    
    // Create player character
    createPlayer();
    
    // Set up event listeners
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', restartGame);
    
    // Mobile controls - touch events
    leftButton.addEventListener('touchstart', () => moveRight = true);
    leftButton.addEventListener('touchend', () => moveRight = false);
    rightButton.addEventListener('touchstart', () => moveLeft = true);
    rightButton.addEventListener('touchend', () => moveLeft = false);
    jumpButton.addEventListener('touchstart', () => {
        // Only jump if not already jumping
        if (!isJumping) {
            isJumping = true;
            verticalVelocity = jumpSpeed;
        }
    });
    
    // Mobile controls - mouse events (for testing on desktop)
    leftButton.addEventListener('mousedown', () => moveRight = true);
    leftButton.addEventListener('mouseup', () => moveRight = false);
    leftButton.addEventListener('mouseleave', () => moveRight = false);
    rightButton.addEventListener('mousedown', () => moveLeft = true);
    rightButton.addEventListener('mouseup', () => moveLeft = false);
    rightButton.addEventListener('mouseleave', () => moveLeft = false);
    jumpButton.addEventListener('mousedown', () => {
        // Only jump if not already jumping
        if (!isJumping) {
            isJumping = true;
            verticalVelocity = jumpSpeed;
        }
    });
    
    // Start animation loop
    animate();
}

// Create office environment
function createOffice() {
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(10, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x999999,
        roughness: 0.8,
        metalness: 0.2
    });
    floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Create walls
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xdddddd,
        roughness: 0.9,
        metalness: 0.1
    });
    
    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(0.5, 5, 100);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-5, 2.5, 0);
    scene.add(leftWall);
    
    // Right wall
    const rightWallGeometry = new THREE.BoxGeometry(0.5, 5, 100);
    const rightWall = new THREE.Mesh(rightWallGeometry, wallMaterial);
    rightWall.position.set(5, 2.5, 0);
    scene.add(rightWall);
    
    // Add office decorations along the walls
    for (let i = -45; i < 45; i += 10) {
        // Add some decorations on the left wall
        if (Math.random() > 0.5) {
            const paintingGeometry = new THREE.BoxGeometry(0.1, 1, 1);
            const paintingMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const painting = new THREE.Mesh(paintingGeometry, paintingMaterial);
            painting.position.set(-4.7, 3, i);
            scene.add(painting);
        }
        
        // Add some decorations on the right wall
        if (Math.random() > 0.5) {
            const paintingGeometry = new THREE.BoxGeometry(0.1, 1, 1);
            const paintingMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const painting = new THREE.Mesh(paintingGeometry, paintingMaterial);
            painting.position.set(4.7, 3, i);
            scene.add(painting);
        }
    }
}

// Create a simple desk
function createDesk(x, y, z) {
    const deskGeometry = new THREE.BoxGeometry(3, 1, 2);
    const deskMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x8B4513,
        roughness: 0.7,
        metalness: 0.2
    });
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.set(x, y + 0.5, z);
    desk.castShadow = true;
    desk.receiveShadow = true;
    scene.add(desk);
    
    // Add a computer on the desk
    const computerGeometry = new THREE.BoxGeometry(1, 1, 0.5);
    const computerMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const computer = new THREE.Mesh(computerGeometry, computerMaterial);
    computer.position.set(x, y + 1.5, z);
    computer.castShadow = true;
    scene.add(computer);
}

// Create player character
function createPlayer() {
    // Create a temporary box as the player until the model loads
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0x0000ff, transparent: true, opacity: 0 });
    player = new THREE.Mesh(geometry, material);
    player.position.y = defaultPlayerHeight;
    player.castShadow = true;
    scene.add(player);
    
    // Load the custom character model
    const loader = new THREE.GLTFLoader();
    
    // Try to load the custom model, but fall back to a visible box if it fails
    loader.load('models/your_character.glb', 
    // Success callback
    (gltf) => {
        console.log('Model loaded successfully');
        playerModel = gltf.scene;
        playerModel.scale.set(0.5, 0.5, 0.5); // Adjust scale as needed
        playerModel.position.y = defaultPlayerHeight - 1; // Adjust position as needed
        player.add(playerModel); // Add the model as a child of the player object
        
        // Make the player visible (in case it was hidden)
        player.traverse((node) => {
            if (node.isMesh) {
                node.material.opacity = 1;
                node.material.transparent = false;
            }
        });
        
        // Set up animations if your model has them
        if (gltf.animations && gltf.animations.length > 0) {
            mixer = new THREE.AnimationMixer(playerModel);
            const animations = gltf.animations;
            
            // Play idle animation (assuming first animation is idle)
            const idleAction = mixer.clipAction(animations[0]);
            idleAction.play();
            
            // You can set up more animations here
            // const runAction = mixer.clipAction(animations[1]);
            // const jumpAction = mixer.clipAction(animations[2]);
        }
    }, 
    // Progress callback
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    // Error callback
    (error) => {
        console.error('An error happened loading the model:', error);
        // Make the default box visible as a fallback
        player.traverse((node) => {
            if (node.isMesh) {
                node.material.opacity = 1;
                node.material.transparent = false;
            }
        });
    });
}

// Create an obstacle
function createObstacle() {
    // Determine the type of obstacle (0: chair, 1: desk, 2: filing cabinet, 3: water cooler)
    let obstacleType;
    do {
        obstacleType = Math.floor(Math.random() * 4); // Now 4 types of obstacles
    } while (obstacleType === lastObstacleType); // Avoid consecutive same obstacles
    
    lastObstacleType = obstacleType;
    
    let obstacle;
    
    // Determine the lane (left, center, right) with higher probability for center lane
    // Use weighted random selection: 20% left, 50% center, 30% right
    const random = Math.random();
    let lane;
    if (random < 0.2) {
        lane = -1; // Left lane (20% chance)
    } else if (random < 0.7) {
        lane = 0;  // Center lane (50% chance)
    } else {
        lane = 1;  // Right lane (30% chance)
    }
    
    // Add some variation to the position within the lane
    const laneVariation = (Math.random() - 0.5) * 0.8; // Small random offset
    const xPosition = (lane * 3) + laneVariation; // Position in lane with variation
    
    switch (obstacleType) {
        case 0: // Chair
            // Make chairs more varied in size
            const chairWidth = 1.5 + (Math.random() * 0.5 - 0.25); // 1.25-1.75
            const chairHeight = 1.5 + (Math.random() * 0.3 - 0.15); // 1.35-1.65
            const chairDepth = 1.5 + (Math.random() * 0.3 - 0.15); // 1.35-1.65
            
            const chairGeometry = new THREE.BoxGeometry(chairWidth, chairHeight, chairDepth);
            const chairMaterial = new THREE.MeshStandardMaterial({ 
                color: Math.random() > 0.5 ? 0xff0000 : 0x0000ff, // Randomly red or blue
                roughness: 0.8,
                metalness: 0.1
            });
            obstacle = new THREE.Mesh(chairGeometry, chairMaterial);
            break;
            
        case 1: // Desk
            const deskGeometry = new THREE.BoxGeometry(3, 1, 2);
            const deskMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8B4513,
                roughness: 0.7,
                metalness: 0.2
            });
            obstacle = new THREE.Mesh(deskGeometry, deskMaterial);
            
            // Sometimes add a computer on top of the desk
            if (Math.random() > 0.5) {
                const computerGeometry = new THREE.BoxGeometry(0.8, 0.8, 0.4);
                const computerMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
                const computer = new THREE.Mesh(computerGeometry, computerMaterial);
                computer.position.set(0, 0.9, 0); // Position on top of desk
                obstacle.add(computer);
            }
            break;
            
        case 2: // Filing cabinet
            const cabinetGeometry = new THREE.BoxGeometry(1, 3, 1);
            const cabinetMaterial = new THREE.MeshStandardMaterial({ 
                color: Math.random() > 0.5 ? 0x444444 : 0x666666, // Dark or light gray
                roughness: 0.9,
                metalness: 0.3
            });
            obstacle = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
            break;
            
        case 3: // Water cooler (new obstacle type)
            // Create the base
            const baseGeometry = new THREE.BoxGeometry(1, 0.5, 1);
            const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            obstacle = new THREE.Mesh(baseGeometry, baseMaterial);
            
            // Create the water tank
            const tankGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 8);
            const tankMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x87CEFA, // Light blue
                transparent: true,
                opacity: 0.7
            });
            const tank = new THREE.Mesh(tankGeometry, tankMaterial);
            tank.position.set(0, 0.85, 0); // Position on top of base
            obstacle.add(tank);
            
            // Create the spout
            const spoutGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.3);
            const spoutMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
            const spout = new THREE.Mesh(spoutGeometry, spoutMaterial);
            spout.position.set(0, 0.25, 0.5); // Position on front of base
            obstacle.add(spout);
            break;
    }
    
    // Position the obstacle at the far end of the corridor
    obstacle.position.set(xPosition, defaultPlayerHeight, 50);
    obstacle.castShadow = true;
    obstacle.receiveShadow = true;
    scene.add(obstacle);
    obstacles.push(obstacle);
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle keyboard input
function onKeyDown(event) {
    if (!gameActive) return;
    
    switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveRight = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveLeft = true;
            break;
        case 'Space':
            // Only jump if not already jumping
            if (!isJumping) {
                isJumping = true;
                verticalVelocity = jumpSpeed;
                playWhooshSound();
            }
            break;
    }
}

function onKeyUp(event) {
    switch(event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveRight = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveLeft = false;
            break;
    }
}

// Start the game
function startGame() {
    startScreen.classList.add('hidden');
    gameActive = true;
    score = 0;
    updateUI();
    
    // Play start game sound
    playStartGameSound();
}

// Restart the game
function restartGame() {
    // Remove all obstacles
    for (const obstacle of obstacles) {
        scene.remove(obstacle);
    }
    obstacles = [];
    
    // Reset player position
    player.position.set(0, defaultPlayerHeight, 0);
    isJumping = false;
    verticalVelocity = 0;
    
    // Reset game speed and difficulty
    gameSpeed = 0.5; // Reset to initial value
    spawnRate = 1200; // Reset to initial value
    
    // Reset game state
    gameOverScreen.classList.add('hidden');
    gameActive = true;
    score = 0;
    distanceTraveled = 0; // Reset distance traveled
    updateUI();
}

// Update UI elements
function updateUI() {
    scoreValue.textContent = score;
}

// Check for collisions between player and obstacles
function checkCollisions() {
    const playerBox = new THREE.Box3().setFromObject(player);
    
    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obstacle = obstacles[i];
        const obstacleBox = new THREE.Box3().setFromObject(obstacle);
        
        if (playerBox.intersectsBox(obstacleBox)) {
            // Collision detected
            scene.remove(obstacle);
            obstacles.splice(i, 1);
            playDeathSound();
            gameOver();
        }
    }
}

// Game over
function gameOver() {
    gameActive = false;
    finalScore.textContent = score;
    gameOverScreen.classList.remove('hidden');
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    const delta = clock.getDelta();
    
    // Update animations if mixer exists
    if (mixer) {
        mixer.update(delta);
    }
    
    if (gameActive) {
        // Update player position based on input
        playerDirection.x = Number(moveRight) - Number(moveLeft);
        playerDirection.normalize();
        
        playerVelocity.x = playerDirection.x * playerSpeed;
        
        player.position.x += playerVelocity.x;
        
        // Keep player within bounds (within the corridor)
        player.position.x = Math.max(-4, Math.min(4, player.position.x));
        
        // Update camera position to follow player (fixed behind player)
        camera.position.x = player.position.x;
        camera.position.y = player.position.y + 5;
        camera.position.z = player.position.z - 10;
        
        // Make the camera look at a point ahead of the player
        const lookAtPoint = new THREE.Vector3(
            player.position.x, 
            player.position.y, 
            player.position.z + 20
        );
        camera.lookAt(lookAtPoint);
        
        // Update obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obstacle = obstacles[i];
            const previousZ = obstacle.position.z;
            obstacle.position.z -= gameSpeed;
            
            // Play whoosh sound when an obstacle passes the player (around z=0)
            if (previousZ >= 0 && obstacle.position.z < 0) {
                playWhooshSound();
            }
            
            // Remove obstacles that are out of bounds
            if (obstacle.position.z < -25) {
                scene.remove(obstacle);
                obstacles.splice(i, 1);
                score += 1;
                updateUI();
            }
        }
        
        // Spawn new obstacles
        const currentTime = Date.now();
        if (currentTime - lastSpawnTime > spawnRate) {
            createObstacle();
            
            // Occasionally spawn a second obstacle in a different lane (more likely at higher speeds)
            const chanceOfDoubleObstacle = Math.min(0.4, gameSpeed / 10); // Up to 40% chance at max speed
            if (Math.random() < chanceOfDoubleObstacle) {
                // Add a small delay before creating the second obstacle
                setTimeout(() => {
                    if (gameActive) { // Only create if game is still active
                        createObstacle();
                    }
                }, 300); // 300ms delay between obstacles
            }
            
            lastSpawnTime = currentTime;
            
            // Increase difficulty over time - obstacles spawn more frequently
            // Adjusted to scale with game speed for better balance
            spawnRate = Math.max(200, spawnRate - 30); // Decreased minimum spawn rate and increased decrement
        }
        
        // Check for collisions
        checkCollisions();
        
        // Update jumping
        if (isJumping) {
            player.position.y += verticalVelocity;
            verticalVelocity -= gravity;
            
            if (player.position.y <= defaultPlayerHeight) {
                player.position.y = defaultPlayerHeight;
                isJumping = false;
            }
        }
        
        // Increase game speed over time
        gameSpeed = Math.min(maxGameSpeed, gameSpeed + gameSpeedIncrement);
        
        // Update score based on distance traveled
        distanceTraveled += gameSpeed;
        if (Math.floor(distanceTraveled) % 10 === 0 && Math.floor(distanceTraveled) > 0) {
            // Increase score every 10 units of distance
            if (Math.floor(distanceTraveled / 10) > score) {
                score = Math.floor(distanceTraveled / 10);
                updateUI();
            }
        }
    }
    
    renderer.render(scene, camera);
}

// Initialize audio
function initAudio() {
    try {
        // Create an audio context
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        soundsInitialized = true;
    } catch (e) {
        console.error('Web Audio API is not supported in this browser', e);
    }
}

// Play whoosh sound
function playWhooshSound() {
    if (!soundsInitialized || !audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.3);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.5, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.error('Error playing whoosh sound', e);
    }
}

// Play death sound
function playDeathSound() {
    if (!soundsInitialized || !audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.error('Error playing death sound', e);
    }
}

// Play start game sound
function playStartGameSound() {
    if (!soundsInitialized || !audioContext) return;
    
    try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(300, audioContext.currentTime + 0.5);
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.7, audioContext.currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.error('Error playing start game sound', e);
    }
}

// Initialize the game when the page loads
window.addEventListener('load', init);
