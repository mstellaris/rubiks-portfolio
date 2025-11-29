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
