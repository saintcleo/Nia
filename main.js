// Rochelle's 4-way flip-book demo (no idle frames)
// We'll use step1 as stand-in for idle so she stays visible when not moving.

const SPRITES = {
  right: [
    "https://i.imgur.com/k0VzrMh_d.webp?maxwidth=760&fidelity=grand",
    "https://i.imgur.com/woD9rax_d.webp?maxwidth=760&fidelity=grand",
  ],
  left: [
    "https://i.imgur.com/zKUhBtG_d.webp?maxwidth=760&fidelity=grand",
    "https://i.imgur.com/tkFpehq_d.webp?maxwidth=760&fidelity=grand",
  ],
  up: [
    "https://i.imgur.com/PNt1XI0_d.webp?maxwidth=760&fidelity=grand",
    "https://i.imgur.com/9z2kMjb_d.webp?maxwidth=760&fidelity=grand",
  ],
  down: [
    "https://i.imgur.com/HvPjToL_d.webp?maxwidth=760&fidelity=grand",
    "https://i.imgur.com/ZA0yrOY_d.webp?maxwidth=760&fidelity=grand",
  ],
};

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// Preload images
const cache = new Map();
async function loadImage(src){
  if (cache.has(src)) return cache.get(src);
  const img = new Image();
  img.crossOrigin = "anonymous";
  const p = new Promise((res, rej)=>{ img.onload = ()=>res(img); img.onerror = rej; });
  img.src = src;
  cache.set(src, p);
  return p;
}
async function preloadAll(){
  const urls = Object.values(SPRITES).flat();
  await Promise.all(urls.map(loadImage));
}

// State
let x = canvas.width/2, y = canvas.height/2 + 40;
let dir = "right";
let vx = 0, vy = 0;
let moving = false;
let stepIndex = 0;
let stepTimer = 0;
let speedMult = 1;
let stepInterval = 180; // ms

// UI
const btnUp = document.getElementById("btnUp");
const btnDown = document.getElementById("btnDown");
const btnLeft = document.getElementById("btnLeft");
const btnRight = document.getElementById("btnRight");
const btnSpeed = document.getElementById("btnSpeed");
const btnStep = document.getElementById("btnStep");

let hold = {up:false,down:false,left:false,right:false};

function bindHold(btn, key){
  btn.addEventListener("touchstart", e=>{ e.preventDefault(); hold[key]=true; });
  btn.addEventListener("touchend",   e=>{ e.preventDefault(); hold[key]=false; });
  btn.addEventListener("mousedown",  ()=>{ hold[key]=true; });
  btn.addEventListener("mouseup",    ()=>{ hold[key]=false; });
  btn.addEventListener("mouseleave", ()=>{ hold[key]=false; });
}
bindHold(btnUp, 'up'); bindHold(btnDown, 'down');
bindHold(btnLeft, 'left'); bindHold(btnRight, 'right');

// Optional keyboard for desktop testing
window.addEventListener('keydown', e=>{
  if (e.key==='ArrowUp'||e.key==='w') hold.up=true;
  if (e.key==='ArrowDown'||e.key==='s') hold.down=true;
  if (e.key==='ArrowLeft'||e.key==='a') hold.left=true;
  if (e.key==='ArrowRight'||e.key==='d') hold.right=true;
});
window.addEventListener('keyup', e=>{
  if (e.key==='ArrowUp'||e.key==='w') hold.up=false;
  if (e.key==='ArrowDown'||e.key==='s') hold.down=false;
  if (e.key==='ArrowLeft'||e.key==='a') hold.left=false;
  if (e.key==='ArrowRight'||e.key==='d') hold.right=false;
});

btnSpeed.addEventListener('click', ()=>{
  speedMult = (speedMult===1?2:1);
  btnSpeed.textContent = `Speed: ${speedMult}×`;
});
btnStep.addEventListener('click', ()=>{
  stepInterval = (stepInterval===180?120:180);
  btnStep.textContent = `Step rate: ${stepInterval}ms`;
});

function pickFrame(){
  const list = SPRITES[dir];
  if (!moving) return list[0];       // treat step1 as idle/stand
  return list[stepIndex % 2];        // 2-frame flip
}

function update(dt){
  vx = 0; vy = 0; moving = false;
  const base = 0.10 * speedMult;
  if (hold.left && !hold.right){ vx=-base; dir="left";  moving=true; }
  if (hold.right && !hold.left){ vx= base; dir="right"; moving=true; }
  if (hold.up && !hold.down){    vy=-base; dir="up";    moving=true; }
  if (hold.down && !hold.up){    vy= base; dir="down";  moving=true; }

  x += vx*dt; y += vy*dt;
  x = Math.max(40, Math.min(canvas.width-40, x));
  y = Math.max(60, Math.min(canvas.height-40, y));

  if (moving){
    stepTimer += dt;
    if (stepTimer >= stepInterval){
      stepTimer = 0;
      stepIndex = (stepIndex + 1) % 2;
    }
  } else {
    stepIndex = 0;
    stepTimer = 0;
  }
}

async function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);

  ctx.globalAlpha = 0.5;
  for (let i=0;i<canvas.width;i+=24){
    ctx.fillStyle = (i/24)%2===0 ? "#0e0e0e" : "#0a0a0a";
    ctx.fillRect(i, 0, 24, canvas.height);
  }
  ctx.globalAlpha = 1;

  const src = pickFrame();
  const img = await loadImage(src);

  const w = 96, h = 128;
  ctx.drawImage(img, 0, 0, img.width, img.height, x - w/2, y - h, w, h);

  ctx.fillStyle = "#bbb";
  ctx.font = "12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial";
  ctx.fillText(`Dir: ${dir} | Moving: ${moving?'yes':'no'} | Speed: ${speedMult}x | Step: ${stepInterval}ms`, 10, 18);
}

let last = performance.now();
async function loop(now){
  const dt = now - last; last = now;
  update(dt);
  await render();
  requestAnimationFrame(loop);
}

(async function start(){
  await preloadAll();
  requestAnimationFrame(loop);
})();
