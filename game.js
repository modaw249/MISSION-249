
"use strict";

/* MISSION 249 — Expanded 3D City & Touch Flight System */

const container = document.querySelector(".game-container");
container.querySelector("#gameCanvas")?.remove();
document.querySelector("#mission249-ui")?.remove();

const canvas = document.createElement("canvas");
canvas.id = "gameCanvas";
container.appendChild(canvas);

const gl = canvas.getContext("webgl", {
  antialias: true,
  alpha: false,
  powerPreference: "high-performance"
});

if (!gl) {
  alert("متصفحك لا يدعم WebGL");
  throw new Error("WebGL unavailable");
}

const css = document.createElement("style");
css.textContent = `
.game-container {max-width:100%;padding:8px;background:#091117}
.game-header {display:none}
.main-screen {min-height:70vh}
#gameCanvas {
 display:none;width:100%;height:65vh;min-height:420px;
 border:1px solid #53656b;border-radius:8px;
 touch-action:none;background:#87aabb
}
#mission249-ui {
 display:none;color:#e1e9e5;font-family:Arial,sans-serif;
 user-select:none
}
.m249-top {
 display:flex;justify-content:space-between;align-items:center;
 padding:10px 8px;background:#101c23;border:1px solid #34474e;
 font-size:11px;gap:5px
}
.m249-brand {color:#d5aa58;font-weight:bold;letter-spacing:1px}
.m249-live {color:#69d49a}
.m249-stats {
 display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin:6px 0
}
.m249-stat {
 background:#14232b;border:1px solid #34474e;
 padding:8px 2px;text-align:center;font-size:10px
}
.m249-stat strong {
 display:block;color:#d5aa58;font-size:12px;margin-top:5px
}
.m249-main {
 display:grid;grid-template-columns:1fr 115px;gap:8px;
 margin-top:8px;align-items:center
}
.m249-joystick-area {
 display:flex;flex-direction:column;align-items:center;gap:6px
}
.m249-joystick {
 width:145px;height:145px;border-radius:50%;
 border:2px solid #657c7c;
 background:radial-gradient(circle,#253b40 0%,#14252d 65%,#0b171d 100%);
 position:relative;touch-action:none;box-shadow:inset 0 0 18px #000
}
.m249-joystick:before,.m249-joystick:after {
 content:"";position:absolute;background:#52696a;opacity:.45
}
.m249-joystick:before {width:1px;height:100%;left:50%}
.m249-joystick:after {height:1px;width:100%;top:50%}
.m249-knob {
 position:absolute;width:54px;height:54px;left:50%;top:50%;
 transform:translate(-50%,-50%);
 border-radius:50%;border:2px solid #d0aa60;
 background:radial-gradient(circle at 35% 30%,#b99a5e,#34453d 70%);
 box-shadow:0 3px 12px #000;pointer-events:none
}
.m249-joystick-label {font-size:10px;color:#aebdb8}
.m249-side {display:flex;flex-direction:column;gap:6px}
.m249-btn {
 border:1px solid #586d70;border-radius:5px;
 min-height:39px;background:#1a3038;color:#e6e9e5;
 font-size:11px;font-weight:bold;touch-action:manipulation
}
.m249-btn.active {background:#b68b43;color:#101820}
.m249-bottom {
 display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px
}
.m249-panel {
 background:#101c23;border:1px solid #34474e;
 padding:8px;font-size:10px;line-height:1.8;min-height:54px
}
.m249-panel strong {color:#d7ae64}
#scanMessage {color:#b8d5c2}
.m249-marker {
 position:absolute;transform:translate(-50%,-50%);
 border:1px solid #e1bd66;color:#f1d58d;
 background:#17251edc;padding:4px 6px;border-radius:4px;
 font-size:10px;white-space:nowrap;pointer-events:none;
}
.m249-marker.selected {background:#7b5125;color:white}
#scanOverlay {position:absolute;inset:0;pointer-events:none;overflow:hidden}
.m249-game-wrap {position:relative}
`;

document.head.appendChild(css);

