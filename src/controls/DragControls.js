import { RaycasterHelper } from './Raycaster.js';

export class DragControls {
  constructor(cube, camera, canvas, orbitControls, viewState) {
    this.cube = cube;
    this.camera = camera;
    this.canvas = canvas;
    this.orbitControls = orbitControls;
    this.viewState = viewState;
    this.raycaster = new RaycasterHelper(camera, canvas);

    // Drag state
    this.isDragging = false;
    this.dragStart = null;
    this.clickedCubie = null;
    this.clickedFaceNormal = null;
    this.activePointerId = null;
    this.activeDragThreshold = 10;

    // Thresholds for detecting a drag vs click
    this.dragThreshold = 10; // pixels (mouse)
    this.touchDragThreshold = 20; // pixels (touch — fingers are less precise)

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Capture phase for pointerdown so it fires BEFORE OrbitControls (bubble phase)
    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this), true);
    this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
    this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
    this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this));
  }

  onPointerDown(event) {
    if (this.viewState && !this.viewState.isCubeInteractive) return;
    this.raycaster.updateMouse(event);

    // Get all cubie meshes
    const cubieMeshes = this.cube.cubies.map(c => c.mesh);
    const intersection = this.raycaster.getFirstIntersection(cubieMeshes);

    if (intersection) {
      // Prevent OrbitControls from processing this touch/click
      event.stopImmediatePropagation();

      // Capture pointer so we get move/up even if finger slides off canvas
      this.canvas.setPointerCapture(event.pointerId);
      this.activePointerId = event.pointerId;

      this.isDragging = true;
      this.dragStart = { x: event.clientX, y: event.clientY };
      this.clickedCubie = this.findCubieByMesh(intersection.object);
      this.clickedFaceNormal = intersection.face.normal.clone();

      // Transform normal to world space
      this.clickedFaceNormal.transformDirection(intersection.object.matrixWorld);

      // Use larger threshold for touch (fingers are less precise)
      this.activeDragThreshold = event.pointerType === 'touch'
        ? this.touchDragThreshold
        : this.dragThreshold;

      // Disable orbit controls while rotating a face
      this.orbitControls.enabled = false;
    }
  }

  onPointerMove(event) {
    if (!this.isDragging || !this.dragStart) return;
    if (event.pointerId !== this.activePointerId) return;

    const dx = event.clientX - this.dragStart.x;
    const dy = event.clientY - this.dragStart.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if we've dragged far enough
    if (distance > this.activeDragThreshold) {
      this.executeFaceRotation(dx, dy);
      this.resetDrag();
    }
  }

  onPointerUp(event) {
    if (event.pointerId !== this.activePointerId) return;
    if (this.activePointerId !== null) {
      this.canvas.releasePointerCapture(this.activePointerId);
    }
    this.resetDrag();
  }

  resetDrag() {
    this.isDragging = false;
    this.dragStart = null;
    this.clickedCubie = null;
    this.clickedFaceNormal = null;
    this.activePointerId = null;
    this.orbitControls.enabled = true;
  }

  findCubieByMesh(mesh) {
    return this.cube.cubies.find(c => c.mesh === mesh);
  }

  executeFaceRotation(dx, dy) {
    if (!this.clickedCubie || !this.clickedFaceNormal) return;

    // Determine which axis the clicked face is on
    const normal = this.clickedFaceNormal;
    const absX = Math.abs(normal.x);
    const absY = Math.abs(normal.y);
    const absZ = Math.abs(normal.z);

    let clickedAxis;

    if (absX > absY && absX > absZ) {
      clickedAxis = 'x';
    } else if (absY > absZ) {
      clickedAxis = 'y';
    } else {
      clickedAxis = 'z';
    }

    // Determine rotation axis and direction based on drag direction
    const { axis, direction } = this.determineRotation(clickedAxis, dx, dy);

    if (axis && direction) {
      // Get the layer to rotate
      const rotationLayer = this.clickedCubie[axis];
      this.cube.rotate(axis, Math.round(rotationLayer), direction);
    }
  }

  determineRotation(clickedAxis, dx, dy) {
    // Determine if the drag is more horizontal or vertical
    const isHorizontal = Math.abs(dx) > Math.abs(dy);
    const isPositiveX = dx > 0;
    const isPositiveY = dy > 0;

    if (clickedAxis === 'z') {
      // Front or back face clicked
      if (isHorizontal) {
        // Horizontal drag rotates around Y
        return {
          axis: 'y',
          direction: isPositiveX ? 1 : -1
        };
      } else {
        // Vertical drag rotates around X
        return {
          axis: 'x',
          direction: isPositiveY ? -1 : 1
        };
      }
    } else if (clickedAxis === 'y') {
      // Top or bottom face clicked
      if (isHorizontal) {
        // Horizontal drag rotates around Z
        return {
          axis: 'z',
          direction: isPositiveX ? -1 : 1
        };
      } else {
        // Vertical drag rotates around X
        return {
          axis: 'x',
          direction: isPositiveY ? -1 : 1
        };
      }
    } else {
      // Left or right face clicked (x-axis)
      if (isHorizontal) {
        // Horizontal drag rotates around Y
        return {
          axis: 'y',
          direction: isPositiveX ? 1 : -1
        };
      } else {
        // Vertical drag rotates around Z
        return {
          axis: 'z',
          direction: isPositiveY ? 1 : -1
        };
      }
    }
  }
}
