import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { Cube } from './cube/Cube.js';
import { setupKeyboardControls } from './controls/KeyboardControls.js';
import { DragControls } from './controls/DragControls.js';
import { UnlockAnimation } from './animation/UnlockAnimation.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Camera
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(5, 4, 6);

// Renderer
const canvas = document.getElementById('cube-canvas');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Post-processing with bloom
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,   // Strength
  0.4,   // Radius
  0.85   // Threshold
);
composer.addPass(bloomPass);

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false; // Disable panning, only rotation

// Create the Rubik's cube
const cube = new Cube(scene);
cube.addToScene(scene);

// Unlock animation
const unlockAnimation = new UnlockAnimation(cube);

// Setup keyboard controls
setupKeyboardControls(cube);

// Setup drag controls
const dragControls = new DragControls(cube, camera, canvas, controls);

// Face solved callback - trigger unlock animation
cube.onFaceSolved = (face) => {
  console.log(`Face ${face} was solved!`);
  unlockAnimation.play(face);
};

// Scramble with spacebar
document.addEventListener('keydown', (e) => {
  if (e.key === ' ') { // Spacebar
    cube.scramble(25);
  }
});

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  composer.render(); // Use composer instead of renderer
}

animate();

// Expose for debugging
window.cube = cube;