const ui = document.createElement("section");
ui.id = "mission249-ui";
ui.innerHTML = `
 <div class="m249-top">
  <span class="m249-brand">MISSION 249</span>
  <span class="m249-live">● SYSTEM ONLINE</span>
  <span>DRONE CAMERA</span>
 </div>

 <div class="m249-stats">
  <div class="m249-stat">الارتفاع<strong id="mAltitude">140 م</strong></div>
  <div class="m249-stat">السرعة<strong id="mSpeed">0 كم/س</strong></div>
  <div class="m249-stat">سلامة الدرون<strong>100%</strong></div>
  <div class="m249-stat">الاتصال<strong style="color:#69d49a">مستقر</strong></div>
 </div>

 <div class="m249-game-wrap">
  <div id="scanOverlay"></div>
 </div>

 <div class="m249-main">
  <div class="m249-joystick-area">
   <div class="m249-joystick" id="mJoystick">
    <div class="m249-knob" id="mKnob"></div>
   </div>
   <div class="m249-joystick-label">عصا الحركة — جميع الاتجاهات</div>
  </div>
  <div class="m249-side">
   <button class="m249-btn" id="mRise">▲ ارتفاع</button>
   <button class="m249-btn" id="mLower">▼ انخفاض</button>
   <button class="m249-btn active" id="mNormal">NORMAL CAM</button>
   <button class="m249-btn" id="mThermal">THERMAL IR</button>
   <button class="m249-btn" id="mZoomIn">ZOOM +</button>
   <button class="m249-btn" id="mZoomOut">ZOOM −</button>
  </div>
 </div>

 <div class="m249-bottom">
  <div class="m249-panel">
   <strong>TACTICAL SCAN</strong><br>
   <span id="scanMessage">اضغط على نقطة مجهولة لمسحها</span>
  </div>
  <div class="m249-panel">
   <strong>FLIGHT STATUS</strong><br>
   <span id="flightMessage">المس الشاشة وحرك الكاميرا لاستكشاف المنطقة</span>
  </div>
 </div>
`;

canvas.after(ui);
const gameWrap = ui.querySelector(".m249-game-wrap");
gameWrap.insertBefore(canvas, ui.querySelector("#scanOverlay"));

/* WebGL shaders */

const vertexSource = `
attribute vec3 position;
attribute vec3 normal;
uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;
varying vec3 vNormal;
varying vec3 vWorld;

void main(){
 vec4 world=model*vec4(position,1.0);
 vWorld=world.xyz;
 vNormal=mat3(model)*normal;
 gl_Position=projection*view*world;
}`;

const fragmentSource = `
precision mediump float;
uniform vec3 objectColor;
uniform float thermal;
varying vec3 vNormal;
varying vec3 vWorld;

void main(){
 vec3 light=normalize(vec3(-0.5,1.0,0.4));
 float diffuse=max(dot(normalize(vNormal),light),0.0);
 float shade=0.42+diffuse*0.58;
 vec3 color=objectColor*shade;

 if(thermal>0.5){
  float heat=clamp(objectColor.r*0.7+objectColor.g*0.3,0.0,1.0);
  color=mix(vec3(0.015,0.06,0.09),vec3(1.0,0.38,0.04),heat);
 }
 gl_FragColor=vec4(color,1.0);
}`;

function compileShader(type, source) {
 const s=gl.createShader(type);
 gl.shaderSource(s,source);
 gl.compileShader(s);
 if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))
  throw new Error(gl.getShaderInfoLog(s));
 return s;
}

const program=gl.createProgram();
gl.attachShader(program,compileShader(gl.VERTEX_SHADER,vertexSource));
gl.attachShader(program,compileShader(gl.FRAGMENT_SHADER,fragmentSource));
gl.linkProgram(program);
if(!gl.getProgramParameter(program,gl.LINK_STATUS))
 throw new Error(gl.getProgramInfoLog(program));
gl.useProgram(program);

const L={
 p:gl.getAttribLocation(program,"position"),
 n:gl.getAttribLocation(program,"normal"),
 projection:gl.getUniformLocation(program,"projection"),
 view:gl.getUniformLocation(program,"view"),
 model:gl.getUniformLocation(program,"model"),
 color:gl.getUniformLocation(program,"objectColor"),
 thermal:gl.getUniformLocation(program,"thermal")
};

/* Cube mesh */

const faces=[
 [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],[0,0,1]],
 [[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[0,0,-1]],
 [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,0,0]],
 [[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1],[1,0,0]],
 [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1],[0,1,0]],
 [[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1],[0,-1,0]]
];

const vertices=[],normals=[];
for(const f of faces){
 for(const i of [0,1,2,0,2,3]){
  vertices.push(...f[i]);
  normals.push(...f[4]);
 }
}

