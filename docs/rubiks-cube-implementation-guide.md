# Rubik's Cube Website: Step-by-Step Implementation Guide

## Project Overview

**Goal:** Build an interactive 3D Rubik's cube that serves as the navigation system for a personal portfolio website. Solving each face unlocks a different section with a sci-fi explosion animation.

**Tech Stack:**
- Three.js (3D rendering)
- GSAP (animations)
- Vite (build tool / dev server)
- Vanilla JavaScript (no React)

**Timeline:** ~16 days across 7 phases

---

## Pre-Phase: Project Setup

### Step 0.1: Create project structure
```bash
mkdir rubiks-portfolio
cd rubiks-portfolio
npm init -y
npm install three gsap
npm install -D vite
```

### Step 0.2: Configure Vite
Create `vite.config.js`:
```javascript
export default {
  root: 'src',
  publicDir: '../public',
  build: {
    outDir: '../dist'
  }
}
```

### Step 0.3: Create folder structure
```
rubiks-portfolio/
├── public/
│   └── hdri/           # Environment maps go here
├── src/
│   ├── index.html
│   ├── main.js
│   ├── style.css
│   ├── cube/
│   ├── controls/
│   ├── animation/
│   └── utils/
├── package.json
└── vite.config.js
```

### Step 0.4: Create base HTML
Create `src/index.html`:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <canvas id="cube-canvas"></canvas>
  <script type="module" src="./main.js"></script>
</body>
</html>
```

### Step 0.5: Create base CSS
Create `src/style.css`:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  overflow: hidden;
  background: #0a0a0a;
}

#cube-canvas {
  display: block;
  width: 100vw;
  height: 100vh;
}
```

### Step 0.6: Add npm scripts
Update `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### ✅ Checkpoint 0
Run `npm run dev` — should see empty black page with no errors in console.

---

## Phase 1: Static Cube Rendering (Days 1-2)

### Goal
Render a 3×3×3 Rubik's cube with colored faces that can be rotated to view all sides.

---

### Step 1.1: Basic Three.js scene setup

Create `src/main.js`:

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

// Camera
const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(4, 3, 5);

// Renderer
const canvas = document.getElementById('cube-canvas');
const renderer = new THREE.WebGLRenderer({ 
  canvas,
  antialias: true 
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// Test cube (temporary)
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const testCube = new THREE.Mesh(geometry, material);
scene.add(testCube);

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
```

### ✅ Checkpoint 1.1
Run `npm run dev` — should see a red cube you can rotate with mouse drag.

---

### Step 1.2: Create constants file

Create `src/utils/constants.js`:

```javascript
// Face colors (standard Rubik's cube colors)
export const COLORS = {
  white: 0xffffff,   // Up (Y+)
  yellow: 0xffff00,  // Down (Y-)
  green: 0x00ff00,   // Front (Z+)
  blue: 0x0000ff,    // Back (Z-)
  red: 0xff0000,     // Right (X+)
  orange: 0xff8800   // Left (X-)
};

// Face definitions - which color belongs to which direction
export const FACES = {
  right:  { axis: 'x', direction:  1, color: COLORS.red },
  left:   { axis: 'x', direction: -1, color: COLORS.orange },
  up:     { axis: 'y', direction:  1, color: COLORS.white },
  down:   { axis: 'y', direction: -1, color: COLORS.yellow },
  front:  { axis: 'z', direction:  1, color: COLORS.green },
  back:   { axis: 'z', direction: -1, color: COLORS.blue }
};

// Cubie size and gap
export const CUBIE_SIZE = 1;
export const CUBIE_GAP = 0.05;

// Website sections mapped to face colors
export const SECTIONS = {
  white: { name: 'About', path: '/about' },
  yellow: { name: 'Experience', path: '/experience' },
  green: { name: 'Projects', path: '/projects' },
  blue: { name: 'Skills', path: '/skills' },
  red: { name: 'Contact', path: '/contact' },
  orange: { name: 'Blog', path: '/blog' }
};
```

---

### Step 1.3: Create Cubie class

Create `src/cube/Cubie.js`:

```javascript
import * as THREE from 'three';
import { CUBIE_SIZE, COLORS } from '../utils/constants.js';

export class Cubie {
  constructor(x, y, z) {
    // Logical position (-1, 0, or 1 on each axis)
    this.x = x;
    this.y = y;
    this.z = z;
    
    // Create the mesh
    this.mesh = this.createMesh();
    
    // Position the mesh in 3D space
    const offset = CUBIE_SIZE + 0.05; // size + gap
    this.mesh.position.set(
      x * offset,
      y * offset,
      z * offset
    );
  }
  
  createMesh() {
    const geometry = new THREE.BoxGeometry(
      CUBIE_SIZE, 
      CUBIE_SIZE, 
      CUBIE_SIZE
    );
    
    // Create materials for each face
    // Order: +X, -X, +Y, -Y, +Z, -Z (right, left, up, down, front, back)
    const materials = [
      new THREE.MeshBasicMaterial({ color: this.getFaceColor('x', 1) }),   // Right
      new THREE.MeshBasicMaterial({ color: this.getFaceColor('x', -1) }),  // Left
      new THREE.MeshBasicMaterial({ color: this.getFaceColor('y', 1) }),   // Up
      new THREE.MeshBasicMaterial({ color: this.getFaceColor('y', -1) }),  // Down
      new THREE.MeshBasicMaterial({ color: this.getFaceColor('z', 1) }),   // Front
      new THREE.MeshBasicMaterial({ color: this.getFaceColor('z', -1) })   // Back
    ];
    
    return new THREE.Mesh(geometry, materials);
  }
  
  getFaceColor(axis, direction) {
    // Only outer faces get colors, inner faces are black
    const position = this[axis];
    
    if (position === direction) {
      // This face is on the outside
      if (axis === 'x' && direction === 1) return COLORS.red;
      if (axis === 'x' && direction === -1) return COLORS.orange;
      if (axis === 'y' && direction === 1) return COLORS.white;
      if (axis === 'y' && direction === -1) return COLORS.yellow;
      if (axis === 'z' && direction === 1) return COLORS.green;
      if (axis === 'z' && direction === -1) return COLORS.blue;
    }
    
    // Inner face - black
    return 0x111111;
  }
}
```

---

