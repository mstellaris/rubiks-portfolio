import * as THREE from 'three';
import gsap from 'gsap';

export class FaceLink {
  constructor(scene, camera, cube) {
    this.scene = scene;
    this.camera = camera;
    this.cube = cube;
    this.activeLinks = new Map(); // face -> { line, button, curve, ... }
  }

  show(face, section) {
    // Remove existing link for this face if any
    this.hide(face);

    const faceCenter = this.getFaceCenter(face);
    const faceNormal = this.getFaceNormal(face);

    // Calculate a curved path (vine-like)
    const curvePoints = this.generateVineCurve(faceCenter, faceNormal, face);

    // Create line with many segments for smooth curve
    const segmentCount = 50;
    const lineGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(segmentCount * 3);

    // Initialize all points at start position
    for (let i = 0; i < segmentCount; i++) {
      positions[i * 3] = faceCenter.x;
      positions[i * 3 + 1] = faceCenter.y;
      positions[i * 3 + 2] = faceCenter.z;
    }
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0
    });

    const line = new THREE.Line(lineGeometry, lineMaterial);
    this.scene.add(line);

    // Create HTML button (hidden initially)
    const button = document.createElement('button');
    button.className = 'face-link-button';
    button.textContent = section.name;
    button.style.opacity = '0';
    button.style.transform = 'translate(-50%, -50%) scale(0.8)';
    button.dataset.face = face;

    button.addEventListener('click', () => {
      this.navigateTo(section);
    });

    document.body.appendChild(button);

    // Store the final endpoint for button positioning
    const endPoint = curvePoints[curvePoints.length - 1].clone();

    // Store reference
    this.activeLinks.set(face, {
      line,
      button,
      endPoint,
      section,
      curvePoints,
      segmentCount,
      faceCenter: faceCenter.clone(),
      faceNormal: faceNormal.clone()
    });

    // Animate: fade in line, then grow it like a vine
    const positionAttr = lineGeometry.attributes.position;

    // First fade in the line material
    gsap.to(lineMaterial, {
      opacity: 0.7,
      duration: 0.3,
      ease: "power2.out"
    });

    // Then animate the vine growing
    const growthDuration = 1.2; // Slower, more organic
    const animState = { progress: 0 };

    gsap.to(animState, {
      progress: 1,
      duration: growthDuration,
      ease: "power1.inOut", // Smooth organic easing
      onUpdate: () => {
        const currentProgress = animState.progress;

        // Calculate how many segments to show based on progress
        const visibleSegments = Math.floor(currentProgress * segmentCount);

        for (let i = 0; i < segmentCount; i++) {
          if (i <= visibleSegments) {
            // This segment is visible - interpolate along curve
            const t = i / (segmentCount - 1);
            const point = this.getPointOnCurve(curvePoints, t);

            // Add slight organic wobble during growth
            const wobbleAmount = (1 - currentProgress) * 0.02;
            const wobble = Math.sin(i * 0.5 + currentProgress * 10) * wobbleAmount;

            positionAttr.setXYZ(i,
              point.x + wobble,
              point.y + wobble * 0.5,
              point.z + wobble
            );
          } else {
            // Hide segments not yet grown by placing at last visible point
            const lastT = visibleSegments / (segmentCount - 1);
            const lastPoint = this.getPointOnCurve(curvePoints, lastT);
            positionAttr.setXYZ(i, lastPoint.x, lastPoint.y, lastPoint.z);
          }
        }
        positionAttr.needsUpdate = true;
      },
      onComplete: () => {
        // Finalize curve positions (remove wobble)
        for (let i = 0; i < segmentCount; i++) {
          const t = i / (segmentCount - 1);
          const point = this.getPointOnCurve(curvePoints, t);
          positionAttr.setXYZ(i, point.x, point.y, point.z);
        }
        positionAttr.needsUpdate = true;

        // Show button with scale animation
        gsap.to(button, {
          opacity: 1,
          duration: 0.4,
          ease: "back.out(1.7)"
        });
        gsap.to(button.style, {
          transform: 'translate(-50%, -50%) scale(1)',
          duration: 0.4,
          ease: "back.out(1.7)"
        });
      }
    });

    // Start updating button position
    this.updateButtonPosition(face);
  }

  // Generate a curved vine-like path from face center outward
  generateVineCurve(start, normal, face) {
    const points = [];
    const baseLength = 3.0;

    // Start point
    points.push(start.clone());

    // Calculate a gentle curve with slight organic deviation
    // The curve bends slightly based on face direction for visual interest
    const perpendicular = this.getPerpendicularVector(normal);

    // Control points for organic curve
    const curveBend = 0.3; // How much the vine curves
    const curveDirection = face === 'left' || face === 'down' || face === 'back' ? -1 : 1;

    // Mid point with curve
    const mid = start.clone()
      .add(normal.clone().multiplyScalar(baseLength * 0.5))
      .add(perpendicular.clone().multiplyScalar(curveBend * curveDirection));
    points.push(mid);

    // End point - project to check viewport bounds
    let end = start.clone()
      .add(normal.clone().multiplyScalar(baseLength))
      .add(perpendicular.clone().multiplyScalar(curveBend * 0.5 * curveDirection));

    // Adjust endpoint to stay within viewport
    end = this.clampToViewport(end, start, 0.85);
    points.push(end);

    return points;
  }

  // Get a vector perpendicular to the normal for curve bending
  getPerpendicularVector(normal) {
    // Choose an up vector that's not parallel to normal
    const up = Math.abs(normal.y) < 0.9
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);

    return new THREE.Vector3().crossVectors(normal, up).normalize();
  }

  // Interpolate along curve points using Catmull-Rom style
  getPointOnCurve(points, t) {
    if (points.length === 2) {
      return points[0].clone().lerp(points[1], t);
    }

    // For 3+ points, use quadratic bezier
    const p0 = points[0];
    const p1 = points[1];
    const p2 = points[2];

    const oneMinusT = 1 - t;
    return new THREE.Vector3(
      oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
      oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y,
      oneMinusT * oneMinusT * p0.z + 2 * oneMinusT * t * p1.z + t * t * p2.z
    );
  }

  // Clamp endpoint to stay within viewport bounds
  clampToViewport(point, start, maxScreenRatio) {
    const projected = point.clone().project(this.camera);

    // Check if outside viewport bounds (with margin)
    const margin = maxScreenRatio;
    if (Math.abs(projected.x) > margin || Math.abs(projected.y) > margin) {
      // Scale back the point to fit within bounds
      const direction = point.clone().sub(start);
      let scale = 1;

      if (Math.abs(projected.x) > margin) {
        scale = Math.min(scale, margin / Math.abs(projected.x));
      }
      if (Math.abs(projected.y) > margin) {
        scale = Math.min(scale, margin / Math.abs(projected.y));
      }

      return start.clone().add(direction.multiplyScalar(scale * 0.9));
    }

    return point;
  }

  hide(face) {
    const link = this.activeLinks.get(face);
    if (!link) return;

    // Animate button out
    gsap.to(link.button, {
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        link.button.remove();
      }
    });

    // Animate line shrinking back (reverse vine)
    const positionAttr = link.line.geometry.attributes.position;
    const startPoint = link.faceCenter;

    gsap.to(link.line.material, {
      opacity: 0,
      duration: 0.4,
      delay: 0.1,
      ease: "power2.in",
      onComplete: () => {
        this.scene.remove(link.line);
        link.line.geometry.dispose();
        link.line.material.dispose();
      }
    });

    this.activeLinks.delete(face);
  }

  hideAll() {
    for (const face of this.activeLinks.keys()) {
      this.hide(face);
    }
  }

  updateButtonPosition(face) {
    const link = this.activeLinks.get(face);
    if (!link) return;

    // Project 3D end point to screen coordinates
    const screenPos = link.endPoint.clone().project(this.camera);

    const x = (screenPos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screenPos.y * 0.5 + 0.5) * window.innerHeight;

    // Check if point is in front of camera
    if (screenPos.z < 1) {
      link.button.style.left = `${x}px`;
      link.button.style.top = `${y}px`;
      link.button.style.visibility = 'visible';
    } else {
      link.button.style.visibility = 'hidden';
    }

    // Continue updating
    requestAnimationFrame(() => this.updateButtonPosition(face));
  }

  update() {
    // Update line positions to account for cube movement (idle animation)
    for (const [face, link] of this.activeLinks) {
      const faceCenter = this.getFaceCenter(face);
      const faceNormal = this.getFaceNormal(face);

      // Account for floating animation
      const floatOffset = this.cube.group.position.y;

      // Regenerate curve with new start position
      const adjustedStart = faceCenter.clone();
      adjustedStart.y += floatOffset;

      const curvePoints = this.generateVineCurve(adjustedStart, faceNormal, face);
      link.curvePoints = curvePoints;
      link.endPoint.copy(curvePoints[curvePoints.length - 1]);

      // Update line geometry
      const positionAttr = link.line.geometry.attributes.position;
      for (let i = 0; i < link.segmentCount; i++) {
        const t = i / (link.segmentCount - 1);
        const point = this.getPointOnCurve(curvePoints, t);
        positionAttr.setXYZ(i, point.x, point.y, point.z);
      }
      positionAttr.needsUpdate = true;
    }
  }

  getFaceCenter(face) {
    const offset = 1.6; // Slightly outside the cube face
    const centers = {
      right: new THREE.Vector3(offset, 0, 0),
      left: new THREE.Vector3(-offset, 0, 0),
      up: new THREE.Vector3(0, offset, 0),
      down: new THREE.Vector3(0, -offset, 0),
      front: new THREE.Vector3(0, 0, offset),
      back: new THREE.Vector3(0, 0, -offset)
    };
    return centers[face];
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

  navigateTo(section) {
    console.log(`Navigating to: ${section.name} (${section.path})`);
    // For now, show the overlay. Later: window.location.href = section.path;

    const overlay = document.getElementById('section-overlay');
    const title = document.getElementById('section-title');
    const description = document.getElementById('section-description');

    if (overlay && title && description) {
      title.textContent = section.name;
      description.textContent = `Welcome to the ${section.name} section.`;
      overlay.classList.remove('hidden');
    }
  }
}
