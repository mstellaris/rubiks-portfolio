import * as THREE from 'three';
import gsap from 'gsap';
import hologramVert from '../shaders/hologram.vert?raw';
import hologramFrag from '../shaders/hologram.frag?raw';

const SECTION_TEXT = {
  about: ['About Me', '5+ Years', '20+ Projects', 'Creative Developer'],
  experience: ['Experience', 'Senior Engineer', '15+ Products', 'Full Stack'],
  projects: ['Projects', '3D Interactive', 'Collab Tools', 'Generative Art'],
  skills: ['Skills', 'Three.js / WebGL', 'GSAP Animation', 'Node.js'],
  contact: ['Contact', 'hello@portfolio.dev', 'GitHub: @stellar', 'Open to work'],
  blog: ['Blog', 'Three.js Deep Dives', 'Design Philosophy', 'Coming Soon'],
};

const FACE_TINTS = {
  right: new THREE.Color(1.0, 0.3, 0.3),
  left: new THREE.Color(1.0, 0.6, 0.2),
  up: new THREE.Color(0.9, 0.9, 1.0),
  down: new THREE.Color(1.0, 1.0, 0.3),
  front: new THREE.Color(0.3, 1.0, 0.3),
  back: new THREE.Color(0.3, 0.5, 1.0),
};

export class HologramProjection {
  constructor(scene, camera, cube) {
    this.scene = scene;
    this.camera = camera;
    this.cube = cube;
    this.activeProjections = new Map();
    this.time = 0;
  }

  project(face, section) {
    if (this.activeProjections.has(face)) return;

    const key = section.name.toLowerCase();
    const texts = SECTION_TEXT[key] || [section.name];
    const tint = FACE_TINTS[face] || new THREE.Color(1, 1, 1);

    const normal = this._getNormal(face);
    const center = this._getCenter(face);
    const perp = this._getPerp(normal);

    const panels = [];

    texts.forEach((text, i) => {
      // Create canvas texture for each panel
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      ctx.clearRect(0, 0, 512, 128);
      ctx.fillStyle = i === 0 ? '#ffffff' : 'rgba(255,255,255,0.85)';
      ctx.font = i === 0 ? 'bold 44px Inter, sans-serif' : '30px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 256, 64);

      // Draw border frame
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, 492, 108);

      const texture = new THREE.CanvasTexture(canvas);

      const material = new THREE.ShaderMaterial({
        vertexShader: hologramVert,
        fragmentShader: hologramFrag,
        uniforms: {
          uTexture: { value: texture },
          uTime: { value: 0 },
          uOpacity: { value: 0 },
          uTint: { value: tint },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const geometry = new THREE.PlaneGeometry(2.0, 0.5);
      const mesh = new THREE.Mesh(geometry, material);

      // Position panels floating near the face
      const offset = 2.0 + i * 0.15;
      const spread = (i - (texts.length - 1) / 2) * 0.65;

      mesh.position.copy(center)
        .add(normal.clone().multiplyScalar(offset))
        .add(perp.clone().multiplyScalar(spread * 0.3));

      // Apply vertical spread
      mesh.position.y += spread;

      // Face the camera (billboard-ish but fixed orientation)
      mesh.lookAt(this.camera.position);

      mesh.userData.baseY = mesh.position.y;
      mesh.userData.bobOffset = i * 1.5;

      this.scene.add(mesh);
      panels.push({ mesh, material, texture, canvas });

      // Stagger appearance
      gsap.to(material.uniforms.uOpacity, {
        value: 0.9,
        duration: 0.6,
        delay: 0.2 + i * 0.15,
        ease: 'power2.out'
      });
    });

    this.activeProjections.set(face, { panels });
  }

  dismiss(face) {
    const proj = this.activeProjections.get(face);
    if (!proj) return;

    proj.panels.forEach((panel, i) => {
      gsap.to(panel.material.uniforms.uOpacity, {
        value: 0,
        duration: 0.3,
        delay: i * 0.05,
        onComplete: () => {
          this.scene.remove(panel.mesh);
          panel.material.dispose();
          panel.mesh.geometry.dispose();
          panel.texture.dispose();
        }
      });
    });

    this.activeProjections.delete(face);
  }

  dismissAll() {
    for (const face of this.activeProjections.keys()) {
      this.dismiss(face);
    }
  }

  update(time) {
    this.time = time;
    const floatOffset = this.cube.group.position.y;

    for (const [, proj] of this.activeProjections) {
      proj.panels.forEach(panel => {
        // Update time uniform for scanlines/flicker
        panel.material.uniforms.uTime.value = time;

        // Gentle bobbing
        const bob = Math.sin(time * 1.5 + panel.mesh.userData.bobOffset) * 0.03;
        panel.mesh.position.y = panel.mesh.userData.baseY + bob + floatOffset;

        // Face the camera
        panel.mesh.lookAt(this.camera.position);
      });
    }
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

  _getCenter(face) {
    const offset = 1.6;
    const centers = {
      right: new THREE.Vector3(offset, 0, 0),
      left: new THREE.Vector3(-offset, 0, 0),
      up: new THREE.Vector3(0, offset, 0),
      down: new THREE.Vector3(0, -offset, 0),
      front: new THREE.Vector3(0, 0, offset),
      back: new THREE.Vector3(0, 0, -offset),
    };
    return centers[face];
  }

  _getPerp(normal) {
    const up = Math.abs(normal.y) < 0.9
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
    return new THREE.Vector3().crossVectors(normal, up).normalize();
  }
}
