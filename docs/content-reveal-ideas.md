# Content Reveal Ideas

Research into creative alternatives for presenting portfolio content when a Rubik's cube face is solved. The current implementation shows a flat full-screen overlay with a title and generic description — the weakest link in an otherwise creative experience.

## Current Flow

```
Solve face -> Unlock animation (glow + expand) -> Vine grows from face
-> Button appears at vine tip -> Click button -> Full-screen overlay
-> "Welcome to [Section] section." + Back to Cube button
```

The overlay is defined in `index.html` as a centered `<div>` with a title, paragraph, and back button. `FaceLink.navigateTo()` populates the title and removes the `hidden` class. The `SECTIONS` config has `name` and `path` per section but `path` is unused.

---

## Idea 1: Portal Through the Face

**Concept:** The camera flies toward the solved face. The 9 cubies dissolve/become transparent, revealing a portal rendered via `WebGLRenderTarget`. The user literally enters the cube face into a dedicated mini-scene for that section. Clicking "back" reverses the camera, flying back out.

**Why it fits:** Each face becomes a doorway. You don't leave the cube — you go *inside* it. The puzzle-solving reward is spatial and physical.

**Technical approach:**
- `WebGLRenderTarget` renders a secondary `THREE.Scene` per section onto a texture
- Apply texture to a plane at the face opening
- GSAP animates the camera along the face normal toward the face center
- Cubie materials transition to `transparent: true` with animated opacity
- OrbitControls disabled during transition, re-enabled on return
- 6 mini-scenes need content: lighting, text meshes, positioned objects

**What exists that helps:**
- `UnlockAnimation.getCubiesOnFace(face)`, `getFaceCenter()`, `getFaceNormal()`
- GSAP timeline pattern from `UnlockAnimation.play()`
- `savedState` pattern for save/restore
- Camera and renderer references in `main.js`

**New files needed:**
- `src/effects/PortalTransition.js` — camera fly-in, dissolve, render target, return
- `src/scenes/SectionScene.js` — factory for per-section mini-scenes

**Files to modify:** `main.js`, `UnlockAnimation.js`, `Cubie.js`

**New dependencies:** None (`WebGLRenderTarget` is built into Three.js)

**Effort: XL (30-45 hours)**

**Risks:**
- Two scenes + render target has memory/performance cost, especially on mobile
- Building 6 meaningful mini-scenes is a design task on top of the code
- The "return" transition needs equal polish or it feels half-baked
- Render target resolution management on resize

---

## Idea 2: Face Unfold / Cube Net

**Concept:** The 9 solved cubies detach from the cube, rotate to lay flat (like unfolding a cube net), then spread into a 3x3 grid. Each cubie becomes a content card using `CSS3DRenderer` to show HTML content on the card faces.

**Why it fits:** The cube is made of pieces, content is made of pieces. You literally take the cube apart to see what's inside.

**Technical approach:**
- `CSS3DRenderer` (ships with Three.js) renders DOM elements in 3D space
- Layer CSS3D renderer on top of WebGL canvas, sharing the same camera
- 9 cubies animate: rotate 90 degrees to flatten, then spread into a grid
- Each cubie's outward face gets a `CSS3DObject` with HTML card content
- Remaining 5 cube faces stay visible in background, slightly dimmed

**What exists that helps:**
- `UnlockAnimation.getCubiesOnFace(face)` and sort-by-distance
- `savedState` pattern for position/rotation save/restore
- GSAP timeline sequencing

**New files needed:**
- `src/effects/FaceUnfold.js` — cubie detach, flatten, spread, CSS3DObject creation
- `src/content/CardContent.js` — HTML content per card per section

**Files to modify:** `main.js`, `index.html`, `style.css`

**New dependencies:** None (`CSS3DRenderer` ships with Three.js)

**Effort: Large (20-30 hours)**

