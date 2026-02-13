import * as THREE from 'three';
import gsap from 'gsap';

// Content items per section
const TREE_CONTENT = {
  about: [
    { label: '5+ Years', sub: 'Experience' },
    { label: '20+ Projects', sub: 'Completed' },
    { label: 'Creative Dev', sub: 'Focus Area' },
  ],
  experience: [
    { label: 'Company A', sub: 'Senior Engineer' },
    { label: 'Company B', sub: 'Creative Developer' },
    { label: '15+ Products', sub: 'Shipped' },
  ],
  projects: [
    { label: '3D Web', sub: 'Interactive Experiences' },
    { label: 'Collab Tools', sub: 'Real-time Apps' },
    { label: 'Gen Art', sub: 'Creative Coding' },
  ],
  skills: [
    { label: 'Three.js', sub: 'WebGL & 3D' },
    { label: 'GSAP', sub: 'Animation' },
    { label: 'Full Stack', sub: 'JS/Node' },
  ],
  contact: [
    { label: 'Email', sub: 'hello@portfolio.dev' },
    { label: 'GitHub', sub: '@stellar' },
    { label: "Let's Talk", sub: 'Open to work' },
  ],
  blog: [
    { label: 'Three.js Tips', sub: 'Deep Dives' },
    { label: 'Design', sub: 'Philosophy' },
    { label: 'Coming Soon', sub: 'More Posts' },
  ],
};

export class BranchTree {
  constructor(scene, camera, cube) {
    this.scene = scene;
    this.camera = camera;
    this.cube = cube;
    this.activeTrees = new Map(); // face -> { branches: [], nodes: [] }
    this._projVec = new THREE.Vector3();
  }

  grow(face, section, vineEndPoint, vineNormal) {
    this.remove(face);

    const key = section.name.toLowerCase();
    const items = TREE_CONTENT[key] || [];
    const branches = [];
    const nodes = [];

    const perpendicular = this._getPerp(vineNormal);
    const segmentCount = 30;

    items.forEach((item, i) => {
      const spread = (i - (items.length - 1) / 2) * 1.2;
      const branchEnd = vineEndPoint.clone()
        .add(vineNormal.clone().multiplyScalar(1.5 + i * 0.3))
        .add(perpendicular.clone().multiplyScalar(spread));

      const branchMid = vineEndPoint.clone()
        .add(vineNormal.clone().multiplyScalar(0.7))
        .add(perpendicular.clone().multiplyScalar(spread * 0.4));

      const curvePoints = [vineEndPoint.clone(), branchMid, branchEnd];

      // Create branch line
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(segmentCount * 3);
      for (let j = 0; j < segmentCount; j++) {
        positions[j * 3] = vineEndPoint.x;
        positions[j * 3 + 1] = vineEndPoint.y;
        positions[j * 3 + 2] = vineEndPoint.z;
      }
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const mat = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0
      });

      const line = new THREE.Line(geom, mat);
      this.scene.add(line);

      // Create HTML node
      const el = document.createElement('div');
      el.className = 'tree-node';
      el.innerHTML = `<span class="tree-node-label">${item.label}</span><span class="tree-node-sub">${item.sub}</span>`;
      el.style.opacity = '0';
      document.body.appendChild(el);

      branches.push({ line, curvePoints, segmentCount, endPoint: branchEnd.clone() });
      nodes.push({ el, endPoint: branchEnd.clone() });

      // Animate branch growth
      const delay = i * 0.25;
      gsap.to(mat, { opacity: 0.5, duration: 0.3, delay });

      const state = { progress: 0 };
      gsap.to(state, {
        progress: 1,
        duration: 0.8,
        delay,
        ease: 'power1.out',
        onUpdate: () => {
          const posAttr = geom.attributes.position;
          const visible = Math.floor(state.progress * segmentCount);
          for (let j = 0; j < segmentCount; j++) {
            const t = j / (segmentCount - 1);
            const pt = j <= visible
              ? this._bezier(curvePoints, t)
              : this._bezier(curvePoints, visible / (segmentCount - 1));
            posAttr.setXYZ(j, pt.x, pt.y, pt.z);
          }
          posAttr.needsUpdate = true;
        },
        onComplete: () => {
          gsap.to(el, { opacity: 1, duration: 0.4, ease: 'back.out(1.7)' });
        }
      });
    });

    this.activeTrees.set(face, { branches, nodes });
  }

  remove(face) {
    const tree = this.activeTrees.get(face);
    if (!tree) return;

    tree.branches.forEach(b => {
      gsap.to(b.line.material, {
        opacity: 0, duration: 0.3,
        onComplete: () => {
          this.scene.remove(b.line);
          b.line.geometry.dispose();
          b.line.material.dispose();
        }
      });
    });
    tree.nodes.forEach(n => {
      gsap.to(n.el, {
        opacity: 0, duration: 0.2,
        onComplete: () => n.el.remove()
      });
    });

    this.activeTrees.delete(face);
  }

  removeAll() {
    for (const face of this.activeTrees.keys()) {
      this.remove(face);
    }
  }

  update() {
    const floatOffset = this.cube.group.position.y;

    for (const [, tree] of this.activeTrees) {
      tree.nodes.forEach((node, i) => {
        const branch = tree.branches[i];
        this._projVec.copy(branch.endPoint);
        this._projVec.y += floatOffset;
        this._projVec.project(this.camera);

        if (this._projVec.z < 1) {
          const x = (this._projVec.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-this._projVec.y * 0.5 + 0.5) * window.innerHeight;
          node.el.style.left = `${x}px`;
          node.el.style.top = `${y}px`;
          node.el.style.visibility = 'visible';
        } else {
          node.el.style.visibility = 'hidden';
        }
      });

      // Update branch line Y offsets
      tree.branches.forEach(b => {
        const posArr = b.line.geometry.attributes.position.array;
        // Quick approach: just offset the whole line group vertically
        b.line.position.y = floatOffset;
      });
    }
  }

  _bezier(pts, t) {
    const omt = 1 - t;
    return new THREE.Vector3(
      omt * omt * pts[0].x + 2 * omt * t * pts[1].x + t * t * pts[2].x,
      omt * omt * pts[0].y + 2 * omt * t * pts[1].y + t * t * pts[2].y,
      omt * omt * pts[0].z + 2 * omt * t * pts[1].z + t * t * pts[2].z
    );
  }

  _getPerp(normal) {
    const up = Math.abs(normal.y) < 0.9
      ? new THREE.Vector3(0, 1, 0)
      : new THREE.Vector3(1, 0, 0);
    return new THREE.Vector3().crossVectors(normal, up).normalize();
  }
}
