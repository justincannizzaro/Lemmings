import { LEVELS } from './levels.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const terrainCanvas = document.getElementById('terrain');
const terrainCtx = terrainCanvas.getContext('2d');

const levelSelect = document.getElementById('level-select');
const skillButtonsEl = document.getElementById('skill-buttons');
const statusLine = document.getElementById('status-line');
const lemmingCounts = document.getElementById('lemming-counts');
const timerLine = document.getElementById('timer-line');
const goalLine = document.getElementById('goal-line');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const restartBtn = document.getElementById('restart-btn');
const uploadInput = document.getElementById('upload-terrain');
const customWidth = document.getElementById('custom-width');
const customHeight = document.getElementById('custom-height');
const customSpawn = document.getElementById('custom-spawn');
const customExit = document.getElementById('custom-exit');
const customGoal = document.getElementById('custom-goal');
const addCustomLevelBtn = document.getElementById('add-custom-level');

const GAME_STEP = 1 / 60;
const TIME_SCALE = 0.25; // slow the whole simulation to 1/4 speed
const MAX_FALL_SAFE = 64;
const LEM_WIDTH = 10;
const LEM_HEIGHT = 16;
const COLORS = { terrain: '#4c566a', steel: '#29303f', exit: '#77dd77', spawn: '#7ad7f0' };

const SKILLS = [
  { key: 'builder', label: 'Builder' },
  { key: 'basher', label: 'Basher' },
  { key: 'digger', label: 'Digger' },
  { key: 'blocker', label: 'Blocker' },
  { key: 'climber', label: 'Climber' },
  { key: 'floater', label: 'Floater' },
  { key: 'bomber', label: 'Bomber' }
];

let customLevels = [];
let terrainData = null;
let currentLevel = cloneLevel(LEVELS[0]);
let state = createState(currentLevel);
let lastTime = performance.now();
let accumulator = 0;
let running = false;
let paused = false;
let activeSkill = null;
let uploadedImage = null;
let hoverLemming = null;

class Lemming {
  constructor(level) {
    this.level = level;
    this.x = level.spawn.x;
    this.y = level.spawn.y;
    this.vx = 0.9;
    this.vy = 0;
    this.dir = 1;
    this.state = 'walker';
    this.climber = false;
    this.floater = false;
    this.fallDistance = 0;
    this.buildSteps = 0;
    this.actionTimer = 0;
    this.bombTimer = 0;
    this.removed = false;
  }

  rect() {
    return { x: this.x - LEM_WIDTH / 2, y: this.y - LEM_HEIGHT, w: LEM_WIDTH, h: LEM_HEIGHT };
  }

  assign(skill) {
    if (this.removed) return false;
    switch (skill) {
      case 'builder':
        if (this.state === 'walker' || this.state === 'fall') { this.state = 'builder'; this.buildSteps = 12; this.actionTimer = 0; return true; }
        break;
      case 'basher':
        if (this.state === 'walker') { this.state = 'basher'; this.actionTimer = 60; return true; }
        break;
      case 'digger':
        if (this.state === 'walker') { this.state = 'digger'; this.actionTimer = 80; return true; }
        break;
      case 'blocker':
        if (this.state === 'walker') { this.state = 'blocker'; this.vx = 0; return true; }
        break;
      case 'climber':
        if (!this.climber) { this.climber = true; return true; }
        break;
      case 'floater':
        if (!this.floater) { this.floater = true; return true; }
        break;
      case 'bomber':
        if (this.state !== 'bomb') { this.state = 'bomb'; this.bombTimer = 180; return true; }
        break;
      default:
        break;
    }
    return false;
  }

  update(blockers) {
    if (this.removed) return;
    switch (this.state) {
      case 'walker':
        this.walk(blockers);
        break;
      case 'fall':
        this.fall();
        break;
      case 'blocker':
        this.stand();
        break;
      case 'builder':
        this.build();
        break;
      case 'basher':
        this.bash();
        break;
      case 'digger':
        this.dig();
        break;
      case 'climb':
        this.climb();
        break;
      case 'bomb':
        this.tickBomb();
        break;
      case 'exiting':
      case 'splat':
      default:
        break;
    }
  }

  stand() {
    this.vy = 0;
    this.fallDistance = 0;
  }