**Risks:**
- CSS3D and WebGL sharing a camera requires careful DOM layering and pointer event management
- Unfold math is non-trivial (intermediate transforms that look natural)
- CSS3D performance can be inconsistent on mobile
- Cube left with missing face needs visual handling

---

## Idea 3: Dimensional Shift

**Concept:** Clicking the vine button shrinks the entire cube to a corner as an interactive miniature. Particles reorganize from random floating into content layout shapes (rectangles, lines). HTML content fades in aligned with particle formations.

**Why it fits:** The cube stays present as a navigation hub. The particle reformation creates a "magic" moment. Spatial transition feels continuous.

**Technical approach:**
- GSAP animates `cube.group.scale` and `cube.group.position` to shrink cube to top-left corner
- Particle positions lerp from ambient positions to target layout positions (card outlines, headers, dividers)
- Increase particle count (200 is too sparse — need 500-2000+)
- Replace simple rotation with per-particle `BufferAttribute` position writes per frame
- HTML content fades in, aligned with particle formations via 3D-to-2D projection
- Mini cube stays interactive — click another solved face to swap sections

**What exists that helps:**
- `ParticleSystem` with `BufferGeometry` and `PointsMaterial`
- `cube.group.position` and `cube.group.scale` (GSAP can animate both)
- Theme system CSS variables for styling

**New files needed:**
- `src/effects/DimensionalShift.js` — cube shrink, particle morph, HTML reveal, reverse
- `src/content/LayoutTargets.js` — target particle positions for content layouts

**Files to modify:** `Particles.js` (major rewrite), `main.js`, `style.css`, `index.html`

**New dependencies:** None

**Effort: Large (25-35 hours)**

**Risks:**
- 200 particles forming content shapes won't be readable; need 1000+, which impacts mobile performance
- Computing target positions for "content layouts" is a design problem — text outlines require font glyph sampling
- Synchronizing particle positions with HTML positions needs pixel-perfect projection
- Increased particle count with per-particle animation could drop below 60fps on mobile

---

## Idea 4: Face as Window with Parallax

**Concept:** The solved face's cubies become transparent glass, revealing parallax content layers visible inside the cube. Moving the camera shifts the parallax layers for depth.

**Why it fits:** You solved a face, now you can peer inside the cube. Each face is a window into a different world.

**Technical approach:**
- Swap solved cubie face materials to `MeshPhysicalMaterial` with `transmission: 1` (glass effect)
- Place content planes at different Z-depths inside the cube group
- Track camera position in render loop, apply parallax offsets to each layer
- Content on planes via `CanvasTexture` or loaded images
- Stencil buffer or positioning to prevent content being visible through other faces

**What exists that helps:**
- `UnlockAnimation.getCubiesOnFace(face)` and face utils
- `Cubie.mesh.material` array — can swap individual face materials
- OrbitControls already moves camera (natural parallax input)
- GSAP for material transition

**New files needed:**
- `src/effects/FaceWindow.js` — glass swap, interior content planes, parallax offset
- `src/content/InteriorLayers.js` — textured planes per section

**Files to modify:** `Cubie.js`, `main.js`, `UnlockAnimation.js`

**New dependencies:** None (`MeshPhysicalMaterial` is built into Three.js)

**Effort: Medium (15-22 hours)**

**Risks:**
- `MeshPhysicalMaterial` with transmission is GPU-intensive; 9 glass cubies + bloom could cause frame drops
- Content readability depends on viewing angle — oblique angles make content unreadable
- Stencil clipping to prevent cross-face visibility adds complexity
- The interior space is tiny (~3x3x3 units) — fitting readable content is tight

---

## Idea 5: Vine-to-Tree Content Growth

**Concept:** Instead of the vine leading to a button that opens an overlay, the vine *is* the content. After extending from the solved face, it branches into a tree structure. Each branch terminates in a content node (project card, skill badge, etc.).

**Why it fits:** The vine mechanic already exists and feels organic. Extending it into a content tree is a natural evolution. Keeps everything in 3D space with no mode-switching.