### Step 1.4: Create Cube class

Create `src/cube/Cube.js`:

```javascript
import * as THREE from 'three';
import { Cubie } from './Cubie.js';

export class Cube {
  constructor() {
    // Container for all cubies
    this.group = new THREE.Group();
    
    // Array of all 27 cubies
    this.cubies = [];
    
    // Create the cube
    this.createCubies();
  }
  
  createCubies() {
    // Create 3x3x3 = 27 cubies
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cubie = new Cubie(x, y, z);
          this.cubies.push(cubie);
          this.group.add(cubie.mesh);
        }
      }
    }
  }
  
  // Get all cubies on a specific layer
  getCubiesOnLayer(axis, layer) {
    return this.cubies.filter(cubie => cubie[axis] === layer);
  }
  
  // Add cube to a Three.js scene
  addToScene(scene) {
    scene.add(this.group);
  }
}
```

---

### Step 1.5: Update main.js to use Cube class

Update `src/main.js`:

```javascript
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Cube } from './cube/Cube.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

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

// Controls
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enablePan = false; // Disable panning, only rotation

// Create the Rubik's cube
const cube = new Cube();
cube.addToScene(scene);

// Handle resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();

// Expose for debugging
window.cube = cube;
```

### ✅ Checkpoint 1.5
Run `npm run dev` — should see a complete Rubik's cube with all 6 colors visible as you rotate it with the mouse. Each face should show the correct color (white top, yellow bottom, green front, blue back, red right, orange left).

---

### Step 1.6: Add basic lighting

Update `src/main.js` — add after scene creation:

```javascript
// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);
```

Update `src/cube/Cubie.js` — change `MeshBasicMaterial` to `MeshStandardMaterial`:

```javascript
const materials = [
  new THREE.MeshStandardMaterial({ color: this.getFaceColor('x', 1) }),
  new THREE.MeshStandardMaterial({ color: this.getFaceColor('x', -1) }),
  new THREE.MeshStandardMaterial({ color: this.getFaceColor('y', 1) }),
  new THREE.MeshStandardMaterial({ color: this.getFaceColor('y', -1) }),
  new THREE.MeshStandardMaterial({ color: this.getFaceColor('z', 1) }),
  new THREE.MeshStandardMaterial({ color: this.getFaceColor('z', -1) })
];
```

### ✅ Checkpoint 1.6
The cube should now have shading — faces angled toward the light are brighter, faces away are darker. This gives depth and makes it look 3D rather than flat.

---

### Step 1.7: Add rounded edges (optional polish)

Update `src/cube/Cubie.js`:

```javascript
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CUBIE_SIZE, COLORS } from '../utils/constants.js';

// In createMesh(), replace BoxGeometry with:
const geometry = new RoundedBoxGeometry(
  CUBIE_SIZE,
  CUBIE_SIZE, 
  CUBIE_SIZE,
  4,      // segments (smoothness)
  0.08    // radius of rounded edges
);
```

### ✅ Phase 1 Complete
You should have a static Rubik's cube with:
- All 27 cubies in correct positions
- 6 face colors correctly assigned
- Basic lighting for depth
- Rounded edges (optional)
- Mouse rotation via OrbitControls

---

## Phase 2: Face Rotation Mechanics (Days 3-5)

### Goal
Implement the ability to rotate cube faces with keyboard controls, with smooth animated transitions.

---

### Step 2.1: Install and set up GSAP

GSAP should already be installed. Create the animation utility:

Create `src/animation/MoveQueue.js`:

```javascript
// Queue to ensure moves execute one at a time
export class MoveQueue {
  constructor() {
    this.queue = [];
    this.isAnimating = false;
  }
  
  add(moveFunction) {
    return new Promise((resolve) => {
      this.queue.push({ moveFunction, resolve });
      this.processNext();
    });
  }
  
  async processNext() {
    if (this.isAnimating || this.queue.length === 0) return;
    
    this.isAnimating = true;
    const { moveFunction, resolve } = this.queue.shift();
    
    await moveFunction();
    
    this.isAnimating = false;
    resolve();
    this.processNext();
  }
}
```

---

### Step 2.2: Add rotation method to Cube class

Update `src/cube/Cube.js`:

```javascript
import * as THREE from 'three';
import gsap from 'gsap';
import { Cubie } from './Cubie.js';
import { MoveQueue } from '../animation/MoveQueue.js';

export class Cube {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.cubies = [];
    this.moveQueue = new MoveQueue();
    
    this.createCubies();
  }
  
  createCubies() {
    for (let x = -1; x <= 1; x++) {
      for (let y = -1; y <= 1; y++) {
        for (let z = -1; z <= 1; z++) {
          const cubie = new Cubie(x, y, z);
          this.cubies.push(cubie);
          this.group.add(cubie.mesh);
        }
      }
    }
  }
  
  getCubiesOnLayer(axis, layer) {
    return this.cubies.filter(cubie => 
      Math.round(cubie[axis]) === layer
    );
  }
  
  // Rotate a face
  // axis: 'x', 'y', or 'z'
  // layer: -1, 0, or 1
  // direction: 1 (clockwise) or -1 (counter-clockwise)
  rotate(axis, layer, direction) {
    return this.moveQueue.add(() => this.executeRotation(axis, layer, direction));
  }
  
  executeRotation(axis, layer, direction) {
    return new Promise((resolve) => {
      // Get cubies on this layer
      const layerCubies = this.getCubiesOnLayer(axis, layer);
      
      // Create a temporary pivot group
      const pivot = new THREE.Group();
      this.scene.add(pivot);
      
      // Attach cubies to pivot (preserves world position)
      layerCubies.forEach(cubie => {
        pivot.attach(cubie.mesh);
      });
      
      // Determine rotation amount
      const angle = (Math.PI / 2) * direction;
      
      // Animate the rotation
      const rotationTarget = { value: 0 };
      
      gsap.to(rotationTarget, {
        value: angle,
        duration: 0.3,
        ease: "power2.inOut",
        onUpdate: () => {
          pivot.rotation[axis] = rotationTarget.value;
        },
        onComplete: () => {
          // Return cubies to main group
          layerCubies.forEach(cubie => {
            this.group.attach(cubie.mesh);
          });
          
          // Update logical positions
          this.updatePositionsAfterRotation(layerCubies, axis, direction);
          
          // Clean up pivot
          this.scene.remove(pivot);
          
          resolve();
        }
      });
    });
  }
  
  updatePositionsAfterRotation(cubies, axis, direction) {
    // Update the logical x, y, z positions based on rotation
    cubies.forEach(cubie => {
      const oldX = cubie.x;
      const oldY = cubie.y;
      const oldZ = cubie.z;
      
      if (axis === 'x') {
        cubie.y = direction === 1 ? -oldZ : oldZ;
        cubie.z = direction === 1 ? oldY : -oldY;
      } else if (axis === 'y') {
        cubie.x = direction === 1 ? oldZ : -oldZ;
        cubie.z = direction === 1 ? -oldX : oldX;
      } else if (axis === 'z') {
        cubie.x = direction === 1 ? -oldY : oldY;
        cubie.y = direction === 1 ? oldX : -oldX;
      }
      
      // Round to avoid floating point issues
      cubie.x = Math.round(cubie.x);
      cubie.y = Math.round(cubie.y);
      cubie.z = Math.round(cubie.z);
    });
  }
  
  addToScene(scene) {
    scene.add(this.group);
  }
}
```

