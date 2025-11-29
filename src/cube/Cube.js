import * as THREE from 'three';
import gsap from 'gsap';
import { Cubie } from './Cubie.js';
import { MoveQueue } from '../animation/MoveQueue.js';
import { SolveDetector } from '../detection/SolveDetector.js';

export class Cube {
  constructor(scene) {
    this.scene = scene;

    // Container for all cubies
    this.group = new THREE.Group();

    // Array of all 27 cubies
    this.cubies = [];

    // Move queue for sequential animations
    this.moveQueue = new MoveQueue();

    // Create the cube
    this.createCubies();

    // Solve detection
    this.solveDetector = new SolveDetector(this);
    this.onFaceSolved = null; // Callback for when a face is solved
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

      // Update face colors
      cubie.rotateFaceColors(axis, direction);
    });

    // Check for solved faces after each move
    this.checkSolvedFaces();
  }

  checkSolvedFaces() {
    const newlySolved = this.solveDetector.checkAllFaces();

    for (const face of newlySolved) {
      console.log(`Face solved: ${face}!`);

      if (this.onFaceSolved) {
        this.onFaceSolved(face);
      }
    }
  }

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

  // Add cube to a Three.js scene
  addToScene(scene) {
    scene.add(this.group);
  }
}
