# Building an interactive 3D Rubik's cube web experience

**Three.js is the clear framework choice** for this project, offering the gentlest learning curve, smallest bundle size, and—critically—the richest ecosystem of existing Rubik's cube implementations to study. Combined with GSAP for animations and HDR environment maps for polished visuals, a developer comfortable with code but new to 3D web development can build this experience incrementally as a learning project. The recommended starting point is bsehovac's "The Cube" implementation, which already includes solve detection, modern rendering, and clean architecture.

## Framework comparison strongly favors Three.js

For this specific project, Three.js wins across every relevant criterion. The library has **significantly more Rubik's cube implementations** available—at least six well-documented projects versus Babylon.js's two or three. This matters enormously for a learning project where studying existing code accelerates development.

Three.js also has a simpler initial architecture with cleaner class design. While Babylon.js offers more built-in features that "hold your hand," that comes with a steeper initial learning curve and more complex overall structure. For someone new to both JavaScript and 3D development, Three.js's straightforward `Scene`, `Camera`, `Renderer`, and `Mesh` pattern is easier to internalize.

Bundle size also favors Three.js: approximately **155KB gzipped** versus Babylon.js's 500KB+. For a single interactive element on a webpage, the lighter footprint is preferable.

The community resources are decisive. Three.js has **1.8 million weekly npm downloads** versus Babylon.js's 11,000. Free resources like the "Discover three.js" book and countless YouTube tutorials make self-directed learning feasible. React Three Fiber should be avoided—it requires learning both React and Three.js simultaneously, which the official documentation explicitly warns against for beginners.

## Existing implementations provide excellent starting points

The research identified five significant open-source projects, each valuable for different reasons:

**Cuber (stewdio/Cuber-DEMO)** is the most educational implementation, having powered the Google Doodle and Chrome Cube Lab experiments. Its code includes extensive ASCII art illustrations and a clean separation between logical state and visual rendering. The "cubelet" concept—where pieces have permanent IDs but changing addresses—is beautifully documented. For understanding cube mechanics, vocabulary, and architecture patterns, Cuber is the best reference.

**The Cube (bsehovac/the-cube)** is the **recommended starting point** for actually building this project. Available both on GitHub and as a clean CodePen demo, it includes solve detection, a timer, multiple cube sizes (2×2 to 5×5), rounded geometry for realism, and theming. The code is modern, uses RoundedBoxGeometry for aesthetic edges, and is structured as a single comprehensible file. With 254 GitHub stars, it's actively maintained.

**cubing.js** provides the most comprehensive library approach, offering web components (`<twisty-player>`), Bluetooth smart cube support, and WCA-compliant scramble generation. It's overkill for this project but useful if extending to more advanced features later.

**cube.js (ldez/cubejs)** handles pure state manipulation without rendering—it implements the Kociemba two-phase algorithm that solves any cube in 22 moves or fewer. If adding an auto-solve feature later, integrate this library alongside the visual implementation.

## Data model and rotation mechanics

The **piece-based 3D coordinate model** is recommended for web implementations that need both logical state and visual rendering. Each of the 27 cubies (26 visible plus the hidden center) tracks its position as a THREE.Vector3 coordinate:

```javascript
class Cubie {
  constructor(x, y, z) {
    this.position = new THREE.Vector3(x, y, z);
    this.mesh = null; // Three.js mesh reference
    this.homePosition = new THREE.Vector3(x, y, z);
  }
}

// Create all cubies in a -1 to 1 coordinate grid
const cubies = [];
for (let x = -1; x <= 1; x++) {
  for (let y = -1; y <= 1; y++) {
    for (let z = -1; z <= 1; z++) {
      cubies.push(new Cubie(x, y, z));
    }
  }
}
```

**Face rotation uses a temporary group pattern.** When turning a face, the nine affected cubies are temporarily parented to a THREE.Group, the group is animated to rotate 90°, then the cubies are returned to the scene while preserving their world transforms:

```javascript
function rotateFace(axis, layer, direction) {
  const pivot = new THREE.Group();
  scene.add(pivot);
  
  // Filter cubies on this layer (e.g., all where x === 1 for R face)
  const faceCubies = cubies.filter(c => 
    Math.round(c.position[axis]) === layer
  );
  
  // Temporarily parent to pivot
  faceCubies.forEach(c => pivot.attach(c.mesh));
  
  // Animate, then cleanup
  gsap.to(pivot.rotation, {
    [axis]: direction * Math.PI / 2,
    duration: 0.3,
    ease: "power2.inOut",
    onComplete: () => {
      faceCubies.forEach(c => scene.attach(c.mesh));
      scene.remove(pivot);
      updateLogicalPositions(faceCubies);
    }
  });
}
```

