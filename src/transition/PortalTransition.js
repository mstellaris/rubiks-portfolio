import * as THREE from 'three';
import gsap from 'gsap';

const MOBILE_BREAKPOINT = 768;

export class PortalTransition {
  constructor({ camera, canvas, renderer, composer, cube, faceLink, contentPanel, viewState, orbitControls }) {
    this.camera = camera;
    this.canvas = canvas;
    this.renderer = renderer;
    this.composer = composer;
    this.cube = cube;
    this.faceLink = faceLink;
    this.contentPanel = contentPanel;
    this.viewState = viewState;
    this.orbitControls = orbitControls;

    this.panelEl = contentPanel.el;

    // Saved state for reversal
    this.savedCameraPos = new THREE.Vector3();
    this.savedCameraTarget = new THREE.Vector3();
    this.clonedMaterials = []; // { cubie, origMaterials }
    this.activeFace = null;
    this.masterTl = null;
  }

  enter(face, section) {
    if (this.viewState.current !== 'cube') return;

    this.viewState.set('transitioning', face);
    this.activeFace = face;
    this.orbitControls.enabled = false;

    // Save camera state
    this.savedCameraPos.copy(this.camera.position);
    this.savedCameraTarget.copy(this.orbitControls.target);

    // Populate content panel
    this.contentPanel.populate(face, section);
    this.contentPanel.resetStyles();

    // Build master timeline
    const tl = gsap.timeline({
      onComplete: () => {
        this.viewState.set('content', face);
        this.panelEl.classList.add('active');
      }
    });

    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;

    // Phase 1: Camera fly toward face
    const cameraTarget = this.computeCameraTarget(face);
    tl.to(this.camera.position, {
      x: cameraTarget.x,
      y: cameraTarget.y,
      z: cameraTarget.z,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.lookAt(this.cube.group.position);
      }
    }, 'flyStart');

    // Phase 2: Fade face cubies to transparent
    this.fadeFaceCubies(face, tl, 'flyStart+=0.4');

    // Phase 3: Dim non-active vines
    const dimTl = this.faceLink.dimAllExcept(face);
    tl.add(dimTl, 'flyStart+=0.8');

    // Phase 4: Split screen
    if (isMobile) {
      this.addMobileSplit(tl, 'flyStart+=0.8');
    } else {
      this.addDesktopSplit(tl, 'flyStart+=0.8');

      // Phase 5: Bridge vine to panel edge (desktop only)
      this.faceLink.bridgeVineTo(face, tl, 0.4);
    }

    // Phase 6: Reveal content
    const revealTl = this.contentPanel.getRevealTimeline();
    tl.add(revealTl, isMobile ? 'flyStart+=1.2' : 'flyStart+=1.6');

