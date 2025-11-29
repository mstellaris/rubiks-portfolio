# Rubik's Cube Portfolio

An interactive 3D Rubik's cube that serves as a unique portfolio navigation system. Solve a face to unlock that section of the website.

![Three.js](https://img.shields.io/badge/Three.js-black?style=flat&logo=three.js&logoColor=white)
![GSAP](https://img.shields.io/badge/GSAP-88CE02?style=flat&logo=greensock&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)

## Features

- **Interactive 3D Cube** - Fully functional Rubik's cube with realistic rotation mechanics
- **Keyboard Controls** - Use R, L, U, D, F, B keys (+ Shift for reverse) to rotate faces
- **Mouse/Drag Controls** - Click and drag on faces to rotate intuitively
- **Solve Detection** - Automatically detects when a face is solved
- **Unlock Animation** - Solved faces trigger a satisfying expansion animation with glow effects
- **Navigation Links** - Vine-like lines extend from solved faces with clickable section buttons
- **Visual Polish** - PBR materials, HDR environment reflections, bloom post-processing, ambient particles

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
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Controls

| Input | Action |
|-------|--------|
| **R / L / U / D / F / B** | Rotate face clockwise |
| **Shift + Key** | Rotate face counter-clockwise |
| **Click + Drag** | Rotate face with mouse |
| **Orbit (drag background)** | Rotate camera view |
| **Spacebar** | Scramble cube |
| **Escape** | Close section overlay |

## Tech Stack

- **[Three.js](https://threejs.org/)** - 3D rendering with WebGL
- **[GSAP](https://greensock.com/gsap/)** - Smooth animations and timelines
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server

## Project Structure

```
src/
├── main.js           # Scene setup, render loop, event handling
├── cube/             # Cube and Cubie classes
├── controls/         # Keyboard and drag interaction
├── animation/        # Move queue and unlock animations
├── detection/        # Solve detection logic
├── effects/          # Particles and face link system
└── utils/            # Constants and helpers
```

## License

MIT