function makeBuffer(data,location,size){
 const b=gl.createBuffer();
 gl.bindBuffer(gl.ARRAY_BUFFER,b);
 gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);
 gl.enableVertexAttribArray(location);
 gl.vertexAttribPointer(location,size,gl.FLOAT,false,0,0);
}
makeBuffer(vertices,L.p,3);
makeBuffer(normals,L.n,3);

function perspective(fov,aspect,near,far){
 const f=1/Math.tan(fov/2),nf=1/(near-far);
 return new Float32Array([
  f/aspect,0,0,0,0,f,0,0,
  0,0,(far+near)*nf,-1,
  0,0,2*far*near*nf,0
 ]);
}

function lookAt(e,c,u){
 let z=[e[0]-c[0],e[1]-c[1],e[2]-c[2]];
 let n=Math.hypot(...z);z=z.map(v=>v/n);
 let x=[u[1]*z[2]-u[2]*z[1],u[2]*z[0]-u[0]*z[2],u[0]*z[1]-u[1]*z[0]];
 n=Math.hypot(...x);x=x.map(v=>v/n);
 const y=[z[1]*x[2]-z[2]*x[1],z[2]*x[0]-z[0]*x[2],z[0]*x[1]-z[1]*x[0]];
 return new Float32Array([
  x[0],y[0],z[0],0,x[1],y[1],z[1],0,
  x[2],y[2],z[2],0,
  -x[0]*e[0]-x[1]*e[1]-x[2]*e[2],
  -y[0]*e[0]-y[1]*e[1]-y[2]*e[2],
  -z[0]*e[0]-z[1]*e[1]-z[2]*e[2],1
 ]);
}

function modelMatrix(x,y,z,sx,sy,sz){
 return new Float32Array([
  sx,0,0,0,0,sy,0,0,0,0,sz,0,x,y,z,1
 ]);
}

/* Large procedural city environment */

const objects=[];

function add(x,y,z,sx,sy,sz,color){
 objects.push({x,y,z,sx,sy,sz,color});
}

// Ground and river
add(0,-3,100,260,3,330,[0.57,0.48,0.34]);
add(0,-0.8,125,260,0.3,29,[0.12,0.34,0.48]);

// Main roads
add(0,0.1,45,6,0.15,190,[0.24,0.26,0.25]);
add(-85,0.1,45,3,0.15,180,[0.25,0.27,0.26]);
add(85,0.1,45,3,0.15,180,[0.25,0.27,0.26]);
add(-45,0.1,45,2.5,0.15,180,[0.28,0.28,0.26]);
add(45,0.1,45,2.5,0.15,180,[0.28,0.28,0.26]);

// Bridge across the Nile
add(0,1.3,125,7,0.55,36,[0.49,0.5,0.48]);
add(-7.2,2.5,125,0.35,1.2,36,[0.68,0.67,0.61]);
add(7.2,2.5,125,0.35,1.2,36,[0.68,0.67,0.61]);

for(let z=95;z<160;z+=9){
 add(-4,0,z,0.5,2.2,0.6,[0.43,0.43,0.41]);
 add(4,0,z,0.5,2.2,0.6,[0.43,0.43,0.41]);
}

// Road markings
for(let z=-70;z<290;z+=13){
 add(0,0.28,z,0.13,0.025,4,[0.9,0.82,0.64]);
}

// Urban blocks: two city districts
for(let i=0;i<180;i++){
 const side=i%2===0?-1:1;
 const row=Math.floor(i/2);
 const z=-65+(row%36)*9;
 const x=side*(14+Math.floor(row/36)*15+(row%3)*2);
 const h=3.5+(row%7)*1.6;
 const width=3.5+(row%3)*0.7;
 const depth=3.2+(row%4)*0.5;
 const colors=[
  [0.68,0.59,0.47],
  [0.72,0.65,0.53],
  [0.58,0.55,0.48],
  [0.64,0.62,0.55]
 ];
 const color=colors[row%colors.length];

 add(x,h/2,z,width,h/2,depth,color);
 add(x,h+0.12,z,width+0.12,0.15,depth+0.12,[0.39,0.38,0.34]);

 // Roof structures
 if(row%3===0){
  add(x+0.5,h+0.5,z,0.6,0.35,0.6,[0.49,0.47,0.4]);
 }
}

