import * as THREE from 'three';

export class RaycasterHelper {
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  // Update mouse position from event
  updateMouse(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  // Get intersections with objects
  getIntersections(objects) {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    return this.raycaster.intersectObjects(objects, true);
  }

  // Get the first intersection
  getFirstIntersection(objects) {
    const intersections = this.getIntersections(objects);
    return intersections.length > 0 ? intersections[0] : null;
  }
}
