import { COLORS } from "./config.js";

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function drawTileBackground(ctx, w, h, palette = "default") {
  ctx.save();
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  if (palette === "toilet") {
    grad.addColorStop(0, "#d6e3f0");
    grad.addColorStop(1, "#b5c4d6");
  } else if (palette === "mainpipe") {
    grad.addColorStop(0, "#8d97ab");
    grad.addColorStop(1, "#5e687c");
  } else {
    grad.addColorStop(0, "#e8eef5");
    grad.addColorStop(1, "#c4ceda");
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const tile = 56;
  const cols = Math.ceil(w / tile) + 1;
  const rows = Math.ceil(h / tile) + 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * tile;
      const y = r * tile;
      const offsetRow = r % 2 === 0 ? 0 : tile / 2;
      const tx = x + offsetRow;
      const lightOn = (c + r) % 2 === 0;
      const tg = ctx.createLinearGradient(tx, y, tx, y + tile);
      if (palette === "mainpipe") {
        tg.addColorStop(0, lightOn ? "#9aa5b8" : "#828d9f");
        tg.addColorStop(1, lightOn ? "#7a8497" : "#67708a");
      } else if (palette === "toilet") {
        tg.addColorStop(0, lightOn ? "#e1eaf3" : "#cad7e5");
        tg.addColorStop(1, lightOn ? "#c8d4e2" : "#b3c1d3");
      } else {
        tg.addColorStop(0, lightOn ? "#f0f5fa" : "#dde6ef");
        tg.addColorStop(1, lightOn ? "#d4dfeb" : "#bcc8d6");
      }
      ctx.fillStyle = tg;
      ctx.fillRect(tx + 1, y + 1, tile - 2, tile - 2);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(tx + 3, y + 3, tile - 6, 2);
      ctx.fillRect(tx + 3, y + 3, 2, tile - 6);
      ctx.fillStyle = "rgba(0,0,0,0.12)";
      ctx.fillRect(tx + tile - 5, y + 3, 2, tile - 6);
      ctx.fillRect(tx + 3, y + tile - 5, tile - 6, 2);
      if ((c * 17 + r * 31) % 7 === 0) {
        ctx.fillStyle = "rgba(140,100,60,0.18)";
        ctx.fillRect(tx + 6 + ((c * 13) % 20), y + 6 + ((r * 11) % 20), 4, 2);
      }
    }
  }
  ctx.fillStyle = "rgba(40,52,80,0.45)";
  for (let r = 0; r < rows + 1; r++) ctx.fillRect(0, r * tile, w, 1);
  for (let c = 0; c < cols + 1; c++) ctx.fillRect(c * tile, 0, 1, h);
  ctx.fillStyle = "rgba(120,80,40,0.12)";
  for (let i = 0; i < 30; i++) {
    const sx = (i * 977 + 23) % w;
    const sy = (i * 631 + 41) % h;
    ctx.beginPath();
    ctx.arc(sx, sy, 1 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawPath(ctx, points, opts = {}) {
  if (points.length < 2) return;
  const outer = opts.outerWidth ?? 56;
  const inner = opts.innerWidth ?? 38;
  const intensity = Math.max(0, Math.min(1, opts.intensity || 0));
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (intensity > 0.05) {
    ctx.strokeStyle = `rgba(233,83,75,${0.4 * intensity})`;
    ctx.lineWidth = outer + 22;
    ctx.shadowColor = `rgba(255,90,60,${0.55 * intensity})`;
    ctx.shadowBlur = 24;
    poly(ctx, points);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = outer + 10;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 6;
  poly(ctx, points);
  ctx.stroke();
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "#5a6377";
  ctx.lineWidth = outer;
  poly(ctx, points);
  ctx.stroke();
  ctx.strokeStyle = "#3a4255";
  ctx.lineWidth = outer - 4;
  poly(ctx, points);
  ctx.stroke();
  ctx.strokeStyle = "#2a3144";
  ctx.lineWidth = outer - 12;
  poly(ctx, points);
  ctx.stroke();
  ctx.strokeStyle = "#0e1320";
  ctx.lineWidth = inner;
  poly(ctx, points);
  ctx.stroke();
  ctx.strokeStyle = "rgba(120,140,180,0.25)";
  ctx.lineWidth = 2;
  poly(ctx, points, -inner / 2 + 2);
  ctx.stroke();
  ctx.save();
  ctx.strokeStyle = "rgba(80,40,20,0.5)";
  ctx.lineWidth = inner - 6;
  ctx.setLineDash([6, 18]);
  ctx.lineDashOffset = -((opts.time || 0) * 60);
  poly(ctx, points);
  ctx.stroke();
  ctx.restore();
  drawRivets(ctx, points, outer);
  drawFlowArrows(ctx, points, opts.time || 0);
  for (let i = 1; i < points.length - 1; i++) drawBend(ctx, points[i], outer);
  drawEnd(ctx, points[0], outer, "in");
  drawEnd(ctx, points[points.length - 1], outer, "out");
  ctx.restore();
}

function drawFlowArrows(ctx, points, time) {
  const speed = 50;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    if (len < 60) continue;
    const ux = dx / len;
    const uy = dy / len;
    const spacing = 80;
    const offset = (time * speed) % spacing;
    for (let d = 30 + offset; d < len - 20; d += spacing) {
      const px = a.x + ux * d;
      const py = a.y + uy * d;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.atan2(uy, ux));
      ctx.fillStyle = "rgba(120,200,255,0.45)";
      ctx.beginPath();
      ctx.moveTo(-6, -5);
      ctx.lineTo(2, 0);
      ctx.lineTo(-6, 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(160,230,255,0.8)";
      ctx.beginPath();
      ctx.moveTo(-3, -3);
      ctx.lineTo(1, 0);
      ctx.lineTo(-3, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

function poly(ctx, points, yOff = 0) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y + yOff);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y + yOff);
}

function drawRivets(ctx, points, outer) {
  const step = 36;
  const half = outer / 2 - 4;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy);
    const nx = dy / len, ny = -dx / len;
    const count = Math.floor(len / step);
    for (let r = 1; r <= count; r++) {
      const t = r / (count + 1);
      const px = a.x + dx * t, py = a.y + dy * t;
      for (const side of [1, -1]) {
        const rx = px + nx * half * side, ry = py + ny * half * side;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.beginPath(); ctx.arc(rx + 0.5, ry + 0.5, 2.2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#8a93a8";
        ctx.beginPath(); ctx.arc(rx, ry, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.45)";
        ctx.beginPath(); ctx.arc(rx - 0.5, ry - 0.5, 0.8, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
}

function drawBend(ctx, p, outer) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.arc(p.x, p.y, outer / 2 + 8, 0, Math.PI * 2); ctx.fill();
  const rg = ctx.createRadialGradient(p.x - 6, p.y - 8, 4, p.x, p.y, outer / 2 + 6);
  rg.addColorStop(0, "#6d7a92"); rg.addColorStop(0.6, "#3a4255"); rg.addColorStop(1, "#1a1f2d");
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(p.x, p.y, outer / 2 + 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#0a0d14";
  ctx.beginPath(); ctx.arc(p.x, p.y, outer / 2 - 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(180,200,230,0.35)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, p.y, outer / 2 - 4, -Math.PI * 0.7, -Math.PI * 0.1); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const rr = outer / 2 + 2;
    const rx = p.x + Math.cos(a) * rr, ry = p.y + Math.sin(a) * rr;
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.beginPath(); ctx.arc(rx + 0.5, ry + 0.5, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#8a93a8";
    ctx.beginPath(); ctx.arc(rx, ry, 2.2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawEnd(ctx, p, outer, dir) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath(); ctx.arc(p.x, p.y, outer / 2 + 10, 0, Math.PI * 2); ctx.fill();
  const rg = ctx.createRadialGradient(p.x - 6, p.y - 8, 4, p.x, p.y, outer / 2 + 8);
  rg.addColorStop(0, "#7d8aa3"); rg.addColorStop(1, "#2a3144");
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.arc(p.x, p.y, outer / 2 + 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#06080d";
  ctx.beginPath(); ctx.arc(p.x, p.y, outer / 2, 0, Math.PI * 2); ctx.fill();
  if (dir === "out") {
    ctx.fillStyle = "rgba(255,80,40,0.18)";
    ctx.beginPath(); ctx.arc(p.x, p.y, outer / 2 + 22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,107,61,0.35)";
    ctx.beginPath(); ctx.arc(p.x, p.y, outer / 2 + 12, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawToiletEntry(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y - 24);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath(); ctx.ellipse(0, 38, 44, 8, 0, 0, Math.PI * 2); ctx.fill();
  const tg = ctx.createLinearGradient(-36, -48, 36, -48);
  tg.addColorStop(0, "#f6f9fc"); tg.addColorStop(0.5, "#ffffff"); tg.addColorStop(1, "#d6dee8");
  ctx.fillStyle = tg;
  roundRect(ctx, -36, -48, 72, 32, 6); ctx.fill();
  ctx.fillStyle = "#b8c4d1"; roundRect(ctx, -36, -48, 72, 6, 4); ctx.fill();
  ctx.fillStyle = "#5a6377"; ctx.fillRect(26, -42, 6, 4);
  const bg = ctx.createRadialGradient(0, 0, 8, 0, 0, 36);
  bg.addColorStop(0, "#ffffff"); bg.addColorStop(0.7, "#dee5ee"); bg.addColorStop(1, "#b5c1d0");
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.ellipse(0, 6, 36, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#0e1525";
  ctx.beginPath(); ctx.ellipse(0, 6, 26, 14, 0, 0, Math.PI * 2); ctx.fill();
  const wa = 0.55 + Math.sin(time * 2.4) * 0.15;
  ctx.fillStyle = `rgba(80,160,230,${wa})`;
  ctx.beginPath(); ctx.ellipse(0, 6, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.beginPath(); ctx.ellipse(-8, 1, 5, 2, -0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#1a2a40"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center";
  ctx.fillText("변기", 0, -54);
  ctx.restore();
}

export function drawSinkEntry(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y - 16);
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath(); ctx.ellipse(0, 28, 38, 6, 0, 0, Math.PI * 2); ctx.fill();
  const sg = ctx.createLinearGradient(-40, -28, 40, 14);
  sg.addColorStop(0, "#ffffff"); sg.addColorStop(0.6, "#e1eaf3"); sg.addColorStop(1, "#b5c1d0");
  ctx.fillStyle = sg;
  roundRect(ctx, -40, -28, 80, 38, 10); ctx.fill();
  ctx.fillStyle = "#0e1525";
  ctx.beginPath(); ctx.ellipse(0, -4, 28, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#9aa9bd"; ctx.fillRect(-3, -34, 6, 18);
  ctx.fillStyle = "#5a6377"; roundRect(ctx, -8, -32, 16, 4, 2); ctx.fill();
  ctx.fillStyle = "#7a8aa0"; ctx.fillRect(-1, -10, 2, 4);
  const sa = 0.6 + Math.sin(time * 4) * 0.2;
  ctx.fillStyle = `rgba(120,200,255,${sa})`;
  for (let i = 0; i < 3; i++) ctx.fillRect(-1 + (i - 1) * 1.5, -6 + i * 1.5, 1.2, 4);
  ctx.fillStyle = "#1a2a40"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center";
  ctx.fillText("세면대", 0, -40);
  ctx.restore();
}

export function drawJunctionEntry(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y - 10);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.ellipse(0, 26, 32, 6, 0, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(-4, -8, 4, 0, 0, 30);
  g.addColorStop(0, "#7d8aa3"); g.addColorStop(1, "#2a3144");
  ctx.fillStyle = g;
  roundRect(ctx, -32, -28, 64, 40, 8); ctx.fill();
  ctx.fillStyle = "#0a0d14";
  ctx.beginPath(); ctx.ellipse(0, -2, 24, 14, 0, 0, Math.PI * 2); ctx.fill();
  const glow = 0.35 + Math.sin(time * 3) * 0.2;
  ctx.fillStyle = `rgba(255,140,60,${glow})`;
  ctx.beginPath(); ctx.ellipse(0, -2, 16, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.75)"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center";
  ctx.fillText("진입", 0, -34);
  ctx.restore();
}

export function drawSewerExit(ctx, x, y, time) {
  ctx.save();
  ctx.translate(x, y);
  const pulse = 0.18 + Math.sin(time * 2.4) * 0.1;
  ctx.fillStyle = `rgba(255,80,40,${pulse})`;
  ctx.beginPath(); ctx.arc(0, 0, 64, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(255,120,60,${pulse + 0.15})`;
  ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#7d8aa3"; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.fillStyle = "#8a93a8";
    ctx.beginPath(); ctx.arc(Math.cos(a) * 28, Math.sin(a) * 28, 2.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "#06080d";
  ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(255,107,61,${0.35 + Math.sin(time * 4) * 0.15})`;
  ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,200,120,0.65)"; ctx.font = "bold 9px -apple-system, sans-serif"; ctx.textAlign = "center";
  ctx.fillText("⚠ 메인 오수관", 0, 50);
  ctx.restore();
}

export function drawSlot(ctx, x, y, hover, time, locked = false, buildModeActive = false) {
  ctx.save();
  ctx.translate(x, y);
  const pulse = (Math.sin(time * 2.6) + 1) * 0.5;
  const pulseFast = (Math.sin(time * 4.2) + 1) * 0.5;
  if (hover && !locked) {
    ctx.fillStyle = `rgba(78,161,255,${0.5 + pulse * 0.25})`;
    ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(120,200,255,${0.25 + pulseFast * 0.15})`;
    ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
  } else if (buildModeActive && !locked) {
    ctx.fillStyle = `rgba(94,207,128,${0.32 + pulse * 0.22})`;
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = locked
    ? "rgba(200,80,80,0.25)"
    : buildModeActive
      ? `rgba(160,220,170,${0.45 + pulse * 0.2})`
      : `rgba(140,180,235,${0.42 + pulse * 0.18})`;
  ctx.beginPath(); ctx.arc(0, 0, hover && !locked ? 22 : 18, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = hover && !locked
    ? "#4ea1ff"
    : locked
      ? "rgba(200,80,80,0.7)"
      : buildModeActive
        ? `rgba(94,207,128,${0.85 + pulse * 0.15})`
        : `rgba(140,180,235,${0.9 + pulse * 0.1})`;
  ctx.lineWidth = hover && !locked ? 3 : buildModeActive ? 2.4 : 2;
  ctx.setLineDash(hover && !locked ? [] : buildModeActive ? [] : [4, 4]);
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();
  ctx.setLineDash([]);
  if (hover && !locked) {
    ctx.fillStyle = "#4ea1ff"; ctx.font = "bold 20px -apple-system, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("+", 0, 1);
  } else if (buildModeActive && !locked) {
    ctx.fillStyle = `rgba(94,207,128,${0.8 + pulseFast * 0.2})`; ctx.font = "bold 16px -apple-system, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("+", 0, 1);
  } else if (locked) {
    ctx.fillStyle = "rgba(200,80,80,0.9)"; ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("✕", 0, 1);
  } else {
    ctx.fillStyle = `rgba(140,180,235,${0.6 + pulse * 0.3})`;
    ctx.font = "10px -apple-system, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("+", 0, 1);
  }
  ctx.restore();
}

export function drawEnemy(ctx, enemy, time) {
  const { type, x, y, hpRatio, effects, def, hitFlash } = enemy;
  ctx.save();
  ctx.translate(x, y);
  const wobble = Math.sin(time * 7 + enemy.seed) * 0.06;
  ctx.rotate(wobble);
  const bob = Math.sin(time * 5 + enemy.seed * 0.7) * 1.2;
  ctx.translate(0, bob);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.ellipse(0, def.radius + 3, def.radius * 0.95, 4.5, 0, 0, Math.PI * 2); ctx.fill();
  if (type === "wetwipe") drawWetWipe(ctx, def, time, enemy.seed);
  else if (type === "paper") drawPaper(ctx, def, time, enemy.seed);
  else if (type === "lens") drawLens(ctx, def);
  else if (type === "cap") drawCap(ctx, def);
  else if (type === "micro") drawMicro(ctx, def, time, enemy.seed);
  else if (type === "kitchen") drawKitchen(ctx, def, time, enemy.seed);
  else if (type === "boss") drawBoss(ctx, def, time, enemy.seed, enemy.bossVariant ?? 0, enemy.hpRatio ?? 1);
  if (hitFlash > 0) {
    ctx.globalAlpha = Math.min(1, hitFlash);
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(0, 0, def.radius + 2, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (effects?.stun > 0) {
    for (let i = 0; i < 3; i++) {
      const a = time * 3 + (i * Math.PI * 2) / 3;
      ctx.fillStyle = "#d6ecff";
      ctx.beginPath(); ctx.arc(Math.cos(a) * 10, -def.radius - 8 + Math.sin(a) * 4, 2.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (effects?.poison > 0) {
    ctx.fillStyle = `rgba(123,229,140,${0.6 + Math.sin(time * 8) * 0.2})`;
    for (let i = 0; i < 4; i++) {
      const a = (time * 2 + i * 1.6 + enemy.seed) % (Math.PI * 2);
      const r = def.radius + 5;
      ctx.beginPath(); ctx.arc(Math.cos(a) * r, Math.sin(a) * r * 0.5 - 2, 2.2, 0, Math.PI * 2); ctx.fill();
    }
  }
  if (effects?.confuse > 0) {
    ctx.fillStyle = "#f6d96a"; ctx.font = "bold 14px -apple-system, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("?", 0, -def.radius - 6 + Math.sin(time * 6) * 2);
  }
  ctx.restore();
  drawHpBar(ctx, x, y - def.radius - 10, def, hpRatio);
}

function drawWetWipe(ctx, def, time, seed) {
  const r = def.radius;
  const breath = Math.sin(time * 2.4 + seed) * 0.06;
  ctx.save();
  ctx.scale(1 + breath, 1 - breath * 0.6);
  ctx.fillStyle = "rgba(20,55,110,0.55)";
  roundRect(ctx, -r - 1.5, -r * 0.78 - 1.5, r * 2 + 3, r * 1.56 + 3, 5); ctx.fill();
  const g = ctx.createLinearGradient(-r, -r * 0.7, r, r * 0.7);
  g.addColorStop(0, "#b6dcff"); g.addColorStop(0.5, "#7eb8ff"); g.addColorStop(1, "#4a8ec8");
  ctx.fillStyle = g;
  roundRect(ctx, -r, -r * 0.75, r * 2, r * 1.5, 4); ctx.fill();
  ctx.save();
  ctx.beginPath();
  roundRect(ctx, -r, -r * 0.75, r * 2, r * 1.5, 4);
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.45)"; ctx.lineWidth = 1.1;
  for (let i = -2; i <= 3; i++) {
    const ws = ((seed * 13 + i * 7) % 5) - 2;
    ctx.beginPath();
    ctx.moveTo(-r - 2, -r * 0.6 + i * 3 + ws * 0.5);
    ctx.bezierCurveTo(
      -r * 0.4, -r * 0.6 + i * 3 + ws,
      r * 0.4, -r * 0.6 + i * 3 - ws,
      r + 2, -r * 0.6 + i * 3 + ws * 0.5,
    );
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(40,80,140,0.4)"; ctx.lineWidth = 0.6;
  for (let i = 0; i < 6; i++) {
    const a = (seed * 17 + i * 41) % 360;
    const px = -r + ((a * 7) % (r * 2));
    const py = -r * 0.7 + ((a * 11) % (r * 1.4));
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + 2 + (i % 3), py + 1 + ((i * 3) % 2));
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(80,60,30,0.32)";
  for (let i = 0; i < 3; i++) {
    const sx = -r * 0.6 + ((seed * 23 + i * 31) % (r * 1.2));
    const sy = -r * 0.4 + ((seed * 19 + i * 17) % (r * 0.8));
    ctx.beginPath(); ctx.arc(sx, sy, 1.6 + (i % 2), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillRect(-r + 2, -r * 0.7, 1.5, r * 0.5);
  ctx.fillRect(r - 3, -r * 0.6, 1, r * 0.4);
  ctx.fillStyle = "rgba(15,30,60,0.78)";
  ctx.font = `bold ${Math.floor(r * 0.5)}px -apple-system, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("물티슈", 0, 0);
  ctx.fillStyle = "rgba(15,30,60,0.55)";
  ctx.font = `${Math.floor(r * 0.32)}px sans-serif`;
  ctx.fillText("금지", 0, r * 0.45);
  ctx.restore();
  ctx.fillStyle = `rgba(120,200,255,${0.6 + Math.sin(time * 3 + seed) * 0.3})`;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    const dx = r - 2 - i * 3.5;
    const dy = -r * 0.5 + Math.sin(time * 3.4 + seed + i * 1.3) * 1.8;
    ctx.arc(dx, dy, 1.4 + (i % 2) * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(255,255,255,${0.4 + Math.sin(time * 4 + seed) * 0.2})`;
  ctx.beginPath();
  ctx.arc(-r * 0.5, -r * 0.45, 0.9, 0, Math.PI * 2);
  ctx.fill();
}

function drawPaper(ctx, def, time, seed) {
  const r = def.radius;
  const flutter = Math.sin(time * 6 + seed) * 0.04;
  ctx.save();
  ctx.rotate(flutter);
  ctx.fillStyle = "rgba(120,90,55,0.45)";
  ctx.beginPath(); ctx.arc(1, 1, r + 1.5, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, 1, 0, 0, r);
  g.addColorStop(0, "#fffaee"); g.addColorStop(0.6, "#f1e5c6"); g.addColorStop(1, "#cdb98a");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(140,110,70,0.45)"; ctx.lineWidth = 0.8;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.35 + i * 0.18), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(180,150,100,0.4)"; ctx.lineWidth = 0.6;
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + seed * 0.13;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * (r * 0.3), Math.sin(a) * (r * 0.3));
    ctx.lineTo(Math.cos(a) * (r * 0.96), Math.sin(a) * (r * 0.96));
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(140,100,55,0.6)";
  ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(90,60,30,0.85)";
  ctx.beginPath(); ctx.arc(0, 0, r * 0.18, 0, Math.PI * 2); ctx.fill();
  const trailA = ((time * 1.5 + seed * 0.4) % Math.PI * 2);
  ctx.strokeStyle = "rgba(245,232,195,0.7)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const sx = Math.cos(trailA) * r;
  const sy = Math.sin(trailA) * r;
  ctx.moveTo(sx, sy);
  ctx.bezierCurveTo(
    sx * 1.3 + Math.sin(time * 4 + seed) * 1.5,
    sy * 1.3 + Math.cos(time * 4 + seed) * 1.5,
    sx * 1.5 - Math.sin(time * 4 + seed) * 2,
    sy * 1.5 - Math.cos(time * 4 + seed) * 2,
    sx * 1.7,
    sy * 1.7,
  );
  ctx.stroke();
  ctx.restore();
}

function drawLens(ctx, def) {
  const r = def.radius;
  ctx.fillStyle = "rgba(60,120,140,0.55)";
  ctx.beginPath(); ctx.arc(0.5, 0.5, r + 1.2, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, 0.5, 0, 0, r);
  g.addColorStop(0, "#f6fffe");
  g.addColorStop(0.35, "#dbfff9");
  g.addColorStop(0.75, "#a9efe5");
  g.addColorStop(1, "#5fb6a5");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
  ctx.strokeStyle = "rgba(80,180,200,0.45)"; ctx.lineWidth = 0.6;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(0, 0, r * (0.45 + i * 0.18), Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.32, -r * 0.4, r * 0.42, r * 0.18, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.4, -r * 0.45, r * 0.22, r * 0.1, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = "rgba(40,110,130,0.85)"; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(0, 0, r - 0.6, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(20,60,80,0.55)";
  ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2); ctx.fill();
}

function drawCap(ctx, def) {
  const r = def.radius;
  ctx.fillStyle = "rgba(60,80,120,0.45)";
  roundRect(ctx, -r * 0.62, -r - 1.5, r * 1.24, r * 2 + 3, 5); ctx.fill();
  ctx.fillStyle = "#6f7d99";
  roundRect(ctx, -r * 0.55, -r * 1.05, r * 1.1, r * 0.55, 4); ctx.fill();
  const cg = ctx.createLinearGradient(-r * 0.55, -r * 1.05, r * 0.55, -r * 0.5);
  cg.addColorStop(0, "#9aa6c0");
  cg.addColorStop(0.5, "#7e8aa8");
  cg.addColorStop(1, "#566080");
  ctx.fillStyle = cg;
  roundRect(ctx, -r * 0.5, -r, r * 1.0, r * 0.45, 3); ctx.fill();
  ctx.strokeStyle = "rgba(40,55,85,0.7)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 5; i++) {
    const cx = -r * 0.45 + i * (r * 0.22);
    ctx.beginPath();
    ctx.moveTo(cx, -r * 0.95);
    ctx.lineTo(cx, -r * 0.55);
    ctx.stroke();
  }
  const bg = ctx.createLinearGradient(-r * 0.55, -r * 0.55, r * 0.55, r);
  bg.addColorStop(0, "#ffffff");
  bg.addColorStop(0.5, "#e6ecf5");
  bg.addColorStop(1, "#a8b6cc");
  ctx.fillStyle = bg;
  roundRect(ctx, -r * 0.5, -r * 0.55, r * 1.0, r * 1.55, 3); ctx.fill();
  ctx.fillStyle = "rgba(80,140,200,0.85)";
  roundRect(ctx, -r * 0.35, -r * 0.25, r * 0.7, r * 0.45, 1); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `bold ${Math.floor(r * 0.35)}px monospace`;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("인공", 0, -r * 0.05);
  ctx.fillText("눈물", 0, r * 0.15);
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.fillRect(-r * 0.35, -r * 0.45, 1.2, r * 0.6);
  ctx.fillStyle = "rgba(80,140,200,0.75)";
  ctx.beginPath();
  ctx.moveTo(0, r * 0.55);
  ctx.lineTo(-r * 0.18, r * 0.85);
  ctx.lineTo(r * 0.18, r * 0.85);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.beginPath();
  ctx.arc(0, r * 0.75, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(50,80,120,0.55)";
  ctx.font = `${Math.floor(r * 0.28)}px monospace`;
  ctx.fillText("RX·5F", 0, r * 0.95);
}

function drawMicro(ctx, def, time, seed) {
  const r = def.radius;
  const w = Math.sin(time * 12 + seed) * 0.8;
  ctx.fillStyle = "rgba(80,80,100,0.5)";
  ctx.beginPath(); ctx.arc(w + 0.5, 0.5, r + 0.5, 0, Math.PI * 2); ctx.fill();
  const g = ctx.createRadialGradient(-1, -1, 0.5, 0, 0, r);
  g.addColorStop(0, "#f0f5fa"); g.addColorStop(1, "#a8b3c6");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(w, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(40,40,60,0.6)";
  ctx.beginPath(); ctx.arc(w, 0, 1.5, 0, Math.PI * 2); ctx.fill();
}

function drawKitchen(ctx, def, time, seed) {
  const r = def.radius;
  const pulse = Math.sin(time * 3 + seed) * 0.2;
  ctx.fillStyle = `rgba(180,120,40,${0.5 + pulse})`;
  roundRect(ctx, -r - 2, -r * 0.8 - 2, r * 2 + 4, r * 1.6 + 4, 3); ctx.fill();
  const g = ctx.createLinearGradient(-r, -r * 0.8, r, r * 0.8);
  g.addColorStop(0, "#ffd887"); g.addColorStop(0.5, "#f2bf5d"); g.addColorStop(1, "#d49a3a");
  ctx.fillStyle = g;
  roundRect(ctx, -r, -r * 0.8, r * 2, r * 1.6, 2); ctx.fill();
  ctx.strokeStyle = "rgba(120,80,30,0.45)"; ctx.lineWidth = 0.8;
  for (let i = 0; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(-r + i * (r / 2.5), -r * 0.8); ctx.lineTo(-r + i * (r / 2.5), r * 0.8); ctx.stroke(); }
  for (let i = 0; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(-r, -r * 0.8 + i * (r * 0.4)); ctx.lineTo(r, -r * 0.8 + i * (r * 0.4)); ctx.stroke(); }
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.font = `bold ${Math.floor(r * 0.55)}px sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("KT", 0, -1);
  ctx.fillStyle = "rgba(180,30,30,0.85)";
  ctx.font = `bold ${Math.floor(r * 0.35)}px sans-serif`;
  ctx.fillText("금물!", 0, r * 0.45);
  ctx.strokeStyle = `rgba(255,255,255,${0.4 + pulse})`; ctx.lineWidth = 1.5;
  ctx.strokeRect(-r - 2, -r * 0.8 - 2, r * 2 + 4, r * 1.6 + 4);
}

function drawBoss(ctx, def, time, seed, variant, hpRatio = 1) {
  const r = def.radius;
  const phase = time * 1.6 + seed;
  const enraged = hpRatio < 0.5;
  const dying = hpRatio < 0.25;
  const phaseSpeed = dying ? 4.5 : enraged ? 2.6 : 1.6;
  const phaseAdj = time * phaseSpeed + seed;
  ctx.fillStyle = dying
    ? `rgba(160,0,0,${0.6 + Math.sin(time * 8) * 0.3})`
    : enraged
      ? "rgba(80,20,10,0.6)"
      : "rgba(0,0,0,0.5)";
  ctx.beginPath(); ctx.ellipse(2, r + 6, r * 0.9, 6, 0, 0, Math.PI * 2); ctx.fill();
  if (enraged) {
    ctx.strokeStyle = dying
      ? `rgba(255,80,40,${0.55 + Math.sin(time * 12) * 0.3})`
      : `rgba(255,140,40,${0.4 + Math.sin(time * 6) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r + 8 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  const lobes = 9;
  const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.2, 0, 0, r);
  if (dying) {
    g.addColorStop(0, "#ff5a3a");
    g.addColorStop(0.4, "#a01a18");
    g.addColorStop(1, "#3a0808");
  } else if (enraged) {
    g.addColorStop(0, "#c66a3a");
    g.addColorStop(0.4, "#7a3018");
    g.addColorStop(1, "#2a1008");
  } else {
    g.addColorStop(0, "#8b5a2b");
    g.addColorStop(0.4, "#5e3b1f");
    g.addColorStop(1, "#2a1810");
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  for (let i = 0; i <= lobes; i++) {
    const a = (i / lobes) * Math.PI * 2;
    const wobMag = dying ? 9 : enraged ? 7 : 5;
    const wob = Math.sin(phaseAdj + a * 3 + variant) * wobMag;
    const rr = r + wob;
    const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();
  if (dying) {
    ctx.fillStyle = `rgba(255,200,80,${0.5 + Math.sin(time * 10) * 0.3})`;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + time * 2;
      const dist = r * 0.7 + Math.sin(time * 4 + i) * 4;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * dist, Math.sin(a) * dist, 2 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = "#3a2818";
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + phase * 0.4;
    const rr = r * 0.55;
    ctx.beginPath(); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, 3 + (variant % 4), 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = "#0a0503";
  ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
  const ep = (Math.sin(phase * 2) + 1) * 0.3;
  ctx.fillStyle = `rgba(255,240,80,${0.7 + ep})`;
  ctx.shadowColor = "#ffea66"; ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.arc(-r * 0.22, -r * 0.08, 5, 0, Math.PI * 2); ctx.arc(r * 0.22, -r * 0.08, 5, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#000";
  ctx.beginPath(); ctx.arc(-r * 0.22, -r * 0.08, 1.8, 0, Math.PI * 2); ctx.arc(r * 0.22, -r * 0.08, 1.8, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + phase * 0.5;
    const x = Math.cos(a) * r * 1.1, y = Math.sin(a) * r * 1.1;
    ctx.fillStyle = "rgba(60,40,20,0.7)";
    ctx.beginPath(); ctx.arc(x, y, 3 + Math.sin(phase * 3 + i) * 1.5, 0, Math.PI * 2); ctx.fill();
  }
}

function drawHpBar(ctx, x, y, def, hpRatio) {
  const w = Math.max(24, def.radius * 2 + 4);
  const h = 5;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(x - w / 2 - 1, y - h / 2 - 1, w + 2, h + 2);
  ctx.fillStyle = "#1a0808";
  ctx.fillRect(x - w / 2, y - h / 2, w, h);
  const ratio = Math.max(0, hpRatio);
  let color = def.armor >= 5 ? "#c8d4e8" : "#ff5a5a";
  if (ratio < 0.3) color = "#ff2a2a";
  else if (ratio < 0.6) color = "#ff8a3a";
  ctx.fillStyle = color;
  ctx.fillRect(x - w / 2, y - h / 2, w * ratio, h);
  if (ratio > 0) { ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(x - w / 2, y - h / 2, w * ratio, 1.5); }
  ctx.restore();
}

export function drawTower(ctx, tower, time, hover = false) {
  const { x, y, type, level, branch } = tower;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.beginPath(); ctx.ellipse(0, 20, 22, 6, 0, 0, Math.PI * 2); ctx.fill();
  if (hover) {
    ctx.fillStyle = `rgba(78,161,255,${0.18 + Math.sin(time * 3) * 0.06})`;
    ctx.beginPath(); ctx.arc(0, 0, 26, 0, Math.PI * 2); ctx.fill();
  }
  const kills = tower.kills || 0;
  let rank = null;
  if (kills >= 200) rank = { color: "#bff0ff", glow: "#7ed0ff", label: "💎", line: 2.5 };
  else if (kills >= 100) rank = { color: "#ffea66", glow: "#ffd54a", label: "🥇", line: 2.2 };
  else if (kills >= 30) rank = { color: "#d8d8e0", glow: "#a8a8b8", label: "🥈", line: 1.8 };
  else if (kills >= 10) rank = { color: "#d99a55", glow: "#a07840", label: "🥉", line: 1.6 };
  if (rank) {
    ctx.save();
    ctx.strokeStyle = rank.color;
    ctx.shadowColor = rank.glow;
    ctx.shadowBlur = 6;
    ctx.lineWidth = rank.line;
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  const recoil = tower.recoil || 0;
  ctx.translate(0, recoil * 2);
  if (type === "plunger") drawPlungerTower(ctx, level, branch, time, recoil);
  else if (type === "suction") drawSuctionTower(ctx, level, branch, time, recoil);
  else if (type === "chemical") drawChemicalTower(ctx, level, branch, time, recoil);
  else if (type === "barracks") drawBarracksTower(ctx, level, branch, time);
  ctx.translate(0, -recoil * 2);
  for (let i = 0; i < level; i++) {
    ctx.fillStyle = "#ffea66"; ctx.shadowColor = "#ffea66"; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.arc(-12 + i * 6, 18, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  if (tower.kills > 0 && tower.kills < 10000) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    roundRect(ctx, -20, -34, 40, 12, 4); ctx.fill();
    ctx.fillStyle = "#f6d96a";
    ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
    ctx.fillText(`★ ${tower.kills}`, 0, -25);
  }
  if (tower.targetMode && tower.targetMode !== "first") {
    const modeShort = {
      threat: "위협",
      strongest: "최강",
      last: "후미",
      closest: "근접",
    };
    const label = modeShort[tower.targetMode] || tower.targetMode;
    ctx.fillStyle = "rgba(78,161,255,0.85)";
    roundRect(ctx, -16, 24, 32, 11, 3); ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "bold 8px -apple-system, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 30);
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
}

function drawPlungerTower(ctx, level, branch, time, recoil = 0) {
  const isDouble = branch === "A";
  const isVacuum = branch === "B";
  const fireExtend = recoil * 4;
  ctx.fillStyle = "#3a2418"; ctx.fillRect(-3, 4, 6, 14);
  ctx.fillStyle = "#5a3a26"; ctx.fillRect(-8, 16, 16, 4);
  ctx.fillStyle = "#7a4a26"; ctx.fillRect(-2, -10 - fireExtend, 4, 18 + fireExtend);
  ctx.fillStyle = "#9a5a36"; ctx.fillRect(-2, -10 - fireExtend, 1.5, 18 + fireExtend);
  const cg = ctx.createRadialGradient(-2, -12 - fireExtend, 1, 0, -10 - fireExtend, 14);
  cg.addColorStop(0, "#ff7a6a"); cg.addColorStop(0.6, "#d44a4a"); cg.addColorStop(1, "#7a2c2c");
  ctx.fillStyle = cg;
  ctx.beginPath(); ctx.arc(0, -10 - fireExtend, 11, 0, Math.PI, true); ctx.fill();
  ctx.fillStyle = "#7a2c2c"; ctx.fillRect(-11, -12 - fireExtend, 22, 3);
  ctx.fillStyle = "#a83838"; ctx.fillRect(-11, -12 - fireExtend, 22, 1);
  if (recoil > 0.3) {
    ctx.fillStyle = `rgba(255,210,138,${recoil * 0.55})`;
    ctx.shadowColor = "#ffd28a";
    ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.arc(0, -10 - fireExtend, 14 + recoil * 6, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = "#f0c89a";
  ctx.beginPath(); ctx.arc(-7, 8, 3, 0, Math.PI * 2); ctx.arc(7, 8, 3, 0, Math.PI * 2); ctx.fill();
  if (isDouble) {
    const w = Math.sin(time * 14) * 1.5;
    ctx.fillStyle = "#7a2c2c"; ctx.fillRect(-12 + w, -6, 4, 12); ctx.fillRect(8 - w, -6, 4, 12);
    ctx.fillStyle = "#b03434";
    ctx.beginPath(); ctx.arc(-10 + w, -6, 5, 0, Math.PI, true); ctx.arc(10 - w, -6, 5, 0, Math.PI, true); ctx.fill();
  }
  if (isVacuum) {
    const pull = Math.sin(time * 5) * 2;
    ctx.strokeStyle = `rgba(111,184,255,${0.5 + pull * 0.1})`; ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, -8, 14 + i * 4 + pull, -Math.PI * 0.8, -Math.PI * 0.2); ctx.stroke(); }
  }
  if (level >= 2) {
    ctx.fillStyle = "#ffea66"; ctx.shadowColor = "#ffea66"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(0, -22, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
}

function drawSuctionTower(ctx, level, branch, time, recoil = 0) {
  const isI = branch === "A", isR = branch === "B";
  ctx.fillStyle = "#1a1f2a"; roundRect(ctx, -14, -4, 28, 22, 3); ctx.fill();
  const g = ctx.createLinearGradient(-14, -4, -14, 18);
  g.addColorStop(0, "#5a6478"); g.addColorStop(1, "#3a4258");
  ctx.fillStyle = g; roundRect(ctx, -12, -2, 24, 18, 2); ctx.fill();
  ctx.fillStyle = "#222730";
  ctx.fillRect(-10, 2, 4, 3); ctx.fillRect(-3, 2, 4, 3); ctx.fillRect(4, 2, 4, 3);
  const ledOn = recoil > 0.3;
  ctx.fillStyle = ledOn ? "#fff04a" : "#ffea66"; ctx.beginPath(); ctx.arc(-8, 4, 1.2 + recoil * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ledOn ? "#a8ffb4" : "#5acf80"; ctx.beginPath(); ctx.arc(0, 4, 1.2 + recoil * 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ledOn ? "#a4cbff" : "#4ea1ff"; ctx.beginPath(); ctx.arc(8, 4, 1.2 + recoil * 0.6, 0, Math.PI * 2); ctx.fill();
  const hg = ctx.createRadialGradient(-2, -6, 1, 0, -4, 10);
  hg.addColorStop(0, "#7fc89a"); hg.addColorStop(0.6, "#4d8c66"); hg.addColorStop(1, "#27553d");
  ctx.fillStyle = hg;
  ctx.beginPath(); ctx.arc(0, -4, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#1a3326";
  ctx.beginPath(); ctx.arc(0, -4, 5, 0, Math.PI * 2); ctx.fill();
  const intake = Math.sin(time * 9) * 1.5 + recoil * 2;
  ctx.fillStyle = isR ? "#6fb8ff" : "#0a1410";
  ctx.beginPath(); ctx.arc(0, -4, 2.5 + intake, 0, Math.PI * 2); ctx.fill();
  if (recoil > 0.3) {
    ctx.strokeStyle = `rgba(168,224,186,${recoil * 0.8})`;
    ctx.lineWidth = 2 + recoil * 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, -4, 8 + i * 5 + recoil * 4, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  if (isI) {
    ctx.fillStyle = "#888"; ctx.fillRect(-14, 10, 28, 3);
    ctx.fillStyle = "#666"; for (let i = 0; i < 5; i++) ctx.fillRect(-13 + i * 6, 10, 1, 3);
    ctx.fillStyle = "#aaa"; ctx.fillRect(-14, 13, 28, 1);
  }
  if (isR) {
    ctx.strokeStyle = `rgba(214,236,255,${0.5 + Math.sin(time * 5) * 0.3})`; ctx.lineWidth = 1.8;
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(0, -4, 14 + i * 5, 0, Math.PI * 2); ctx.stroke(); }
  }
  if (level >= 2) {
    ctx.fillStyle = "#ffea66"; ctx.shadowColor = "#ffea66"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(0, -16, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
}

function drawChemicalTower(ctx, level, branch, time, recoil = 0) {
  const isA = branch === "A", isL = branch === "B";
  ctx.fillStyle = "#1a1224"; roundRect(ctx, -9, -2, 18, 22, 3); ctx.fill();
  const g = ctx.createLinearGradient(-7, -2, 7, 20);
  g.addColorStop(0, "#a888ff"); g.addColorStop(0.5, "#7e63d1"); g.addColorStop(1, "#3e2f72");
  ctx.fillStyle = g; roundRect(ctx, -7, 0, 14, 18, 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fillRect(-6, 2, 2, 14);
  const liq = isA ? "#a8e07d" : isL ? "#a8c8ff" : "#d6b8ff";
  const shimmer = Math.sin(time * 4) * 1;
  ctx.fillStyle = liq; ctx.fillRect(-5, 6 + shimmer, 10, 10);
  ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.fillRect(-5, 6 + shimmer, 10, 1);
  ctx.fillStyle = "#1a1224"; ctx.fillRect(-3, -8, 6, 8);
  const sg = ctx.createLinearGradient(0, -16, 0, -8);
  sg.addColorStop(0, "#6f4ab8"); sg.addColorStop(1, "#3e2f72");
  ctx.fillStyle = sg; roundRect(ctx, -5, -16, 10, 8, 2); ctx.fill();
  ctx.fillStyle = "#d4b88f"; ctx.fillRect(-2, -19, 4, 3);
  if (isA) {
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + time * 1.4;
      const dist = 8 + Math.sin(time * 6 + i) * 2;
      ctx.fillStyle = `rgba(168,224,125,${0.5 + Math.sin(time * 5 + i) * 0.3})`;
      ctx.beginPath(); ctx.arc(Math.cos(a) * dist, -10 + Math.sin(a) * dist * 0.6, 1.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "rgba(168,224,125,0.7)"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("H+", 0, 12);
  }
  if (isL) {
    ctx.fillStyle = "rgba(168,200,255,0.85)"; ctx.font = "bold 8px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("L−", 0, 13);
    ctx.strokeStyle = "rgba(168,200,255,0.5)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(0, 11, 4, 0, Math.PI * 2); ctx.stroke();
  }
  if (level >= 2) {
    ctx.fillStyle = "#ffea66"; ctx.shadowColor = "#ffea66"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(0, -22, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
  if (recoil > 0.3) {
    const sprayColor = isA ? "#a8e07d" : isL ? "#a8c8ff" : "#d6b8ff";
    ctx.fillStyle = `rgba(255,255,255,${recoil * 0.7})`;
    ctx.beginPath(); ctx.arc(0, -16, 4 + recoil * 4, 0, Math.PI * 2); ctx.fill();
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + time * 8;
      const dist = 8 + recoil * 6;
      ctx.fillStyle = `rgba(${sprayColor === "#a8e07d" ? "168,224,125" : sprayColor === "#a8c8ff" ? "168,200,255" : "214,184,255"},${recoil * 0.9})`;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * dist, -16 + Math.sin(a) * dist * 0.4, 2 + recoil * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBarracksTower(ctx, level, branch, time) {
  const isM = branch === "A", isAp = branch === "B";
  ctx.fillStyle = "#3a2818"; ctx.fillRect(-15, 14, 30, 6);
  const wg = ctx.createLinearGradient(-14, -2, 14, 14);
  wg.addColorStop(0, "#c79b56"); wg.addColorStop(0.5, "#a88860"); wg.addColorStop(1, "#7a5828");
  ctx.fillStyle = wg; ctx.fillRect(-14, -2, 28, 16);
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  for (let i = 0; i < 4; i++) ctx.fillRect(-14, 1 + i * 4, 28, 0.5);
  for (let i = 0; i < 5; i++) ctx.fillRect(-14 + i * 6, -2, 0.5, 16);
  const rg = ctx.createLinearGradient(0, -16, 0, -2);
  rg.addColorStop(0, "#d8b070"); rg.addColorStop(1, "#7a5828");
  ctx.fillStyle = rg;
  ctx.beginPath(); ctx.moveTo(-16, -2); ctx.lineTo(0, -16); ctx.lineTo(16, -2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "#3a2818"; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = "#3a2818"; roundRect(ctx, -3, 2, 6, 10, 1); ctx.fill();
  ctx.fillStyle = "#ffea66"; ctx.beginPath(); ctx.arc(2, 7, 0.6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#a8c8ff";
  ctx.fillRect(-10, 1, 4, 4); ctx.fillRect(6, 1, 4, 4);
  ctx.strokeStyle = "#3a2818"; ctx.lineWidth = 0.5;
  ctx.strokeRect(-10, 1, 4, 4); ctx.strokeRect(6, 1, 4, 4);
  ctx.fillStyle = "#fff"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("배관", 0, -5);
  if (isM) {
    ctx.fillStyle = "#ffea66"; ctx.shadowColor = "#ffea66"; ctx.shadowBlur = 6;
    ctx.beginPath();
    const cx = 0, cy = -22, r = 4;
    ctx.moveTo(cx, cy - r);
    for (let i = 1; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = i % 2 === 0 ? r : r * 0.5;
      ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    }
    ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  }
  if (isAp) {
    ctx.fillStyle = "rgba(0,0,0,0.7)"; roundRect(ctx, -8, -22, 16, 8, 3); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "bold 7px sans-serif"; ctx.textAlign = "center";
    ctx.fillText("×4", 0, -16);
  }
  if (level >= 2) {
    ctx.fillStyle = "#ffea66"; ctx.shadowColor = "#ffea66"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(10, -12, 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
  }
}

export function drawPlumber(ctx, p, time) {
  ctx.save();
  ctx.translate(p.x, p.y);
  const bob = Math.sin(time * 8 + (p.seed || 0)) * 1.2;
  ctx.translate(0, bob);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.ellipse(0, 10, 8, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  const og = ctx.createLinearGradient(-5, -4, 5, 10);
  og.addColorStop(0, "#4a8acc"); og.addColorStop(1, "#1f4a85");
  ctx.fillStyle = og;
  roundRect(ctx, -5, -4, 10, 14, 2); ctx.fill();
  ctx.fillStyle = "#3060b0"; ctx.fillRect(-1, -2, 2, 10);
  ctx.fillStyle = "#ffea66"; ctx.fillRect(-3, -3, 1.5, 1.5); ctx.fillRect(1.5, -3, 1.5, 1.5);
  ctx.fillStyle = "#f0c89a";
  ctx.beginPath(); ctx.arc(0, -8, 4.5, 0, Math.PI * 2); ctx.fill();
  const hg = ctx.createLinearGradient(-6, -13, 6, -7);
  hg.addColorStop(0, "#d44a4a"); hg.addColorStop(1, "#7a2c2c");
  ctx.fillStyle = hg;
  roundRect(ctx, -6, -13, 12, 6, 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.9)"; ctx.fillRect(-5, -12, 10, 2);
  ctx.fillStyle = "#7a2c2c"; ctx.font = "bold 4px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("배관", 0, -10.6);
  ctx.fillStyle = "#000"; ctx.fillRect(-2, -7.5, 1, 0.6); ctx.fillRect(1, -7.5, 1, 0.6);
  const ws = p.weaponSide || -6;
  ctx.strokeStyle = "#3a2818"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(ws, 0); ctx.lineTo(ws - 2, -8); ctx.stroke();
  ctx.fillStyle = "#d44a4a";
  ctx.beginPath(); ctx.arc(ws - 2, -10, 3, 0, Math.PI, true); ctx.fill();
  ctx.fillStyle = "#7a2c2c"; ctx.fillRect(ws - 5, -11, 6, 1);
  if (p.hpRatio < 1) drawHpBar(ctx, 0, -20, { radius: 6, armor: 0 }, p.hpRatio);
  if (p.attackFlash > 0) {
    ctx.fillStyle = `rgba(246,217,106,${p.attackFlash * 0.7})`;
    ctx.beginPath(); ctx.arc(ws - 2, -10, 10, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawProjectile(ctx, p, time) {
  ctx.save();
  ctx.translate(p.x, p.y);
  if (p.type === "plunger") {
    const ang = Math.atan2(p.vy, p.vx); ctx.rotate(ang);
    for (let i = 1; i <= 4; i++) {
      const a = 0.4 - i * 0.08;
      ctx.fillStyle = `rgba(122,74,38,${a})`;
      ctx.fillRect(-8 - i * 5, -1.1, 6, 2.2);
    }
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(-8, -1, 16, 2);
    ctx.fillStyle = "#7a4a26"; ctx.fillRect(-7, -1, 14, 1.5);
    ctx.fillStyle = "#d44a4a";
    ctx.beginPath(); ctx.arc(7, 0, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#7a2c2c";
    ctx.beginPath(); ctx.arc(7, 0, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,180,160,0.85)";
    ctx.beginPath(); ctx.arc(8, -1.5, 1.4, 0, Math.PI * 2); ctx.fill();
  } else if (p.type === "suction") {
    const ang = Math.atan2(p.vy, p.vx); ctx.rotate(ang);
    for (let i = 1; i <= 5; i++) {
      const a = 0.55 - i * 0.1;
      ctx.fillStyle = `rgba(168,224,186,${a})`;
      ctx.beginPath();
      ctx.ellipse(-i * 6, 0, 4 - i * 0.3, 2.4 - i * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = "rgba(168,224,186,0.5)"; ctx.fillRect(-10, -2, 20, 4);
    ctx.fillStyle = "#4d8c66"; ctx.fillRect(-8, -1.5, 14, 3);
    ctx.fillStyle = "#a8e0ba"; ctx.fillRect(4, -0.5, 4, 1);
    ctx.fillStyle = "rgba(220,255,200,0.95)";
    ctx.beginPath(); ctx.arc(8, 0, 1.6, 0, Math.PI * 2); ctx.fill();
  } else if (p.type === "chemical") {
    for (let i = 1; i <= 3; i++) {
      const a = 0.35 - i * 0.1;
      ctx.fillStyle = `rgba(168,224,125,${a})`;
      const dx = -(p.vx || 0) * 0.02 * i;
      const dy = -(p.vy || 0) * 0.02 * i;
      ctx.beginPath();
      ctx.arc(dx, dy, 5 - i, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.rotate(time * 6);
    ctx.fillStyle = "rgba(168,224,125,0.4)";
    ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(-2, -2, 0, 0, 0, 7);
    g.addColorStop(0, "#dcffc8"); g.addColorStop(1, "#7be58c");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath(); ctx.arc(-2, -2, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(220,255,180,0.95)";
    ctx.beginPath(); ctx.arc(1.5, -1.5, 0.9, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

export function drawParticle(ctx, p) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
  if (p.kind === "splat") {
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  } else if (p.kind === "money") {
    const text = `+₩${p.value.toLocaleString("ko-KR")}`;
    ctx.font = `bold ${p.size}px -apple-system, sans-serif`; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillText(text, p.x + 1, p.y + 1);
    ctx.fillStyle = "#ffea66"; ctx.shadowColor = "#a07c20"; ctx.shadowBlur = 4;
    ctx.fillText(text, p.x, p.y); ctx.shadowBlur = 0;
  } else if (p.kind === "spark") {
    ctx.fillStyle = p.color; ctx.fillRect(p.x - 1, p.y - 1, 2, 2);
    ctx.shadowColor = p.color; ctx.shadowBlur = 3;
    ctx.fillRect(p.x - 0.5, p.y - 0.5, 1, 1); ctx.shadowBlur = 0;
  } else if (p.kind === "ring") {
    ctx.strokeStyle = p.color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.stroke();
  } else if (p.kind === "damage") {
    const color = p.color || "#ff6a6a";
    ctx.font = `bold ${p.size}px -apple-system, sans-serif`; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0,0,0,0.8)"; ctx.fillText(p.text, p.x + 1, p.y + 1);
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 3;
    ctx.fillText(p.text, p.x, p.y); ctx.shadowBlur = 0;
  } else if (p.kind === "text") {
    ctx.font = `bold ${p.size}px -apple-system, sans-serif`; ctx.textAlign = "center";
    ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillText(p.text, p.x + 1, p.y + 1);
    ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 4;
    ctx.fillText(p.text, p.x, p.y); ctx.shadowBlur = 0;
  } else if (p.kind === "bubble") {
    ctx.font = "11px -apple-system, sans-serif";
    const textW = ctx.measureText(p.text).width;
    const w = textW + 16, h = 20;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 1;
    roundRect(ctx, p.x - w / 2, p.y - h, w, h, 6); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(p.x - 4, p.y); ctx.lineTo(p.x, p.y + 5); ctx.lineTo(p.x + 4, p.y); ctx.closePath();
    ctx.fillStyle = "rgba(255,255,255,0.95)"; ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.stroke();
    ctx.fillStyle = "#1a1814"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(p.text, p.x, p.y - h / 2);
  }
  ctx.restore();
}

export function drawSign(ctx, sign) {
  ctx.save();
  ctx.translate(sign.x, sign.y);
  if (sign.color === "warning") {
    ctx.fillStyle = "rgba(0,0,0,0.5)"; roundRect(ctx, -46, -16, 92, 32, 2); ctx.fill();
    const g = ctx.createLinearGradient(-44, -14, 44, 14);
    g.addColorStop(0, "#fbe57a"); g.addColorStop(1, "#e8c542");
    ctx.fillStyle = g; roundRect(ctx, -44, -14, 88, 28, 2); ctx.fill();
    ctx.strokeStyle = "#1a1814"; ctx.lineWidth = 2; roundRect(ctx, -44, -14, 88, 28, 2); ctx.stroke();
    ctx.fillStyle = "#1a1814"; ctx.font = "bold 13px -apple-system, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText("⚠ " + sign.text, 0, 0);
    ctx.fillStyle = "rgba(0,0,0,0.2)"; ctx.fillRect(-2, 16, 4, 6);
  } else if (sign.color === "sticker") {
    ctx.save(); ctx.rotate(-0.04);
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(-39, -9, 80, 20);
    ctx.fillStyle = "#fbf6e7"; ctx.fillRect(-40, -10, 80, 20);
    ctx.fillStyle = "#1a1814"; ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(sign.text, 0, 0);
    ctx.fillStyle = "rgba(180,150,80,0.35)"; ctx.fillRect(-40, -10, 80, 1); ctx.fillRect(-40, 9, 80, 1);
    ctx.restore();
  } else if (sign.color === "muted") {
    ctx.fillStyle = "rgba(40,52,80,0.5)"; ctx.font = "11px monospace"; ctx.textAlign = "center";
    ctx.fillText(sign.text, 0, 0);
  } else if (sign.color === "poster") {
    ctx.save(); ctx.rotate(0.03);
    ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.fillRect(-58, -28, 120, 60);
    ctx.fillStyle = "#fffae0"; ctx.fillRect(-60, -30, 120, 60);
    ctx.fillStyle = "#e9534b"; ctx.font = "bold 13px -apple-system, sans-serif"; ctx.textAlign = "center";
    ctx.fillText("⚠ 사용 금지 ⚠", 0, -10);
    ctx.fillStyle = "#1a1814"; ctx.font = "10px -apple-system, sans-serif";
    ctx.fillText(sign.text, 0, 8);
    ctx.fillStyle = "#7a6b50"; ctx.font = "7px monospace";
    ctx.fillText("— 노마다마스 5F", 0, 22);
    ctx.restore();
  }
  ctx.restore();
}

export function drawRangeIndicator(ctx, x, y, range, color) {
  ctx.save();
  ctx.strokeStyle = color || "rgba(78,161,255,0.85)";
  const fillColor = color
    ? color.replace(/[\d.]+\)$/, "0.12)")
    : "rgba(78,161,255,0.12)";
  ctx.fillStyle = fillColor;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([8, 5]);
  ctx.beginPath(); ctx.arc(x, y, range, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.setLineDash([]);
  ctx.shadowColor = color || "rgba(78,161,255,0.85)"; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(x, y, range, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.restore();
}

export function drawHazard(ctx, h, time) {
  if (h.type !== "acid") return;
  ctx.save();
  ctx.translate(h.x, h.y);
  const lifeRatio = Math.max(0, h.duration / h.maxDuration);
  const pulse = 0.4 + Math.sin(time * 4 + h.seed) * 0.15;
  ctx.fillStyle = `rgba(120,200,80,${0.2 * lifeRatio})`;
  ctx.beginPath();
  ctx.arc(0, 0, h.radius + 4, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createRadialGradient(0, 0, 4, 0, 0, h.radius);
  g.addColorStop(0, `rgba(180,255,120,${0.7 * lifeRatio})`);
  g.addColorStop(0.6, `rgba(120,210,90,${0.55 * lifeRatio})`);
  g.addColorStop(1, `rgba(80,140,60,${0.35 * lifeRatio})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, h.radius * lifeRatio + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = `rgba(168,224,125,${pulse * lifeRatio})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, h.radius * lifeRatio, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + time * 1.2 + h.seed;
    const dist = (h.radius * 0.5) * (0.6 + Math.sin(time * 3 + i + h.seed) * 0.3);
    const bx = Math.cos(a) * dist;
    const by = Math.sin(a) * dist;
    ctx.fillStyle = `rgba(220,255,180,${0.7 * lifeRatio})`;
    ctx.beginPath();
    ctx.arc(bx, by, 2 + Math.sin(time * 5 + i) * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = `rgba(80,140,60,${0.9 * lifeRatio})`;
  ctx.font = "bold 9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("H+", 0, 3);
  ctx.restore();
}

export function drawGhostTower(ctx, type, x, y, time, valid) {
  ctx.save();
  ctx.globalAlpha = 0.65;
  drawTower(ctx, { type, x, y, level: 0, branch: null, kills: 0 }, time, false);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = valid ? "rgba(94,207,128,0.95)" : "rgba(233,83,75,0.95)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