---

### Step 2.3: Update main.js to pass scene to Cube

Update `src/main.js`:

```javascript
// Change this line:
const cube = new Cube();

// To:
const cube = new Cube(scene);
```

---

### Step 2.4: Add keyboard controls

Create `src/controls/KeyboardControls.js`:

```javascript
// Standard Rubik's cube notation
// R = Right, L = Left, U = Up, D = Down, F = Front, B = Back
// Lowercase or with Shift = counter-clockwise (prime moves)

export function setupKeyboardControls(cube) {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input field
    if (e.target.tagName === 'INPUT') return;
    
    const key = e.key.toLowerCase();
    const isShift = e.shiftKey;
    
    // Direction: 1 = clockwise, -1 = counter-clockwise (prime)
    const dir = isShift ? -1 : 1;
    
    switch (key) {
      case 'r': // Right face
        cube.rotate('x', 1, dir);
        break;
      case 'l': // Left face
        cube.rotate('x', -1, -dir); // Inverted because we look from right
        break;
      case 'u': // Up face
        cube.rotate('y', 1, dir);
        break;
      case 'd': // Down face
        cube.rotate('y', -1, -dir);
        break;
      case 'f': // Front face
        cube.rotate('z', 1, dir);
        break;
      case 'b': // Back face
        cube.rotate('z', -1, -dir);
        break;
      case 'm': // Middle layer (between L and R)
        cube.rotate('x', 0, -dir);
        break;
      case 'e': // Equatorial layer (between U and D)
        cube.rotate('y', 0, -dir);
        break;
      case 's': // Standing layer (between F and B)
        cube.rotate('z', 0, dir);
        break;
    }
  });
  
  console.log('Keyboard controls active:');
  console.log('R/L/U/D/F/B = rotate faces');
  console.log('Hold Shift for counter-clockwise');
}
```

Update `src/main.js`:

```javascript
import { setupKeyboardControls } from './controls/KeyboardControls.js';

// After creating the cube:
setupKeyboardControls(cube);
```

### ✅ Checkpoint 2.4
Press R, L, U, D, F, B keys — faces should rotate 90° with smooth animation. Hold Shift for reverse direction. Multiple quick key presses should queue up and execute in order.

---

### Step 2.5: Add visual debugging (optional but helpful)

Add to `src/main.js`:

```javascript
// Debug: show axes
const axesHelper = new THREE.AxesHelper(4);
scene.add(axesHelper);
// Red = X, Green = Y, Blue = Z
```

### ✅ Phase 2 Complete
You should now have:
- Keyboard-controlled face rotations (R, L, U, D, F, B)
- Smooth animated transitions
- Queued moves that execute sequentially
- Logical position tracking that updates after each move

---

## Phase 3: Mouse/Drag Interaction (Days 6-8)

### Goal
Enable dragging on cube faces to rotate them, distinguishing between whole-cube rotation and face turns.

---

### Step 3.1: Create raycasting utility

Create `src/controls/Raycaster.js`:

```javascript
import * as THREE from 'three';

export class RaycasterHelper {
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }
  
  // Update mouse position from event
  updateMouse(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  
  // Get intersections with objects
  getIntersections(objects) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(objects, true);
  }
  
  // Get the first intersection
  getFirstIntersection(objects) {
    const intersections = this.getIntersections(objects);
    return intersections.length > 0 ? intersections[0] : null;
  }
}
```

---

### Step 3.2: Create drag controls

Create `src/controls/DragControls.js`:

