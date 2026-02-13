export class ViewState {
  constructor() {
    this.current = 'cube'; // 'cube' | 'transitioning' | 'content'
    this.activeFace = null;
  }

  set(state, face = null) {
    this.current = state;
    this.activeFace = face;
  }

  get isCubeInteractive() {
    return this.current === 'cube';
  }
}
