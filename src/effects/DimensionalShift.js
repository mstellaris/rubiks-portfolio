import * as THREE from 'three';
import gsap from 'gsap';

const SHIFT_CONTENT = {
  about: { title: 'About Me', items: ['Creative Developer with 5+ years experience', 'Passionate about interactive 3D web experiences', 'Bridging design and engineering'] },
  experience: { title: 'Experience', items: ['Senior Engineer — Led interactive product teams', 'Creative Developer — Built immersive web apps', 'Freelance — Shipped 15+ client projects'] },
  projects: { title: 'Projects', items: ['3D Experiences — Immersive WebGL showcases', 'Generative Art — Algorithmic visual systems', 'Open Source — Tools for the creative web'] },
  skills: { title: 'Skills', items: ['Three.js / WebGL / Shaders', 'GSAP / Animation Systems', 'React / TypeScript / Node.js'] },
  contact: { title: 'Contact', items: ['Email — hello@portfolio.dev', 'GitHub — @creative-dev', 'Open to collaborations and opportunities'] },
  blog: { title: 'Blog', items: ['Shader deep-dives and tutorials', 'Creative coding experiments', 'Performance tips for 3D web'] },
};

export class DimensionalShift {
  constructor(cube, scene, camera, particles) {
    this.cube = cube;
    this.scene = scene;
    this.camera = camera;
    this.particles = particles;
    this.isActive = false;
    this.overlay = null;
    this.savedCubePos = new THREE.Vector3();
    this.savedCubeScale = new THREE.Vector3();
    this.textParticles = null;
    this.activeFace = null;
  }

  enter(face, section) {
    if (this.isActive) return;
    this.isActive = true;
    this.activeFace = face;

    const key = section.name.toLowerCase();
    const content = SHIFT_CONTENT[key] || { title: section.name, items: ['Content coming soon'] };

    // Save cube state
    this.savedCubePos.copy(this.cube.group.position);
    this.savedCubeScale.copy(this.cube.group.scale);

    // Create overlay
    this._createOverlay(content, section);

    // Build master timeline
    const tl = gsap.timeline();

    // Phase 1: Cube shrinks and moves to top-left corner
    tl.to(this.cube.group.scale, {
      x: 0.3, y: 0.3, z: 0.3,
      duration: 0.8,
      ease: 'power2.inOut',
    }, 0);

    tl.to(this.cube.group.position, {
      x: -3.5, y: 2.5, z: 0,
      duration: 0.8,
      ease: 'power2.inOut',
    }, 0);

    // Phase 2: Spawn text-shaped particle field
    tl.call(() => {
      this._spawnTextParticles(content);
    }, null, 0.6);

    // Phase 3: Fade in overlay content
    tl.to(this.overlay, {
      opacity: 1,
      duration: 0.5,
      ease: 'power2.out',
    }, 0.9);

    // Stagger content items
    const items = this.overlay.querySelectorAll('.shift-item');
    tl.fromTo(items, {
      opacity: 0, y: 20,
    }, {
      opacity: 1, y: 0,
      duration: 0.4,
      stagger: 0.1,
      ease: 'power2.out',
    }, 1.0);
  }

  reverse() {
    if (!this.isActive) return;

    const tl = gsap.timeline({
      onComplete: () => {
        this.isActive = false;
        this.activeFace = null;
      }
    });

    // Fade out overlay
    tl.to(this.overlay, {
      opacity: 0,
      duration: 0.3,
      ease: 'power2.in',
      onComplete: () => {
        this.overlay.remove();
        this.overlay = null;
      }
    }, 0);

    // Remove text particles
    tl.call(() => {
      this._removeTextParticles();
    }, null, 0.2);

    // Restore cube
    tl.to(this.cube.group.scale, {
      x: this.savedCubeScale.x,
      y: this.savedCubeScale.y,
      z: this.savedCubeScale.z,
      duration: 0.8,
      ease: 'power2.inOut',
    }, 0.3);

    tl.to(this.cube.group.position, {
      x: this.savedCubePos.x,
      y: this.savedCubePos.y,
      z: this.savedCubePos.z,
      duration: 0.8,
      ease: 'power2.inOut',
    }, 0.3);
  }

