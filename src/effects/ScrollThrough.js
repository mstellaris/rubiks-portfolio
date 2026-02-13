import * as THREE from 'three';
import gsap from 'gsap';

const SCROLL_CONTENT = {
  about: {
    title: 'About Me',
    slides: [
      'Creative developer with 5+ years crafting interactive web experiences.',
      'I bridge design and engineering — pixel-perfect yet performant.',
      'Specializing in 3D web, generative art, and animation systems.',
    ],
  },
  experience: {
    title: 'Experience',
    slides: [
      'Senior Engineer — Led teams building immersive product interfaces.',
      'Creative Developer — Shipped 15+ interactive projects across industries.',
      'Freelance — Delivered award-winning web experiences for global brands.',
    ],
  },
  projects: {
    title: 'Projects',
    slides: [
      '3D portfolio showcases with WebGL and custom shaders.',
      'Generative art tools and algorithmic visual systems.',
      'Open source libraries for creative coding on the web.',
    ],
  },
  skills: {
    title: 'Skills',
    slides: [
      'Three.js, WebGL, GLSL shaders — real-time 3D on the web.',
      'GSAP, CSS animations — fluid motion and micro-interactions.',
      'React, TypeScript, Node.js — full-stack creative applications.',
    ],
  },
  contact: {
    title: 'Contact',
    slides: [
      'Always open to exciting collaborations and creative projects.',
      'Reach out via email or connect on GitHub and LinkedIn.',
      "Let's build something extraordinary together.",
    ],
  },
  blog: {
    title: 'Blog',
    slides: [
      'Deep-dives into Three.js, shaders, and creative coding.',
      'Performance optimization tips for 3D web experiences.',
      'Tutorials, experiments, and behind-the-scenes breakdowns.',
    ],
  },
};

export class ScrollThrough {
  constructor(cube, scene, camera, orbitControls) {
    this.cube = cube;
    this.scene = scene;
    this.camera = camera;
    this.orbitControls = orbitControls;
    this.isActive = false;
    this.activeFace = null;

    this.savedCameraPos = new THREE.Vector3();
    this.savedCameraTarget = new THREE.Vector3();

    this.scrollProgress = 0;
    this.curve = null;
    this.contentPlanes = [];
    this.overlay = null;
    this.scrollHandler = null;
  }

  enter(face, section) {
    if (this.isActive) return;
    this.isActive = true;
    this.activeFace = face;

    const key = section.name.toLowerCase();
    const content = SCROLL_CONTENT[key] || { title: section.name, slides: ['Content coming soon.'] };

    // Save camera state
    this.savedCameraPos.copy(this.camera.position);
    this.savedCameraTarget.copy(this.orbitControls.target);

    // Disable orbit controls
    this.orbitControls.enabled = false;

    // Make cubies semi-transparent
    this._fadeCubies(0.15);

    // Build a path through/around the cube
    this.curve = this._buildPath(face);

    // Create floating content planes along the path
    this._createContentPlanes(content);

    // Create scroll indicator overlay
    this._createOverlay(content, section);

    // Animate camera to start of path
    const startPos = this.curve.getPointAt(0);
    const lookAt = this.curve.getPointAt(0.05);

    gsap.to(this.camera.position, {
      x: startPos.x, y: startPos.y, z: startPos.z,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.lookAt(lookAt);
      },
    });

