// Standard Rubik's cube notation
// R = Right, L = Left, U = Up, D = Down, F = Front, B = Back
// Lowercase or with Shift = counter-clockwise (prime moves)

export function setupKeyboardControls(cube) {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input field
    if (e.target.tagName === 'INPUT') return;

    const key = e.key.toLowerCase();
    const isShift = e.shiftKey;

    // Direction: 1 = clockwise, -1 = counter-clockwise (prime)
    const dir = isShift ? -1 : 1;

    switch (key) {
      case 'r': // Right face
        cube.rotate('x', 1, dir);
        break;
      case 'l': // Left face
        cube.rotate('x', -1, -dir); // Inverted because we look from right
        break;
      case 'u': // Up face
        cube.rotate('y', 1, dir);
        break;
      case 'd': // Down face
        cube.rotate('y', -1, -dir);
        break;
      case 'f': // Front face
        cube.rotate('z', 1, dir);
        break;
      case 'b': // Back face
        cube.rotate('z', -1, -dir);
        break;
      case 'm': // Middle layer (between L and R)
        cube.rotate('x', 0, -dir);
        break;
      case 'e': // Equatorial layer (between U and D)
        cube.rotate('y', 0, -dir);
        break;
      case 's': // Standing layer (between F and B)
        cube.rotate('z', 0, dir);
        break;
    }
  });

  console.log('Keyboard controls active:');
  console.log('R/L/U/D/F/B = rotate faces');
  console.log('Hold Shift for counter-clockwise');
}
