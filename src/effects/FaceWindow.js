import * as THREE from 'three';
import gsap from 'gsap';

const SECTION_TEXT = {
  about: ['About', '5+ Years Experience', '20+ Projects', 'Creative Dev'],
  experience: ['Experience', '3 Companies', '15+ Products', 'Full Stack'],
  projects: ['Projects', '3D Web', 'Collab Tools', 'Gen Art'],
  skills: ['Skills', 'Three.js', 'GSAP', 'WebGL'],
  contact: ['Contact', 'Email', 'GitHub', "Let's Talk"],
  blog: ['Blog', 'Three.js Tips', 'Design', 'Coming Soon'],
};

const FACE_COLORS = {
  right: 0xff0000,
  left: 0xff8800,
  up: 0xffffff,
  down: 0xffff00,
  front: 0x00ff00,
  back: 0x0066ff,
};

export class FaceWindow {
  constructor(cube, scene, camera) {
    this.cube = cube;
    this.scene = scene;
    this.camera = camera;
    this.activeWindows = new Map(); // face -> { glassMats, contentGroup, savedMats }
  }

  activate(face, section) {
    if (this.activeWindows.has(face)) return;

    const key = section.name.toLowerCase();
    const texts = SECTION_TEXT[key] || [section.name];
    const color = FACE_COLORS[face] || 0xffffff;

    // Find face cubies
    const { axis, layer } = this._faceToAxisLayer(face);
    const faceCubies = this.cube.cubies.filter(c => Math.round(c[axis]) === layer);

    // Swap face materials to glass
    const savedMats = [];
    const glassMats = [];

    faceCubies.forEach(cubie => {
      const origMats = cubie.mesh.material;
      savedMats.push({ cubie, origMats });

      const newMats = (Array.isArray(origMats) ? origMats : [origMats]).map((mat, idx) => {
        // Only make the outward face transparent
        const faceIdx = this._faceIndex(face);
        if (idx === faceIdx) {
          const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 0.9,
            roughness: 0.1,
            metalness: 0,
            ior: 1.5,
            thickness: 0.5,
            transparent: true,
            opacity: 0.3,
          });
          glassMats.push(glassMat);
          return glassMat;
        }
        return mat;
      });

      cubie.mesh.material = newMats;
    });

    // Create content planes inside the cube
    const contentGroup = new THREE.Group();
    const normal = this._getFaceNormal(face);
    const center = new THREE.Vector3();

    // Create 3 depth layers with text
    texts.forEach((text, i) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = 'transparent';
      ctx.clearRect(0, 0, 512, 128);
      ctx.fillStyle = i === 0 ? '#ffffff' : 'rgba(255,255,255,0.7)';
      ctx.font = i === 0 ? 'bold 48px Inter, sans-serif' : '32px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 64);

      const texture = new THREE.CanvasTexture(canvas);
      const planeGeom = new THREE.PlaneGeometry(1.8, 0.5);
      const planeMat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const plane = new THREE.Mesh(planeGeom, planeMat);

      // Position at different depths along the face normal
      const depth = -0.3 - i * 0.4;
      const verticalOffset = (i - texts.length / 2) * 0.55;

      plane.position.copy(center)
        .add(normal.clone().multiplyScalar(layer * 1.05 + depth));

      // Offset vertically/horizontally based on face orientation
      if (axis === 'x') {
        plane.position.y += verticalOffset;
        plane.rotation.y = layer > 0 ? -Math.PI / 2 : Math.PI / 2;
      } else if (axis === 'y') {
        plane.position.z += verticalOffset;
        plane.rotation.x = layer > 0 ? Math.PI / 2 : -Math.PI / 2;
      } else {
        plane.position.y += verticalOffset;
        plane.rotation.y = layer > 0 ? 0 : Math.PI;
      }

      plane.userData.basePosition = plane.position.clone();
      plane.userData.depthLayer = i;

      contentGroup.add(plane);

      // Animate plane opacity in
      gsap.to(planeMat, { opacity: 1, duration: 0.5, delay: 0.3 + i * 0.15 });
    });

    this.scene.add(contentGroup);
    this.activeWindows.set(face, { glassMats, contentGroup, savedMats });
  }

  deactivate(face) {
    const win = this.activeWindows.get(face);
    if (!win) return;

    // Fade out content
    win.contentGroup.children.forEach((plane, i) => {
      gsap.to(plane.material, {
        opacity: 0, duration: 0.3, delay: i * 0.05,
        onComplete: () => {
          plane.material.map?.dispose();
          plane.material.dispose();
          plane.geometry.dispose();
        }
      });
    });

    setTimeout(() => {
      this.scene.remove(win.contentGroup);
    }, 800);

    // Restore original materials
    win.savedMats.forEach(({ cubie, origMats }) => {
      cubie.mesh.material = origMats;
    });
    win.glassMats.forEach(m => m.dispose());

    this.activeWindows.delete(face);
  }

  deactivateAll() {
    for (const face of this.activeWindows.keys()) {
      this.deactivate(face);
    }
  }

  update() {
    // Apply parallax based on camera position
    const camPos = this.camera.position;

    for (const [, win] of this.activeWindows) {
      win.contentGroup.children.forEach(plane => {
        const base = plane.userData.basePosition;
        const depth = plane.userData.depthLayer;
        const parallaxStrength = 0.02 * (depth + 1);

        plane.position.x = base.x + camPos.x * parallaxStrength;
        plane.position.y = base.y + camPos.y * parallaxStrength;
        plane.position.z = base.z + camPos.z * parallaxStrength;
      });
    }
  }

  _faceToAxisLayer(face) {
    const map = {
      right: { axis: 'x', layer: 1 },
      left: { axis: 'x', layer: -1 },
      up: { axis: 'y', layer: 1 },
      down: { axis: 'y', layer: -1 },
      front: { axis: 'z', layer: 1 },
      back: { axis: 'z', layer: -1 },
    };
    return map[face];
  }

  _faceIndex(face) {
    // Material index: +X=0, -X=1, +Y=2, -Y=3, +Z=4, -Z=5
    const map = { right: 0, left: 1, up: 2, down: 3, front: 4, back: 5 };
    return map[face];
  }

  _getFaceNormal(face) {
    const normals = {
      right: new THREE.Vector3(1, 0, 0),
      left: new THREE.Vector3(-1, 0, 0),
      up: new THREE.Vector3(0, 1, 0),
      down: new THREE.Vector3(0, -1, 0),
      front: new THREE.Vector3(0, 0, 1),
      back: new THREE.Vector3(0, 0, -1),
    };
    return normals[face];
  }
}