// Trees and roadside vegetation
for(let i=0;i<55;i++){
 const side=i%2===0?-1:1;
 const x=side*(10+(i%5)*2);
 const z=-50+i*5;
 add(x,1,z,0.25,1.1,0.25,[0.34,0.25,0.15]);
 add(x,2.4,z,1.1,1.2,1.1,[0.22,0.35,0.22]);
}

// Fictional civilian vehicles
const vehicleColors=[
 [0.7,0.7,0.65],[0.19,0.25,0.28],
 [0.55,0.48,0.34],[0.24,0.32,0.25]
];

for(let i=0;i<24;i++){
 const x=(i%2===0?-1:1)*(2+(i%4)*1.1);
 const z=-35+i*11;
 const color=vehicleColors[i%vehicleColors.length];

 add(x,0.8,z,0.95,0.65,2,color);
 add(x,1.45,z-0.15,0.72,0.3,0.95,[0.26,0.36,0.4]);

 for(const side of [-1,1]){
  add(x+side*0.95,0.45,z-1.2,0.25,0.4,0.35,[0.07,0.07,0.07]);
  add(x+side*0.95,0.45,z+1.2,0.25,0.4,0.35,[0.07,0.07,0.07]);
 }
}

// Fictional scan points
const targets=[
 {x:-17,y:2,z:35,name:"نقطة مجهولة A",type:"إشارة غير معرّفة"},
 {x:23,y:3,z:72,name:"نقطة مجهولة B",type:"حركة مرصودة"},
 {x:-28,y:4,z:105,name:"نقطة مجهولة C",type:"مصدر حراري"},
 {x:19,y:3,z:155,name:"نقطة مجهولة D",type:"إشارة غير معرّفة"},
 {x:38,y:2,z:210,name:"نقطة مجهولة E",type:"حركة مرصودة"}
];

const state={
 x:0,y:15,z:-12,
 yaw:0,pitch:-0.04,
 zoom:1,thermal:0,
 running:false,
 elapsed:0,
 joystickX:0,joystickY:0,
 rise:0
};

let lastTime=0;
let selected=-1;
let markers=[];

gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);

/* Camera projection for scan markers */

function projectPoint(point){
 const dx=point.x-state.x;
 const dy=point.y-state.y;
 const dz=point.z-state.z;

 const cy=Math.cos(state.yaw),sy=Math.sin(state.yaw);
 const cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);

 const forwardX=sy*cp;
 const forwardY=sp;
 const forwardZ=cy*cp;

 const rightX=cy;
 const rightZ=-sy;

 const depth=dx*forwardX+dy*forwardY+dz*forwardZ;
 if(depth<2)return null;

 const rx=dx*rightX+dz*rightZ;
 const upX=-sy*sp;
 const upY=cp;
 const upZ=-cy*sp;
 const ry=dx*upX+dy*upY+dz*upZ;

 const f=1/Math.tan(Math.PI/(6*state.zoom));
 const aspect=canvas.clientWidth/canvas.clientHeight;

 return {
  x:canvas.clientWidth/2+(rx/depth)*f*canvas.clientWidth/(2*aspect),
  y:canvas.clientHeight/2-(ry/depth)*f*canvas.clientHeight/2
 };
}

function updateMarkers(){
 const overlay=document.getElementById("scanOverlay");
 overlay.innerHTML="";
 markers=[];

 targets.forEach((target,index)=>{
  const p=projectPoint(target);
  if(!p||p.x<0||p.y<0||p.x>canvas.clientWidth||p.y>canvas.clientHeight)
   return;

  const marker=document.createElement("div");
  marker.className="m249-marker"+(selected===index?" selected":"");
  marker.textContent=selected===index?"● "+target.name:"◇ UNKNOWN";
  marker.style.left=p.x+"px";
  marker.style.top=p.y+"px";
  overlay.appendChild(marker);
  markers.push({index,x:p.x,y:p.y});
 });
}

/* Flight and camera */

