import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { CUBIE_SIZE, COLORS } from '../utils/constants.js';

export class Cubie {
  constructor(x, y, z) {
    // Logical position (-1, 0, or 1 on each axis)
    this.x = x;
    this.y = y;
    this.z = z;

    // Store home position for reset
    this.homeX = x;
    this.homeY = y;
    this.homeZ = z;

    // Track which color is on which face of THIS cubie
    // Key = face direction, Value = color name
    this.faceColors = this.initializeFaceColors();

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
      CUBIE_SIZE,
      CUBIE_SIZE,
      CUBIE_SIZE,
      4,      // segments (smoothness)
      0.08    // radius of rounded edges
    );

    // Create materials for each face
    // Order: +X, -X, +Y, -Y, +Z, -Z (right, left, up, down, front, back)
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
}