    this.masterTl = tl;
  }

  reverse() {
    if (this.viewState.current !== 'content') return;

    this.viewState.set('transitioning', this.activeFace);
    this.panelEl.classList.remove('active');

    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    const face = this.activeFace;

    const tl = gsap.timeline({
      onComplete: () => {
        this.cleanup();
        this.viewState.set('cube');
        this.orbitControls.enabled = true;
      }
    });

    // Phase 1: Exit content
    const exitTl = this.contentPanel.getExitTimeline();
    tl.add(exitTl, 0);

    // Phase 2: Unsplit screen + unbridge vine
    if (isMobile) {
      this.addMobileUnsplit(tl, 0.4);
    } else {
      this.addDesktopUnsplit(tl, 0.4);
      const unbridgeTl = this.faceLink.unbridgeVine(face);
      tl.add(unbridgeTl, 0.4);
    }

    // Phase 3: Restore vine opacities
    const restoreTl = this.faceLink.restoreAll();
    tl.add(restoreTl, 0.6);

    // Phase 4: Restore cubie materials
    this.restoreFaceCubies(tl, 0.8);

    // Phase 5: Camera return
    tl.to(this.camera.position, {
      x: this.savedCameraPos.x,
      y: this.savedCameraPos.y,
      z: this.savedCameraPos.z,
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.lookAt(this.cube.group.position);
      }
    }, 1.0);

    this.masterTl = tl;
  }

  computeCameraTarget(face) {
    const faceNormals = {
      right: new THREE.Vector3(1, 0, 0),
      left: new THREE.Vector3(-1, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      down: new THREE.Vector3(0, -1, 0),
      front: new THREE.Vector3(0, 0, 1),
      back: new THREE.Vector3(0, 0, -1)
    };

    const normal = faceNormals[face];
    const target = normal.clone().multiplyScalar(3.5);
    // Slight upward offset for visual comfort
    target.y += 0.5;
    return target;
  }

  fadeFaceCubies(face, tl, position) {
    const axisFaceMap = {
      right: { axis: 'x', layer: 1 },
      left: { axis: 'x', layer: -1 },
      up: { axis: 'y', layer: 1 },
      down: { axis: 'y', layer: -1 },
      front: { axis: 'z', layer: 1 },
      back: { axis: 'z', layer: -1 }
    };

    const { axis, layer } = axisFaceMap[face];
    const faceCubies = this.cube.getCubiesOnLayer(axis, layer);

    this.clonedMaterials = [];

    // Sort cubies center-out for stagger effect
    const sorted = [...faceCubies].sort((a, b) => {
      const aDist = Math.abs(a.x) + Math.abs(a.y) + Math.abs(a.z);
      const bDist = Math.abs(b.x) + Math.abs(b.y) + Math.abs(b.z);
      return aDist - bDist;
    });

    sorted.forEach((cubie, i) => {
      // Clone the materials array so we can make them transparent
      const origMaterials = cubie.mesh.material;
      const clones = Array.isArray(origMaterials)
        ? origMaterials.map(m => m.clone())
        : [origMaterials.clone()];

      clones.forEach(m => {
        m.transparent = true;
        m.opacity = 1;
      });

      cubie.mesh.material = clones;

      this.clonedMaterials.push({ cubie, origMaterials });

      // Stagger fade based on center-out order
      const delay = i * 0.04;
      clones.forEach(m => {
        tl.to(m, { opacity: 0, duration: 0.6, ease: 'power2.in' }, `${position}+=${delay}`);
      });
    });
  }

  restoreFaceCubies(tl, position) {
    this.clonedMaterials.forEach(({ cubie, origMaterials }, i) => {
      const clones = Array.isArray(cubie.mesh.material)
        ? cubie.mesh.material
        : [cubie.mesh.material];

      const delay = i * 0.03;
      clones.forEach(m => {
        tl.to(m, {
          opacity: 1,
          duration: 0.5,
          ease: 'power2.out',
          onComplete: () => {
            // Swap back to original material and dispose clones
            cubie.mesh.material = origMaterials;
            clones.forEach(c => c.dispose());
          }
        }, position + delay);
      });
    });
  }

  addDesktopSplit(tl, position) {
    // Animate canvas to 40vw, slide panel in from right
    tl.to(this.canvas, {
      width: '40vw',
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        this._updateRendererSize();
      }
    }, position);

    tl.to(this.panelEl, {
      x: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power2.inOut'
    }, position);
  }

  addDesktopUnsplit(tl, position) {
    tl.to(this.panelEl, {
      x: '100%',
      opacity: 0,
      duration: 0.8,
      ease: 'power2.inOut'
    }, position);

    tl.to(this.canvas, {
      width: '100vw',
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => {
        this._updateRendererSize();
      }
    }, position);
  }

  addMobileSplit(tl, position) {
    // On mobile, panel covers full screen
    tl.to(this.panelEl, {
      x: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power2.inOut'
    }, position);
  }

  addMobileUnsplit(tl, position) {
    tl.to(this.panelEl, {
      x: '100%',
      opacity: 0,
      duration: 0.8,
      ease: 'power2.inOut'
    }, position);
  }

  _updateRendererSize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    if (this.composer) this.composer.setSize(w, h);
  }

  cleanup() {
    // Dispose any remaining cloned materials
    this.clonedMaterials.forEach(({ cubie, origMaterials }) => {
      const current = cubie.mesh.material;
      if (current !== origMaterials) {
        cubie.mesh.material = origMaterials;
        const clones = Array.isArray(current) ? current : [current];
        clones.forEach(c => c.dispose());
      }
    });
    this.clonedMaterials = [];

    // Reset panel transform
    gsap.set(this.panelEl, { x: '100%', opacity: 0 });
    this.panelEl.classList.remove('active');

    // Reset canvas width
    this.canvas.style.width = '100vw';
    this._updateRendererSize();

    this.activeFace = null;
    this.masterTl = null;
  }
}
