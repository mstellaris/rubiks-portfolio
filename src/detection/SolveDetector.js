export class SolveDetector {
  constructor(cube) {
    this.cube = cube;
    this.solvedFaces = new Set();
  }

  // Check all faces and return newly solved ones
  checkAllFaces() {
    const faces = ['right', 'left', 'up', 'down', 'front', 'back'];
    const newlySolved = [];

    for (const face of faces) {
      const isSolved = this.isFaceSolved(face);
      const wasSolved = this.solvedFaces.has(face);

      if (isSolved && !wasSolved) {
        this.solvedFaces.add(face);
        newlySolved.push(face);
      } else if (!isSolved && wasSolved) {
        this.solvedFaces.delete(face);
      }
    }

    return newlySolved;
  }

  isFaceSolved(face) {
    const cubiesOnFace = this.getCubiesOnFace(face);

    if (cubiesOnFace.length !== 9) return false;

    // Get the color of the center cubie (which never changes position)
    const centerCubie = cubiesOnFace.find(c => this.isCenter(c, face));
    if (!centerCubie) return false;

    const centerColor = centerCubie.getColorOnFace(face);
    if (!centerColor) return false;

    // Check if all 9 cubies show the same color on this face
    return cubiesOnFace.every(cubie => {
      return cubie.getColorOnFace(face) === centerColor;
    });
  }

  getCubiesOnFace(face) {
    const { axis, layer } = this.faceToAxisLayer(face);
    return this.cube.cubies.filter(c => Math.round(c[axis]) === layer);
  }

  isCenter(cubie, face) {
    const { axis } = this.faceToAxisLayer(face);
    // Center piece has 0 on the other two axes
    const otherAxes = ['x', 'y', 'z'].filter(a => a !== axis);
    return otherAxes.every(a => cubie[a] === 0);
  }

  faceToAxisLayer(face) {
    const mapping = {
      right: { axis: 'x', layer: 1 },
      left: { axis: 'x', layer: -1 },
      up: { axis: 'y', layer: 1 },
      down: { axis: 'y', layer: -1 },
      front: { axis: 'z', layer: 1 },
      back: { axis: 'z', layer: -1 }
    };
    return mapping[face];
  }

  getFaceColor(face) {
    // Return the expected color for each face
    const colors = {
      right: 'red',
      left: 'orange',
      up: 'white',
      down: 'yellow',
      front: 'green',
      back: 'blue'
    };
    return colors[face];
  }
}
