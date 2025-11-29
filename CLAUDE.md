# Rubik's Cube Portfolio

Interactive 3D Rubik's cube as a portfolio navigation system. Solving a face triggers a sci-fi explosion animation and navigates to that section.

## Tech Stack

- **Three.js** - 3D rendering
- **GSAP** - animations
- **Vite** - build tool/dev server
- **Vanilla JS** - no React

## Project Structure

```
src/
├── main.js              # Entry point, scene setup, render loop
├── index.html
├── style.css
├── cube/
│   ├── Cube.js          # Main cube class, orchestrates everything
│   ├── Cubie.js         # Individual cubie with position and mesh
│   └── (future: CubeState.js, CubeMaterials.js)
├── controls/
│   ├── KeyboardControls.js
│   ├── DragControls.js
│   └── Raycaster.js
├── animation/
│   ├── MoveQueue.js     # Queue sequential moves
│   └── UnlockAnimation.js
├── detection/
│   └── SolveDetector.js
├── effects/
│   └── Particles.js
└── utils/
    └── constants.js     # Face colors, axis mappings, sections
public/
└── hdri/                # Environment maps (.hdr files)
```

## Development Phases

- [x] **Phase 1**: Static cube rendering (27 cubies, 6 colors, OrbitControls)
- [x] **Phase 2**: Face rotation mechanics (keyboard R/L/U/D/F/B, GSAP animations)
- [x] **Phase 3**: Mouse/drag interaction (raycasting, gesture detection)
- [x] **Phase 4**: Solve detection (track face colors, detect when 9 match)
- [x] **Phase 5**: Unlock animation (glow, expand outward, bloom effect)
- [x] **Phase 6**: Visual polish (PBR materials, HDR environment, particles)
- [x] **Phase 7**: Website integration (navigation, UI overlay)

## Key Patterns

### Face Rotation
Uses temporary THREE.Group pivot pattern:
1. Filter cubies on layer
2. Attach to pivot group
3. Animate pivot rotation with GSAP
4. Return cubies to scene with `attach()` (preserves world transform)
5. Update logical positions

### Coordinate System
- Cubies use -1, 0, 1 coordinates on each axis
- Face colors: white (Y+), yellow (Y-), green (Z+), blue (Z-), red (X+), orange (X-)

### Solve Detection
- Track which color faces which direction on each cubie
- After rotation, update face colors with `rotateFaceColors()`
- Compare all 9 cubies on a face to center piece color

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run preview  # Preview production build
```

## Reference Docs

- `rubiks_cube_research.md` - Framework comparison, architecture decisions, code patterns
- `rubiks-cube-implementation-guide.md` - Step-by-step implementation with complete code examples

## Face-to-Section Mapping

| Color  | Face  | Section    |
|--------|-------|------------|
| White  | Up    | About      |
| Yellow | Down  | Experience |
| Green  | Front | Projects   |
| Blue   | Back  | Skills     |
| Red    | Right | Contact    |
| Orange | Left  | Blog       |