**Technical approach:**
- After initial vine completes, trigger recursive branching from the endpoint
- L-system or predefined tree structure per section
- Each terminal node gets a `CSS2DObject` or HTML element positioned via 3D-to-2D projection
- Hover a node to expand/preview, click to show full content
- Multiple `THREE.Line` objects per face, each with growth animation

**What exists that helps:**
- `FaceLink.show()` — entire vine growth system (heavy reuse)
- `generateVineCurve()`, `getPointOnCurve()`, `getPerpendicularVector()` — curve math
- `updateButtonPosition()` — 3D-to-2D projection
- GSAP animation sequencing for staggered growth

**New files needed:**
- `src/effects/BranchTree.js` — branching logic, recursive growth
- `src/content/TreeContent.js` — maps section data to tree node content

**Files to modify:** `FaceLink.js` (extend), `main.js` (minor), `style.css`

**New dependencies:** None

**Effort: Medium (12-18 hours)**

**Risks:**
- 3D branching with viewport clamping is tricky — branches can overlap or go off-screen
- With 6 faces solved, could have 30+ floating elements (overlap/z-ordering)
- Organic tree aesthetic may clash with geometric cube aesthetic
- Performance with many `THREE.Line` objects and per-frame position updates

---

## Idea 6: Cubies as Interactive Gallery

**Concept:** The 9 solved cubies orbit outward, forming a ring or constellation. Each cubie shows content on its face via `CanvasTexture` — project screenshots, skill icons, timeline entries. Click a cubie to expand it.

**Why it fits:** Cubies have always been individual entities. Liberating them after solving a face is a satisfying reward.

**Technical approach:**
- Detach 9 cubies, animate to orbital/grid positions using spherical coordinates
- Replace outward face material with `CanvasTexture` (draw text/images with Canvas 2D API)
- Add hover-to-enlarge via raycasting
- Click a cubie to zoom camera to it and show detailed content
- Remaining cube shows which faces are "deployed"

**What exists that helps:**
- `UnlockAnimation.getCubiesOnFace(face)` and `savedState` pattern
- GSAP timeline for position/rotation/scale
- `RaycasterHelper` and `DragControls.findCubieByMesh()` for click detection

**New files needed:**
- `src/effects/CubieGallery.js` — orbit animation, canvas textures, click-to-expand
- `src/content/CanvasRenderer.js` — text wrapping, images, styling on `<canvas>`

**Files to modify:** `Cubie.js`, `main.js`, `UnlockAnimation.js`

**New dependencies:** None

**Effort: Large (22-30 hours)**

**Risks:**
- `CanvasTexture` text is low-resolution vs DOM text — needs DPI scaling
- Rich content in Canvas 2D is labor-intensive compared to HTML/CSS
- Gallery cubies are still part of cube's logical model — rotations during gallery would break things (need to lock cube)
- Click detection in gallery mode vs drag detection on cube faces needs careful event routing

---

## Idea 7: Shader Dissolve Transition

**Concept:** A custom `ShaderMaterial` drives a Perlin noise dissolve effect emanating from the solved face center, erasing the 3D scene to reveal content underneath. Feels like a game unlock.

**Why it fits:** Visually striking, gamification-friendly. The dissolve is a trending effect in creative portfolios (2024-2026).

**Technical approach:**
- Custom `THREE.ShaderMaterial` with vertex + fragment shaders
- Perlin/simplex noise in GLSL determines dissolve pattern
- Uniforms: `uProgress` (0-1), `uOrigin` (face center), edge color, edge width
- GSAP tweens `uProgress` uniform
- `discard` fragments below noise threshold for true dissolve
- Revealed content: DOM layer beneath canvas, or secondary scene

**What exists that helps:**
- `UnlockAnimation.getCubiesOnFace(face)` and `getFaceCenter(face)`
- GSAP can tween any object property (including shader uniforms)
- Theme system for dissolve edge color matching

