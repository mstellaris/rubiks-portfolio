// Face colors (standard Rubik's cube colors)
export const COLORS = {
  white: 0xffffff,   // Up (Y+)
  yellow: 0xffff00,  // Down (Y-)
  green: 0x00ff00,   // Front (Z+)
  blue: 0x0000ff,    // Back (Z-)
  red: 0xff0000,     // Right (X+)
  orange: 0xff8800   // Left (X-)
};

// Face definitions - which color belongs to which direction
export const FACES = {
  right:  { axis: 'x', direction:  1, color: COLORS.red },
  left:   { axis: 'x', direction: -1, color: COLORS.orange },
  up:     { axis: 'y', direction:  1, color: COLORS.white },
  down:   { axis: 'y', direction: -1, color: COLORS.yellow },
  front:  { axis: 'z', direction:  1, color: COLORS.green },
  back:   { axis: 'z', direction: -1, color: COLORS.blue }
};

// Cubie size and gap
export const CUBIE_SIZE = 1;
export const CUBIE_GAP = 0.05;

// Website sections mapped to face colors
export const SECTIONS = {
  white: { name: 'About', path: '/about' },
  yellow: { name: 'Experience', path: '/experience' },
  green: { name: 'Projects', path: '/projects' },
  blue: { name: 'Skills', path: '/skills' },
  red: { name: 'Contact', path: '/contact' },
  orange: { name: 'Blog', path: '/blog' }
};

// Rich content for each section (displayed in the content panel)
export const SECTION_CONTENT = {
  about: {
    html: `
      <p class="content-lead">I build interactive experiences at the intersection of design and engineering.</p>
      <p>With a passion for creative development and 3D web experiences, I craft interfaces that delight users and push the boundaries of what's possible in the browser.</p>
      <div class="content-stats">
        <div class="stat"><span class="stat-number">5+</span><span class="stat-label">Years Experience</span></div>
        <div class="stat"><span class="stat-number">20+</span><span class="stat-label">Projects</span></div>
        <div class="stat"><span class="stat-number">10+</span><span class="stat-label">Technologies</span></div>
      </div>
      <p>I believe the best digital products combine technical excellence with thoughtful design, creating moments that feel effortless yet memorable.</p>
    `
  },
  experience: {
    html: `
      <p class="content-lead">A journey through creative technology and software engineering.</p>
      <p>From building interactive data visualizations to crafting immersive 3D experiences, my career has been driven by curiosity and a desire to create meaningful digital products.</p>
      <div class="content-stats">
        <div class="stat"><span class="stat-number">3</span><span class="stat-label">Companies</span></div>
        <div class="stat"><span class="stat-number">15+</span><span class="stat-label">Shipped Products</span></div>
      </div>
      <p>Each role has deepened my understanding of how great engineering serves great design.</p>
    `
  },
  projects: {
    html: `
      <p class="content-lead">Selected work spanning web applications, creative tools, and interactive experiences.</p>
      <p>I gravitate toward projects that challenge conventional interfaces and explore new paradigms for human-computer interaction.</p>
      <p>From real-time collaboration tools to generative art experiments, each project is an opportunity to learn something new and push creative boundaries.</p>
    `
  },
  skills: {
    html: `
      <p class="content-lead">Full-stack development with a focus on creative technology.</p>
      <p>My toolkit spans the modern web stack, with deep expertise in JavaScript, Three.js, WebGL, and animation frameworks like GSAP.</p>
      <p>I'm equally comfortable building performant backend systems and crafting pixel-perfect interfaces with smooth 60fps animations.</p>
    `
  },
  contact: {
    html: `
      <p class="content-lead">Let's build something extraordinary together.</p>
      <p>Whether you have a creative project in mind, a technical challenge to solve, or just want to chat about the future of web experiences, I'd love to hear from you.</p>
      <p>The best collaborations start with a conversation.</p>
    `
  },
  blog: {
    html: `
      <p class="content-lead">Thoughts on creative development, 3D web, and the craft of building interactive experiences.</p>
      <p>I write about the techniques, tools, and thinking behind modern creative web development. From Three.js deep dives to design philosophy, these posts capture lessons learned along the way.</p>
      <p>Coming soon.</p>
    `
  }
};
