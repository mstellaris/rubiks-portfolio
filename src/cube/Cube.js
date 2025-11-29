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
