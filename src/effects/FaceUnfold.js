import * as THREE from 'three';
import gsap from 'gsap';

const CARD_CONTENT = {
  about: ['About Me', '5+ Years', '20+ Projects', 'Creative Dev', 'Design + Code', '3D Web', 'Interactive', 'Curious', 'Building'],
  experience: ['Experience', 'Company A', 'Company B', 'Freelance', '15+ Products', 'Senior Eng', 'Creative Dev', 'Lead', 'Mentor'],
  projects: ['Projects', '3D Experiences', 'Collab Tools', 'Gen Art', 'Data Viz', 'WebGL', 'Portfolios', 'Games', 'Open Source'],
  skills: ['Skills', 'Three.js', 'GSAP', 'WebGL', 'React', 'Node.js', 'TypeScript', 'Shaders', 'CSS'],
  contact: ['Contact', 'Email', 'GitHub', 'LinkedIn', 'Twitter', 'Portfolio', "Let's Talk", 'Hire Me', 'Collab'],
  blog: ['Blog', 'Three.js Tips', 'Shaders 101', 'Animation', 'Design', 'WebGL', 'GSAP Deep', 'Performance', 'Coming Soon'],
};

export class FaceUnfold {
  constructor(cube, scene, camera) {
    this.cube = cube;
    this.scene = scene;
    this.camera = camera;
    this.activeUnfolds = new Map();
  }

  unfold(face, section) {
    if (this.activeUnfolds.has(face)) return;

    const key = section.name.toLowerCase();
    const texts = CARD_CONTENT[key] || Array(9).fill(section.name);

    const { axis, layer } = this._faceToAxisLayer(face);
    const faceCubies = this.cube.cubies.filter(c => Math.round(c[axis]) === layer);
    const normal = this._getNormal(face);

    // Save cubie states
    const savedStates = faceCubies.map(cubie => ({
      cubie,
      position: cubie.mesh.position.clone(),
      rotation: cubie.mesh.rotation.clone(),
      materials: cubie.mesh.material,
    }));

    // Sort cubies into 3x3 grid order
    const sorted = this._sortGrid(faceCubies, axis);

    // Create canvas textures for cards
    const cardTextures = [];

    const tl = gsap.timeline();

    sorted.forEach((cubie, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;

      // Target grid position: spread out in front of the face
      const gridSpacing = 1.5;
      const gridCenter = normal.clone().multiplyScalar(layer * 1.05 + 3.0);

      // Determine the 2D grid axes based on face
      const { hAxis, vAxis } = this._getGridAxes(axis);
      const targetPos = gridCenter.clone();
      targetPos[hAxis] += (col - 1) * gridSpacing;
      targetPos[vAxis] += (1 - row) * gridSpacing;

      // Animate position
      tl.to(cubie.mesh.position, {
        x: targetPos.x,
        y: targetPos.y,
        z: targetPos.z,
        duration: 0.8,
        ease: 'back.out(1.5)',
      }, 0.1 + i * 0.04);

      // Flatten rotation to face camera-ish direction
      const targetRot = this._getTargetRotation(face);
      tl.to(cubie.mesh.rotation, {
        x: targetRot.x,
        y: targetRot.y,
        z: targetRot.z,
        duration: 0.8,
        ease: 'power2.out',
      }, 0.1 + i * 0.04);

      // After movement, add card texture to the outward face
      const cardCanvas = this._createCardCanvas(texts[i], i === 0);
      const cardTexture = new THREE.CanvasTexture(cardCanvas);
      cardTextures.push(cardTexture);

      // Swap the outward face material after animation
      tl.call(() => {
        const faceIdx = this._faceIndex(face);
        const mats = Array.isArray(cubie.mesh.material)
          ? [...cubie.mesh.material]
          : [cubie.mesh.material];

        mats[faceIdx] = new THREE.MeshBasicMaterial({
          map: cardTexture,
          transparent: true,
        });
        cubie.mesh.material = mats;
      }, null, 0.8 + i * 0.04);
    });

    this.activeUnfolds.set(face, { savedStates, cardTextures, sorted });
  }

  fold(face) {
    const unfold = this.activeUnfolds.get(face);
    if (!unfold) return;

    const tl = gsap.timeline({
      onComplete: () => {
        this.activeUnfolds.delete(face);
      }
    });

    unfold.savedStates.forEach(({ cubie, position, rotation, materials }, i) => {
      // Restore material first
      cubie.mesh.material = materials;

      tl.to(cubie.mesh.position, {
        x: position.x, y: position.y, z: position.z,
        duration: 0.6, ease: 'power2.inOut',
      }, i * 0.03);

      tl.to(cubie.mesh.rotation, {
        x: rotation.x, y: rotation.y, z: rotation.z,
        duration: 0.6, ease: 'power2.inOut',
      }, i * 0.03);
    });

    // Cleanup textures
    tl.call(() => {
      unfold.cardTextures.forEach(t => t.dispose());
    });
  }

  foldAll() {
    for (const face of this.activeUnfolds.keys()) {
      this.fold(face);
    }
  }

  _createCardCanvas(text, isTitle) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = 'rgba(30, 30, 40, 0.9)';
    ctx.fillRect(0, 0, 256, 256);

    // Border
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, 248, 248);

    // Text
    ctx.fillStyle = isTitle ? '#ffffff' : 'rgba(255,255,255,0.85)';
    ctx.font = isTitle ? 'bold 32px Inter, sans-serif' : '24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 128);

    return canvas;
  }

  _sortGrid(cubies, axis) {
    const { hAxis, vAxis } = this._getGridAxes(axis);
    return [...cubies].sort((a, b) => {
      const rowDiff = b[vAxis] - a[vAxis]; // top-to-bottom
      if (Math.abs(rowDiff) > 0.5) return rowDiff;
      return a[hAxis] - b[hAxis]; // left-to-right
    });
  }

  _getGridAxes(axis) {
    if (axis === 'x') return { hAxis: 'z', vAxis: 'y' };
    if (axis === 'y') return { hAxis: 'x', vAxis: 'z' };
    return { hAxis: 'x', vAxis: 'y' };
  }

  _getTargetRotation(face) {
    const rotations = {
      right: { x: 0, y: Math.PI / 2, z: 0 },
      left: { x: 0, y: -Math.PI / 2, z: 0 },
      up: { x: -Math.PI / 2, y: 0, z: 0 },
      down: { x: Math.PI / 2, y: 0, z: 0 },
      front: { x: 0, y: 0, z: 0 },
      back: { x: 0, y: Math.PI, z: 0 },
    };
    return rotations[face] || { x: 0, y: 0, z: 0 };
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
    const map = { right: 0, left: 1, up: 2, down: 3, front: 4, back: 5 };
    return map[face];
  }

  _getNormal(face) {
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
