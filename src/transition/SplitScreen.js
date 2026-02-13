import gsap from 'gsap';

const MOBILE_BREAKPOINT = 768;

export class SplitScreen {
  constructor({ camera, renderer, composer, cube, faceLink, contentPanel, orbitControls }) {
    this.camera = camera;
    this.renderer = renderer;
    this.composer = composer;
    this.cube = cube;
    this.faceLink = faceLink;
    this.contentPanel = contentPanel;
    this.orbitControls = orbitControls;

    this.panelEl = contentPanel.el;
    this.isOpen = false;
    this.activeFace = null;
    this.savedTarget = null;
  }

  enter(face, section) {
    if (this.isOpen) return;
    this.isOpen = true;
    this.activeFace = face;

    // Save orbit target
    this.savedTarget = this.orbitControls.target.clone();

    // Populate and reset content panel
    this.contentPanel.populate(face, section);
    this.contentPanel.resetStyles();

    const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
    const tl = gsap.timeline({
      onComplete: () => {
        this.panelEl.classList.add('active');
      }
    });

    if (!isMobile) {
      // Shift cube to the left by moving OrbitControls target
      tl.to(this.orbitControls.target, {
        x: -2.5,
        duration: 0.8,
        ease: 'power2.inOut'
      }, 0);
    }

    // Dim other vines
    for (const [f, link] of this.faceLink.activeLinks) {
      if (f === face) continue;
      tl.to(link.line.material, { opacity: 0.15, duration: 0.4 }, 0);
      tl.to(link.button, { opacity: 0.15, pointerEvents: 'none', duration: 0.4 }, 0);
    }

    // Slide panel in
    tl.to(this.panelEl, {
      x: 0,
      opacity: 1,
      duration: 0.8,
      ease: 'power2.inOut'
    }, 0.2);

    // Reveal content
    const revealTl = this.contentPanel.getRevealTimeline();
    tl.add(revealTl, 0.6);
  }

  reverse() {
    if (!this.isOpen) return;
    this.panelEl.classList.remove('active');

    const tl = gsap.timeline({
      onComplete: () => {
        this.isOpen = false;
        this.activeFace = null;
        gsap.set(this.panelEl, { x: '100%', opacity: 0 });
      }
    });

    // Exit content
    const exitTl = this.contentPanel.getExitTimeline();
    tl.add(exitTl, 0);

    // Slide panel out
    tl.to(this.panelEl, {
      x: '100%',
      opacity: 0,
      duration: 0.8,
      ease: 'power2.inOut'
    }, 0.3);

    // Restore orbit target
    if (this.savedTarget) {
      tl.to(this.orbitControls.target, {
        x: this.savedTarget.x,
        y: this.savedTarget.y,
        z: this.savedTarget.z,
        duration: 0.8,
        ease: 'power2.inOut'
      }, 0.3);
    }

    // Restore dimmed vines
    for (const [, link] of this.faceLink.activeLinks) {
      tl.to(link.line.material, { opacity: this.faceLink.vineOpacity, duration: 0.4 }, 0.5);
      tl.to(link.button, { opacity: 1, pointerEvents: 'auto', duration: 0.4 }, 0.5);
    }
  }
}