```javascript
import * as THREE from 'three';
import { RaycasterHelper } from './Raycaster.js';

export class DragControls {
  constructor(cube, camera, canvas, orbitControls) {
    this.cube = cube;
    this.camera = camera;
    this.canvas = canvas;
    this.orbitControls = orbitControls;
    this.raycaster = new RaycasterHelper(camera, canvas);
    
    // Drag state
    this.isDragging = false;
    this.dragStart = null;
    this.clickedCubie = null;
    this.clickedFaceNormal = null;
    
    // Threshold for detecting a drag vs click
    this.dragThreshold = 10; // pixels
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
  }
  
  onMouseDown(event) {
    this.raycaster.updateMouse(event);
    
    // Get all cubie meshes
    const cubieMeshes = this.cube.cubies.map(c => c.mesh);
    const intersection = this.raycaster.getFirstIntersection(cubieMeshes);
    
    if (intersection) {
      // Clicked on a cubie
      this.isDragging = true;
      this.dragStart = { x: event.clientX, y: event.clientY };
      this.clickedCubie = this.findCubieByMesh(intersection.object);
      this.clickedFaceNormal = intersection.face.normal.clone();
      
      // Transform normal to world space
      this.clickedFaceNormal.transformDirection(intersection.object.matrixWorld);
      
      // Disable orbit controls while potentially rotating a face
      this.orbitControls.enabled = false;
    }
  }
  
  onMouseMove(event) {
    if (!this.isDragging || !this.dragStart) return;
    
    const dx = event.clientX - this.dragStart.x;
    const dy = event.clientY - this.dragStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if we've dragged far enough
    if (distance > this.dragThreshold) {
      this.executeFaceRotation(dx, dy);
      this.resetDrag();
    }
  }
  
  onMouseUp(event) {
    this.resetDrag();
  }
  
  resetDrag() {
    this.isDragging = false;
    this.dragStart = null;
    this.clickedCubie = null;
    this.clickedFaceNormal = null;
    this.orbitControls.enabled = true;
  }
  
  findCubieByMesh(mesh) {
    return this.cube.cubies.find(c => c.mesh === mesh);
  }
  
  executeFaceRotation(dx, dy) {
    if (!this.clickedCubie || !this.clickedFaceNormal) return;
    
    // Determine which axis the clicked face is on
    const normal = this.clickedFaceNormal;
    const absX = Math.abs(normal.x);
    const absY = Math.abs(normal.y);
    const absZ = Math.abs(normal.z);
    
    let clickedAxis, layer;
    
    if (absX > absY && absX > absZ) {
      clickedAxis = 'x';
      layer = Math.round(this.clickedCubie.x);
    } else if (absY > absZ) {
      clickedAxis = 'y';
      layer = Math.round(this.clickedCubie.y);
    } else {
      clickedAxis = 'z';
      layer = Math.round(this.clickedCubie.z);
    }
    
    // Determine rotation axis and direction based on drag direction
    const { axis, direction } = this.determineRotation(clickedAxis, dx, dy);
    
    if (axis && direction) {
      // Get the layer to rotate
      const rotationLayer = this.clickedCubie[axis];
      this.cube.rotate(axis, Math.round(rotationLayer), direction);
    }
  }
  
  determineRotation(clickedAxis, dx, dy) {
    // Determine if the drag is more horizontal or vertical
    const isHorizontal = Math.abs(dx) > Math.abs(dy);
    
    // Map drag direction to rotation based on which face was clicked
    // This is simplified - a full implementation would account for camera angle
    
    if (clickedAxis === 'z') {
      // Front or back face
      if (isHorizontal) {
        return { axis: 'y', direction: dx > 0 ? 1 : -1 };
      } else {
        return { axis: 'x', direction: dy > 0 ? -1 : 1 };
      }
    } else if (clickedAxis === 'y') {
      // Top or bottom face
      if (isHorizontal) {
        return { axis: 'z', direction: dx > 0 ? -1 : 1 };
      } else {
        return { axis: 'x', direction: dy > 0 ? -1 : 1 };
      }
    } else if (clickedAxis === 'x') {
      // Left or right face
      if (isHorizontal) {
        return { axis: 'y', direction: dx > 0 ? 1 : -1 };
      } else {
        return { axis: 'z', direction: dy > 0 ? 1 : -1 };
      }
    }
    
    return { axis: null, direction: null };
  }
}
```

---

### Step 3.3: Integrate drag controls into main.js

Update `src/main.js`:

```javascript
import { DragControls } from './controls/DragControls.js';

// After creating orbit controls and cube:
const dragControls = new DragControls(cube, camera, canvas, controls);
```

### ✅ Checkpoint 3.3
Click and drag on a cube face — it should rotate the appropriate layer. Clicking on empty space and dragging should still rotate the whole cube.

---

### Step 3.4: Refine drag detection for accuracy

The basic drag controls work but may feel imprecise. We need to account for camera angle. Update `DragControls.js` with an improved `determineRotation` method:

```javascript
determineRotation(clickedAxis, dx, dy) {
  // Get drag direction in screen space
  const dragAngle = Math.atan2(dy, dx);
  
  // Convert to 8 directions (up, down, left, right, and diagonals)
  // Then map to rotation based on clicked face
  
  const isHorizontal = Math.abs(dx) > Math.abs(dy);
  const isPositiveX = dx > 0;
  const isPositiveY = dy > 0;
  
  // Get camera's forward direction (simplified - assumes camera looks at origin)
  const cameraDir = new THREE.Vector3();
  this.camera.getWorldDirection(cameraDir);
  
  // Determine which way "right" and "up" are relative to the camera
  const cameraRight = new THREE.Vector3();
  cameraRight.crossVectors(cameraDir, new THREE.Vector3(0, 1, 0)).normalize();
  
  // For now, use simplified logic that works when camera is roughly in front
  if (clickedAxis === 'z') {
    // Front or back face clicked
    if (isHorizontal) {
      // Horizontal drag rotates around Y
      return { 
        axis: 'y', 
        direction: isPositiveX ? 1 : -1 
      };
    } else {
      // Vertical drag rotates around X
      return { 
        axis: 'x', 
        direction: isPositiveY ? -1 : 1 
      };
    }
  } else if (clickedAxis === 'y') {
    // Top or bottom face clicked
    if (isHorizontal) {
      // Horizontal drag rotates around Z
      return { 
        axis: 'z', 
        direction: isPositiveX ? -1 : 1 
      };
    } else {
      // Vertical drag rotates around X
      return { 
        axis: 'x', 
        direction: isPositiveY ? -1 : 1 
      };
    }
  } else {
    // Left or right face clicked (x-axis)
    if (isHorizontal) {
      // Horizontal drag rotates around Y
      return { 
        axis: 'y', 
        direction: isPositiveX ? 1 : -1 
      };
    } else {
      // Vertical drag rotates around Z
      return { 
        axis: 'z', 
        direction: isPositiveY ? 1 : -1 
      };
    }
  }
}
```

### ✅ Phase 3 Complete
You should now have:
- Click and drag on cube faces to rotate layers
- Orbit controls still work when clicking empty space
- Keyboard controls still work alongside mouse controls

---

## Phase 4: Solve Detection (Day 9)

### Goal
Detect when a face is completely solved (all 9 stickers the same color).

---

### Step 4.1: Track face colors on cubies

We need to track which color is on which face of each cubie, and update this when rotations happen.

Update `src/cube/Cubie.js`:

