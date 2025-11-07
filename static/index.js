// Initialize Lucide icons
lucide.createIcons();

// Mobile menu toggle
const menuBtn = document.getElementById("menuBtn");
const mobileMenu = document.getElementById("mobileMenu");

menuBtn.addEventListener("click", () => {
  mobileMenu.classList.toggle("open");
});

// Close mobile menu when clicking links
mobileMenu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mobileMenu.classList.remove("open");
  });
});

// Canvas Animation
function n(e) {
  this.init(e || {});
}
n.prototype = {
  init: function (e) {
    this.phase = e.phase || 0;
    this.offset = e.offset || 0;
    this.frequency = e.frequency || 0.001;
    this.amplitude = e.amplitude || 1;
  },
  update: function () {
    return (
      (this.phase += this.frequency),
      (window.canvasE = this.offset + Math.sin(this.phase) * this.amplitude)
    );
  },
  value: function () {
    return window.canvasE;
  },
};

function Line(e) {
  this.init(e || {});
}

Line.prototype = {
  init: function (e) {
    this.spring = e.spring + 0.1 * Math.random() - 0.05;
    this.friction = window.E.friction + 0.01 * Math.random() - 0.005;
    this.nodes = [];
    for (var t, n = 0; n < window.E.size; n++) {
      t = new Node();
      t.x = window.pos.x;
      t.y = window.pos.y;
      this.nodes.push(t);
    }
  },
  update: function () {
    let e = this.spring,
      t = this.nodes[0];
    t.vx += (window.pos.x - t.x) * e;
    t.vy += (window.pos.y - t.y) * e;
    for (var n, i = 0, a = this.nodes.length; i < a; i++)
      (t = this.nodes[i]),
        0 < i &&
          ((n = this.nodes[i - 1]),
          (t.vx += (n.x - t.x) * e),
          (t.vy += (n.y - t.y) * e),
          (t.vx += n.vx * window.E.dampening),
          (t.vy += n.vy * window.E.dampening)),
        (t.vx *= this.friction),
        (t.vy *= this.friction),
        (t.x += t.vx),
        (t.y += t.vy),
        (e *= window.E.tension);
  },
  draw: function () {
    let e,
      t,
      n = this.nodes[0].x,
      i = this.nodes[0].y;
    window.ctx.beginPath();
    window.ctx.moveTo(n, i);
    for (var a = 1, o = this.nodes.length - 2; a < o; a++) {
      e = this.nodes[a];
      t = this.nodes[a + 1];
      n = 0.5 * (e.x + t.x);
      i = 0.5 * (e.y + t.y);
      window.ctx.quadraticCurveTo(e.x, e.y, n, i);
    }
    e = this.nodes[a];
    t = this.nodes[a + 1];
    window.ctx.quadraticCurveTo(e.x, e.y, t.x, t.y);
    window.ctx.stroke();
    window.ctx.closePath();
  },
};

function onMousemove(e) {
  function o() {
    window.lines = [];
    for (let e = 0; e < window.E.trails; e++)
      window.lines.push(
        new Line({ spring: 0.45 + (e / window.E.trails) * 0.025 })
      );
  }
  function c(e) {
    e.touches
      ? ((window.pos.x = e.touches[0].pageX),
        (window.pos.y = e.touches[0].pageY))
      : ((window.pos.x = e.clientX), (window.pos.y = e.clientY)),
      e.preventDefault();
  }
  function l(e) {
    1 == e.touches.length &&
      ((window.pos.x = e.touches[0].pageX),
      (window.pos.y = e.touches[0].pageY));
  }
  document.removeEventListener("mousemove", onMousemove),
    document.removeEventListener("touchstart", onMousemove),
    document.addEventListener("mousemove", c),
    document.addEventListener("touchmove", c),
    document.addEventListener("touchstart", l),
    c(e),
    o(),
    render();
}

function render() {
  if (window.ctx.running) {
    window.ctx.globalCompositeOperation = "source-over";
    window.ctx.clearRect(
      0,
      0,
      window.ctx.canvas.width,
      window.ctx.canvas.height
    );
    window.ctx.globalCompositeOperation = "lighter";
    window.ctx.strokeStyle =
      "hsla(" + Math.round(window.f.update()) + ",100%,50%,0.025)";
    window.ctx.lineWidth = 10;
    for (var e, t = 0; t < window.E.trails; t++) {
      (e = window.lines[t]).update();
      e.draw();
    }
    window.ctx.frame++;
    window.requestAnimationFrame(render);
  }
}

function resizeCanvas() {
  window.ctx.canvas.width = window.innerWidth - 20;
  window.ctx.canvas.height = window.innerHeight;
}

window.canvasE = 0;
window.pos = {};
window.lines = [];
window.E = {
  debug: true,
  friction: 0.5,
  trails: 80,
  size: 50,
  dampening: 0.025,
  tension: 0.99,
};

function Node() {
  this.x = 0;
  this.y = 0;
  this.vy = 0;
  this.vx = 0;
}

function renderCanvas() {
  window.ctx = document.getElementById("canvas").getContext("2d");
  if (!window.ctx) return;
  window.ctx.running = true;
  window.ctx.frame = 1;
  window.f = new n({
    phase: Math.random() * 2 * Math.PI,
    amplitude: 85,
    frequency: 0.0015,
    offset: 285,
  });
  document.addEventListener("mousemove", onMousemove);
  document.addEventListener("touchstart", onMousemove);
  document.body.addEventListener("orientationchange", resizeCanvas);
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("focus", () => {
    if (!window.ctx.running) {
      window.ctx.running = true;
      render();
    }
  });
  window.addEventListener("blur", () => {
    window.ctx.running = true;
  });
  resizeCanvas();
}

// Initialize canvas when page loads
window.addEventListener("load", renderCanvas);
