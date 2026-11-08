
"use strict";

// MISSION 249 - WebGL 3D Engine
const container = document.querySelector(".game-container");

container.querySelector("#gameCanvas")?.remove();

const canvas = document.createElement("canvas");
canvas.id = "gameCanvas";
canvas.style.cssText =
  "width:100%;height:65vh;display:none;border-radius:12px;touch-action:none;background:#87a9bb";
container.appendChild(canvas);

const gl = canvas.getContext("webgl", {
  antialias: true,
  alpha: false
});

if (!gl) {
  alert("هذا المتصفح لا يدعم WebGL");
  throw new Error("WebGL unavailable");
}

const vertexShader = `
attribute vec3 position;
attribute vec3 normal;
uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec4 world = model * vec4(position, 1.0);
  vPosition = world.xyz;
  vNormal = mat3(model) * normal;
  gl_Position = projection * view * world;
}
`;

const fragmentShader = `
precision mediump float;
uniform vec3 objectColor;
uniform float thermal;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  vec3 light = normalize(vec3(-0.5, 1.0, 0.4));
  float diffuse = max(dot(normalize(vNormal), light), 0.0);
  float shade = 0.48 + diffuse * 0.52;

  vec3 color = objectColor * shade;

  if (thermal > 0.5) {
    float heat = clamp(0.35 + objectColor.r * 0.9, 0.0, 1.0);
    color = mix(vec3(0.02, 0.08, 0.05),
                vec3(1.0, 0.35, 0.04), heat);
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

function compile(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

const program = gl.createProgram();
gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexShader));
gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentShader));
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(gl.getProgramInfoLog(program));
}

gl.useProgram(program);

const loc = {
  position: gl.getAttribLocation(program, "position"),
  normal: gl.getAttribLocation(program, "normal"),
  projection: gl.getUniformLocation(program, "projection"),
  view: gl.getUniformLocation(program, "view"),
  model: gl.getUniformLocation(program, "model"),
  color: gl.getUniformLocation(program, "objectColor"),
  thermal: gl.getUniformLocation(program, "thermal")
};

// Matrix utilities
function identity() {
  return new Float32Array([
    1,0,0,0, 0,1,0,0,
    0,0,1,0, 0,0,0,1
  ]);
}

function multiply(a, b) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function perspective(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0
  ]);
}

function lookAt(eye, center, up) {
  let zx = eye[0] - center[0];
  let zy = eye[1] - center[1];
  let zz = eye[2] - center[2];
  let n = Math.hypot(zx, zy, zz);
  zx /= n; zy /= n; zz /= n;

  let xx = up[1] * zz - up[2] * zy;
  let xy = up[2] * zx - up[0] * zz;
  let xz = up[0] * zy - up[1] * zx;
  n = Math.hypot(xx, xy, xz);
  xx /= n; xy /= n; xz /= n;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx*eye[0]+xy*eye[1]+xz*eye[2]),
    -(yx*eye[0]+yy*eye[1]+yz*eye[2]),
    -(zx*eye[0]+zy*eye[1]+zz*eye[2]), 1
  ]);
}

function modelMatrix(x, y, z, sx, sy, sz, angle = 0) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);

  return new Float32Array([
    c*sx, 0, -s*sx, 0,
    0, sy, 0, 0,
    s*sz, 0, c*sz, 0,
    x, y, z, 1
  ]);
}

// Cube geometry
const faces = [
  [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[0,0,1]],
  [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[0,0,-1]],
  [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,0,0]],
  [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1],[1,0,0]],
  [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[0,1,0]],
  [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,-1,0]]
];

const vertices = [];
const normals = [];

for (const f of faces) {
  const indices = [0,1,2,0,2,3];
  for (const i of indices) {
    vertices.push(...f[i]);
    normals.push(...f[4]);
  }
}

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
gl.enableVertexAttribArray(loc.position);
gl.vertexAttribPointer(loc.position, 3, gl.FLOAT, false, 0, 0);

const normalBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
gl.enableVertexAttribArray(loc.normal);
gl.vertexAttribPointer(loc.normal, 3, gl.FLOAT, false, 0, 0);

gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);

function cube(x,y,z,sx,sy,sz,color,angle=0) {
  gl.uniformMatrix4fv(
    loc.model, false,
    modelMatrix(x,y,z,sx,sy,sz,angle)
  );
  gl.uniform3fv(loc.color, color);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

// Game state
const drone = {
  x: 0,
  y: 14,
  z: -8,
  health: 100
};

const keys = {
  forward:false, backward:false,
  left:false, right:false,
  up:false, down:false
};

let cameraMode = 0;
let running = false;
let lastTime = 0;
let elapsed = 0;
let rotorAngle = 0;

// Sudan-inspired environment
function buildWorld() {
  // Ground
  cube(0,-2,90,180,2,240,[0.57,0.47,0.31]);

  // Distant hills
  for (let i=0;i<12;i++) {
    const x = (i-6)*25;
    cube(x,2,170+(i%3)*12,18,8,15,[0.48,0.43,0.32]);
  }

  // Main road
  cube(0,0.05,65,5,0.15,160,[0.25,0.27,0.25]);

  // Road markings
  for (let z=-30;z<160;z+=12) {
    cube(0,0.22,z,0.12,0.03,4,[0.85,0.79,0.59]);
  }

  // River
  cube(0,-0.5,112,180,0.25,22,[0.12,0.35,0.46]);

  // Bridge deck
  cube(0,1,112,5,0.5,30,[0.48,0.49,0.45]);

  // Bridge rails
  cube(-5.1,2.2,112,0.25,1.3,30,[0.67,0.65,0.57]);
  cube(5.1,2.2,112,0.25,1.3,30,[0.67,0.65,0.57]);

  // Bridge supports
  for (let z=92;z<=132;z+=12) {
    cube(-3, -1, z, 0.6, 2.5, 1,[0.43,0.43,0.4]);
    cube(3, -1, z, 0.6, 2.5, 1,[0.43,0.43,0.4]);
  }

  // Buildings on both sides
  for (let i=0;i<42;i++) {
    const side = i%2===0 ? -1 : 1;
    const z = -25 + Math.floor(i/2)*9;
    const x = side*(13 + (i%4)*5);
    const height = 3 + (i%5)*1.7;

    cube(x,height/2,z,3.5,height/2,3.5,
      i%3===0 ? [0.65,0.55,0.42] : [0.72,0.65,0.52]);

    // Roof detail
    cube(x,height+0.12,z,3.6,0.15,3.6,[0.38,0.36,0.32]);
  }

  // Fictional convoy vehicles
  for (let i=0;i<5;i++) {
    const z = 10 + i*9;
    cube(0,1.1,z,1.1,0.8,2.1,[0.22,0.29,0.24]);
    cube(0,2,z,0.85,0.3,1.1,[0.31,0.37,0.29]);
    cube(-1.1,0.55,z,0.35,0.5,0.35,[0.08,0.08,0.08]);
    cube(1.1,0.55,z,0.35,0.5,0.35,[0.08,0.08,0.08]);
  }
}

function drawDrone() {
  const x = drone.x;
  const y = drone.y;
  const z = drone.z;

  // Main body
  cube(x,y,z,1.1,0.28,1.4,[0.17,0.21,0.19]);

  // Camera housing
  cube(x,y-0.45,z+0.8,0.42,0.35,0.35,[0.08,0.1,0.1]);

  // Arms
  cube(x-1.5,y,z,0.9,0.12,0.12,[0.25,0.29,0.25]);
  cube(x+1.5,y,z,0.9,0.12,0.12,[0.25,0.29,0.25]);
  cube(x,y,z-1.5,0.12,0.12,0.9,[0.25,0.29,0.25]);
  cube(x,y,z+1.5,0.12,0.12,0.9,[0.25,0.29,0.25]);

  // Animated propellers
  const spin = rotorAngle;
  const positions = [
    [-1.5,0,0],[1.5,0,0],[0,0,-1.5],[0,0,1.5]
  ];

  for (const p of positions) {
    cube(x+p[0],y+0.2,z+p[2],0.75,0.035,0.08,
      [0.08,0.09,0.08],spin);
  }
}

function render(now) {
  if (!running) return;

  const dt = Math.min((now-lastTime)/1000 || 0, 0.04);
  lastTime = now;
  elapsed += dt;
  rotorAngle += dt*24;

  const speed = 12*dt;

  if (keys.forward) drone.z += speed;
  if (keys.backward) drone.z -= speed;
  if (keys.left) drone.x -= speed;
  if (keys.right) drone.x += speed;
  if (keys.up) drone.y += speed*0.7;
  if (keys.down) drone.y -= speed*0.7;

  drone.y = Math.max(5,Math.min(55,drone.y));
  drone.x = Math.max(-35,Math.min(35,drone.x));
  drone.z = Math.max(-30,Math.min(150,drone.z));

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1,2);

  if (canvas.width !== Math.floor(w*dpr) ||
      canvas.height !== Math.floor(h*dpr)) {
    canvas.width = Math.floor(w*dpr);
    canvas.height = Math.floor(h*dpr);
    gl.viewport(0,0,canvas.width,canvas.height);
  }

  gl.clearColor(0.48,0.66,0.75,1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.uniformMatrix4fv(
    loc.projection,false,
    perspective(Math.PI/3,canvas.width/canvas.height,0.1,500)
  );

  const eye = [drone.x,drone.y+7,drone.z-19];
  const target = [drone.x,drone.y-1,drone.z+12];

  gl.uniformMatrix4fv(
    loc.view,false,
    lookAt(eye,target,[0,1,0])
  );

  gl.uniform1f(loc.thermal,cameraMode);

  buildWorld();
  drawDrone();

  document.getElementById("altitude").textContent =
    "الارتفاع: "+Math.round(drone.y*10)+"م";

  document.getElementById("health").textContent =
    "سلامة الدرون: "+drone.health+"%";

  document.getElementById("camera").textContent =
    cameraMode ? "الكاميرا: حرارية" : "الكاميرا: عادية";

  document.getElementById("timer").textContent =
    "الوقت: "+Math.floor(elapsed)+" ثانية";

  requestAnimationFrame(render);
}

// Interface
const style = document.createElement("style");
style.textContent = `
#gameCanvas{display:block;margin-top:12px}
.game-hud{display:flex;flex-wrap:wrap;justify-content:space-between;
gap:8px;padding:12px;background:#101820;color:white;font-size:12px}
.game-controls{display:grid;grid-template-columns:repeat(3,1fr);
gap:8px;margin-top:10px}
.game-controls button{min-height:48px;background:#263744;color:white;
border:0;border-radius:8px;font-weight:bold;touch-action:none}
.game-controls button:active{background:#bd8b35;color:#111}
`;
document.head.appendChild(style);

const hud = document.createElement("div");
hud.className = "game-hud";
hud.innerHTML = `
<span id="altitude">الارتفاع: 140م</span>
<span id="health">سلامة الدرون: 100%</span>
<span id="timer">الوقت: 0</span>
<span id="camera">الكاميرا: عادية</span>
`;
canvas.after(hud);

const controls = document.createElement("div");
controls.className = "game-controls";
controls.innerHTML = `
<button data-key="forward">تقدم ▲</button>
<button data-key="up">ارتفاع ⬆</button>
<button data-key="backward">تراجع ▼</button>
<button data-key="left">يسار ◀</button>
<button id="cameraNormal">عادية</button>
<button data-key="right">يمين ▶</button>
<button data-key="down">انخفاض ⬇</button>
<button id="cameraThermal">حرارية</button>
`;
hud.after(controls);

hud.style.display = "none";
controls.style.display = "none";

controls.querySelectorAll("[data-key]").forEach(button => {
  const key = button.dataset.key;

  const release = e => {
    e.preventDefault();
    keys[key] = false;
  };

  button.addEventListener("pointerdown",e => {
    e.preventDefault();
    keys[key] = true;
    button.setPointerCapture(e.pointerId);
  });

  button.addEventListener("pointerup",release);
  button.addEventListener("pointercancel",release);
  button.addEventListener("lostpointercapture",release);
});

document.getElementById("cameraNormal").onclick = () => {
  cameraMode = 0;
};

document.getElementById("cameraThermal").onclick = () => {
  cameraMode = 1;
};

document.getElementById("settingsButton").onclick = () => {
  alert("MISSION 249\nتحكم باللمس\nكاميرا عادية وحرارية");
};

document.getElementById("startButton").onclick = () => {
  drone.x = 0;
  drone.y = 14;
  drone.z = -8;
  elapsed = 0;
  lastTime = 0;
  running = true;

  document.querySelector(".main-screen").style.display = "none";
  canvas.style.display = "block";
  hud.style.display = "flex";
  controls.style.display = "grid";

  requestAnimationFrame(render);
};
