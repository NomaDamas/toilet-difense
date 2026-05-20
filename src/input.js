export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouse = { x: 0, y: 0, down: false, justClicked: false };
    this.keys = {};
    this.keyBuffer = "";
    this.bufferTime = 0;
    this.onClick = null;
    this.onKey = null;
    this._listeners = [];
    this._setup();
  }

  _setup() {
    const map = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const sx = this.canvas.width / rect.width;
      const sy = this.canvas.height / rect.height;
      this.mouse.x = (e.clientX - rect.left) * sx;
      this.mouse.y = (e.clientY - rect.top) * sy;
    };
    const onMove = (e) => map(e);
    const onDown = (e) => {
      map(e);
      this.mouse.down = true;
      this.mouse.justClicked = true;
      if (this.onClick) this.onClick(this.mouse.x, this.mouse.y, e.button || 0);
    };
    const onUp = () => {
      this.mouse.down = false;
    };
    const onContext = (e) => e.preventDefault();
    const onKey = (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.bufferTime = 1.5;
      if (/^[0-9a-zA-Z]$/.test(e.key)) {
        this.keyBuffer = (this.keyBuffer + e.key).slice(-12);
      }
      if (this.onKey) this.onKey(e);
    };
    const onKeyUp = (e) => {
      this.keys[e.key.toLowerCase()] = false;
    };
    this.canvas.addEventListener("mousemove", onMove);
    this.canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    this.canvas.addEventListener("contextmenu", onContext);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    this._listeners = [
      ["mousemove", onMove, this.canvas],
      ["mousedown", onDown, this.canvas],
      ["mouseup", onUp, window],
      ["contextmenu", onContext, this.canvas],
      ["keydown", onKey, window],
      ["keyup", onKeyUp, window],
    ];
  }

  consumeClick() {
    const c = this.mouse.justClicked;
    this.mouse.justClicked = false;
    return c;
  }

  update(dt) {
    if (this.bufferTime > 0) {
      this.bufferTime -= dt;
      if (this.bufferTime <= 0) {
        this.keyBuffer = "";
      }
    }
  }

  clearBuffer() {
    this.keyBuffer = "";
    this.bufferTime = 0;
  }
}
