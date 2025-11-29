import * as THREE from 'three';
import gsap from 'gsap';
import { SECTIONS } from '../utils/constants.js';

export class UnlockAnimation {
  constructor(cube) {
    this.cube = cube;
    this.isAnimating = false;
    this.savedState = []; // Store positions/rotations before animation
    this.onComplete = null; // Callback when animation finishes
    this.animationQueue = []; // Queue for pending face animations
  }

  // Play the unlock animation for a solved face
  play(face) {
    console.log(`[UnlockAnimation] play() called for face: ${face}, isAnimating: ${this.isAnimating}`);

    // If already animating, queue this face for later
    if (this.isAnimating) {
      console.log(`[UnlockAnimation] Queueing face: ${face}`);
      this.animationQueue.push({ face, onComplete: this.onComplete });
      this.onComplete = null; // Clear so it doesn't get overwritten
      return;
    }

    this.isAnimating = true;

    // Save current state of ALL cubies before animating
    this.savedState = this.cube.cubies.map(cubie => ({
      cubie,
      position: cubie.mesh.position.clone(),
      rotation: cubie.mesh.rotation.clone()
    }));

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

    // Store callback for this specific animation
    const currentCallback = this.onComplete;
    this.onComplete = null;

    // Create GSAP timeline
    const tl = gsap.timeline({
      onComplete: () => {
        this.isAnimating = false;
        this.resetCubePositions();

        // Call the onComplete callback for this animation
        if (currentCallback) {
          currentCallback();
        }

        // Process next queued animation if any
        this.processQueue();
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

  // Process the next animation in the queue
  processQueue() {
    if (this.animationQueue.length === 0) return;

    const next = this.animationQueue.shift();
    console.log(`[UnlockAnimation] Processing queued face: ${next.face}`);

    // Set the callback for the next animation
    this.onComplete = next.onComplete;

    // Play the animation (with a small delay for visual separation)
    setTimeout(() => {
      this.play(next.face);
    }, 200);
  }

  resetCubePositions() {
    const offset = 1.05; // CUBIE_SIZE + gap

    // Restore each cubie using clean calculated positions
    this.savedState.forEach(({ cubie, rotation }) => {
      // Kill any existing tweens on this mesh
      gsap.killTweensOf(cubie.mesh.position);
      gsap.killTweensOf(cubie.mesh.rotation);

      // Calculate clean position from logical coordinates
      const cleanX = cubie.x * offset;
      const cleanY = cubie.y * offset;
      const cleanZ = cubie.z * offset;

      gsap.to(cubie.mesh.position, {
        x: cleanX,
        y: cleanY,
        z: cleanZ,
        duration: 0.4,
        ease: "power2.out",
        overwrite: true
      });

      gsap.to(cubie.mesh.rotation, {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
        duration: 0.4,
        ease: "power2.out",
        overwrite: true
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

    // Clear saved state
    this.savedState = [];
  }
}