function render(now){
 if(!state.running)return;

 const dt=Math.min((now-lastTime)/1000||0,0.04);
 lastTime=now;
 state.elapsed+=dt;

 // Smooth 360-degree joystick movement
 const forward=state.joystickY;
 const sideways=state.joystickX;
 const speed=20;

 const sin=Math.sin(state.yaw);
 const cos=Math.cos(state.yaw);

 state.x+=(sideways*cos+forward*sin)*speed*dt;
 state.z+=(sideways*-sin+forward*cos)*speed*dt;
 state.y+=state.rise*speed*0.65*dt;

 state.x=Math.max(-120,Math.min(120,state.x));
 state.z=Math.max(-100,Math.min(285,state.z));
 state.y=Math.max(5,Math.min(85,state.y));

 const dpr=Math.min(devicePixelRatio||1,2);
 const w=canvas.clientWidth;
 const h=canvas.clientHeight;

 if(canvas.width!==Math.floor(w*dpr)||
    canvas.height!==Math.floor(h*dpr)){
  canvas.width=Math.floor(w*dpr);
  canvas.height=Math.floor(h*dpr);
  gl.viewport(0,0,canvas.width,canvas.height);
 }

 gl.clearColor(0.48,0.66,0.75,1);
 gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

 gl.uniformMatrix4fv(
  L.projection,false,
  perspective(Math.PI/(3*state.zoom),canvas.width/canvas.height,0.1,650)
 );

 const cp=Math.cos(state.pitch),sp=Math.sin(state.pitch);
 const direction=[
  Math.sin(state.yaw)*cp,
  sp,
  Math.cos(state.yaw)*cp
 ];

 const eye=[state.x,state.y,state.z];
 const target=[
  eye[0]+direction[0]*40,
  eye[1]+direction[1]*40,
  eye[2]+direction[2]*40
 ];

 gl.uniformMatrix4fv(L.view,false,lookAt(eye,target,[0,1,0]));
 gl.uniform1f(L.thermal,state.thermal);

 for(const o of objects){
  gl.uniformMatrix4fv(
   L.model,false,
   modelMatrix(o.x,o.y,o.z,o.sx,o.sy,o.sz)
  );
  gl.uniform3fv(L.color,o.color);
  gl.drawArrays(gl.TRIANGLES,0,36);
 }

 document.getElementById("mAltitude").textContent=
  Math.round(state.y*10)+" م";

 document.getElementById("mSpeed").textContent=
  Math.round(Math.hypot(state.joystickX,state.joystickY)*20)+" كم/س";

 updateMarkers();
 requestAnimationFrame(render);
}

/* Virtual joystick */

const joystick=document.getElementById("mJoystick");
const knob=document.getElementById("mKnob");
let joystickPointer=null;

function moveJoystick(e){
 const r=joystick.getBoundingClientRect();
 const cx=r.left+r.width/2;
 const cy=r.top+r.height/2;
 const max=r.width*0.34;

 let dx=e.clientX-cx;
 let dy=e.clientY-cy;
 const length=Math.hypot(dx,dy);

 if(length>max){
  dx=dx/length*max;
  dy=dy/length*max;
 }

 state.joystickX=dx/max;
 state.joystickY=-dy/max;

 knob.style.left=`calc(50% + ${dx}px)`;
 knob.style.top=`calc(50% + ${dy}px)`;
}

function resetJoystick(){
 joystickPointer=null;
 state.joystickX=0;
 state.joystickY=0;
 knob.style.left="50%";
 knob.style.top="50%";
}

joystick.addEventListener("pointerdown",e=>{
 e.preventDefault();
 joystickPointer=e.pointerId;
 joystick.setPointerCapture(e.pointerId);
 moveJoystick(e);
});

joystick.addEventListener("pointermove",e=>{
 if(e.pointerId===joystickPointer)moveJoystick(e);
});

joystick.addEventListener("pointerup",resetJoystick);
joystick.addEventListener("pointercancel",resetJoystick);
joystick.addEventListener("lostpointercapture",resetJoystick);

/* Altitude controls */

function holdButton(id,value){
 const b=document.getElementById(id);
 b.addEventListener("pointerdown",e=>{
  e.preventDefault();
  state.rise=value;
  b.classList.add("active");
  b.setPointerCapture(e.pointerId);
 });
 const release=()=>{
  state.rise=0;
  b.classList.remove("active");
 };
 b.addEventListener("pointerup",release);
 b.addEventListener("pointercancel",release);
 b.addEventListener("lostpointercapture",release);
}

holdButton("mRise",1);
holdButton("mLower",-1);

/* Drag screen to look around */

let lookPointer=null;
let previousX=0,previousY=0;
let dragDistance=0;