The critical method is `attach()` rather than `add()`—it preserves world transforms when re-parenting, which is essential for correct cube mechanics.

**Distinguishing cube rotation from face turns** requires tracking user gesture context. Whole-cube rotation should use Three.js OrbitControls for drag-and-rotate behavior when clicking the background or holding a modifier key. Face turns are triggered when dragging on a specific cubie—the drag direction relative to the clicked face determines which layer rotates which way.

## Solve detection is straightforward

For single-face detection (the project requirement), check whether all nine stickers on a face share the same color. Since center pieces never move, compare all face stickers to the center:

```javascript
function isFaceSolved(faceColor, faceCubies) {
  return faceCubies.every(cubie => {
    const faceSticker = cubie.getFaceColor(faceColor);
    return faceSticker === faceColor;
  });
}

// Check after each move completes
function checkForSolvedFaces() {
  const faces = ['white', 'yellow', 'green', 'blue', 'orange', 'red'];
  for (const face of faces) {
    if (isFaceSolved(face, getCubiesOnFace(face))) {
      triggerUnlockAnimation(face);
      return;
    }
  }
}
```

The check should run in the animation's `onComplete` callback—not during animation—to avoid false positives from intermediate states.

## The explosion animation combines GSAP easing with emissive glow

The "sci-fi unlock" effect has three phases: a brief glow-up, outward expansion with stagger, and optional collapse or transition. Each cubie's expansion direction is calculated as a vector from the face center to its position:

```javascript
function triggerUnlockAnimation(faceCubies, faceCenter) {
  const timeline = gsap.timeline();
  
  // Phase 1: Glow up (0.15s)
  faceCubies.forEach(cubie => {
    timeline.to(cubie.mesh.material, {
      emissiveIntensity: 0.4,
      duration: 0.15
    }, 0);
  });
  
  // Phase 2: Expand outward with stagger
  faceCubies.forEach((cubie, i) => {
    const direction = new THREE.Vector3()
      .subVectors(cubie.position, faceCenter)
      .normalize();
    
    const targetPos = cubie.position.clone()
      .add(direction.multiplyScalar(0.4));
    
    timeline.to(cubie.mesh.position, {
      x: targetPos.x,
      y: targetPos.y,
      z: targetPos.z,
      duration: 0.5,
      ease: "back.out(1.4)"  // Overshoot then settle
    }, 0.1 + (i * 0.025));   // Staggered start
  });
  
  // Phase 3: Transition to website section
  timeline.call(() => navigateToSection(faceColor), null, "+=0.3");
  
  return timeline;
}
```

The key easing choices: **`back.out(1.4)`** for the expansion creates the dramatic "unlock" feel with a subtle overshoot before settling. For any collapse animation, **`elastic.out(1, 0.6)`** provides a satisfying spring-like return. GSAP's stagger parameter (each cubie starting 25ms after the previous) creates a rippling wave effect.

**Adding bloom glow** requires post-processing setup with UnrealBloomPass:

```javascript
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.4,   // Strength - subtle
  1.2,   // Radius
  0.85   // Threshold
));
```

During the unlock animation, animating each cubie's `material.emissiveIntensity` from 0 to 0.4 creates the glowing effect that the bloom pass amplifies.

## Achieving polished visuals with PBR materials

For a modern, polished aesthetic, use **MeshPhysicalMaterial** with clearcoat for subtle glossiness:

```javascript
const cubieMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xff0000,           // Face color
  roughness: 0.2,            // Fairly smooth
  metalness: 0,              // Plastic, not metal
  clearcoat: 0.4,            // Subtle glossy layer
  clearcoatRoughness: 0.1,
  emissive: 0xff0000,        // Same color for glow
  emissiveIntensity: 0       // Start with no glow
});
```

**Environment mapping is essential** for PBR materials to look correct—without it, metallic and reflective surfaces appear flat black. Load an HDR environment map from Poly Haven (free, CC0 license):

```javascript
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

new RGBELoader().load('studio_small_08_1k.hdr', (texture) => {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = texture;  // All PBR materials reflect this
  scene.backgroundBlurriness = 0.5;  // Optional: blur visible background
});
```

