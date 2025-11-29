// Queue to ensure moves execute one at a time
export class MoveQueue {
  constructor() {
    this.queue = [];
    this.isAnimating = false;
  }

  add(moveFunction) {
    return new Promise((resolve) => {
      this.queue.push({ moveFunction, resolve });
      this.processNext();
    });
  }

  async processNext() {
    if (this.isAnimating || this.queue.length === 0) return;

    this.isAnimating = true;
    const { moveFunction, resolve } = this.queue.shift();

    await moveFunction();

    this.isAnimating = false;
    resolve();
    this.processNext();
  }
}
