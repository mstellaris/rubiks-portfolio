import gsap from 'gsap';
import { SECTION_CONTENT } from '../utils/constants.js';

const FACE_ACCENT_COLORS = {
  right: '#ff0000',
  left: '#ff8800',
  up: '#ffffff',
  down: '#ffff00',
  front: '#00ff00',
  back: '#0066ff'
};

export class ContentPanel {
  constructor() {
    this.el = document.getElementById('content-panel');
    this.titleEl = this.el.querySelector('.content-title');
    this.accentLine = this.el.querySelector('.content-accent-line');
    this.bodyEl = this.el.querySelector('.content-body');
    this.backBtn = this.el.querySelector('.content-back-btn');
  }

  populate(face, section) {
    const key = section.name.toLowerCase();
    const content = SECTION_CONTENT[key];

    this.titleEl.textContent = section.name;
    this.accentLine.style.background = FACE_ACCENT_COLORS[face] || '#ffffff';
    this.bodyEl.innerHTML = content ? content.html : `<p>Welcome to the ${section.name} section.</p>`;
  }

  getRevealTimeline() {
    const tl = gsap.timeline();

    tl.to(this.titleEl, {
      opacity: 1,
      y: 0,
      duration: 0.4,
      ease: 'power2.out'
    }, 0);

    tl.to(this.accentLine, {
      width: '60px',
      duration: 0.5,
      ease: 'power2.out'
    }, 0.1);

    const bodyChildren = this.bodyEl.children;
    if (bodyChildren.length) {
      tl.to(bodyChildren, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.08
      }, 0.2);
    }

    tl.to(this.backBtn, {
      opacity: 1,
      y: 0,
      duration: 0.3,
      ease: 'power2.out'
    }, 0.4);

    return tl;
  }

  getExitTimeline() {
    const tl = gsap.timeline();

    tl.to(this.backBtn, { opacity: 0, y: 10, duration: 0.2, ease: 'power2.in' }, 0);

    const bodyChildren = this.bodyEl.children;
    if (bodyChildren.length) {
      tl.to(bodyChildren, { opacity: 0, y: 15, duration: 0.3, ease: 'power2.in', stagger: 0.04 }, 0);
    }

    tl.to(this.accentLine, { width: 0, duration: 0.3, ease: 'power2.in' }, 0.1);
    tl.to(this.titleEl, { opacity: 0, y: 20, duration: 0.3, ease: 'power2.in' }, 0.15);

    return tl;
  }

  resetStyles() {
    gsap.set(this.titleEl, { opacity: 0, y: 20 });
    gsap.set(this.accentLine, { width: 0 });
    gsap.set(this.backBtn, { opacity: 0, y: 10 });
    if (this.bodyEl.children.length) {
      gsap.set(this.bodyEl.children, { opacity: 0, y: 15 });
    }
  }
}