  walk(blockers) {
    this.applyGravity();
    if (isSolid(this.x, this.y + 1)) {
      this.vy = 0;
      this.fallDistance = 0;
    }
    const frontX = this.x + this.dir * (LEM_WIDTH / 2 + 1);
    const feetY = this.y - 1;
    if (isSolid(frontX, feetY) || isSolid(frontX, feetY - 8)) {
      if (this.climber) {
        this.state = 'climb';
        return;
      }
      this.dir *= -1;
    }

    // blocker bump
    for (const b of blockers) {
      if (b === this || b.removed) continue;
      if (b.state === 'blocker') {
        const br = b.rect();
        const r = this.rect();
        if (intersects(r, br)) {
          this.dir *= -1;
          break;
        }
      }
    }

    this.x += this.dir * this.vx * TIME_SCALE;
    if (!isSolid(this.x, this.y + 1)) {
      this.state = 'fall';
    }
  }

  fall() {
    this.applyGravity();
    const dy = this.vy * TIME_SCALE;
    this.y += dy;
    this.fallDistance += Math.abs(dy);
    if (this.y >= this.level.height - 1) {
      this.hitGround();
      return;
    }
    if (isSolid(this.x, this.y + 1)) {
      this.hitGround();
    }
  }

  hitGround() {
    if (this.floater && this.fallDistance > MAX_FALL_SAFE) {
      this.fallDistance = MAX_FALL_SAFE / 2;
    }
    if (this.fallDistance > MAX_FALL_SAFE) {
      this.state = 'splat';
      this.removed = true;
      state.lost += 1;
      return;
    }
    this.state = 'walker';
    this.fallDistance = 0;
    this.vy = 0;
  }

  climb() {
    const head = { x: this.x + this.dir * (LEM_WIDTH / 2 + 1), y: this.y - LEM_HEIGHT };
    if (!isSolid(head.x, head.y)) {
      this.y -= 1.5 * TIME_SCALE;
      if (!isSolid(head.x, head.y - 2) && !isSolid(this.x, this.y - LEM_HEIGHT)) {
        this.state = 'walker';
      }
      return;
    }
    // ceiling, drop
    this.state = 'walker';
    this.dir *= -1;
  }

  build() {
    if (this.buildSteps <= 0) {
      this.state = 'walker';
      return;
    }
    this.actionTimer -= 1;
    if (this.actionTimer <= 0) {
      this.actionTimer = 8;
      const stepY = -2;
      const w = 12; const h = 4;
      const baseX = this.x + this.dir * 6;
      const baseY = this.y + stepY;
      terrainCtx.fillStyle = COLORS.terrain;
      terrainCtx.fillRect(baseX - w / 2, baseY - h, w, h);
      refreshTerrainData();
      this.x += this.dir * 6 * TIME_SCALE;
      this.y += stepY * TIME_SCALE;
      this.buildSteps -= 1;
      if (isSolid(this.x, this.y - LEM_HEIGHT)) {
        this.state = 'walker';
      }
    }
  }

  bash() {
    if (this.actionTimer-- <= 0) {
      this.state = 'walker';
      return;
    }
    const area = { x: this.x + this.dir * (LEM_WIDTH / 2), y: this.y - LEM_HEIGHT / 2, w: this.dir * 10, h: 10 };
    carve(area, true);
  }

  dig() {
    if (this.actionTimer-- <= 0) {
      this.state = 'walker';
      return;
    }
    const area = { x: this.x - LEM_WIDTH / 2, y: this.y, w: LEM_WIDTH, h: 6 };
    carve(area, true);
    if (!isSolid(this.x, this.y + 1)) {
      this.state = 'fall';
    }
  }

  tickBomb() {
    this.bombTimer -= 1;
    if (this.bombTimer <= 0) {
      explosion(this.x, this.y - LEM_HEIGHT / 2, 26);
      this.removed = true;
      state.lost += 1;
    }
  }
}

function cloneLevel(level) {
  const terrain = level.terrain || {};
  return {
    ...level,
    skills: { ...level.skills },
    terrain: {
      ...terrain,
      ground: terrain.ground ? terrain.ground.map(r => ({ ...r })) : [],
      blocks: terrain.blocks ? terrain.blocks.map(r => ({ ...r })) : [],
      holes: terrain.holes ? terrain.holes.map(r => ({ ...r })) : [],
      steel: terrain.steel ? terrain.steel.map(r => ({ ...r })) : [],
      image: terrain.image || null
    }
  };
}

