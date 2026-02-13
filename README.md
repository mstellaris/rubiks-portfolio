# Rubik's Cube Portfolio

An interactive 3D Rubik's cube that serves as a unique portfolio navigation system. Solve a face to unlock that section of the website.

![Three.js](https://img.shields.io/badge/Three.js-black?style=flat&logo=three.js&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=flat&logo=greensock&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat&logo=node.js&logoColor=white)

## Features

- **Interactive 3D Cube** - Fully functional Rubik's cube with realistic rotation mechanics
- **Keyboard Controls** - Use R, L, U, D, F, B keys (+ Shift for reverse) to rotate faces
- **Mouse/Touch Controls** - Click and drag on faces to rotate; context-aware touch input on mobile
- **Solve Detection** - Automatically detects when a face is solved
- **Unlock Animation** - Solved faces trigger a satisfying expansion animation with glow effects
- **Navigation Links** - Vine-like lines extend from solved faces with clickable section buttons
- **Dark/Light Theme** - Toggle between themes; respects system preference with manual override
- **Visual Polish** - PBR materials, HDR environment reflections, bloom post-processing, ambient particles
- **Performance Optimized** - Shared geometry/materials, adaptive bloom for mobile, cached vine positions

## Face-to-Section Mapping

| Color  | Face  | Section    |
|--------|-------|------------|
| White  | Up    | About      |
| Yellow | Down  | Experience |
| Green  | Front | Projects   |
| Blue   | Back  | Skills     |
| Red    | Right | Contact    |
| Orange | Left  | Blog       |

## Getting Started

```bash
# Use Node 22 (reads .nvmrc)
nvm use

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npx eslint src/
```

## Controls

| Input | Action |
|-------|--------|
| **R / L / U / D / F / B** | Rotate face clockwise |
| **Shift + Key** | Rotate face counter-clockwise |
| **Click + Drag on face** | Rotate face with mouse/touch |
| **Drag background** | Orbit camera |
| **Spacebar** | Scramble cube |
| **Escape** | Close section overlay |
| **Backtick (`)** | Reset cube to solved state |

## Tech Stack

- **[Three.js](https://threejs.org/)** (v0.182) - 3D rendering with WebGL
- **[GSAP](https://greensock.com/gsap/)** (v3.14) - Smooth animations and timelines
- **[Vite](https://vitejs.dev/)** (v7) - Fast build tool and dev server
- **Node.js 22** - Runtime requirement

## Project Structure

```
src/
├── main.js           # Scene setup, render loop, theme wiring
├── style.css         # CSS custom properties for theming
├── index.html        # FOUC prevention, theme toggle button
├── cube/             # Cube and Cubie classes (shared geometry/materials)
├── controls/         # Keyboard and pointer-based drag interaction
├── animation/        # Move queue and unlock animations
├── detection/        # Solve detection logic
├── effects/          # Particles and face link system
└── utils/            # Constants, theme manager
docs/
├── rubiks_cube_research.md              # Framework comparison, architecture decisions
├── rubiks-cube-implementation-guide.md  # Step-by-step implementation guide
└── aws-deployment-guide.md              # AWS deployment documentation
```

## CI/CD

GitHub Actions runs on every push to `main`:
- ESLint lint check
- Production build verification
- Bundle size check (700KB limit)

## License

MIT