```javascript
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CUBIE_SIZE, COLORS } from '../utils/constants.js';

export class Cubie {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    
    // Track which color is on which face of THIS cubie
    // Key = face direction, Value = color name
    this.faceColors = this.initializeFaceColors();
    
    this.mesh = this.createMesh();
    
    const offset = CUBIE_SIZE + 0.05;
    this.mesh.position.set(x * offset, y * offset, z * offset);
  }
  
  initializeFaceColors() {
    // Set initial colors based on starting position
    return {
      right:  this.x === 1 ? 'red' : null,
      left:   this.x === -1 ? 'orange' : null,
      up:     this.y === 1 ? 'white' : null,
      down:   this.y === -1 ? 'yellow' : null,
      front:  this.z === 1 ? 'green' : null,
      back:   this.z === -1 ? 'blue' : null
    };
  }
  
  // Get the color showing on a particular side of the CUBE (not the cubie)
  getColorOnFace(face) {
    return this.faceColors[face];
  }
  
  // After rotation, update which of the cubie's colors face which direction
  rotateFaceColors(axis, direction) {
    const old = { ...this.faceColors };
    
    if (axis === 'x') {
      if (direction === 1) {
        this.faceColors.up = old.front;
        this.faceColors.front = old.down;
        this.faceColors.down = old.back;
        this.faceColors.back = old.up;
      } else {
        this.faceColors.up = old.back;
        this.faceColors.back = old.down;
        this.faceColors.down = old.front;
        this.faceColors.front = old.up;
      }
    } else if (axis === 'y') {
      if (direction === 1) {
        this.faceColors.front = old.right;
        this.faceColors.right = old.back;
        this.faceColors.back = old.left;
        this.faceColors.left = old.front;
      } else {
        this.faceColors.front = old.left;
        this.faceColors.left = old.back;
        this.faceColors.back = old.right;
        this.faceColors.right = old.front;
      }
    } else if (axis === 'z') {
      if (direction === 1) {
        this.faceColors.up = old.left;
        this.faceColors.left = old.down;
        this.faceColors.down = old.right;
        this.faceColors.right = old.up;
      } else {
        this.faceColors.up = old.right;
        this.faceColors.right = old.down;
        this.faceColors.down = old.left;
        this.faceColors.left = old.up;
      }
    }
  }
  
  createMesh() {
    const geometry = new RoundedBoxGeometry(
      CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE, 4, 0.08
    );
    
    const materials = [
      this.createFaceMaterial(this.faceColors.right),
      this.createFaceMaterial(this.faceColors.left),
      this.createFaceMaterial(this.faceColors.up),
      this.createFaceMaterial(this.faceColors.down),
      this.createFaceMaterial(this.faceColors.front),
      this.createFaceMaterial(this.faceColors.back)
    ];
    
    return new THREE.Mesh(geometry, materials);
  }
  
  createFaceMaterial(colorName) {
    const color = colorName ? COLORS[colorName] : 0x111111;
    return new THREE.MeshStandardMaterial({ color });
  }
}
```

---

### Step 4.2: Update Cube.js to rotate face colors

Update `src/cube/Cube.js` — modify `updatePositionsAfterRotation`:

```javascript
updatePositionsAfterRotation(cubies, axis, direction) {
  cubies.forEach(cubie => {
    // Update logical position
    const oldX = cubie.x;
    const oldY = cubie.y;
    const oldZ = cubie.z;
    
    if (axis === 'x') {
      cubie.y = direction === 1 ? -oldZ : oldZ;
      cubie.z = direction === 1 ? oldY : -oldY;
    } else if (axis === 'y') {
      cubie.x = direction === 1 ? oldZ : -oldZ;
      cubie.z = direction === 1 ? -oldX : oldX;
    } else if (axis === 'z') {
      cubie.x = direction === 1 ? -oldY : oldY;
      cubie.y = direction === 1 ? oldX : -oldX;
    }
    
    cubie.x = Math.round(cubie.x);
    cubie.y = Math.round(cubie.y);
    cubie.z = Math.round(cubie.z);
    
    // Update face colors
    cubie.rotateFaceColors(axis, direction);
  });
  
  // Check for solved faces after each move
  this.checkSolvedFaces();
}
```

---

### Step 4.3: Create solve detector

Create `src/detection/SolveDetector.js`:

```javascript
export class SolveDetector {
  constructor(cube) {
    this.cube = cube;
    this.solvedFaces = new Set();
    this.onFaceSolved = null; // Callback
  }
  
  // Check all faces and return newly solved ones
  checkAllFaces() {
    const faces = ['right', 'left', 'up', 'down', 'front', 'back'];
    const newlySolved = [];
    
    for (const face of faces) {
      const isSolved = this.isFaceSolved(face);
      const wasSolved = this.solvedFaces.has(face);
      
      if (isSolved && !wasSolved) {
        this.solvedFaces.add(face);
        newlySolved.push(face);
      } else if (!isSolved && wasSolved) {
        this.solvedFaces.delete(face);
      }
    }
    
    return newlySolved;
  }
  
  isFaceSolved(face) {
    const cubiesOnFace = this.getCubiesOnFace(face);
    
    if (cubiesOnFace.length !== 9) return false;
    
    // Get the color of the center cubie (which never changes position)
    const centerCubie = cubiesOnFace.find(c => this.isCenter(c, face));
    if (!centerCubie) return false;
    
    const centerColor = centerCubie.getColorOnFace(face);
    if (!centerColor) return false;
    
    // Check if all 9 cubies show the same color on this face
    return cubiesOnFace.every(cubie => {
      return cubie.getColorOnFace(face) === centerColor;
    });
  }
  
  getCubiesOnFace(face) {
    const { axis, layer } = this.faceToAxisLayer(face);
    return this.cube.cubies.filter(c => Math.round(c[axis]) === layer);
  }
  
  isCenter(cubie, face) {
    const { axis } = this.faceToAxisLayer(face);
    // Center piece has 0 on the other two axes
    const otherAxes = ['x', 'y', 'z'].filter(a => a !== axis);
    return otherAxes.every(a => cubie[a] === 0);
  }
  
  faceToAxisLayer(face) {
    const mapping = {
      right: { axis: 'x', layer: 1 },
      left: { axis: 'x', layer: -1 },
      up: { axis: 'y', layer: 1 },
      down: { axis: 'y', layer: -1 },
      front: { axis: 'z', layer: 1 },
      back: { axis: 'z', layer: -1 }
    };
    return mapping[face];
  }
  
  getFaceColor(face) {
    // Return the expected color for each face
    const colors = {
      right: 'red',
      left: 'orange', 
      up: 'white',
      down: 'yellow',
      front: 'green',
      back: 'blue'
    };
    return colors[face];
  }
}
```

---