function createState(level) {
  return {
    level,
    lemmings: [],
    rescued: 0,
    lost: 0,
    out: 0,
    spawnTimer: 0,
    timeLeft: level.timeLimit,
    status: 'Idle',
    skills: { ...level.skills }
  };
}

function drawLevel(level) {
  terrainCanvas.width = level.width;
  terrainCanvas.height = level.height;
  canvas.width = level.width;
  canvas.height = level.height;
  terrainCtx.clearRect(0, 0, level.width, level.height);

  if (level.terrain.image) {
    terrainCtx.drawImage(level.terrain.image, 0, 0, level.width, level.height);
  }
  terrainCtx.fillStyle = COLORS.terrain;
  const t = level.terrain;
  if (t.ground) t.ground.forEach(r => terrainCtx.fillRect(r.x, r.y, r.w, r.h));
  if (t.blocks) t.blocks.forEach(r => terrainCtx.fillRect(r.x, r.y, r.w, r.h));
  if (t.holes) {
    terrainCtx.save();
    terrainCtx.globalCompositeOperation = 'destination-out';
    t.holes.forEach(r => terrainCtx.fillRect(r.x, r.y, r.w, r.h));
    terrainCtx.restore();
  }
  refreshTerrainData();
}

function refreshTerrainData() {
  terrainData = terrainCtx.getImageData(0, 0, terrainCanvas.width, terrainCanvas.height);
}

function isSolid(x, y) {
  if (!terrainData) return false;
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  if (xi < 0 || yi < 0 || xi >= terrainData.width || yi >= terrainData.height) return false;
  const idx = (yi * terrainData.width + xi) * 4 + 3;
  return terrainData.data[idx] > 1;
}

function intersects(a, b) {
  return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
}

function carve(area, respectSteel = true) {
  const { x, y, w, h } = areaRect(area);
  if (respectSteel && hitsSteel({ x, y, w, h })) return;
  terrainCtx.save();
  terrainCtx.globalCompositeOperation = 'destination-out';
  terrainCtx.fillRect(x, y, w, h);
  terrainCtx.restore();
  refreshTerrainData();
}

function explosion(x, y, radius) {
  terrainCtx.save();
  terrainCtx.globalCompositeOperation = 'destination-out';
  terrainCtx.beginPath();
  terrainCtx.arc(x, y, radius, 0, Math.PI * 2);
  terrainCtx.fill();
  terrainCtx.restore();
  refreshTerrainData();
  state.lemmings = state.lemmings.filter(l => {
    if (l.removed) return false;
    const dx = l.x - x; const dy = l.y - y;
    if (dx * dx + dy * dy <= radius * radius) {
      l.removed = true;
      state.lost += 1;
      return false;
    }
    return true;
  });
}

function hitsSteel(area) {
  const steel = state.level.terrain.steel || [];
  return steel.some(s => intersects(area, s));
}

function areaRect(a) {
  const w = Math.abs(a.w);
  return { x: Math.min(a.x, a.x + a.w), y: a.y, w, h: a.h };
}

function drawGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0a0c14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(terrainCanvas, 0, 0);
  drawExit();
  drawSpawn();

  for (const lem of state.lemmings) {
    drawLemming(lem);
  }
  if (hoverLemming && !hoverLemming.removed) {
    const r = hoverLemming.rect();
    ctx.save();
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4);
    ctx.restore();
  }

  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(0, 0, canvas.width, 30);
  ctx.fillStyle = '#8be9fd';
  ctx.fillText(`Time ${Math.ceil(state.timeLeft)}s`, 10, 20);
}

