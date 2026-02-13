import * as THREE from 'three';
import gsap from 'gsap';
import dissolveVert from '../shaders/dissolve.vert?raw';
import dissolveFrag from '../shaders/dissolve.frag?raw';

const FACE_COLORS = {
  right: new THREE.Color('#ff0000'),
  left: new THREE.Color('#ff8800'),
  up: new THREE.Color('#ffffff'),
  down: new THREE.Color('#ffff00'),
  front: new THREE.Color('#00ff00'),
  back: new THREE.Color('#0066ff')
};

const SECTION_TEXT = {
  about: { title: 'About', lead: 'Building interactive experiences at the intersection of design and engineering.', body: 'Passionate about creative development, 3D web, and pushing browser boundaries.' },
  experience: { title: 'Experience', lead: 'A journey through creative technology and software engineering.', body: 'From data visualizations to immersive 3D — driven by curiosity.' },
  projects: { title: 'Projects', lead: 'Selected work spanning web apps, creative tools, and interactive experiences.', body: 'Challenging conventional interfaces and exploring new paradigms.' },
  skills: { title: 'Skills', lead: 'Full-stack development with a focus on creative technology.', body: 'JavaScript, Three.js, WebGL, GSAP — pixel-perfect at 60fps.' },
  contact: { title: 'Contact', lead: "Let's build something extraordinary together.", body: 'The best collaborations start with a conversation.' },
  blog: { title: 'Blog', lead: 'Thoughts on creative development and 3D web.', body: 'Coming soon.' },
};

export class DissolveTransition {
  constructor(cube, scene) {
    this.cube = cube;
    this.scene = scene;
    this.isActive = false;
    this.savedMaterials = [];
    this.dissolveMaterials = [];
    this.overlayEl = null;

    this._createOverlay();
  }

  _createOverlay() {
    this.overlayEl = document.createElement('div');
    this.overlayEl.className = 'dissolve-overlay';
    this.overlayEl.innerHTML = `
      <div class="dissolve-content">
        <h1 class="dissolve-title"></h1>
        <p class="dissolve-lead"></p>
        <p class="dissolve-body"></p>
        <button class="dissolve-back ui-button">Back to Cube</button>
      </div>
    `;
    this.overlayEl.style.opacity = '0';
    this.overlayEl.style.pointerEvents = 'none';
    document.body.appendChild(this.overlayEl);

    this.overlayEl.querySelector('.dissolve-back').addEventListener('click', () => {
      this.reverse();
    });
  }

  enter(face, section) {
    if (this.isActive) return;
    this.isActive = true;

    const key = section.name.toLowerCase();
    const text = SECTION_TEXT[key] || { title: section.name, lead: '', body: '' };

    this.overlayEl.querySelector('.dissolve-title').textContent = text.title;
    this.overlayEl.querySelector('.dissolve-lead').textContent = text.lead;
    this.overlayEl.querySelector('.dissolve-body').textContent = text.body;

    // Get face center as dissolve origin
    const origin = this._getFaceCenter(face);
    const edgeColor = FACE_COLORS[face] || new THREE.Color('#ffffff');

    // Swap all cubie materials to dissolve shader
    this.savedMaterials = [];
    this.dissolveMaterials = [];

    this.cube.cubies.forEach(cubie => {
      const origMats = cubie.mesh.material;
      this.savedMaterials.push({ cubie, origMats });

      const dissolveMats = (Array.isArray(origMats) ? origMats : [origMats]).map(mat => {
        const color = mat.color ? mat.color.clone() : new THREE.Color(0x333333);
        return new THREE.ShaderMaterial({
          vertexShader: dissolveVert,
          fragmentShader: dissolveFrag,
          uniforms: {
            uProgress: { value: 0 },
            uOrigin: { value: origin },
            uColor: { value: color },
            uEdgeColor: { value: edgeColor.clone() },
            uEdgeWidth: { value: 0.3 },
          },
          transparent: true,
          side: THREE.FrontSide,
        });
      });

      this.dissolveMaterials.push(...dissolveMats);
      cubie.mesh.material = dissolveMats;
    });

    // Animate dissolve
    const state = { progress: 0 };
    gsap.to(state, {
      progress: 1,
      duration: 2.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.dissolveMaterials.forEach(m => {
          m.uniforms.uProgress.value = state.progress;
        });
      },
      onComplete: () => {
        // Show overlay content
        this.overlayEl.style.pointerEvents = 'auto';
        gsap.to(this.overlayEl, { opacity: 1, duration: 0.5 });
      }
    });
  }

  reverse() {
    if (!this.isActive) return;

    // Hide overlay
    gsap.to(this.overlayEl, {
      opacity: 0, duration: 0.3,
      onComplete: () => {
        this.overlayEl.style.pointerEvents = 'none';
      }
    });

    // Reverse dissolve
    const state = { progress: 1 };
    gsap.to(state, {
      progress: 0,
      duration: 1.5,
      ease: 'power2.inOut',
      delay: 0.2,
      onUpdate: () => {
        this.dissolveMaterials.forEach(m => {
          m.uniforms.uProgress.value = state.progress;
        });
      },
      onComplete: () => {
        // Restore original materials
        this.savedMaterials.forEach(({ cubie, origMats }) => {
          cubie.mesh.material = origMats;
        });
        this.dissolveMaterials.forEach(m => m.dispose());
        this.dissolveMaterials = [];
        this.savedMaterials = [];
        this.isActive = false;
      }
    });
  }

  _getFaceCenter(face) {
    const offset = 1.05;
    const map = {
      right: new THREE.Vector3(offset, 0, 0),
      left: new THREE.Vector3(-offset, 0, 0),
      up: new THREE.Vector3(0, offset, 0),
      down: new THREE.Vector3(0, -offset, 0),
      front: new THREE.Vector3(0, 0, offset),
      back: new THREE.Vector3(0, 0, -offset),
    };
    return map[face] || new THREE.Vector3();
  }
}