**New files needed:**
- `src/shaders/dissolve.vert` — vertex shader
- `src/shaders/dissolve.frag` — fragment shader with noise, threshold, edge glow
- `src/effects/DissolveTransition.js` — material swaps, uniform animation, cleanup

**Files to modify:** `Cubie.js`, `UnlockAnimation.js`, `main.js`

**New dependencies:** Optional `glsl-noise` (or copy-paste public domain Perlin noise)

**Effort: Medium (14-20 hours)**

**Risks:**
- GLSL debugging is harder than JS (visual-only feedback, no console.log)
- `RoundedBoxGeometry` UV mapping may cause noise pattern quirks
- Multi-material meshes (6 per cubie) complicate shader swap
- Bloom post-processing may double-bloom the dissolve edge glow

---

## Idea 8: Split-Screen Hybrid

**Concept:** The cube slides to the left side of the screen while a content panel slides in from the right. The vine connects the two. Cube stays interactive — click another vine to swap content.

**Why it fits:** Most practical and accessible. Keeps the cube as persistent navigation while giving content proper reading space. No disorientation.

**Technical approach:**
- GSAP animates camera position or cube group to reframe to the left
- HTML content panel slides in from right with staggered reveals
- Vine endpoint adjusts to connect face to panel edge
- Clicking a different vine button crossfades panel content
- Canvas resizes or camera viewport adjusts for half-screen

**What exists that helps:**
- `FaceLink.show()` — vine animation (adjust endpoints)
- Overlay system as starting point for panel
- GSAP and theme CSS variables
- Camera and OrbitControls

**New files needed:**
- `src/effects/SplitScreen.js` — slide transitions, panel content, return animation
- `src/content/PanelContent.js` — HTML content per section (or inline in HTML)

**Files to modify:** `main.js`, `FaceLink.js`, `index.html`, `style.css`

**New dependencies:** None

**Effort: Small (8-14 hours)**

**Risks:**
- Canvas resize mid-session can cause visual jumps
- Camera aspect ratio must be recalculated for half-screen
- OrbitControls need adjustment for shifted view
- Mobile: side-by-side doesn't work on narrow screens — needs top/bottom fallback

---

## Idea 9: Holographic Projection

**Concept:** The solved face projects floating holographic panels into 3D space nearby — scanlines, transparency, chromatic aberration, glitch animations.

**Why it fits:** Extends the existing particle/glow aesthetic. The cube becomes a sci-fi artifact that projects information when unlocked.

**Technical approach:**
- `THREE.PlaneGeometry` meshes with `CanvasTexture` for content
- Custom `ShaderMaterial` with scanlines (`fract(uv.y * lineCount)`), chromatic aberration, flicker
- `THREE.AdditiveBlending` for holographic glow
- Stagger appearance of multiple panels
- Gentle floating/bobbing animation

**What exists that helps:**
- `FaceLink.getFaceCenter(face)` and `getFaceNormal(face)` for positioning
- GSAP for opacity, position, scale animation
- `FaceLink.update()` pattern for per-frame position sync with cube floating
- `ParticleSystem` as aesthetic reference

**New files needed:**
- `src/effects/HologramProjection.js` — planes, shader materials, positioning, show/hide
- `src/shaders/hologram.vert` and `hologram.frag` — scanlines, flicker, chromatic aberration
- `src/content/HologramContent.js` — canvas textures per section

**Files to modify:** `main.js`, `UnlockAnimation.js`

**New dependencies:** None

**Effort: Medium (16-24 hours)**

**Risks:**
- Holographic shaders need careful tuning — too much is distracting, too little is pointless
- `CanvasTexture` has same resolution/DPI challenges as other canvas approaches
- Reading content through scanlines and flicker may be impractical for actual portfolio use
- Additive blending + bloom could over-brighten hologram areas
- Multiple faces solved = multiple projections overlapping

---

## Idea 10: Scroll-Through-the-Cube