  update(time) {
    if (!this.textParticles) return;

    // Gently rotate text particle field
    this.textParticles.rotation.y = Math.sin(time * 0.3) * 0.05;
    this.textParticles.rotation.x = Math.cos(time * 0.2) * 0.03;

    // Shimmer: modulate sizes
    const sizes = this.textParticles.geometry.attributes.size;
    if (sizes) {
      const arr = sizes.array;
      for (let i = 0; i < arr.length; i++) {
        arr[i] = this.textParticles.userData.baseSizes[i] *
          (0.8 + 0.4 * Math.sin(time * 2 + i * 0.5));
      }
      sizes.needsUpdate = true;
    }
  }

  _spawnTextParticles(content) {
    // Create particle positions from text rendered on canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Render title text to canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 512, 256);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 64px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(content.title, 256, 128);

    // Sample pixel positions to create 3D particle positions
    const imageData = ctx.getImageData(0, 0, 512, 256);
    const positions = [];
    const step = 3; // Sample every 3 pixels

    for (let y = 0; y < 256; y += step) {
      for (let x = 0; x < 512; x += step) {
        const idx = (y * 512 + x) * 4;
        if (imageData.data[idx] > 128) {
          // Map pixel coords to 3D space
          const px = (x / 512 - 0.5) * 8;
          const py = -(y / 256 - 0.5) * 4;
          const pz = (Math.random() - 0.5) * 0.5;
          positions.push(px, py + 0.5, pz);
        }
      }
    }

    if (positions.length === 0) return;

    const geometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(positions);
    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Random sizes for sparkle
    const baseSizes = new Float32Array(positions.length / 3);
    for (let i = 0; i < baseSizes.length; i++) {
      baseSizes[i] = 0.04 + Math.random() * 0.04;
    }
    geometry.setAttribute('size', new THREE.BufferAttribute(baseSizes.slice(), 1));

    const material = new THREE.PointsMaterial({
      color: 0x88bbff,
      size: 0.05,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.textParticles = new THREE.Points(geometry, material);
    this.textParticles.userData.baseSizes = baseSizes;
    this.scene.add(this.textParticles);

    // Animate particles appearing
    gsap.to(material, {
      opacity: 0.8,
      duration: 1.0,
      ease: 'power2.out',
    });

    // Animate from random scattered positions to text shape
    const finalPositions = posArray.slice();
    const startPositions = new Float32Array(posArray.length);
    for (let i = 0; i < startPositions.length; i += 3) {
      startPositions[i] = (Math.random() - 0.5) * 15;
      startPositions[i + 1] = (Math.random() - 0.5) * 10;
      startPositions[i + 2] = (Math.random() - 0.5) * 5;
    }

    // Set initial random positions
    geometry.attributes.position.array.set(startPositions);
    geometry.attributes.position.needsUpdate = true;

    // Morph to final text shape
    const morphState = { t: 0 };
    gsap.to(morphState, {
      t: 1,
      duration: 1.5,
      ease: 'power2.out',
      onUpdate: () => {
        const arr = geometry.attributes.position.array;
        for (let i = 0; i < arr.length; i++) {
          arr[i] = startPositions[i] + (finalPositions[i] - startPositions[i]) * morphState.t;
        }
        geometry.attributes.position.needsUpdate = true;
      }
    });
  }

  _removeTextParticles() {
    if (!this.textParticles) return;

    gsap.to(this.textParticles.material, {
      opacity: 0,
      duration: 0.5,
      onComplete: () => {
        this.scene.remove(this.textParticles);
        this.textParticles.geometry.dispose();
        this.textParticles.material.dispose();
        this.textParticles = null;
      }
    });
  }

  _createOverlay(content, section) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'dimensional-overlay';
    this.overlay.style.opacity = '0';

    const inner = document.createElement('div');
    inner.className = 'dimensional-content';

    const title = document.createElement('h2');
    title.className = 'shift-item';
    title.textContent = content.title;
    inner.appendChild(title);

    const accent = document.createElement('div');
    accent.className = 'dimensional-accent shift-item';
    inner.appendChild(accent);

    content.items.forEach(text => {
      const p = document.createElement('p');
      p.className = 'shift-item';
      p.textContent = text;
      inner.appendChild(p);
    });

    const backBtn = document.createElement('button');
    backBtn.className = 'dimensional-back shift-item';
    backBtn.textContent = '← Back to Cube';
    backBtn.addEventListener('click', () => this.reverse());
    inner.appendChild(backBtn);

    this.overlay.appendChild(inner);
    document.body.appendChild(this.overlay);
  }
}
