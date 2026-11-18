// VELMARA HEAT — keyboard and mouse input: a pressed-key set plus edge-triggered
// action keys, so E (enter car) and F (fight) fire once per press, never repeat.

export class Input {
  constructor(canvas) {
    this.down = new Set();
    this.pressed = new Set();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.locked = false;
    this.canvas = canvas;
    this.onKeyDown = (event) => {
      if (event.repeat) return;
      this.down.add(event.code);
      this.pressed.add(event.code);
      if (event.code === 'Space') event.preventDefault();
    };
    this.onKeyUp = (event) => {
      this.down.delete(event.code);
    };
    this.onMouse = (event) => {
      this.mouseDX += event.movementX || 0;
      this.mouseDY += event.movementY || 0;
    };
    this.onBlur = () => {
      this.down.clear();
    };
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
    document.addEventListener('mousemove', this.onMouse);
    canvas.addEventListener('click', () => {
      if (!this.locked && canvas.requestPointerLock) canvas.requestPointerLock();
    });
    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
    });
  }

  axis() {
    let x = 0;
    let z = 0;
    if (this.down.has('KeyW') || this.down.has('ArrowUp')) z -= 1;
    if (this.down.has('KeyS') || this.down.has('ArrowDown')) z += 1;
    if (this.down.has('KeyA') || this.down.has('ArrowLeft')) x -= 1;
    if (this.down.has('KeyD') || this.down.has('ArrowRight')) x += 1;
    return { x, z };
  }

  sprinting() {
    return this.down.has('ShiftLeft') || this.down.has('ShiftRight');
  }

  wasPressed(code) {
    return this.pressed.has(code);
  }

  consumeMouse() {
    const dx = this.mouseDX;
    const dy = this.mouseDY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  endFrame() {
    this.pressed.clear();
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    document.removeEventListener('mousemove', this.onMouse);
  }
}
export function keyName(code) {
  return code.replace('Key', '').replace('Arrow', '');
}
