# Rubik's Cube Portfolio

Interactive 3D Rubik's cube as a portfolio navigation system. Solving a face triggers an unlock animation, then a vine-like line extends outward with a clickable button to navigate to that section.

## Tech Stack

- **Three.js** (v0.182) - 3D rendering with post-processing (UnrealBloomPass)
- **GSAP** (v3.14) - animations (timelines, easing)
- **Vite** (v7) - build tool/dev server
- **Vanilla JS** - no React
- **Node.js 22** - required (see `.nvmrc`)

## Project Structure

```
src/
├── main.js              # Entry point, scene setup, render loop, theme wiring
├── style.css            # CSS custom properties for theming
├── index.html           # FOUC prevention script, theme toggle button
├── cube/
│   ├── Cube.js          # Main cube class, move queue, solve detection
│   └── Cubie.js         # Individual cubie with shared geometry/materials
├── controls/
│   ├── KeyboardControls.js  # R/L/U/D/F/B keys + debug keys + scramble/escape
│   ├── DragControls.js      # Pointer Events drag rotation (mouse + touch)
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
    ├── constants.js         # Colors, sections, cubie size
    └── theme.js             # Dark/light theme manager (CSS + Three.js)
public/
└── hdri/
    └── studio.hdr           # Environment map for reflections
docs/
├── rubiks_cube_research.md              # Framework comparison, architecture decisions
├── rubiks-cube-implementation-guide.md  # Step-by-step implementation guide
└── aws-deployment-guide.md              # AWS deployment documentation
```

## Current State

All development phases complete plus performance optimizations and feature additions:
- Keyboard and mouse/touch controls for face rotation
- Solve detection triggers unlock animation
- Vine-like line grows from solved face with clickable section button
- Animation queue handles multiple faces solved in quick succession
- Dark/light theme toggle with system preference detection
- Adaptive bloom (disabled on low-end mobile devices)
- Shared geometry and materials for performance
- CI/CD with GitHub Actions (lint, build, bundle size check)

## Key Implementation Details

### Performance Optimizations
- **Shared geometry**: Single RoundedBoxGeometry instance for all 27 cubies
- **Shared interior material**: One material for all non-colored faces, tagged with `isInterior = true`
- **MeshStandardMaterial**: Replaced MeshPhysicalMaterial (roughness 0.55, envMapIntensity 0.2)
- **Adaptive bloom**: Bloom disabled on mobile + small viewport to avoid frame drops
- **FaceLink caching**: Base positions cached after vine growth; per-frame update applies Y-offset via direct array writes instead of regenerating bezier curves
- **Reusable projection vector**: Single `_projVec` for all 3D-to-2D button positioning

### Theme System
- `ThemeManager` singleton in `src/utils/theme.js` with dark/light presets
- CSS custom properties for all UI colors (18 variables)
- Scene callback updates Three.js objects (background, lighting, bloom, particles, vines, interior material)
- System preference via `prefers-color-scheme` with localStorage manual override
- Inline FOUC prevention script in `<head>` applies theme before CSS loads

### Face Rotation (Pivot Pattern)
1. Filter cubies on layer by axis/position
2. Attach to temporary THREE.Group pivot
3. Animate pivot rotation with GSAP
4. Return cubies to scene with `attach()` (preserves world transform)
5. Update logical positions and face colors

### Touch/Pointer Controls
- Pointer Events API for unified mouse + touch input
- Capture phase `pointerdown` with `stopImmediatePropagation` intercepts before OrbitControls
- Pointer capture for reliable tracking across touch surfaces
- Context-aware: touch cubie = face rotation, touch empty space = camera orbit
- Larger drag threshold for touch (20px vs 10px mouse)

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
- `emissiveGlowPeak` property controlled by theme system

### FaceLink (Vine Animation)
- Quadratic bezier curve for organic path
- 50-segment line geometry animated point-by-point
- Slight wobble during growth, settles when complete
- Viewport clamping keeps endpoint on screen
- `vineColor` and `vineOpacity` properties controlled by theme system

## Debug Keys

- **Backtick (`)** - Reset cube to solved state
- **Ctrl+1** - Quick scramble (5 moves)
- **Spacebar** - Full scramble (25 moves)

## Commands

```bash
nvm use          # Switch to Node 22 (reads .nvmrc)
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
npx eslint src/  # Lint check
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
5. **Adaptive bloom broke desktop** - Changed to require both `isMobile && isSmallViewport` (DPR check was false-positive on desktop monitors)
6. **Light theme blown out** - Reduced bloom, exposure, and lighting; darkened interior material for cubie definition