### Step 4.4: Integrate solve detector

Update `src/cube/Cube.js`:

```javascript
import { SolveDetector } from '../detection/SolveDetector.js';

// In constructor:
this.solveDetector = new SolveDetector(this);
this.onFaceSolved = null; // Callback for when a face is solved

// Add this method:
checkSolvedFaces() {
  const newlySolved = this.solveDetector.checkAllFaces();
  
  for (const face of newlySolved) {
    console.log(`🎉 Face solved: ${face}!`);
    
    if (this.onFaceSolved) {
      this.onFaceSolved(face);
    }
  }
}
```

Update `src/main.js` to add callback:

```javascript
// After creating cube:
cube.onFaceSolved = (face) => {
  console.log(`Face ${face} was solved! Trigger animation here.`);
  // We'll add the unlock animation in Phase 5
};
```

### ✅ Checkpoint 4.4
Solve any face (you can do this with keyboard: e.g., if starting from solved, do R then R then R then R to return to solved — the right face should trigger). Check the console for "Face solved" messages.

---

### Step 4.5: Add scramble function

Add to `src/cube/Cube.js`:

```javascript
// Scramble the cube with random moves
async scramble(moveCount = 20) {
  const axes = ['x', 'y', 'z'];
  const layers = [-1, 0, 1];
  const directions = [1, -1];
  
  for (let i = 0; i < moveCount; i++) {
    const axis = axes[Math.floor(Math.random() * axes.length)];
    const layer = layers[Math.floor(Math.random() * layers.length)];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    
    await this.rotate(axis, layer, direction);
  }
}
```

Update `src/main.js`:

```javascript
// Scramble on load (optional - comment out for testing)
// cube.scramble(25);

// Or add a key to scramble
document.addEventListener('keydown', (e) => {
  if (e.key === ' ') { // Spacebar
    cube.scramble(25);
  }
});
```

### ✅ Phase 4 Complete
You should now have:
- Face solve detection working
- Console logs when faces are solved
- Scramble function to mix up the cube
- Callback system ready for animation integration

---

## Phase 5: Unlock Animation (Days 10-12)

### Goal
Create the sci-fi "explosion" animation when a face is solved — cubies expand outward, glow, then trigger navigation.

---

### Step 5.1: Add emissive properties to materials

Update `src/cube/Cubie.js`:

```javascript
createFaceMaterial(colorName) {
  const color = colorName ? COLORS[colorName] : 0x111111;
  return new THREE.MeshStandardMaterial({ 
    color,
    emissive: color,
    emissiveIntensity: 0,
    roughness: 0.3,
    metalness: 0.1
  });
}
```

---

### Step 5.2: Create unlock animation

Create `src/animation/UnlockAnimation.js`:

```javascript
import * as THREE from 'three';
import gsap from 'gsap';
import { SECTIONS } from '../utils/constants.js';

export class UnlockAnimation {
  constructor(cube) {
    this.cube = cube;
    this.isAnimating = false;
  }
  
  // Play the unlock animation for a solved face
  play(face) {
    if (this.isAnimating) return;
    this.isAnimating = true;
    
    const faceCubies = this.getCubiesOnFace(face);
    const faceCenter = this.getFaceCenter(face);
    const section = SECTIONS[this.getFaceColor(face)];
    
    // Create GSAP timeline
    const tl = gsap.timeline({
      onComplete: () => {
        this.isAnimating = false;
        this.navigateToSection(section);
      }
    });
    
    // Phase 1: Glow up (0.2s)
    faceCubies.forEach((cubie, i) => {
      cubie.mesh.material.forEach(mat => {
        if (mat.emissiveIntensity !== undefined) {
          tl.to(mat, {
            emissiveIntensity: 0.5,
            duration: 0.2,
            ease: "power2.in"
          }, 0);
        }
      });
    });
    
    // Phase 2: Expand outward with stagger (0.5s)
    faceCubies.forEach((cubie, i) => {
      // Calculate direction from center to this cubie
      const cubieWorldPos = new THREE.Vector3();
      cubie.mesh.getWorldPosition(cubieWorldPos);
      
      const direction = new THREE.Vector3()
        .subVectors(cubieWorldPos, faceCenter)
        .normalize();
      
      // If it's the center cubie, push it straight out along face normal
      if (direction.length() < 0.1) {
        direction.copy(this.getFaceNormal(face));
      }
      
      const expandDistance = 0.6; // How far to expand
      const targetPos = cubieWorldPos.clone().add(
        direction.multiplyScalar(expandDistance)
      );
      
      tl.to(cubie.mesh.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 0.5,
        ease: "back.out(1.7)"
      }, 0.2 + (i * 0.03)); // Staggered start
    });
    
    // Phase 3: Fade out / hold (0.3s)
    tl.to({}, { duration: 0.3 });
    
    // Phase 4: Contract back (optional - or just transition)
    // For now, we'll transition to the section
    
    return tl;
  }
  
  getCubiesOnFace(face) {
    const { axis, layer } = this.faceToAxisLayer(face);
    return this.cube.cubies.filter(c => Math.round(c[axis]) === layer);
  }
  
  getFaceCenter(face) {
    const { axis, layer } = this.faceToAxisLayer(face);
    const center = new THREE.Vector3();
    center[axis] = layer * 1.05; // Slightly outside the cube
    return center;
  }
  
  getFaceNormal(face) {
    const normals = {
      right: new THREE.Vector3(1, 0, 0),
      left: new THREE.Vector3(-1, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      down: new THREE.Vector3(0, -1, 0),
      front: new THREE.Vector3(0, 0, 1),
      back: new THREE.Vector3(0, 0, -1)
    };
    return normals[face];
  }
  
  getFaceColor(face) {
    const colors = {
      right: 'red',
      left: 'orange',
      up: 'white',
      down: 'yellow',
      front: 'green',
      back: 'blue'
    };
    return colors[face];
  }
  
  faceToAxisLayer(face) {
    const mapping = {
      right: { axis: 'x', layer: 1 },
      left: { axis: 'x', layer: -1 },
      up: { axis: 'y', layer: 1 },
      down: { axis: 'y', layer: -1 },
      front: { axis: 'z', layer: 1 },
      back: { axis: 'z', layer: -1 }
    };
    return mapping[face];
  }
  
  navigateToSection(section) {
    console.log(`Navigating to: ${section.name} (${section.path})`);
    // For now, just log it
    // Later: window.location.href = section.path;
    // Or use a router if building a SPA
    
    // Reset the cube after navigation (for demo purposes)
    setTimeout(() => {
      this.resetCubePositions();
    }, 500);
  }
  
  resetCubePositions() {
    this.cube.cubies.forEach(cubie => {
      const offset = 1.05; // CUBIE_SIZE + gap
      
      gsap.to(cubie.mesh.position, {
        x: cubie.x * offset,
        y: cubie.y * offset,
        z: cubie.z * offset,
        duration: 0.4,
        ease: "power2.out"
      });
      
      cubie.mesh.material.forEach(mat => {
        if (mat.emissiveIntensity !== undefined) {
          gsap.to(mat, {
            emissiveIntensity: 0,
            duration: 0.3
          });
        }
      });
    });
  }
}
```

