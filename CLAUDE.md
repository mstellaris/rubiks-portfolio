# Rubik's Cube Portfolio

Interactive 3D Rubik's cube as a portfolio navigation system. Solving a face triggers an unlock animation, then a vine-like line extends outward with a clickable button to navigate to that section.

## Tech Stack

- **Three.js** - 3D rendering with post-processing (UnrealBloomPass)
- **GSAP** - animations (timelines, easing)
- **Vite** - build tool/dev server
- **Vanilla JS** - no React

## Project Structure

```
src/
├── main.js              # Entry point, scene setup, render loop
├── style.css
├── cube/
│   ├── Cube.js          # Main cube class, move queue, solve detection
│   └── Cubie.js         # Individual cubie with position, mesh, face colors
├── controls/
│   ├── KeyboardControls.js  # R/L/U/D/F/B keys + debug keys
│   ├── DragControls.js      # Mouse drag rotation
│   └── Raycaster.js         # Face/cubie detection
├── animation/
│   ├── MoveQueue.js         # Queue sequential moves
│   └── UnlockAnimation.js   # Solved face animation with queue system
├── detection/
│   └── SolveDetector.js     # Detects when faces are solved
├── effects/
│   ├── Particles.js         # Ambient floating particles
│   └── FaceLink.js          # Vine-like lines + buttons for solved faces
└── utils/
    └── constants.js         # Colors, sections, cubie size
public/
└── hdri/
    └── studio.hdr           # Environment map for reflections
```

## Current State

All 7 development phases complete. The cube is fully functional:
- Keyboard and mouse controls for face rotation
- Solve detection triggers unlock animation
- Vine-like line grows from solved face with clickable section button
- Animation queue handles multiple faces solved in quick succession

## Key Implementation Details

### Face Rotation (Pivot Pattern)
1. Filter cubies on layer by axis/position
2. Attach to temporary THREE.Group pivot
3. Animate pivot rotation with GSAP
4. Return cubies to scene with `attach()` (preserves world transform)
5. Update logical positions and face colors

### Solve Detection
- Each cubie tracks which color faces which direction (`faceColors` object)
- After rotation, `rotateFaceColors()` updates the mapping
- `SolveDetector.checkAllFaces()` returns newly solved faces
- Tracks `solvedFaces` Set to only trigger on state change

### Animation Queue (UnlockAnimation)
- `isAnimating` flag prevents concurrent animations
- `animationQueue` array holds pending face animations
- `processQueue()` plays next animation after current completes
- Each animation stores its own `onComplete` callback

### FaceLink (Vine Animation)
- Quadratic bezier curve for organic path
- 50-segment line geometry animated point-by-point
- Slight wobble during growth, settles when complete
- Viewport clamping keeps endpoint on screen
- Button positioned via 3D-to-2D projection

### Visual Settings
- Background: #252a33 (medium dark gray)
- Ambient light: 0.4 intensity
- Directional light: 0.4 intensity
- Tone mapping: ACESFilmic at 0.7 exposure
- Bloom: 0.5 strength, 0.4 radius, 0.85 threshold
- Materials: MeshPhysicalMaterial with clearcoat 0.3, envMapIntensity 0.5

## Debug Keys

- **Backtick (`)** - Reset cube to solved state
- **Ctrl+1** - Quick scramble (5 moves)
- **Spacebar** - Full scramble (25 moves)

## Commands

```bash
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

## Face-to-Section Mapping

| Color  | Face  | Section    |
|--------|-------|------------|
| White  | Up    | About      |
| Yellow | Down  | Experience |
| Green  | Front | Projects   |
| Blue   | Back  | Skills     |
| Red    | Right | Contact    |
| Orange | Left  | Blog       |

## Bugs Fixed

1. **Animation during scramble** - Added `isScrambling` flag, initialize `solvedFaces` with all 6 faces
2. **Black faces after animation** - Save and restore mesh rotation, not just position
3. **Cubie misalignment** - Use clean calculated positions from logical coords, not saved positions with float drift
4. **Missed face animations** - Added animation queue system

## Reference Docs

- `rubiks_cube_research.md` - Framework comparison, architecture decisions
- `rubiks-cube-implementation-guide.md` - Step-by-step implementation guide
