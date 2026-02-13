import * as THREE from 'three';
import gsap from 'gsap';

export class FaceLink {
  constructor(scene, camera, cube) {
    this.scene = scene;
    this.camera = camera;
    this.cube = cube;
    this.activeLinks = new Map(); // face -> { line, button, curve, ... }
    this._projVec = new THREE.Vector3(); // reusable vector for projection
    this.vineColor = 0xffffff;
    this.vineOpacity = 0.7;
    this.onNavigate = null; // callback(face, section) — set by main.js for portal transition
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
      color: this.vineColor,
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
      if (this.onNavigate) {
        this.onNavigate(face, section);
      } else {
        this.navigateTo(section);
      }
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
      opacity: this.vineOpacity,
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
        // Cache final positions for efficient per-frame Y-offset updates
        const basePositions = new Float32Array(segmentCount * 3);
        for (let i = 0; i < segmentCount; i++) {
          const t = i / (segmentCount - 1);
          const point = this.getPointOnCurve(curvePoints, t);
          basePositions[i * 3] = point.x;
          basePositions[i * 3 + 1] = point.y;
          basePositions[i * 3 + 2] = point.z;
          positionAttr.setXYZ(i, point.x, point.y, point.z);
        }
        positionAttr.needsUpdate = true;

        const link = this.activeLinks.get(face);
        if (link) {
          link.basePositions = basePositions;
          link.baseEndPoint = curvePoints[curvePoints.length - 1].clone();
        }

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

  setThemeColors(vineColor, vineOpacity) {
    this.vineColor = vineColor;
    this.vineOpacity = vineOpacity;

    // Update existing active vine lines
    for (const [, link] of this.activeLinks) {
      if (!link.isDimmed) {
        link.line.material.color.setHex(vineColor);
        link.line.material.opacity = vineOpacity;
      }
    }
  }

  /**
   * Dim all vines except the active face — used during portal transition.
   * Returns a GSAP timeline for sequencing.
   */
  dimAllExcept(activeFace) {
    const tl = gsap.timeline();
    for (const [face, link] of this.activeLinks) {
      if (face === activeFace) continue;
      link.isDimmed = true;
      tl.to(link.line.material, { opacity: 0.15, duration: 0.4, ease: 'power2.out' }, 0);
      tl.to(link.button, { opacity: 0.15, pointerEvents: 'none', duration: 0.4, ease: 'power2.out' }, 0);
    }
    return tl;
  }

  /**
   * Restore all dimmed vines to full opacity and re-enable pointer events.
   * Returns a GSAP timeline for sequencing.
   */
  restoreAll() {
    const tl = gsap.timeline();
    for (const [, link] of this.activeLinks) {
      if (!link.isDimmed) continue;
      link.isDimmed = false;
      tl.to(link.line.material, { opacity: this.vineOpacity, duration: 0.4, ease: 'power2.out' }, 0);
      tl.to(link.button, { opacity: 1, pointerEvents: 'auto', duration: 0.4, ease: 'power2.out' }, 0);
    }
    return tl;
  }

  /**
   * Bridge the active vine toward the content panel edge.
   * Hides the button and morphs the line to a new endpoint.
   * @param {string} face - the face whose vine to bridge
   * @param {gsap.core.Timeline} tl - parent timeline to add tweens to
   * @param {number} panelEdgeScreenX - screen-space X ratio (0-1) of the panel edge (e.g. 0.4)
   */
  bridgeVineTo(face, tl, panelEdgeScreenX) {
    const link = this.activeLinks.get(face);
    if (!link || !link.basePositions) return;

    // Hide the button
    tl.to(link.button, { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0);

    // Compute bridge endpoint: unproject the panel edge screen position to 3D
    const bridgeEnd = this._computeBridgeEndpoint(link, panelEdgeScreenX);
    link.bridgeEndPoint = bridgeEnd;

    // Compute bridge curve points (start → mid → bridgeEnd)
    const bridgeMid = link.faceCenter.clone()
      .add(bridgeEnd.clone().sub(link.faceCenter).multiplyScalar(0.5))
      .add(link.faceNormal.clone().multiplyScalar(0.5));
    link.bridgeCurvePoints = [link.faceCenter.clone(), bridgeMid, bridgeEnd];

    // Cache original base positions so we can lerp between them
    link.originalBasePositions = new Float32Array(link.basePositions);
    link.isBridged = false;

    // Animate the morphing from original curve to bridge curve
    const morphState = { t: 0 };
    tl.to(morphState, {
      t: 1,
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        this._lerpVinePositions(link, morphState.t);
      },
      onComplete: () => {
        link.isBridged = true;
      }
    }, 0);
  }

  /**
   * Reverse the vine bridge — morph back to original curve and restore button.
   * @param {string} face - the face whose vine to unbridge
   * @returns {gsap.core.Timeline}
   */
  unbridgeVine(face) {
    const link = this.activeLinks.get(face);
    const tl = gsap.timeline();
    if (!link || !link.isBridged) return tl;

    link.isBridged = false;

    const morphState = { t: 1 };
    tl.to(morphState, {
      t: 0,
      duration: 0.6,
      ease: 'power2.inOut',
      onUpdate: () => {
        this._lerpVinePositions(link, morphState.t);
      },
      onComplete: () => {
        // Restore base positions to originals
        link.basePositions.set(link.originalBasePositions);
        link.baseEndPoint = link.curvePoints[link.curvePoints.length - 1].clone();
        link.bridgeCurvePoints = null;
        link.bridgeEndPoint = null;
        link.originalBasePositions = null;
      }
    }, 0);

    // Restore button
    tl.to(link.button, { opacity: 1, duration: 0.4, ease: 'back.out(1.7)' }, 0.3);

    return tl;
  }

  /** Compute a 3D point at the panel edge by unprojecting a screen position. */
  _computeBridgeEndpoint(link, panelEdgeScreenX) {
    // Screen X in NDC: panelEdgeScreenX maps 0-1 → -1 to +1
    const ndcX = panelEdgeScreenX * 2 - 1;
    const ndcY = 0; // center vertically

    // Unproject at the same depth as the face center
    const faceNDC = link.faceCenter.clone().project(this.camera);
    const depth = faceNDC.z;

    const target = new THREE.Vector3(ndcX, ndcY, depth).unproject(this.camera);
    return target;
  }

  /** Lerp all vine segment positions between original and bridge curves. */
  _lerpVinePositions(link, t) {
    const posArray = link.line.geometry.attributes.position.array;
    const segCount = link.segmentCount;
    const floatOffset = this.cube.group.position.y;

    for (let i = 0; i < segCount; i++) {
      const u = i / (segCount - 1);
      // Original position from cached base
      const origIdx = i * 3;
      const ox = link.originalBasePositions[origIdx];
      const oy = link.originalBasePositions[origIdx + 1];
      const oz = link.originalBasePositions[origIdx + 2];

      // Bridge position from bridge curve
      const bp = this.getPointOnCurve(link.bridgeCurvePoints, u);

      // Lerp
      posArray[origIdx] = ox + (bp.x - ox) * t;
      posArray[origIdx + 1] = (oy + (bp.y - oy) * t) + floatOffset;
      posArray[origIdx + 2] = oz + (bp.z - oz) * t;
    }
    link.line.geometry.attributes.position.needsUpdate = true;

    // Update endpoint for button positioning
    const lastIdx = (segCount - 1) * 3;
    link.endPoint.set(posArray[lastIdx], posArray[lastIdx + 1], posArray[lastIdx + 2]);
  }

  updateButtonPosition(link) {
    // Project 3D end point to screen coordinates
    this._projVec.copy(link.endPoint).project(this.camera);

    const x = (this._projVec.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-this._projVec.y * 0.5 + 0.5) * window.innerHeight;

    // Check if point is in front of camera
    if (this._projVec.z < 1) {
      link.button.style.left = `${x}px`;
      link.button.style.top = `${y}px`;
      link.button.style.visibility = 'visible';
    } else {
      link.button.style.visibility = 'hidden';
    }
  }

  update() {
    const floatOffset = this.cube.group.position.y;

    for (const [, link] of this.activeLinks) {
      // If vine is bridged, recompute bridge curve each frame
      // to account for cube float offset and shifted canvas
      if (link.isBridged && link.bridgeCurvePoints) {
        // Update bridge start point with float offset
        link.bridgeCurvePoints[0].copy(link.faceCenter).add(
          new THREE.Vector3(0, floatOffset, 0)
        );
        // Recompute midpoint
        link.bridgeCurvePoints[1].copy(link.faceCenter)
          .add(link.bridgeEndPoint.clone().sub(link.faceCenter).multiplyScalar(0.5))
          .add(link.faceNormal.clone().multiplyScalar(0.5));
        link.bridgeCurvePoints[1].y += floatOffset;

        const posArray = link.line.geometry.attributes.position.array;
        for (let i = 0; i < link.segmentCount; i++) {
          const t = i / (link.segmentCount - 1);
          const pt = this.getPointOnCurve(link.bridgeCurvePoints, t);
          posArray[i * 3] = pt.x;
          posArray[i * 3 + 1] = pt.y;
          posArray[i * 3 + 2] = pt.z;
        }
        link.line.geometry.attributes.position.needsUpdate = true;

        const lastIdx = (link.segmentCount - 1) * 3;
        link.endPoint.set(posArray[lastIdx], posArray[lastIdx + 1], posArray[lastIdx + 2]);
      } else if (link.basePositions) {
        // Normal mode: apply cached base positions + Y-offset
        const posArray = link.line.geometry.attributes.position.array;
        const base = link.basePositions;
        for (let i = 0, len = link.segmentCount * 3; i < len; i += 3) {
          posArray[i] = base[i];
          posArray[i + 1] = base[i + 1] + floatOffset;
          posArray[i + 2] = base[i + 2];
        }
        link.line.geometry.attributes.position.needsUpdate = true;

        link.endPoint.copy(link.baseEndPoint);
        link.endPoint.y += floatOffset;
      }

      // Update button screen position (replaces per-face RAF loops)
      this.updateButtonPosition(link);
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