    // Enable scroll-based progression
    this.scrollProgress = 0;
    this.scrollHandler = (e) => this._onScroll(e);
    window.addEventListener('wheel', this.scrollHandler, { passive: false });
    window.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
  }

  reverse() {
    if (!this.isActive) return;

    // Remove scroll handler
    if (this.scrollHandler) {
      window.removeEventListener('wheel', this.scrollHandler);
      this.scrollHandler = null;
    }

    // Remove overlay
    if (this.overlay) {
      gsap.to(this.overlay, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          this.overlay.remove();
          this.overlay = null;
        },
      });
    }

    // Remove content planes
    this._removeContentPlanes();

    // Restore cubies
    this._fadeCubies(1.0);

    // Fly camera back
    gsap.to(this.camera.position, {
      x: this.savedCameraPos.x,
      y: this.savedCameraPos.y,
      z: this.savedCameraPos.z,
      duration: 1.0,
      ease: 'power2.inOut',
      onComplete: () => {
        this.orbitControls.target.copy(this.savedCameraTarget);
        this.orbitControls.enabled = true;
        this.isActive = false;
        this.activeFace = null;
        this.curve = null;
      },
    });

    // Animate lookAt back to center
    const dummy = { x: this.camera.position.x, y: this.camera.position.y, z: this.camera.position.z };
    gsap.to(dummy, {
      x: this.savedCameraPos.x,
      y: this.savedCameraPos.y,
      z: this.savedCameraPos.z,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.lookAt(0, 0, 0);
      },
    });
  }

  update() {
    if (!this.isActive || !this.curve) return;

    // Update camera position along curve based on scroll progress
    const t = Math.max(0, Math.min(1, this.scrollProgress));
    const pos = this.curve.getPointAt(t);
    const lookT = Math.min(t + 0.05, 1);
    const lookAt = this.curve.getPointAt(lookT);

    this.camera.position.lerp(pos, 0.1);
    this.camera.lookAt(lookAt);

    // Fade content planes based on proximity
    this.contentPlanes.forEach((plane, i) => {
      const planeT = (i + 1) / (this.contentPlanes.length + 1);
      const dist = Math.abs(t - planeT);
      const opacity = Math.max(0, 1 - dist * 4);
      plane.material.opacity = opacity;
    });

    // Update progress bar
    if (this.overlay) {
      const bar = this.overlay.querySelector('.scroll-progress-fill');
      if (bar) bar.style.width = `${t * 100}%`;
    }
  }

  _onScroll(e) {
    e.preventDefault();
    this.scrollProgress += e.deltaY * 0.0005;
    this.scrollProgress = Math.max(0, Math.min(1, this.scrollProgress));

    // Auto-reverse when scrolled to end
    if (this.scrollProgress >= 0.99) {
      setTimeout(() => {
        if (this.isActive) this.reverse();
      }, 800);
    }
  }

  _onTouchMove(e) {
    if (!this.isActive) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (this._lastTouchY !== undefined) {
      const delta = this._lastTouchY - touch.clientY;
      this.scrollProgress += delta * 0.002;
      this.scrollProgress = Math.max(0, Math.min(1, this.scrollProgress));
    }
    this._lastTouchY = touch.clientY;
  }

  _buildPath(face) {
    const normal = this._getNormal(face);

    // Path starts outside the face, curves through/around the cube, exits the other side
    const points = [
      // Start: outside the solved face
      normal.clone().multiplyScalar(5),
      // Approach face
      normal.clone().multiplyScalar(2.5),
      // Enter cube
      normal.clone().multiplyScalar(0.5),
      // Center of cube
      new THREE.Vector3(0, 0.3, 0),
      // Exit opposite side
      normal.clone().multiplyScalar(-0.5),
      // Move away from cube
      normal.clone().multiplyScalar(-2.5),
      // Final position: above and looking down
      new THREE.Vector3(0, 4, 5),
    ];

    return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  }

  _createContentPlanes(content) {
    const slides = [content.title, ...content.slides];
    const totalSlides = slides.length;

    slides.forEach((text, i) => {
      const t = (i + 1) / (totalSlides + 1);
      const pos = this.curve.getPointAt(t);

      // Create canvas texture with text
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.fillRect(0, 0, 512, 128);

      ctx.fillStyle = i === 0 ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
      ctx.font = i === 0 ? 'bold 36px Inter, system-ui, sans-serif' : '22px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Word wrap
      const words = text.split(' ');
      let line = '';
      let lines = [];
      for (const word of words) {
        const testLine = line + word + ' ';
        if (ctx.measureText(testLine).width > 480 && line !== '') {
          lines.push(line.trim());
          line = word + ' ';
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());

      const lineHeight = i === 0 ? 40 : 28;
      const startY = 64 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((l, j) => {
        ctx.fillText(l, 256, startY + j * lineHeight);
      });

      const texture = new THREE.CanvasTexture(canvas);

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const geometry = new THREE.PlaneGeometry(4, 1);
      const plane = new THREE.Mesh(geometry, material);
      plane.position.copy(pos);

      // Billboard: always face the path direction
      const tangent = this.curve.getTangentAt(t);
      plane.lookAt(pos.clone().add(tangent));

      this.scene.add(plane);
      this.contentPlanes.push(plane);
    });
  }

  _removeContentPlanes() {
    this.contentPlanes.forEach(plane => {
      gsap.to(plane.material, {
        opacity: 0,
        duration: 0.3,
        onComplete: () => {
          this.scene.remove(plane);
          plane.geometry.dispose();
          plane.material.map.dispose();
          plane.material.dispose();
        },
      });
    });
    this.contentPlanes = [];
  }

  _fadeCubies(targetOpacity) {
    this.cube.cubies.forEach(cubie => {
      const mats = Array.isArray(cubie.mesh.material) ? cubie.mesh.material : [cubie.mesh.material];
      mats.forEach(mat => {
        mat.transparent = true;
        gsap.to(mat, { opacity: targetOpacity, duration: 0.6 });
      });
    });
  }

  _createOverlay(content, section) {
    this.overlay = document.createElement('div');
    this.overlay.className = 'scroll-overlay';

    // Progress bar
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress-bar';
    const fill = document.createElement('div');
    fill.className = 'scroll-progress-fill';
    progressBar.appendChild(fill);
    this.overlay.appendChild(progressBar);

    // Scroll hint
    const hint = document.createElement('div');
    hint.className = 'scroll-hint';
    hint.textContent = 'Scroll to explore';
    this.overlay.appendChild(hint);

    // Back button
    const backBtn = document.createElement('button');
    backBtn.className = 'scroll-back-btn';
    backBtn.textContent = '← Back';
    backBtn.addEventListener('click', () => this.reverse());
    this.overlay.appendChild(backBtn);

    document.body.appendChild(this.overlay);

    gsap.fromTo(this.overlay, { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.8 });

    // Fade out hint after a few seconds
    gsap.to(hint, { opacity: 0, duration: 0.5, delay: 3 });
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
    return normals[face] || new THREE.Vector3(0, 0, 1);
  }
}
