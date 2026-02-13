import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';
import { Cube } from './cube/Cube.js';
import { setupKeyboardControls } from './controls/KeyboardControls.js';
import { DragControls } from './controls/DragControls.js';
import { UnlockAnimation } from './animation/UnlockAnimation.js';
import { ParticleSystem } from './effects/Particles.js';
import { FaceLink } from './effects/FaceLink.js';
import { SECTIONS } from './utils/constants.js';
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Vercel Analytics & Speed Insights
inject();
injectSpeedInsights();

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x252a33);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);

// Load HDR environment map (optional - falls back gracefully)
const hdrLoader = new HDRLoader();
hdrLoader.load('/hdri/studio.hdr',
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

// Detect low-end devices — skip bloom to avoid frame drops
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
const isSmallViewport = (window.innerWidth * window.innerHeight) < 500000;
const isLowEnd = isMobile && isSmallViewport;

let composer = null;
if (!isLowEnd) {
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,   // Strength
    0.4,   // Radius
    0.85   // Threshold
  );
  composer.addPass(bloomPass);
}

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

// Face link system (lines + buttons for solved faces)
const faceLink = new FaceLink(scene, camera, cube);

// Unlock animation
const unlockAnimation = new UnlockAnimation(cube);

// Setup drag controls
const dragControls = new DragControls(cube, camera, canvas, controls);

// Helper to get section from face color
function getSectionForFace(face) {
  const faceColors = {
    right: 'red',
    left: 'orange',
    up: 'white',
    down: 'yellow',
    front: 'green',
    back: 'blue'
  };
  return SECTIONS[faceColors[face]];
}

// Face solved callback - trigger unlock animation, then show face link
cube.onFaceSolved = (face) => {
  console.log(`Face ${face} was solved!`);
  const section = getSectionForFace(face);

  // Set callback for when animation completes
  unlockAnimation.onComplete = () => {
    faceLink.show(face, section);
  };

  unlockAnimation.play(face);
};

// UI Elements
const scrambleBtn = document.getElementById('scramble-btn');
const backBtn = document.getElementById('back-btn');
const sectionOverlay = document.getElementById('section-overlay');

// Setup keyboard controls (after UI elements are available)
setupKeyboardControls(cube, { faceLink, sectionOverlay });

// Scramble button
scrambleBtn?.addEventListener('click', () => {
  faceLink.hideAll();
  cube.scramble(25);
});

// Back button (close section overlay)
backBtn?.addEventListener('click', () => {
  sectionOverlay?.classList.add('hidden');
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
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
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

  // Update face links (lines follow cube)
  faceLink.update();

  controls.update();
  if (composer) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }
}

animate();

// Expose for debugging
window.cube = cube;
