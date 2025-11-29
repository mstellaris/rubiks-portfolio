import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { Cube } from './cube/Cube.js';
import { setupKeyboardControls } from './controls/KeyboardControls.js';
import { DragControls } from './controls/DragControls.js';
import { UnlockAnimation } from './animation/UnlockAnimation.js';
import { ParticleSystem } from './effects/Particles.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x252a33);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Load HDR environment map (optional - falls back gracefully)
const rgbeLoader = new RGBELoader();
rgbeLoader.load('/hdri/studio.hdr',
  (texture) => {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    console.log('HDR environment loaded');
  },
  undefined,
  () => {
    console.log('No HDR found - using default lighting');
  }
);

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
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.7;

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

// Particle system
const particles = new ParticleSystem(scene);

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

// UI Elements
const scrambleBtn = document.getElementById('scramble-btn');
const backBtn = document.getElementById('back-btn');
const sectionOverlay = document.getElementById('section-overlay');

// Scramble button
scrambleBtn?.addEventListener('click', () => {
  cube.scramble(25);
});

// Back button (close section overlay)
backBtn?.addEventListener('click', () => {
  sectionOverlay?.classList.add('hidden');
});

// Scramble with spacebar
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' && !e.target.closest('button')) { // Spacebar (not on button)
    e.preventDefault();
    cube.scramble(25);
  }
  // Escape to close overlay
  if (e.key === 'Escape') {
    sectionOverlay?.classList.add('hidden');
  }
});

// Initial scramble on load (after a short delay)
setTimeout(() => {
  cube.scramble(20);
}, 500);

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop with idle animation
let time = 0;

function animate() {
  requestAnimationFrame(animate);

  time += 0.01;

  // Subtle floating motion
  cube.group.position.y = Math.sin(time) * 0.05;

  // Update particles
  particles.update(time);

  controls.update();
  composer.render();
}

animate();

// Expose for debugging
window.cube = cube;