**Concept:** The camera enters the cube and follows a `CatmullRomCurve3` path through its interior, driven by scroll position. Content stations appear along the path.

**Why it fits:** Turns the cube from an opaque puzzle into an explorable space. The journey through the interior is memorable.

**Technical approach:**
- `THREE.CatmullRomCurve3` defines camera path through cube interior
- `curve.getPointAt(t)` and `curve.getTangentAt(t)` for camera position/lookAt
- Map scroll position (0-1) to camera path position
- Content elements (text, cards, images) as 3D meshes at waypoints along the path
- GSAP ScrollTrigger for scroll-driven animation
- Cubies must become transparent/hidden for interior viewing
- Tall scrollable container (`height: 500vh`) drives the animation

**What exists that helps:**
- Camera from `main.js`
- GSAP (ScrollTrigger is included but needs registration)
- `FaceLink.getPointOnCurve()` — similar curve interpolation concept
- Cube and cubie references

**New files needed:**
- `src/effects/ScrollJourney.js` — curve path, camera binding, waypoint content, enter/exit
- `src/content/WaypointContent.js` — 3D content objects per waypoint

**Files to modify:** `main.js`, `index.html`, `style.css`, `Cubie.js`

**New dependencies:** GSAP ScrollTrigger (included with GSAP, needs `gsap.registerPlugin()`), optional `lenis` for smooth scroll

**Effort: XL (30-40 hours)**

**Risks:**
- Scroll-driven camera animation is notoriously difficult across browsers/devices
- Cube interior is tiny (~3x3x3 units) — fitting content is tight
- Content readability with moving camera is challenging
- Transition between orbit mode and scroll-through mode needs clean state machine
- Changes the app from single-screen to scrollable document (paradigm shift)
- Mobile scroll quirks (overscroll bounce, address bar show/hide)

---

## Summary

| # | Idea | Effort | Hours | New Deps | WOW Factor | Practicality |
|---|------|--------|-------|----------|------------|--------------|
| 1 | Portal Through Face | XL | 30-45 | None | High | Medium |
| 2 | Face Unfold / Cube Net | Large | 20-30 | None | High | Medium |
| 3 | Dimensional Shift | Large | 25-35 | None | High | Medium |
| 4 | Face as Window + Parallax | Medium | 15-22 | None | Medium | Low |
| 5 | Vine-to-Tree Growth | Medium | 12-18 | None | Medium | Medium |
| 6 | Cubies as Gallery | Large | 22-30 | None | High | Medium |
| 7 | Shader Dissolve | Medium | 14-20 | Optional | High | Medium |
| 8 | Split-Screen Hybrid | **Small** | **8-14** | None | Medium | **High** |
| 9 | Holographic Projection | Medium | 16-24 | None | High | Low |
| 10 | Scroll Through Cube | XL | 30-40 | ScrollTrigger | High | Low |

**Lowest effort, highest practicality:** #8 (Split-Screen) and #5 (Vine-to-Tree)
**Highest wow factor for effort:** #7 (Dissolve) and #9 (Hologram)
**Most ambitious:** #1 (Portal) and #10 (Scroll-Through)

## Experiment Plan

Each idea will be implemented on a separate branch for comparison:

| Branch Name | Idea |
|-------------|------|
| `experiment/portal-face` | 1. Portal Through the Face |
| `experiment/face-unfold` | 2. Face Unfold / Cube Net |
| `experiment/dimensional-shift` | 3. Dimensional Shift |
| `experiment/face-window` | 4. Face as Window + Parallax |
| `experiment/vine-tree` | 5. Vine-to-Tree Growth |
| `experiment/cubie-gallery` | 6. Cubies as Gallery |
| `experiment/shader-dissolve` | 7. Shader Dissolve |
| `experiment/split-screen` | 8. Split-Screen Hybrid |
| `experiment/hologram` | 9. Holographic Projection |
| `experiment/scroll-through` | 10. Scroll Through Cube |
