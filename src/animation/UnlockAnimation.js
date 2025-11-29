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
    const faceNormal = this.getFaceNormal(face);
    const section = SECTIONS[this.getFaceColor(face)];

    // Sort cubies by distance from center (center first, corners last)
    const sortedCubies = [...faceCubies].sort((a, b) => {
      const posA = new THREE.Vector3();
      const posB = new THREE.Vector3();
      a.mesh.getWorldPosition(posA);
      b.mesh.getWorldPosition(posB);
      const distA = posA.distanceTo(faceCenter);
      const distB = posB.distanceTo(faceCenter);
      return distA - distB;
    });

    // Create GSAP timeline
    const tl = gsap.timeline({
      onComplete: () => {
        this.isAnimating = false;
        this.navigateToSection(section);
      }
    });

    // Phase 1: Quick pulse glow (0.15s)
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

    // Phase 2: Expand outward with stagger
    sortedCubies.forEach((cubie, i) => {
      const cubieWorldPos = new THREE.Vector3();
      cubie.mesh.getWorldPosition(cubieWorldPos);

      // Direction is combination of outward + forward (along face normal)
      let direction = new THREE.Vector3()
        .subVectors(cubieWorldPos, faceCenter);

      if (direction.length() < 0.1) {
        // Center cubie - push straight out
        direction = faceNormal.clone();
      } else {
        direction.normalize();
        // Add forward motion along face normal
        direction.add(faceNormal.clone().multiplyScalar(0.5));
        direction.normalize();
      }

      const expandDistance = 0.5 + (i * 0.05); // Outer pieces go further
      const targetPos = cubieWorldPos.clone().add(
        direction.multiplyScalar(expandDistance)
      );

      // Position animation
      tl.to(cubie.mesh.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 0.6,
        ease: "back.out(2)"
      }, 0.15 + (i * 0.02));

      // Slight rotation for dynamism
      tl.to(cubie.mesh.rotation, {
        x: cubie.mesh.rotation.x + (Math.random() - 0.5) * 0.3,
        y: cubie.mesh.rotation.y + (Math.random() - 0.5) * 0.3,
        duration: 0.6,
        ease: "power2.out"
      }, 0.15 + (i * 0.02));
    });

    // Phase 3: Hold with glow
    tl.to({}, { duration: 0.4 });

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

    // Reset the cube after animation (for demo purposes)
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

      gsap.to(cubie.mesh.rotation, {
        x: 0,
        y: 0,
        z: 0,
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