---

### Step 5.3: Integrate unlock animation

Update `src/main.js`:

```javascript
import { UnlockAnimation } from './animation/UnlockAnimation.js';

// After creating cube:
const unlockAnimation = new UnlockAnimation(cube);

cube.onFaceSolved = (face) => {
  console.log(`Face ${face} was solved!`);
  unlockAnimation.play(face);
};
```

### ✅ Checkpoint 5.3
Solve a face — you should see the 9 cubies glow and expand outward with a satisfying "pop" effect.

---

### Step 5.4: Add bloom post-processing (optional but recommended)

Update `src/main.js`:

```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

// After creating renderer:
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5,   // Strength
  0.4,   // Radius
  0.85   // Threshold
);
composer.addPass(bloomPass);

// Update animation loop:
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  // renderer.render(scene, camera); // Replace with:
  composer.render();
}

// Update resize handler:
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});
```

### ✅ Checkpoint 5.4
The glow during the unlock animation should now have a soft bloom effect, making it feel more dramatic and sci-fi.

---

### Step 5.5: Refine the animation timing and effects

Update `src/animation/UnlockAnimation.js` with more dramatic effects:

```javascript
// In the play() method, enhance the animation:

play(face) {
  if (this.isAnimating) return;
  this.isAnimating = true;
  
  const faceCubies = this.getCubiesOnFace(face);
  const faceCenter = this.getFaceCenter(face);
  const faceNormal = this.getFaceNormal(face);
  const section = SECTIONS[this.getFaceColor(face)];
  
  const tl = gsap.timeline({
    onComplete: () => {
      this.isAnimating = false;
      this.navigateToSection(section);
    }
  });
  
  // Phase 1: Quick pulse glow
  faceCubies.forEach((cubie) => {
    cubie.mesh.material.forEach(mat => {
      if (mat.emissiveIntensity !== undefined) {
        tl.to(mat, {
          emissiveIntensity: 0.8,
          duration: 0.15,
          ease: "power2.in"
        }, 0);
      }
    });
  });
  
  // Phase 2: Expand with staggered timing based on distance from center
  const sortedCubies = [...faceCubies].sort((a, b) => {
    const posA = new THREE.Vector3();
    const posB = new THREE.Vector3();
    a.mesh.getWorldPosition(posA);
    b.mesh.getWorldPosition(posB);
    const distA = posA.distanceTo(faceCenter);
    const distB = posB.distanceTo(faceCenter);
    return distA - distB; // Center first, edges last
  });
  
  sortedCubies.forEach((cubie, i) => {
    const cubieWorldPos = new THREE.Vector3();
    cubie.mesh.getWorldPosition(cubieWorldPos);
    
    // Direction is combination of outward + forward (along face normal)
    let direction = new THREE.Vector3()
      .subVectors(cubieWorldPos, faceCenter);
    
    if (direction.length() < 0.1) {
      direction = faceNormal.clone();
    } else {
      direction.normalize();
      // Add some forward motion along face normal
      direction.add(faceNormal.clone().multiplyScalar(0.5));
      direction.normalize();
    }
    
    const expandDistance = 0.5 + (i * 0.05); // Outer pieces go further
    const targetPos = cubieWorldPos.clone().add(
      direction.multiplyScalar(expandDistance)
    );
    
    // Add slight rotation
    tl.to(cubie.mesh.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.6,
      ease: "back.out(2)"
    }, 0.15 + (i * 0.02));
    
    tl.to(cubie.mesh.rotation, {
      x: cubie.mesh.rotation.x + (Math.random() - 0.5) * 0.3,
      y: cubie.mesh.rotation.y + (Math.random() - 0.5) * 0.3,
      duration: 0.6,
      ease: "power2.out"
    }, 0.15 + (i * 0.02));
  });
  
  // Phase 3: Hold with pulsing glow
  tl.to({}, { duration: 0.5 });
  
  return tl;
}
```

### ✅ Phase 5 Complete
You should now have:
- Dramatic glow effect when a face is solved
- Cubies expanding outward with staggered timing
- Slight rotation for added dynamism
- Bloom post-processing for sci-fi feel
- Navigation trigger ready for website integration

---

## Phase 6: Visual Polish (Days 13-15)

### Goal
Upgrade materials to PBR with reflections, add environment mapping, and refine the overall aesthetic.

---

### Step 6.1: Download an HDR environment map