canvas.addEventListener("pointerdown",e=>{
 lookPointer=e.pointerId;
 previousX=e.clientX;
 previousY=e.clientY;
 dragDistance=0;
 canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove",e=>{
 if(e.pointerId!==lookPointer)return;

 const dx=e.clientX-previousX;
 const dy=e.clientY-previousY;
 previousX=e.clientX;
 previousY=e.clientY;

 dragDistance+=Math.abs(dx)+Math.abs(dy);

 state.yaw-=dx*0.004;
 state.pitch-=dy*0.003;
 state.pitch=Math.max(-1.0,Math.min(0.8,state.pitch));
});

function selectTarget(e){
 if(dragDistance>12)return;

 const r=canvas.getBoundingClientRect();
 const x=e.clientX-r.left;
 const y=e.clientY-r.top;

 let nearest=-1;
 let distance=38;

 markers.forEach(m=>{
  const d=Math.hypot(m.x-x,m.y-y);
  if(d<distance){distance=d;nearest=m.index;}
 });

 if(nearest>=0){
  selected=nearest;
  const t=targets[nearest];
  document.getElementById("scanMessage").textContent=
   t.name+" — "+t.type;
  document.getElementById("flightMessage").textContent=
   "تم تسجيل النقطة في سجل الاستطلاع";
 }
}

canvas.addEventListener("pointerup",e=>{
 if(e.pointerId===lookPointer)selectTarget(e);
 lookPointer=null;
});
canvas.addEventListener("pointercancel",()=>lookPointer=null);

/* Camera modes and zoom */

document.getElementById("mNormal").onclick=()=>{
 state.thermal=0;
 document.getElementById("mNormal").classList.add("active");
 document.getElementById("mThermal").classList.remove("active");
};

document.getElementById("mThermal").onclick=()=>{
 state.thermal=1;
 document.getElementById("mThermal").classList.add("active");
 document.getElementById("mNormal").classList.remove("active");
};

document.getElementById("mZoomIn").onclick=()=>{
 state.zoom=Math.min(1.8,state.zoom+0.12);
};

document.getElementById("mZoomOut").onclick=()=>{
 state.zoom=Math.max(0.7,state.zoom-0.12);
};

/* Start game */

document.getElementById("startButton").onclick=()=>{
 state.x=0;
 state.y=15;
 state.z=-12;
 state.yaw=0;
 state.pitch=-0.04;
 state.zoom=1;
 state.thermal=0;
 state.elapsed=0;
 state.running=true;
 selected=-1;

 document.querySelector(".main-screen").style.display="none";
 canvas.style.display="block";
 ui.style.display="block";

 lastTime=0;
 requestAnimationFrame(render);
};

document.getElementById("settingsButton").onclick=()=>{
 alert("MISSION 249\nعصا تحكم 360 درجة\nسحب الشاشة لتدوير الكاميرا\nلمس النقاط لمسحها");
};

window.addEventListener("resize",()=>{
 if(!state.running)return;
 const dpr=Math.min(devicePixelRatio||1,2);
 canvas.width=Math.floor(canvas.clientWidth*dpr);
 canvas.height=Math.floor(canvas.clientHeight*dpr);
 gl.viewport(0,0,canvas.width,canvas.height);
});
/* MISSION 249 — FULL SCREEN ACTION HUD */

const fullScreenStyle = document.createElement("style");

