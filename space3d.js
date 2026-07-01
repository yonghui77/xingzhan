(() => {
  "use strict";

  const hex = (value, alpha = 1) => {
    const source = String(value || "#ffffff").replace("#", "");
    const full = source.length === 3 ? source.split("").map(char => char + char).join("") : source.slice(0, 6);
    return [
      parseInt(full.slice(0, 2), 16) / 255,
      parseInt(full.slice(2, 4), 16) / 255,
      parseInt(full.slice(4, 6), 16) / 255,
      alpha
    ];
  };
  const crossNormal = (a, b, c) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const length = Math.hypot(nx, ny, nz) || 1;
    return [nx / length, ny / length, nz / length];
  };
  const rotatePoint = (point, angle, tx, ty, tz = 0) => {
    const cosine = Math.cos(angle), sine = Math.sin(angle);
    return [
      tx + point[0] * cosine - point[1] * sine,
      ty + point[0] * sine + point[1] * cosine,
      tz + point[2]
    ];
  };

  class MeshBatch {
    constructor() {
      this.positions = [];
      this.normals = [];
      this.colors = [];
    }
    triangle(a, b, c, color) {
      const normal = crossNormal(a, b, c);
      [a, b, c].forEach(point => {
        this.positions.push(...point);
        this.normals.push(...normal);
        this.colors.push(...color);
      });
    }
    quad(a, b, c, d, color) {
      this.triangle(a, b, c, color);
      this.triangle(a, c, d, color);
    }
    box(x, y, z, sx, sy, sz, color, angle = 0) {
      const points = [
        [-sx, -sy, -sz], [sx, -sy, -sz], [sx, sy, -sz], [-sx, sy, -sz],
        [-sx, -sy, sz], [sx, -sy, sz], [sx, sy, sz], [-sx, sy, sz]
      ].map(point => rotatePoint(point, angle, x, y, z));
      this.quad(points[4], points[5], points[6], points[7], color);
      this.quad(points[1], points[0], points[3], points[2], color);
      this.quad(points[0], points[4], points[7], points[3], color);
      this.quad(points[5], points[1], points[2], points[6], color);
      this.quad(points[3], points[7], points[6], points[2], color);
      this.quad(points[0], points[1], points[5], points[4], color);
    }
    extrude(polygon, z0, z1, color, angle = 0, tx = 0, ty = 0) {
      const bottom = polygon.map(([x, y]) => rotatePoint([x, y, z0], angle, tx, ty));
      const top = polygon.map(([x, y]) => rotatePoint([x, y, z1], angle, tx, ty));
      for (let index = 1; index < top.length - 1; index++) this.triangle(top[0], top[index], top[index + 1], color);
      for (let index = 1; index < bottom.length - 1; index++) this.triangle(bottom[0], bottom[index + 1], bottom[index], color);
      for (let index = 0; index < polygon.length; index++) {
        const next = (index + 1) % polygon.length;
        this.quad(bottom[index], bottom[next], top[next], top[index], color);
      }
    }
    octahedron(x, y, z, radius, color, angle = 0, stretch = 1) {
      const points = [
        [0, 0, radius * stretch],
        [0, 0, -radius * .68],
        [radius, 0, 0],
        [0, radius * .82, 0],
        [-radius, 0, 0],
        [0, -radius * .82, 0]
      ].map(point => rotatePoint(point, angle, x, y, z));
      for (let index = 0; index < 4; index++) {
        const a = points[2 + index];
        const b = points[2 + (index + 1) % 4];
        this.triangle(points[0], a, b, color);
        this.triangle(points[1], b, a, color);
      }
    }
    ring(x, y, z, radius, thickness, color, rotation = 0, segments = 24) {
      for (let index = 0; index < segments; index++) {
        const angle = rotation + index / segments * Math.PI * 2;
        const arc = Math.PI * 2 * radius / segments * .38;
        this.box(
          x + Math.cos(angle) * radius,
          y + Math.sin(angle) * radius,
          z,
          thickness,
          arc,
          Math.max(1.2, thickness * .42),
          color,
          angle
        );
      }
    }
    ship(x, y, z, size, hull, angle, enemy = false) {
      const model = hull?.model || "pioneer";
      const bodyColor = hex(enemy ? "#d94761" : hull?.color || "#39ddff", .96);
      const accent = hex(enemy ? "#ffb5c0" : hull?.accent || "#dffcff", .98);
      const dark = hex(enemy ? "#35111c" : "#14263b", .98);
      const glass = hex(enemy ? "#ff7188" : "#64e8ff", .92);
      const dimensions = {
        courier: { width: 9, length: 37, wing: 29, engines: [-7, 0, 7] },
        prospector: { width: 20, length: 29, wing: 43, engines: [-14, 14] },
        vanguard: { width: 23, length: 34, wing: 42, engines: [-16, -6, 6, 16] },
        pioneer: { width: 15, length: 32, wing: 35, engines: [-10, 10] }
      }[model] || { width: 15, length: 32, wing: 35, engines: [-10, 10] };
      const s = size;
      const body = [
        [0, -dimensions.length * s],
        [dimensions.width * s, -8 * s],
        [dimensions.width * .75 * s, 25 * s],
        [0, 31 * s],
        [-dimensions.width * .75 * s, 25 * s],
        [-dimensions.width * s, -8 * s]
      ];
      const leftWing = [
        [-dimensions.width * .5 * s, -9 * s],
        [-dimensions.wing * s, 9 * s],
        [-dimensions.wing * .72 * s, 25 * s],
        [-dimensions.width * .35 * s, 17 * s]
      ];
      const rightWing = leftWing.map(([px, py]) => [-px, py]);
      this.extrude(leftWing, z, z + 5 * s, dark, angle, x, y);
      this.extrude(rightWing, z, z + 5 * s, dark, angle, x, y);
      this.extrude(body, z + 1 * s, z + 11 * s, bodyColor, angle, x, y);
      this.extrude([
        [0, -22 * s], [6 * s, -9 * s], [5 * s, 6 * s], [-5 * s, 6 * s], [-6 * s, -9 * s]
      ], z + 11 * s, z + 15 * s, glass, angle, x, y);
      this.box(x, y, z + 14 * s, 2.2 * s, 18 * s, 1.2 * s, accent, angle);
      dimensions.engines.forEach(offset => {
        const cosine = Math.cos(angle), sine = Math.sin(angle);
        const ex = x + offset * s * cosine - 20 * s * sine;
        const ey = y + offset * s * sine + 20 * s * cosine;
        this.box(ex, ey, z + 5 * s, 3.4 * s, 10 * s, 4.2 * s, dark, angle);
        const flameX = x + offset * s * cosine - 31 * s * sine;
        const flameY = y + offset * s * sine + 31 * s * cosine;
        this.octahedron(flameX, flameY, z + 4 * s, 3.7 * s, hex(enemy ? "#ff617b" : hull?.color || "#39ddff", .85), angle, 1.8);
      });
    }
  }

  class WebGLRenderer {
    constructor(canvas, alpha = false) {
      this.canvas = canvas;
      this.alpha = alpha;
      this.gl = null;
      this.program = null;
      this.buffers = {};
      this.available = this.init();
    }
    shader(type, source) {
      const gl = this.gl;
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    }
    init() {
      if (!this.canvas) return false;
      try {
        const gl = this.canvas.getContext("webgl", {
          alpha: this.alpha,
          antialias: true,
          depth: true,
          powerPreference: "high-performance",
          premultipliedAlpha: false
        });
        if (!gl) return false;
        this.gl = gl;
        const vertex = this.shader(gl.VERTEX_SHADER, `
          attribute vec3 aPosition;
          attribute vec3 aNormal;
          attribute vec4 aColor;
          uniform vec2 uViewport;
          uniform vec2 uCamera;
          uniform float uScale;
          uniform float uTilt;
          uniform float uOrbit;
          uniform float uYaw;
          uniform float uPitch;
          uniform float uPerspective;
          varying vec4 vColor;
          varying float vLight;
          void main(){
            vec3 relative = aPosition - vec3(uCamera, 0.0);
            vec2 screen;
            float depth;
            if(uOrbit > 0.5){
              float cy = cos(uYaw), sy = sin(uYaw);
              float cp = cos(uPitch), sp = sin(uPitch);
              vec3 yawed = vec3(relative.x * cy - relative.y * sy, relative.x * sy + relative.y * cy, relative.z);
              vec3 viewed = vec3(yawed.x, yawed.y * cp - yawed.z * sp, yawed.y * sp + yawed.z * cp);
              float perspectiveScale = max(0.58, 1.0 + viewed.z * uPerspective);
              screen = viewed.xy * uScale / perspectiveScale;
              depth = clamp(-viewed.z * 0.003, -0.95, 0.95);
            }else{
              screen = vec2(relative.x * uScale, relative.y * uScale - relative.z * uTilt * uScale);
              depth = clamp(relative.y * 0.00008 - relative.z * 0.0022, -0.95, 0.95);
            }
            vec2 clip = screen / (uViewport * 0.5);
            gl_Position = vec4(clip.x, -clip.y, depth, 1.0);
            vec3 lightDirection = normalize(vec3(-0.45, -0.65, 1.0));
            vLight = 0.26 + max(0.0, dot(normalize(aNormal), lightDirection)) * 0.74;
            vColor = aColor;
          }
        `);
        const fragment = this.shader(gl.FRAGMENT_SHADER, `
          precision mediump float;
          varying vec4 vColor;
          varying float vLight;
          void main(){
            vec3 bloom = vColor.rgb * (0.58 + vLight * 0.68);
            gl_FragColor = vec4(bloom, vColor.a);
          }
        `);
        const program = gl.createProgram();
        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
        this.program = program;
        ["position", "normal", "color"].forEach(name => this.buffers[name] = gl.createBuffer());
        this.locations = {
          position: gl.getAttribLocation(program, "aPosition"),
          normal: gl.getAttribLocation(program, "aNormal"),
          color: gl.getAttribLocation(program, "aColor"),
          viewport: gl.getUniformLocation(program, "uViewport"),
          camera: gl.getUniformLocation(program, "uCamera"),
          scale: gl.getUniformLocation(program, "uScale"),
          tilt: gl.getUniformLocation(program, "uTilt"),
          orbit: gl.getUniformLocation(program, "uOrbit"),
          yaw: gl.getUniformLocation(program, "uYaw"),
          pitch: gl.getUniformLocation(program, "uPitch"),
          perspective: gl.getUniformLocation(program, "uPerspective")
        };
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        return true;
      } catch (error) {
        console.warn("WebGL 3D fallback:", error.message);
        return false;
      }
    }
    resize() {
      if (!this.available) return null;
      const rect = this.canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      const pixelRatio = Math.min(devicePixelRatio || 1, 1.75);
      const width = Math.max(1, Math.round(rect.width * pixelRatio));
      const height = Math.max(1, Math.round(rect.height * pixelRatio));
      if (this.canvas.width !== width || this.canvas.height !== height) {
        this.canvas.width = width;
        this.canvas.height = height;
      }
      this.gl.viewport(0, 0, width, height);
      return { width: rect.width, height: rect.height };
    }
    upload(name, values, size) {
      const gl = this.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers[name]);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.DYNAMIC_DRAW);
      gl.enableVertexAttribArray(this.locations[name]);
      gl.vertexAttribPointer(this.locations[name], size, gl.FLOAT, false, 0, 0);
    }
    render(batch, options = {}) {
      const viewport = this.resize();
      if (!viewport || !batch.positions.length) return false;
      const gl = this.gl;
      const clear = options.clear || [0.01, 0.025, 0.065, this.alpha ? 0 : 1];
      gl.clearColor(clear[0], clear[1], clear[2], clear[3]);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.program);
      this.upload("position", batch.positions, 3);
      this.upload("normal", batch.normals, 3);
      this.upload("color", batch.colors, 4);
      gl.uniform2f(this.locations.viewport, viewport.width, viewport.height);
      gl.uniform2f(this.locations.camera, options.camera?.x || 0, options.camera?.y || 0);
      gl.uniform1f(this.locations.scale, options.scale || 1);
      gl.uniform1f(this.locations.tilt, options.tilt ?? .62);
      gl.uniform1f(this.locations.orbit, options.orbit ? 1 : 0);
      gl.uniform1f(this.locations.yaw, options.yaw || 0);
      gl.uniform1f(this.locations.pitch, options.pitch || 0);
      gl.uniform1f(this.locations.perspective, options.perspective || 0);
      gl.drawArrays(gl.TRIANGLES, 0, batch.positions.length / 3);
      return true;
    }
  }

  const flightCanvas = document.querySelector("#space3DCanvas");
  const dockCanvas = document.querySelector("#station3DCanvas");
  const viewerCanvas = document.querySelector("#shipViewerCanvas");
  const flightRenderer = new WebGLRenderer(flightCanvas, false);
  const dockRenderer = new WebGLRenderer(dockCanvas, true);
  const viewerRenderer = new WebGLRenderer(viewerCanvas, true);
  const viewerControl = { yaw: -.35, pitch: .88, zoom: 1, dragging: false, lastX: 0, lastY: 0, auto: true };
  const starSeeds = Array.from({ length: 180 }, (_, index) => ({
    x: ((index * 977 + 113) % 5000) - 2500,
    y: ((index * 577 + 389) % 5000) - 2500,
    z: -26 + (index % 7) * 3,
    size: .45 + (index % 5) * .16
  }));

  const buildStation = (batch, station, time, color) => {
    batch.ring(station.x, station.y, 12, 68, 3, hex(color, .72), time * .00008, 22);
    batch.ring(station.x, station.y, 25, 48, 4, hex("#a980ff", .55), -time * .00013, 16);
    batch.octahedron(station.x, station.y, 18, 29, hex("#18334b", 1), time * .00005, 1.25);
    batch.octahedron(station.x, station.y, 43, 9, hex("#8ff2ff", .95), -time * .0001, 1.4);
  };
  const buildOutpost = (batch, outpost, time) => {
    if (!outpost?.active) return;
    const color = outpost.shield > 0 ? "#a980ff" : "#ff617b";
    batch.ring(outpost.x, outpost.y, 12, 76, 3.2, hex(color, .68), time * .00016, 18);
    for (let index = 0; index < 5; index++) {
      const angle = time * -.00012 + index / 5 * Math.PI * 2;
      batch.box(outpost.x + Math.cos(angle) * 44, outpost.y + Math.sin(angle) * 44, 12, 8, 31, 7, hex("#52172b", .96), angle);
    }
    batch.octahedron(outpost.x, outpost.y, 26, 27, hex("#7b2943", 1), time * -.0001, 1.15);
  };
  const hullVisual = hull => ({
    model: hull?.visual?.model || hull?.model || "pioneer",
    color: hull?.color || "#39ddff",
    accent: hull?.accent || "#e9ffff"
  });

  function renderFlight(scene) {
    const enabled = flightRenderer.available && scene?.depth !== "off";
    if (flightCanvas) flightCanvas.classList.toggle("active", !!enabled);
    if (!enabled) return false;
    const batch = new MeshBatch();
    const quality = scene.quality || "high";
    const color = scene.systemColor || "#39ddff";
    const viewRadiusX = innerWidth * .68;
    const viewRadiusY = innerHeight * .72;
    const starLimit = quality === "low" ? 50 : quality === "medium" ? 105 : 180;
    starSeeds.slice(0, starLimit).forEach((star, index) => {
      if (Math.abs(star.x - scene.camera.x) > viewRadiusX * 1.5 || Math.abs(star.y - scene.camera.y) > viewRadiusY * 1.5) return;
      batch.octahedron(star.x, star.y, star.z, star.size, hex(index % 13 ? "#b6d5ec" : color, .72), 0, 1);
    });
    const gridStep = 180;
    const startX = Math.floor((scene.camera.x - viewRadiusX) / gridStep) * gridStep;
    const startY = Math.floor((scene.camera.y - viewRadiusY) / gridStep) * gridStep;
    for (let x = startX; x <= scene.camera.x + viewRadiusX; x += gridStep) batch.box(x, scene.camera.y, -18, .45, viewRadiusY, .35, hex(color, .055));
    for (let y = startY; y <= scene.camera.y + viewRadiusY; y += gridStep) batch.box(scene.camera.x, y, -18, viewRadiusX, .45, .35, hex(color, .055));
    buildStation(batch, scene.station, scene.time, color);
    buildOutpost(batch, scene.outpost, scene.time);
    scene.asteroids.forEach(asteroid => {
      const asteroidColor = asteroid.resource === "crystal" ? "#6c4aa0" : "#354b5c";
      batch.octahedron(asteroid.x, asteroid.y, 4, asteroid.r * .88, hex(asteroidColor, 1), asteroid.rotation, .82 + (asteroid.id % 3) * .14);
      if (asteroid.resource === "crystal") batch.octahedron(asteroid.x + 2, asteroid.y - 2, asteroid.r * .65, asteroid.r * .32, hex("#b995ff", .9), -asteroid.rotation, 1.6);
    });
    scene.loot.forEach(loot => batch.box(loot.x, loot.y, 8, 7, 7, 7, hex(loot.color || "#51e7a6", .9), scene.time * .001));
    scene.enemies.forEach(enemy => batch.ship(enemy.x, enemy.y, 6, Math.max(.45, enemy.r / 27), { model: enemy.type === "gunship" ? "vanguard" : enemy.type === "missile" ? "prospector" : "courier" }, enemy.angle + Math.PI / 2, true));
    scene.ai.forEach(pilot => batch.ship(pilot.x, pilot.y, 4, .34, { model: "courier", color: pilot.color, accent: "#dffcff" }, pilot.angle + Math.PI / 2));
    [...scene.bullets, ...scene.enemyBullets].forEach(bullet => batch.octahedron(bullet.x, bullet.y, 12, Math.max(2.2, bullet.r * 1.35), hex(bullet.color || "#ffffff", .95), 0, 1.8));
    if (!scene.docked) {
      const hull = hullVisual(scene.hull);
      batch.ship(scene.player.x, scene.player.y, 8, (scene.hull?.visual?.scale || 1) * .72, hull, scene.player.angle + Math.PI / 2);
      if (scene.shield > 0) batch.ring(scene.player.x, scene.player.y, 16, scene.player.radius * 1.75, 1.25, hex("#53e8ff", .28), scene.time * .0002, 20);
    }
    const systemRgb = hex(color);
    const clear = [systemRgb[0] * .035, systemRgb[1] * .055, systemRgb[2] * .085 + .018, 1];
    return flightRenderer.render(batch, {
      camera: scene.camera,
      clear,
      scale: 1,
      tilt: scene.depth === "enhanced" ? .82 : .62
    });
  }

  function renderDock(scene) {
    const enabled = dockRenderer.available && scene?.depth !== "off" && !dockCanvas?.closest(".station-panel")?.classList.contains("hidden");
    if (dockCanvas) dockCanvas.classList.toggle("active", !!enabled);
    if (!enabled) return false;
    const batch = new MeshBatch();
    const time = scene.time;
    const hull = hullVisual(scene.hull);
    for (let index = -5; index <= 5; index++) {
      batch.box(index * 36, 50, -11, .6, 210, .5, hex("#4fe4ff", .08));
      batch.box(0, index * 36 + 45, -11, 210, .6, .5, hex("#4fe4ff", .08));
    }
    batch.ring(0, 25, 2, 150, 4, hex("#39ddff", .24), time * .00004, 28);
    batch.ring(0, 25, 28, 108, 3, hex("#a980ff", .2), -time * .00007, 22);
    for (const side of [-1, 1]) {
      batch.box(side * 180, 25, 35, 10, 205, 42, hex("#182a42", .85));
      batch.box(side * 146, -115, 55, 34, 8, 55, hex("#28465d", .72), side * .18);
    }
    batch.box(0, 205, 8, 210, 10, 9, hex("#1b344c", .9));
    batch.ship(0, 10, 18, 2.1, hull, Math.sin(time * .0003) * .12);
    batch.ring(0, 12, 36, 83, 1.4, hex("#53e8ff", .28), time * .00014, 24);
    return dockRenderer.render(batch, {
      camera: { x: 0, y: 22 },
      clear: [0, 0, 0, 0],
      scale: Math.max(.74, Math.min(1.18, (dockCanvas.clientWidth || 560) / 560)),
      tilt: .76
    });
  }

  function renderViewer(scene) {
    const panel = viewerCanvas?.closest("#shipViewerPanel");
    const enabled = viewerRenderer.available && scene && panel && !panel.classList.contains("hidden");
    if (!enabled) return false;
    if (viewerControl.auto && !viewerControl.dragging) viewerControl.yaw = scene.time * .00018;
    const batch = new MeshBatch();
    const hull = hullVisual(scene.hull);
    const modelScale = 3.15;
    batch.ring(0, 6, -16, 112, 2.4, hex(hull.color, .24), scene.time * .0001, 28);
    batch.ring(0, 6, 0, 82, 1.4, hex("#a980ff", .16), -scene.time * .00014, 24);
    batch.ship(0, 0, 0, modelScale, hull, 0);
    const fitted = scene.fitted || {};
    if (fitted.weapon) {
      batch.box(-45, -18, 30, 5, 17, 4, hex("#ff7a92", .92), 0);
      batch.box(45, -18, 30, 5, 17, 4, hex("#ff7a92", .92), 0);
    }
    if (fitted.defense) batch.ring(0, 0, 28, 98, 1.5, hex("#53e8ff", .24), scene.time * .0002, 26);
    if (fitted.industrial) {
      batch.box(-58, 24, 17, 10, 20, 8, hex("#ffc45c", .78), 0);
      batch.box(58, 24, 17, 10, 20, 8, hex("#ffc45c", .78), 0);
    }
    if (fitted.electronic) batch.octahedron(0, -52, 38, 7, hex("#c4a1ff", .9), scene.time * .0004, 1.5);
    return viewerRenderer.render(batch, {
      camera: { x: 0, y: 0 },
      clear: [0, 0, 0, 0],
      scale: 2.15 * viewerControl.zoom,
      orbit: true,
      yaw: viewerControl.yaw,
      pitch: viewerControl.pitch,
      perspective: .0024
    });
  }

  if (viewerCanvas) {
    viewerCanvas.addEventListener("pointerdown", event => {
      viewerControl.dragging = true;
      viewerControl.auto = false;
      viewerControl.lastX = event.clientX;
      viewerControl.lastY = event.clientY;
      viewerCanvas.setPointerCapture?.(event.pointerId);
    });
    viewerCanvas.addEventListener("pointermove", event => {
      if (!viewerControl.dragging) return;
      const dx = event.clientX - viewerControl.lastX;
      const dy = event.clientY - viewerControl.lastY;
      viewerControl.yaw += dx * .008;
      viewerControl.pitch = Math.max(.24, Math.min(1.38, viewerControl.pitch + dy * .006));
      viewerControl.lastX = event.clientX;
      viewerControl.lastY = event.clientY;
    });
    const endDrag = () => { viewerControl.dragging = false; };
    viewerCanvas.addEventListener("pointerup", endDrag);
    viewerCanvas.addEventListener("pointercancel", endDrag);
    viewerCanvas.addEventListener("wheel", event => {
      event.preventDefault();
      viewerControl.auto = false;
      viewerControl.zoom = Math.max(.64, Math.min(1.48, viewerControl.zoom - event.deltaY * .001));
    }, { passive: false });
    viewerCanvas.addEventListener("dblclick", () => {
      viewerControl.auto = true;
      viewerControl.pitch = .88;
      viewerControl.zoom = 1;
    });
  }

  const available = flightRenderer.available && dockRenderer.available && viewerRenderer.available;
  document.body.classList.toggle("webgl3d", available);
  window.Space3D = {
    available,
    renderFlight,
    renderDock,
    renderViewer,
    resize() {
      flightRenderer.resize();
      dockRenderer.resize();
      viewerRenderer.resize();
    }
  };
})();