Download a free HDRI from [Poly Haven](https://polyhaven.com/hdris):
- Recommended: "studio_small_08" or similar studio lighting
- Download the 1K version (.hdr file)
- Save to `public/hdri/studio.hdr`

---

### Step 6.2: Set up environment mapping

Update `src/main.js`:

```javascript
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// After creating scene:
const rgbeLoader = new RGBELoader();
rgbeLoader.load('/hdri/studio.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;
  
  // Optional: use as background (blurred)
  // scene.background = texture;
  // scene.backgroundBlurriness = 0.5;
});
```

---

### Step 6.3: Upgrade to MeshPhysicalMaterial

Update `src/cube/Cubie.js`:

```javascript
createFaceMaterial(colorName) {
  const color = colorName ? COLORS[colorName] : 0x111111;
  
  return new THREE.MeshPhysicalMaterial({ 
    color,
    emissive: color,
    emissiveIntensity: 0,
    roughness: 0.15,
    metalness: 0,
    clearcoat: 0.4,
    clearcoatRoughness: 0.1,
    reflectivity: 0.5
  });
}
```

### ✅ Checkpoint 6.3
The cube should now have subtle reflections and a glossy appearance. The environment map provides realistic lighting without visible background.

---

### Step 6.4: Add subtle idle animation

Update `src/main.js`:

```javascript
// Add gentle floating motion
let time = 0;

function animate() {
  requestAnimationFrame(animate);
  
  time += 0.01;
  cube.group.position.y = Math.sin(time) * 0.05;
  cube.group.rotation.y += 0.001; // Very slow rotation
  
  controls.update();
  composer.render();
}
```

---

### Step 6.5: Add particle effects (optional enhancement)

Create `src/effects/Particles.js`:

```javascript
import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = null;
    this.createParticles();
  }
  
  createParticles() {
    const count = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    
    for (let i = 0; i < count * 3; i += 3) {
      // Random positions in a sphere around the cube
      const radius = 5 + Math.random() * 3;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi);
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
      color: 0x4488ff,
      size: 0.02,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    });
    
    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }
  
  update(time) {
    if (this.particles) {
      this.particles.rotation.y = time * 0.05;
      this.particles.rotation.x = time * 0.02;
    }
  }
}
```

Update `src/main.js`:

```javascript
import { ParticleSystem } from './effects/Particles.js';

// After scene creation:
const particles = new ParticleSystem(scene);

// In animate():
function animate() {
  requestAnimationFrame(animate);
  
  time += 0.01;
  particles.update(time);
  
  // ... rest of animate
}
```

### ✅ Phase 6 Complete
You should now have:
- PBR materials with realistic reflections
- HDR environment lighting
- Subtle idle animation
- Optional particle effects for atmosphere

---

## Phase 7: Website Integration (Day 16+)

### Goal
Connect the cube to actual website sections, add UI elements, and finalize the experience.

---

### Step 7.1: Create section pages

For a simple setup, create separate HTML files or use hash routing:

Create `src/sections/about.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <title>About</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body>
  <div class="section-content">
    <h1>About Me</h1>
    <p>Your content here...</p>
    <a href="../index.html">Back to Cube</a>
  </div>
</body>
</html>
```

(Create similar files for other sections)

---

### Step 7.2: Update navigation in UnlockAnimation

Update `src/animation/UnlockAnimation.js`:

```javascript
navigateToSection(section) {
  console.log(`Navigating to: ${section.name} (${section.path})`);
  
  // Fade out canvas
  gsap.to('#cube-canvas', {
    opacity: 0,
    duration: 0.5,
    onComplete: () => {
      window.location.href = section.path;
    }
  });
}
```

---

### Step 7.3: Add UI overlay

Update `src/index.html`:

```html
<body>
  <canvas id="cube-canvas"></canvas>
  
  <div class="ui-overlay">
    <div class="instructions">
      <p>Drag to rotate • Solve a face to unlock</p>
    </div>
    
    <div class="legend">
      <div class="legend-item"><span class="color-dot white"></span> About</div>
      <div class="legend-item"><span class="color-dot yellow"></span> Experience</div>
      <div class="legend-item"><span class="color-dot green"></span> Projects</div>
      <div class="legend-item"><span class="color-dot blue"></span> Skills</div>
      <div class="legend-item"><span class="color-dot red"></span> Contact</div>
      <div class="legend-item"><span class="color-dot orange"></span> Blog</div>
    </div>
  </div>
  
  <script type="module" src="./main.js"></script>
</body>
```

Update `src/style.css`:

```css
.ui-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2rem;
}

.instructions {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
  font-family: system-ui, sans-serif;
}

.legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: rgba(255, 255, 255, 0.7);
  font-family: system-ui, sans-serif;
  font-size: 0.9rem;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.color-dot.white { background: #ffffff; }
.color-dot.yellow { background: #ffff00; }
.color-dot.green { background: #00ff00; }
.color-dot.blue { background: #0000ff; }
.color-dot.red { background: #ff0000; }
.color-dot.orange { background: #ff8800; }
```

---

### Step 7.4: Add scramble on load

Update `src/main.js`:

```javascript
// After cube is created and everything is set up:
setTimeout(() => {
  cube.scramble(20);
}, 1000); // Wait 1 second before scrambling
```

---

### Step 7.5: Add reset button

Update HTML:
```html
<button id="reset-btn" class="ui-button">Scramble</button>
```

Update CSS:
```css
.ui-button {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 0.75rem 1.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  font-family: system-ui, sans-serif;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s;
}

.ui-button:hover {
  background: rgba(255, 255, 255, 0.2);
}
```

Update `src/main.js`:
```javascript
document.getElementById('reset-btn').addEventListener('click', () => {
  cube.scramble(20);
});
```

### ✅ Phase 7 Complete
You should now have:
- Full website integration with navigation
- UI overlay with instructions and legend
- Scramble button
- Smooth transitions between cube and sections

---

## Final Checklist

- [ ] Cube renders with 6 correct colors
- [ ] Orbit controls rotate entire cube
- [ ] Keyboard controls (R, L, U, D, F, B) rotate faces
- [ ] Mouse drag on faces rotates layers
- [ ] Moves queue and execute sequentially
- [ ] Solve detection works for all 6 faces
- [ ] Unlock animation plays when face is solved
- [ ] Glow/bloom effect visible during animation
- [ ] PBR materials with reflections
- [ ] Navigation triggers after animation
- [ ] UI overlay visible
- [ ] Scramble function works

---

## Troubleshooting Guide

**Cube appears black:**
- Check that lighting is added to scene
- Verify environment map loaded successfully

**Face rotations are wrong direction:**
- Adjust direction multipliers in keyboard/drag controls
- Print axis/layer/direction to console to debug

**Solve detection not triggering:**
- Log cubie positions and face colors after each move
- Ensure `rotateFaceColors()` is being called

**Animations not smooth:**
- Check GSAP is imported correctly
- Verify `requestAnimationFrame` loop is running
- Check for console errors

**Performance issues:**
- Reduce particle count
- Use 1K HDR instead of 4K
- Disable bloom if needed

---

## Next Steps (Future Enhancements)

- Touch/mobile support
- Sound effects
- Solve counter/timer
- Undo functionality
- Hint system
- Custom color themes
- Save progress to localStorage