fullScreenStyle.textContent = `
* {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

html, body {
  margin: 0 !important;
  padding: 0 !important;
  width: 100%;
  height: 100%;
  overflow: hidden !important;
  background: #050b10 !important;
  overscroll-behavior: none;
}

.game-container {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  max-width: none !important;
  padding: 0 !important;
  margin: 0 !important;
  overflow: hidden !important;
  background: #050b10 !important;
}

#mission249-ui {
  position: fixed !important;
  inset: 0 !important;
  width: 100vw !important;
  height: 100dvh !important;
  display: none;
  overflow: hidden;
  background: #050b10;
  z-index: 1000;
  font-family: Arial, sans-serif;
}

.m249-game-wrap {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  overflow: hidden;
  background: #182a32;
}

#gameCanvas {
  position: absolute !important;
  inset: 0 !important;
  display: none;
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  touch-action: none;
}

#scanOverlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.m249-top {
  position: absolute;
  z-index: 5;
  top: env(safe-area-inset-top, 0px);
  left: 0;
  right: 0;
  min-height: 48px;
  padding: 10px 13px;
  background: linear-gradient(180deg, #071017ed, #101b22b5);
  border: 0;
  border-bottom: 1px solid #9aa9a044;
  backdrop-filter: blur(8px);
}

.m249-brand {
  font-size: 15px;
  letter-spacing: 1.5px;
  color: #e5bd6c;
}

.m249-live {
  font-size: 10px;
  letter-spacing: .5px;
}

.m249-stats {
  position: absolute;
  z-index: 5;
  top: calc(env(safe-area-inset-top, 0px) + 53px);
  left: 7px;
  right: 7px;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin: 0;
}

.m249-stat {
  background: #09151bc9;
  border: 1px solid #8d9d9740;
  border-radius: 4px;
  padding: 6px 2px;
  color: #c7d2cc;
  font-size: 9px;
  backdrop-filter: blur(5px);
}

.m249-stat strong {
  font-size: 12px;
  color: #e4c17c;
}

.m249-main {
  position: absolute;
  z-index: 6;
  left: 0;
  right: 0;
  bottom: calc(env(safe-area-inset-bottom, 0px) + 82px);
  padding: 0 13px;
  grid-template-columns: 1fr 100px;
  gap: 8px;
  pointer-events: none;
}

.m249-joystick-area,
.m249-side {
  pointer-events: auto;
}

.m249-joystick {
  width: 125px;
  height: 125px;
  background: radial-gradient(circle, #263d43d9, #101d24c9);
  border: 2px solid #9aa99b88;
  box-shadow: 0 0 18px #0008, inset 0 0 20px #0008;
}

.m249-knob {
  width: 48px;
  height: 48px;
  background: radial-gradient(circle at 35% 30%, #d7bd83, #655536 80%);
  border: 2px solid #ead39c;
}

.m249-joystick-label {
  color: #e5e8df;
  text-shadow: 0 1px 4px black;
  font-size: 9px;
}

.m249-side {
  gap: 5px;
}

.m249-btn {
  min-height: 34px;
  background: #0b1922df;
  border: 1px solid #8b9d9c88;
  color: #e8e9df;
  border-radius: 4px;
  font-size: 9px;
  backdrop-filter: blur(5px);
}

.m249-btn.active {
  background: #9d793c;
  border-color: #e4c17c;
  color: #fff;
}

.m249-bottom {
  position: absolute;
  z-index: 6;
  bottom: env(safe-area-inset-bottom, 0px);
  left: 0;
  right: 0;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  margin: 0;
  padding: 6px;
  background: linear-gradient(0deg, #071017f2, #101b22c9);
}

.m249-panel {
  min-height: 42px;
  padding: 5px 7px;
  border: 1px solid #71817d55;
  border-radius: 4px;
  background: #0b171dcc;
  font-size: 9px;
}

.m249-panel strong {
  color: #d7b56f;
}

.m249-marker {
  border: 1px solid #e4c17c;
  background: #07141ddd;
  box-shadow: 0 0 10px #d3aa4b55;
}

#mission249-ui::after {
  content: "+";
  position: absolute;
  z-index: 4;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #e4d5a1a0;
  font-size: 24px;
  font-weight: 200;
  pointer-events: none;
}

.main-screen {
  position: fixed !important;
  inset: 0 !important;
  min-height: 100dvh !important;
  width: 100vw !important;
  padding: 25px 16px !important;
  background:
    radial-gradient(ellipse at 50% 35%, #233943, #0a141b 65%, #05090d) !important;
  color: #e8e8df !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

#startButton {
  width: min(90%, 360px);
  min-height: 55px;
  border: 1px solid #e5c27b;
  border-radius: 5px;
  background: linear-gradient(135deg, #b38b45, #735328);
  color: white;
  font-size: 17px;
  font-weight: bold;
  letter-spacing: 1px;
}

#settingsButton {
  width: min(90%, 360px);
  min-height: 48px;
  margin-top: 12px;
  border: 1px solid #65777d;
  border-radius: 5px;
  background: #15232c;
  color: #e5e5dc;
}

@media (max-height: 650px) {
  .m249-joystick {
    width: 105px;
    height: 105px;
  }
  .m249-main {
    bottom: 72px;
  }
  .m249-btn {
    min-height: 29px;
  }
}
`;

document.head.appendChild(fullScreenStyle);

/* Request native browser fullscreen when starting */
document.getElementById("startButton").addEventListener("click", () => {
  const root = document.documentElement;

  if (root.requestFullscreen) {
    root.requestFullscreen().catch(() => {});
  }

  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("portrait").catch(() => {});
  }
});