Use **1K resolution HDRIs** for reflections—higher resolutions are unnecessary unless the environment is visible as the background. The "studio" HDRIs from Poly Haven work well for product-like presentations; "outdoor" HDRIs suit sci-fi aesthetics.

## Recommended project architecture

Organize the codebase into clear modules separating concerns:

```
src/
├── main.js              # Entry point, scene setup, render loop
├── cube/
│   ├── Cube.js          # Main cube class, orchestrates everything
│   ├── Cubie.js         # Individual cubie with position and mesh
│   ├── CubeState.js     # Logical state management
│   └── CubeMaterials.js # Material definitions for faces
├── controls/
│   ├── CubeControls.js  # Raycasting, gesture detection
│   └── FaceRotation.js  # Face turn logic and animation
├── animation/
│   ├── MoveQueue.js     # Queue sequential moves
│   └── UnlockAnimation.js # Explosion effect
├── detection/
│   └── SolveDetector.js # Face solve checking
└── utils/
    └── constants.js     # Face colors, axis mappings
```

The **Cube.js** class serves as the central orchestrator, instantiating cubies, managing the move queue, and coordinating between controls and state. **CubeState.js** tracks logical positions independently from Three.js transforms, enabling solve detection without querying 3D positions. **MoveQueue.js** ensures animations execute sequentially using an async/await pattern.

## Build sequence for learning development

The recommended implementation order builds incrementally, validating each layer before adding complexity:

**Phase 1: Static cube rendering (Days 1-2)**
Set up Three.js scene, camera, and renderer. Create 27 cubie meshes positioned in a 3×3×3 grid. Apply solid color materials to each face. Add OrbitControls for whole-cube rotation. Verify the cube displays correctly and can be rotated to view all sides.

**Phase 2: Face rotation mechanics (Days 3-5)**
Implement the temporary group pattern for face rotation. Start with keyboard controls (press R for R move, etc.). Add GSAP for smooth 90° animated rotations. Implement the move queue for sequential execution. Test all 18 basic moves (R, R', R2, L, L', L2, etc.).

**Phase 3: Mouse/drag interaction (Days 6-8)**
Add raycasting to detect which cubie was clicked. Track drag gestures to determine rotation direction. Map drag direction to appropriate face rotation. Disable OrbitControls during face rotation gestures.

**Phase 4: Solve detection (Day 9)**
Implement isFaceSolved() checking. Hook solve detection into the move queue's completion callback. Log when a face is solved to verify detection works.

**Phase 5: Unlock animation (Days 10-12)**
Calculate explosion vectors from face center to each cubie. Implement GSAP timeline for expand/contract sequence. Add emissive glow animation synchronized with expansion. Test with each face color.

**Phase 6: Visual polish (Days 13-15)**
Upgrade to MeshPhysicalMaterial with clearcoat. Add HDR environment mapping. Implement UnrealBloomPass for glow enhancement. Tune material properties and lighting for desired aesthetic.

**Phase 7: Website integration (Day 16+)**
Add scramble function to initialize cube in mixed state. Connect unlock animation completion to navigation. Add any UI elements (instructions, reset button).

## Key resources and starting points

- **The Cube repository**: https://github.com/bsehovac/the-cube — Fork and modify this as your base
- **Cuber for learning**: https://github.com/stewdio/Cuber-DEMO — Study the documentation and architecture
- **Discover three.js book**: https://discoverthreejs.com/book/first-steps/ — Free comprehensive guide
- **Object hierarchies**: https://discoverthreejs.com/book/first-steps/organizing-with-group/
- **GSAP with Three.js**: https://spin.atomicobject.com/animations-threejs-gsap/
- **Environment maps tutorial**: https://sbcode.net/threejs/environment-maps/
- **Poly Haven HDRIs**: https://polyhaven.com/hdris — Free CC0 environment maps
- **Ruwix notation guide**: https://ruwix.com/the-rubiks-cube/notation/ — Standard move notation reference
- **UnrealBloomPass example**: https://threejs.org/examples/webgl_postprocessing_unreal_bloom.html
- **GSAP ease visualizer**: https://gsap.com/resources/getting-started/Easing/

The combination of Three.js's accessible architecture, abundant Rubik's cube examples, and GSAP's powerful animation system makes this an achievable learning project that will produce a polished, professional result.