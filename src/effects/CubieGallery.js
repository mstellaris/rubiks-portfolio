import * as THREE from 'three';
import gsap from 'gsap';

const GALLERY_CONTENT = {
  about: ['About Me', '5+ Years Experience', '20+ Projects Shipped', 'Creative Developer', 'Design + Code', '3D Web Specialist', 'Interactive Experiences', 'Always Curious', 'Building the Future'],
  experience: ['Experience', 'Senior Engineer', 'Creative Developer', 'Tech Lead', 'Freelance', '15+ Products', 'Cross-Platform', 'Mentorship', 'Full Stack'],
  projects: ['Projects', '3D Experiences', 'Collab Tools', 'Generative Art', 'Data Visualization', 'WebGL Demos', 'Portfolios', 'Browser Games', 'Open Source'],
  skills: ['Skills', 'Three.js', 'GSAP', 'WebGL / Shaders', 'React', 'Node.js', 'TypeScript', 'CSS / Animation', 'Creative Coding'],
  contact: ['Contact', 'Email Me', 'GitHub', 'LinkedIn', 'Twitter / X', 'Portfolio', "Let's Talk", 'Open to Work', 'Collaborate'],
  blog: ['Blog', 'Three.js Tips', 'Shader Tutorials', 'Animation Deep Dives', 'Design Systems', 'WebGL Perf', 'GSAP Recipes', 'Creative Coding', 'Coming Soon'],
};

export class CubieGallery {
  constructor(cube, scene, camera) {
    this.cube = cube;
    this.scene = scene;
    this.camera = camera;
    this.activeGalleries = new Map();
  }

  open(face, section) {
    if (this.activeGalleries.has(face)) return;

    const key = section.name.toLowerCase();
    const texts = GALLERY_CONTENT[key] || Array(9).fill(section.name);

    const { axis, layer } = this._faceToAxisLayer(face);
    const faceCubies = this.cube.cubies.filter(c => Math.round(c[axis]) === layer);
    const normal = this._getNormal(face);

    // Save original states
    const savedStates = faceCubies.map(cubie => ({
      cubie,
      position: cubie.mesh.position.clone(),
      rotation: cubie.mesh.rotation.clone(),
      materials: cubie.mesh.material.map ? cubie.mesh.material.map(m => m) : [cubie.mesh.material],
    }));

    // Sort into 3x3 grid order
    const sorted = this._sortGrid(faceCubies, axis);

    // Constellation positions — spread in a loose ring around the face
    const constellationTargets = this._generateConstellation(sorted, normal, face, axis);
    const cardTextures = [];

    const tl = gsap.timeline();

    sorted.forEach((cubie, i) => {
      const target = constellationTargets[i];

      // Animate to constellation position
      tl.to(cubie.mesh.position, {
        x: target.x,
        y: target.y,
        z: target.z,
        duration: 1.0,
        ease: 'back.out(1.2)',
      }, 0.05 + i * 0.06);

      // Rotate to face outward
      const targetRot = this._getTargetRotation(face);
      tl.to(cubie.mesh.rotation, {
        x: targetRot.x,
        y: targetRot.y,
        z: targetRot.z,
        duration: 1.0,
        ease: 'power2.out',
      }, 0.05 + i * 0.06);

      // Apply card texture after movement
      const cardCanvas = this._createCardCanvas(texts[i], i === 0);
      const cardTexture = new THREE.CanvasTexture(cardCanvas);
      cardTextures.push(cardTexture);

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
      }, null, 0.9 + i * 0.06);
    });

    this.activeGalleries.set(face, {
      savedStates,
      cardTextures,
      sorted,
      constellationTargets,
      orbitTime: 0,
      face,
    });
  }

  close(face) {
    const gallery = this.activeGalleries.get(face);
    if (!gallery) return;

    const tl = gsap.timeline({
      onComplete: () => {
        gallery.cardTextures.forEach(t => t.dispose());
        this.activeGalleries.delete(face);
      }
    });

    gallery.savedStates.forEach(({ cubie, position, rotation, materials }, i) => {
      cubie.mesh.material = materials;

      tl.to(cubie.mesh.position, {
        x: position.x, y: position.y, z: position.z,
        duration: 0.7, ease: 'power2.inOut',
      }, i * 0.04);

      tl.to(cubie.mesh.rotation, {
        x: rotation.x, y: rotation.y, z: rotation.z,
        duration: 0.7, ease: 'power2.inOut',
      }, i * 0.04);
    });
  }

  closeAll() {
    for (const face of this.activeGalleries.keys()) {
      this.close(face);
    }
  }

  update(time) {
    for (const [, gallery] of this.activeGalleries) {
      gallery.orbitTime += 0.002;
      const t = gallery.orbitTime;

      gallery.sorted.forEach((cubie, i) => {
        const target = gallery.constellationTargets[i];
        const orbitRadius = 0.08;
        const phase = (i / 9) * Math.PI * 2;
        cubie.mesh.position.x = target.x + Math.sin(t + phase) * orbitRadius;
        cubie.mesh.position.y = target.y + Math.cos(t * 0.7 + phase) * orbitRadius * 0.6;
        cubie.mesh.position.z = target.z + Math.cos(t + phase) * orbitRadius;
      });
    }
  }

  _generateConstellation(sorted, normal, face, axis) {
    const { hAxis, vAxis } = this._getGridAxes(axis);
    const positions = [];

    sorted.forEach((cubie, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;

      const base = normal.clone().multiplyScalar(3.5);

      // Irregular spacing for constellation feel
      const spacingH = 1.8 + (Math.sin(i * 1.7) * 0.3);
      const spacingV = 1.8 + (Math.cos(i * 2.3) * 0.3);

      const pos = base.clone();
      pos[hAxis] += (col - 1) * spacingH;
      pos[vAxis] += (1 - row) * spacingV;

      // Slight offset for organic feel
      pos[hAxis] += Math.sin(i * 3.14) * 0.2;
      pos[vAxis] += Math.cos(i * 2.71) * 0.2;

      positions.push(pos);
    });

    return positions;
  }

  _createCardCanvas(text, isTitle) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Background with subtle gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(25, 28, 38, 0.92)');
    grad.addColorStop(1, 'rgba(35, 38, 50, 0.92)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Accent line at top
    ctx.fillStyle = isTitle ? 'rgba(100, 180, 255, 0.8)' : 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(20, 20, isTitle ? 216 : 60, 2);

    // Text
    ctx.fillStyle = isTitle ? '#ffffff' : 'rgba(255, 255, 255, 0.85)';
    ctx.font = isTitle ? 'bold 28px Inter, system-ui, sans-serif' : '22px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 128);

    // Subtle border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(8, 8, 240, 240);

    return canvas;
  }

  _sortGrid(cubies, axis) {
    const { hAxis, vAxis } = this._getGridAxes(axis);
    return [...cubies].sort((a, b) => {
      const rowDiff = b[vAxis] - a[vAxis];
      if (Math.abs(rowDiff) > 0.5) return rowDiff;
      return a[hAxis] - b[hAxis];
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
