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