function drawLemming(lem) {
  if (lem.removed) return;
  const r = lem.rect();
  ctx.save();
  ctx.translate(0.5, 0.5);
  ctx.fillStyle = '#2ee0a5';
  ctx.fillRect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = '#dfe6ee';
  ctx.fillRect(r.x + 2, r.y + 2, r.w - 4, r.h - 6);
  ctx.fillStyle = lem.state === 'blocker' ? '#ffb86c' : '#8be9fd';
  ctx.fillRect(r.x + 2, r.y - 2, r.w - 4, 4);
  if (lem.climber) {
    ctx.strokeStyle = '#ffd166';
    ctx.beginPath();
    ctx.moveTo(r.x, r.y + 2);
    ctx.lineTo(r.x, r.y + r.h - 2);
    ctx.stroke();
  }
  if (lem.floater) {
    ctx.strokeStyle = '#a29bfe';
    ctx.beginPath();
    ctx.moveTo(lem.x, r.y - 6);
    ctx.lineTo(lem.x + 4, r.y - 10);
    ctx.lineTo(lem.x - 4, r.y - 10);
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

function drawExit() {
  const ex = state.level.exit;
  ctx.fillStyle = COLORS.exit;
  ctx.fillRect(ex.x - 12, ex.y - 28, 24, 28);
  ctx.fillStyle = '#0a0c14';
  ctx.fillRect(ex.x - 8, ex.y - 20, 16, 20);
}

function drawSpawn() {
  const sp = state.level.spawn;
  ctx.fillStyle = COLORS.spawn;
  ctx.fillRect(sp.x - 12, sp.y - 12, 24, 12);
}

function applyGravity() {
  this.vy += 0.55 * TIME_SCALE;
}

Lemming.prototype.applyGravity = applyGravity;

function update(delta) {
  if (!running || paused) return;
  state.timeLeft -= delta * TIME_SCALE;
  if (state.timeLeft <= 0) {
    running = false;
    state.status = 'Time up';
  }
  // spawn
  if (state.out < state.level.lemmingsTotal) {
    state.spawnTimer -= delta * 60 * TIME_SCALE;
    if (state.spawnTimer <= 0) {
      spawnLemming();
      state.spawnTimer = state.level.spawnRate;
    }
  }

  const blockers = state.lemmings.filter(l => l.state === 'blocker');
  state.lemmings.forEach(l => l.update(blockers));
  state.lemmings = state.lemmings.filter(l => !l.removed);

  // exits
  for (const l of state.lemmings) {
    if (l.state === 'splat') continue;
    if (distance(l.x, l.y, state.level.exit.x, state.level.exit.y) < 16) {
      l.removed = true;
      state.rescued += 1;
    }
  }
  state.lemmings = state.lemmings.filter(l => !l.removed);

  checkWinLoss();
}

function distance(x1, y1, x2, y2) {
  const dx = x1 - x2; const dy = y1 - y2; return Math.sqrt(dx * dx + dy * dy);
}

function spawnLemming() {
  const lem = new Lemming(state.level);
  state.lemmings.push(lem);
  state.out += 1;
}

function checkWinLoss() {
  const needed = Math.ceil(state.level.lemmingsTotal * (state.level.requiredPercent / 100));
  if (state.rescued >= needed) {
    running = false;
    state.status = 'Level complete';
  }
  const totalGone = state.rescued + state.lost;
  if (totalGone >= state.level.lemmingsTotal && state.rescued < needed) {
    running = false;
    state.status = 'Failed';
  }
}

function loop(now) {
  const delta = (now - lastTime) / 1000;
  lastTime = now;
  accumulator += delta;
  while (accumulator >= GAME_STEP) {
    update(GAME_STEP);
    accumulator -= GAME_STEP;
  }
  drawGame();
  updateUI();
  requestAnimationFrame(loop);
}

function updateUI() {
  const needed = Math.ceil(state.level.lemmingsTotal * (state.level.requiredPercent / 100));
  lemmingCounts.textContent = `Out ${state.out}/${state.level.lemmingsTotal} | Home ${state.rescued}/${needed} | Lost ${state.lost}`;
  timerLine.textContent = `Timer: ${Math.max(0, Math.ceil(state.timeLeft))}s`;
  goalLine.textContent = `Save ${state.level.requiredPercent}% in ${state.level.timeLimit}s`;
  statusLine.textContent = state.status || (running ? 'Running' : 'Idle');
  updateSkillCounts();
}

function buildLevelOptions() {
  levelSelect.innerHTML = '';
  LEVELS.concat(customLevels).forEach((lvl) => {
    const opt = document.createElement('option');
    opt.value = lvl.id;
    opt.textContent = lvl.name;
    levelSelect.appendChild(opt);
  });
  levelSelect.value = currentLevel.id;
}

function buildSkillButtons() {
  skillButtonsEl.innerHTML = '';
  SKILLS.forEach(sk => {
    const btn = document.createElement('button');
    btn.className = 'skill-btn';
    btn.dataset.skill = sk.key;
    btn.innerHTML = `<span>${sk.label}</span><span id="count-${sk.key}"></span>`;
    btn.addEventListener('click', () => setActiveSkill(sk.key));
    skillButtonsEl.appendChild(btn);
  });
  updateSkillCounts();
}

function setActiveSkill(skill) {
  activeSkill = skill;
  document.querySelectorAll('.skill-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.skill === skill));
}

function updateSkillCounts() {
  SKILLS.forEach(sk => {
    const el = document.getElementById(`count-${sk.key}`);
    if (!el) return;
    const remaining = state.skills[sk.key];
    el.textContent = remaining !== undefined ? `${remaining}` : '8';
  });
}

function setLevelById(id) {
  const lvl = LEVELS.concat(customLevels).find(l => l.id === id);
  if (!lvl) return;
  currentLevel = cloneLevel(lvl);
  state = createState(cloneLevel(lvl));
  drawLevel(currentLevel);
  updateSkillCounts();
  running = false;
  paused = false;
  statusLine.textContent = 'Idle';
}

function startLevel() {
  state = createState(cloneLevel(currentLevel));
  drawLevel(currentLevel);
  running = true;
  paused = false;
  state.status = 'Running';
  updateSkillCounts();
}

function restartLevel() {
  state = createState(cloneLevel(currentLevel));
  drawLevel(currentLevel);
  running = true;
  paused = false;
  state.status = 'Running';
  updateSkillCounts();
}

function pauseLevel() {
  paused = !paused;
  state.status = paused ? 'Paused' : 'Running';
}

canvas.addEventListener('click', (e) => {
  if (!activeSkill) return;
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  const target = state.lemmings.find(l => !l.removed && pointInRect(x, y, l.rect()));
  if (target && state.skills[activeSkill] > 0) {
    const applied = target.assign(activeSkill);
    if (applied) {
      state.skills[activeSkill] -= 1;
      updateSkillCounts();
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width / rect.width);
  const y = (e.clientY - rect.top) * (canvas.height / rect.height);
  hoverLemming = state.lemmings.find(l => !l.removed && pointInRect(x, y, l.rect())) || null;
});

canvas.addEventListener('mouseleave', () => { hoverLemming = null; });

function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

levelSelect.addEventListener('change', (e) => {
  setLevelById(e.target.value);
});
startBtn.addEventListener('click', startLevel);
pauseBtn.addEventListener('click', pauseLevel);
restartBtn.addEventListener('click', restartLevel);

uploadInput.addEventListener('change', handleUpload);
addCustomLevelBtn.addEventListener('click', useUploadedLevel);

function handleUpload(ev) {
  const file = ev.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    uploadedImage = img;
  };
  img.src = URL.createObjectURL(file);
}

function useUploadedLevel() {
  if (!uploadedImage) return;
  const [sx, sy] = customSpawn.value.split(',').map(n => parseInt(n.trim(), 10));
  const [ex, ey] = customExit.value.split(',').map(n => parseInt(n.trim(), 10));
  const [save, time] = customGoal.value.split(',').map(n => parseInt(n.trim(), 10));
  const width = parseInt(customWidth.value, 10) || uploadedImage.width;
  const height = parseInt(customHeight.value, 10) || uploadedImage.height;
  const id = `custom-${Date.now()}`;
  const lvl = {
    id,
    name: `Custom ${customLevels.length + 1}`,
    width,
    height,
    timeLimit: time || 300,
    requiredPercent: save || 50,
    lemmingsTotal: 30,
    spawnRate: 18,
    spawn: { x: sx || 40, y: sy || 40 },
    exit: { x: ex || width - 40, y: ey || height - 40 },
    skills: { builder: 12, basher: 8, digger: 8, blocker: 4, climber: 6, floater: 6, bomber: 4 },
    terrain: { image: uploadedImage, steel: [] }
  };
  customLevels.push(lvl);
  buildLevelOptions();
  setLevelById(id);
  drawCustomTerrain(lvl);
}

function drawCustomTerrain(level) {
  canvas.width = level.width;
  canvas.height = level.height;
  terrainCanvas.width = level.width;
  terrainCanvas.height = level.height;
  terrainCtx.clearRect(0, 0, level.width, level.height);
  terrainCtx.drawImage(level.terrain.image, 0, 0, level.width, level.height);
  refreshTerrainData();
}

function init() {
  buildLevelOptions();
  buildSkillButtons();
  drawLevel(currentLevel);
  requestAnimationFrame(loop);
}

init();
