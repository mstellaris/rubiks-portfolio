const STORAGE_KEY = 'rubiks-theme';

const THEMES = {
  dark: {
    css: {
      '--bg-color': '#252a33',
      '--text-primary': 'rgba(255, 255, 255, 0.9)',
      '--text-secondary': 'rgba(255, 255, 255, 0.6)',
      '--text-muted': 'rgba(255, 255, 255, 0.5)',
      '--btn-bg': 'rgba(255, 255, 255, 0.08)',
      '--btn-border': 'rgba(255, 255, 255, 0.2)',
      '--btn-text': 'rgba(255, 255, 255, 0.8)',
      '--btn-hover-bg': 'rgba(255, 255, 255, 0.15)',
      '--btn-hover-border': 'rgba(255, 255, 255, 0.4)',
      '--btn-hover-text': '#ffffff',
      '--face-btn-bg': 'rgba(255, 255, 255, 0.12)',
      '--face-btn-border': 'rgba(255, 255, 255, 0.3)',
      '--face-btn-text': 'rgba(255, 255, 255, 0.9)',
      '--face-btn-hover-bg': 'rgba(255, 255, 255, 0.25)',
      '--face-btn-hover-border': 'rgba(255, 255, 255, 0.5)',
      '--face-btn-hover-shadow': 'rgba(255, 255, 255, 0.2)',
      '--overlay-bg': 'rgba(10, 10, 10, 0.95)',
      '--section-text': '#ffffff',
      '--section-subtext': 'rgba(255, 255, 255, 0.6)',
      '--panel-bg': 'rgba(20, 22, 30, 0.98)',
      '--panel-border': 'rgba(255, 255, 255, 0.08)',
    },
    scene: {
      background: 0x252a33,
      ambientIntensity: 0.4,
      directionalIntensity: 0.4,
      toneMappingExposure: 0.7,
      bloomStrength: 0.5,
      bloomRadius: 0.4,
      bloomThreshold: 0.85,
      particleColor: 0x4488ff,
      particleOpacity: 0.6,
      vineColor: 0xffffff,
      vineOpacity: 0.7,
      interiorColor: 0x111111,
      emissiveGlowPeak: 0.4,
    },
  },
  light: {
    css: {
      '--bg-color': '#e8e8ec',
      '--text-primary': 'rgba(30, 30, 40, 0.9)',
      '--text-secondary': 'rgba(30, 30, 40, 0.6)',
      '--text-muted': 'rgba(30, 30, 40, 0.45)',
      '--btn-bg': 'rgba(0, 0, 0, 0.06)',
      '--btn-border': 'rgba(0, 0, 0, 0.15)',
      '--btn-text': 'rgba(30, 30, 40, 0.8)',
      '--btn-hover-bg': 'rgba(0, 0, 0, 0.1)',
      '--btn-hover-border': 'rgba(0, 0, 0, 0.3)',
      '--btn-hover-text': '#1e1e28',
      '--face-btn-bg': 'rgba(0, 0, 0, 0.07)',
      '--face-btn-border': 'rgba(0, 0, 0, 0.2)',
      '--face-btn-text': 'rgba(30, 30, 40, 0.9)',
      '--face-btn-hover-bg': 'rgba(0, 0, 0, 0.12)',
      '--face-btn-hover-border': 'rgba(0, 0, 0, 0.35)',
      '--face-btn-hover-shadow': 'rgba(0, 0, 0, 0.15)',
      '--overlay-bg': 'rgba(240, 240, 245, 0.95)',
      '--section-text': '#1e1e28',
      '--section-subtext': 'rgba(30, 30, 40, 0.6)',
      '--panel-bg': 'rgba(245, 245, 248, 0.98)',
      '--panel-border': 'rgba(0, 0, 0, 0.08)',
    },
    scene: {
      background: 0xe8e8ec,
      ambientIntensity: 0.5,
      directionalIntensity: 0.35,
      toneMappingExposure: 0.75,
      bloomStrength: 0.08,
      bloomRadius: 0.2,
      bloomThreshold: 0.95,
      particleColor: 0x3366aa,
      particleOpacity: 0.6,
      vineColor: 0x333344,
      vineOpacity: 0.6,
      interiorColor: 0x555555,
      emissiveGlowPeak: 0.2,
    },
  },
};

class ThemeManager {
  constructor() {
    this.current = null;
    this.sceneCallback = null;
    this._mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
  }

  init(sceneCallback) {
    this.sceneCallback = sceneCallback;

    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      this.apply(stored);
    } else {
      this.apply(this._mediaQuery.matches ? 'light' : 'dark');
    }

    this._mediaQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        this.apply(e.matches ? 'light' : 'dark');
      }
    });
  }

  apply(name) {
    this.current = name;
    const theme = THEMES[name];

    document.documentElement.setAttribute('data-theme', name);

    const root = document.documentElement.style;
    for (const [prop, value] of Object.entries(theme.css)) {
      root.setProperty(prop, value);
    }

    if (this.sceneCallback) {
      this.sceneCallback(theme.scene);
    }
  }

  toggle() {
    const next = this.current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, next);
    this.apply(next);
  }
}

export const themeManager = new ThemeManager();
