import {
  COLORS,
  CANVAS,
  TOWERS,
  HEROES,
  DIFFICULTY,
  TIPS,
  INVOICE,
  CREDITS,
  ENEMIES,
  TOOLS,
} from "./config.js";
import { isAudioEnabled, getMasterVolume } from "./audio.js";

export class UI {
  constructor() {
    this.buttons = [];
    this.hovered = null;
    this.lastMouse = { x: 0, y: 0 };
    this.flashes = [];
    this.toasts = [];
  }

  beginFrame() {
    this.buttons = [];
  }

  endFrame() {
    this.flashes = this.flashes.filter((f) => f.life > 0);
    this.toasts = this.toasts.filter((t) => t.life > 0);
  }

  setMouse(x, y) {
    this.lastMouse = { x, y };
    this.hovered = null;
    for (const b of this.buttons) {
      if (
        x >= b.x &&
        x <= b.x + b.w &&
        y >= b.y &&
        y <= b.y + b.h &&
        !b.disabled
      ) {
        this.hovered = b.id;
      }
    }
  }

  flash(text, opts = {}) {
    this.flashes.push({
      text,
      x: opts.x ?? CANVAS.width / 2,
      y: opts.y ?? 80,
      color: opts.color ?? "#f6d96a",
      life: opts.duration ?? 2,
      maxLife: opts.duration ?? 2,
      size: opts.size ?? 22,
    });
  }

  toast(text, opts = {}) {
    this.toasts.push({
      text,
      color: opts.color ?? "#fff",
      life: opts.duration ?? 2.4,
      maxLife: opts.duration ?? 2.4,
      bg: opts.bg ?? "rgba(20,28,46,0.92)",
    });
  }

  update(dt) {
    for (const f of this.flashes) f.life -= dt;
    for (const t of this.toasts) t.life -= dt;
  }

  button({ id, x, y, w, h, label, sub, disabled, color, danger, primary }) {
    const isHover = !disabled && this.hovered === id;
    this.buttons.push({ id, x, y, w, h, disabled });
    return { x, y, w, h, isHover, draw: drawButton, id, label, sub, disabled, color, danger, primary };
  }

  drawButton(ctx, b) {
    drawButton(ctx, b);
  }

  drawMenuButton(ctx, b) {
    drawButton(ctx, b);
  }

  hit(id) {
    return this.hovered === id;
  }
}

function drawButton(ctx, b) {
  const { x, y, w, h, isHover, label, sub, disabled } = b;
  ctx.save();
  let bg = COLORS.buttonBg;
  let stroke = COLORS.panelEdge;
  let labelColor = COLORS.textPrimary;
  if (disabled) {
    bg = "rgba(40,44,60,0.4)";
    stroke = "rgba(60,70,90,0.4)";
    labelColor = COLORS.textMuted;
  } else if (b.danger) {
    bg = isHover ? "#a23837" : "#7a2b2a";
    stroke = "#c8423f";
  } else if (b.primary) {
    bg = isHover ? "#3d7ad6" : "#2a5fb0";
    stroke = "#4ea1ff";
  } else if (isHover) {
    bg = COLORS.buttonHover;
    stroke = COLORS.panelHighlight;
  }
  ctx.fillStyle = bg;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = labelColor;
  ctx.font = `bold ${Math.min(16, h / 2.4)}px -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = sub ? "alphabetic" : "middle";
  ctx.fillText(label, x + w / 2, sub ? y + h / 2 - 2 : y + h / 2);
  if (sub) {
    ctx.fillStyle = disabled ? "rgba(150,160,180,0.5)" : COLORS.textSecondary;
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText(sub, x + w / 2, y + h - 8);
  }
  ctx.restore();
}

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

export function drawMainMenu(ctx, ui, time, progress) {
  ctx.fillStyle = COLORS.tileLight;
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS.height);
  grad.addColorStop(0, "#0e1422");
  grad.addColorStop(0.6, "#1a253c");
  grad.addColorStop(1, "#3a2b1a");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

  ctx.fillStyle = "rgba(246,217,106,0.06)";
  for (let i = 0; i < 40; i++) {
    const px = (i * 73 + (time * 30) % 1200) % CANVAS.width;
    const py = (i * 131) % CANVAS.height;
    ctx.beginPath();
    ctx.arc(px, py, 1 + Math.sin(time + i) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(CANVAS.width / 2, 160);
  ctx.fillStyle = "#f6d96a";
  ctx.font = "bold 64px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(246,217,106,0.5)";
  ctx.shadowBlur = 30;
  ctx.fillText("NomaDamas", 0, 0);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.font = "bold 48px -apple-system, sans-serif";
  ctx.fillText("Toilet Defense 🚽", 0, 60);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "20px -apple-system, sans-serif";
  ctx.fillText("변기톤 · 5층 배관을 사수하라", 0, 100);
  ctx.fillStyle = "#7c89a8";
  ctx.font = "13px -apple-system, sans-serif";
  ctx.fillText(
    "데모데이 화요일까지 출시 · Sisyphus Labs 토큰 후원 by 연규 Kim",
    0,
    128,
  );
  ctx.restore();

  const buttonW = 320;
  const buttonX = (CANVAS.width - buttonW) / 2;
  const baseY = 400;

  const startBtn = ui.button({
    id: "menu_start",
    x: buttonX,
    y: baseY,
    w: buttonW,
    h: 56,
    label: "시작 · START GAME",
    sub: "스테이지를 선택하세요",
    primary: true,
  });
  ui.drawMenuButton(ctx, startBtn);

  const tutorialBtn = ui.button({
    id: "menu_tutorial",
    x: buttonX,
    y: baseY + 72,
    w: buttonW,
    h: 44,
    label: "도움말 · HOW TO PLAY",
  });
  ui.drawMenuButton(ctx, tutorialBtn);

  const bestiaryBtn = ui.button({
    id: "menu_bestiary",
    x: buttonX,
    y: baseY + 124,
    w: buttonW,
    h: 44,
    label: "📖 도감 · BESTIARY",
  });
  ui.drawMenuButton(ctx, bestiaryBtn);

  const creditsBtn = ui.button({
    id: "menu_credits",
    x: buttonX,
    y: baseY + 176,
    w: buttonW,
    h: 44,
    label: "크레딧 · CREDITS",
  });
  ui.drawMenuButton(ctx, creditsBtn);

  if (progress.lastConfig?.levelId) {
    const lc = progress.lastConfig;
    const replayBtn = ui.button({
      id: "menu_replay_last",
      x: buttonX,
      y: baseY - 58,
      w: buttonW,
      h: 48,
      label: `🔁 마지막 출장 재도전`,
      sub: `${lc.levelId} · ${lc.heroId} · ${lc.difficultyId}`,
    });
    ui.drawMenuButton(ctx, replayBtn);
  }

  const lt = progress.lifetime || {};
  const hasLifetime =
    lt && (lt.totalKills > 0 || lt.runsCompleted > 0 || progress.totalRuns > 0);
  const ACH_LIST = [
    "first_kill","first_wave","first_boss","no_escape","millionaire",
    "grade_s","combo_10","all_stages","hard_clear","cheat_master",
  ];
  const achCount = ACH_LIST.filter((id) => progress.achievements?.[id]).length;
  if (hasLifetime) {
    const statY = 252;
    const statX = CANVAS.width - 280;
    ctx.fillStyle = "rgba(78,161,255,0.18)";
    ctx.strokeStyle = "rgba(78,161,255,0.55)";
    ctx.lineWidth = 1;
    roundRect(ctx, statX, statY, 240, 198, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f6d96a";
    ctx.font = "bold 12px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🏆 누적 기록", statX + 120, statY + 18);
    const stats = [
      [`처리 잔해`, `${formatNum(lt.totalKills || 0)}`],
      [`완주 출장`, `${lt.runsCompleted || 0}`],
      [`실패 출장`, `${lt.runsLost || 0}`],
      [`보스 격파`, `${lt.bossesKilled || 0}`],
      [`최고 콤보`, `×${lt.peakCombo || 0}`],
      [`최고 등급`, `${lt.bestGrade || "—"}`],
      [`별 획득`, `${countStars(progress)}/9`],
      [`업적`, `${achCount}/10`],
    ];
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    for (let i = 0; i < stats.length; i++) {
      const ly = statY + 38 + i * 18;
      ctx.fillStyle = "#a9b3c7";
      ctx.fillText(stats[i][0], statX + 16, ly);
      ctx.fillStyle = "#f3f5ff";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "right";
      ctx.fillText(stats[i][1], statX + 224, ly);
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
    }
    if (achCount > 0) {
      ctx.fillStyle = "rgba(78,161,255,0.18)";
      ctx.strokeStyle = "rgba(140,180,235,0.5)";
      ctx.lineWidth = 1;
      const badgeX = CANVAS.width - 280;
      const badgeY = statY + 198 + 10;
      const bw = 240;
      const bh = 50;
      roundRect(ctx, badgeX, badgeY, bw, bh, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#f6d96a";
      ctx.font = "bold 10px -apple-system, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`🏅 해금 업적 (${achCount}/10)`, badgeX + 10, badgeY + 14);
      const ACH_ICONS = {
        first_kill: "🩸", first_wave: "🌊", first_boss: "👹", no_escape: "🛡️",
        millionaire: "💰", grade_s: "🏆", combo_10: "🔥", all_stages: "🚽",
        hard_clear: "💀", cheat_master: "🤫",
      };
      const unlocked = ACH_LIST.filter((id) => progress.achievements?.[id]);
      ctx.font = "18px sans-serif";
      ctx.textAlign = "left";
      for (let bi = 0; bi < unlocked.length; bi++) {
        ctx.fillText(ACH_ICONS[unlocked[bi]] || "🏅", badgeX + 10 + bi * 22, badgeY + 38);
      }
    }
  } else {
    ctx.textAlign = "center";
    ctx.fillStyle = "#5e6883";
    ctx.font = "12px -apple-system, sans-serif";
    ctx.fillText(
      `통산 ${progress.totalRuns}회 출장 완료 · 별 ${countStars(progress)}/9`,
      CANVAS.width / 2,
      640,
    );
  }

  const tipIndex = Math.floor(time / 4) % TIPS.length;
  ctx.fillStyle = "rgba(246,217,106,0.85)";
  ctx.font = "italic 14px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TIP: " + TIPS[tipIndex], CANVAS.width / 2, 670);

  ctx.fillStyle = "#5e6883";
  ctx.font = "10px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("H · ? 키 = 단축키 도움말 · M = 사운드", CANVAS.width / 2, 695);
}

function countStars(progress) {
  return Object.values(progress.scores).reduce(
    (a, s) => a + (s?.stars || 0),
    0,
  );
}

export function drawLevelSelect(ctx, ui, time, progress, levels) {
  drawScreenBg(ctx, time, "#1a253c");
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 36px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("스테이지 선택 · LEVEL SELECT", CANVAS.width / 2, 96);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "14px -apple-system, sans-serif";
  ctx.fillText("배관 곳곳의 막힘을 청소해주세요", CANVAS.width / 2, 122);

  const cardW = 320;
  const cardH = 380;
  const gap = 36;
  const totalW = cardW * 3 + gap * 2;
  const startX = (CANVAS.width - totalW) / 2;
  const cardY = 170;
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i];
    const unlocked = progress.unlocked[level.id];
    const score = progress.scores[level.id];
    const x = startX + i * (cardW + gap);
    const isHover = !!ui.hovered && ui.hovered === `level_${level.id}`;
    drawLevelCard(ctx, x, cardY, cardW, cardH, level, score, unlocked, isHover, time);
    ui.button({
      id: `level_${level.id}`,
      x,
      y: cardY,
      w: cardW,
      h: cardH,
      label: "",
      disabled: !unlocked,
    });
  }

  ui.drawMenuButton(
    ctx,
    ui.button({
      id: "level_back",
      x: 40,
      y: 640,
      w: 160,
      h: 44,
      label: "← 뒤로",
    }),
  );
}

function drawLevelCard(ctx, x, y, w, h, level, score, unlocked, hover, time) {
  ctx.save();
  ctx.fillStyle = hover && unlocked ? "rgba(40,52,80,0.95)" : "rgba(22,28,44,0.9)";
  ctx.strokeStyle = hover && unlocked ? "#4ea1ff" : "#2a3148";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "rgba(60,80,120,0.4)";
  roundRect(ctx, x + 16, y + 16, w - 32, 140, 8);
  ctx.fill();

  ctx.save();
  ctx.translate(x + w / 2, y + 86);
  if (level.id === "sink") drawMiniSink(ctx, time);
  else if (level.id === "toilet") drawMiniToilet(ctx, time);
  else drawMiniMainPipe(ctx, time);
  ctx.restore();

  ctx.fillStyle = unlocked ? "#f3f5ff" : "#5e6883";
  ctx.font = "bold 24px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(level.name, x + w / 2, y + 196);
  ctx.fillStyle = unlocked ? "#a9b3c7" : "#5e6883";
  ctx.font = "13px -apple-system, sans-serif";
  ctx.fillText(level.nameEn, x + w / 2, y + 218);
  ctx.font = "11px -apple-system, sans-serif";
  ctx.fillStyle = unlocked ? "#7c89a8" : "#4a5670";
  wrapText(ctx, level.subtitle, x + w / 2, y + 244, w - 40, 14);

  for (let i = 0; i < 3; i++) {
    const sx = x + w / 2 - 36 + i * 32;
    const sy = y + 300;
    drawStar(ctx, sx, sy, 12, i < (score?.stars || 0));
  }

  if (!unlocked) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    roundRect(ctx, x + 16, y + 16, w - 32, 140, 8);
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    roundRect(ctx, x, y + 290, w, h - 290, 14);
    ctx.fill();
    ctx.fillStyle = "#f6d96a";
    ctx.font = "bold 16px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔒 잠겨있음", x + w / 2, y + 332);
    ctx.fillStyle = "#a9b3c7";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText("이전 스테이지를 클리어하세요", x + w / 2, y + 352);
  } else {
    ctx.fillStyle = hover ? "#4ea1ff" : "#a9b3c7";
    ctx.font = "12px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("클릭해서 진입 →", x + w / 2, y + 354);
  }

  ctx.restore();
}

function drawMiniSink(ctx, time) {
  ctx.fillStyle = "#e8edf3";
  roundRect(ctx, -50, -20, 100, 30, 6);
  ctx.fill();
  ctx.fillStyle = "#1c2a3a";
  ctx.beginPath();
  ctx.ellipse(0, -4, 28, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(120,180,240,${0.6 + Math.sin(time * 3) * 0.2})`;
  ctx.fillRect(-1, -22, 2, 14);
  ctx.fillStyle = "#9aa9bd";
  ctx.fillRect(-3, -28, 6, 4);
}

function drawMiniToilet(ctx, time) {
  ctx.fillStyle = "#f3f6fa";
  roundRect(ctx, -32, -32, 64, 28, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -2, 28, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1c2a3a";
  ctx.beginPath();
  ctx.ellipse(0, -2, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(120,180,240,${0.4 + Math.sin(time * 2) * 0.2})`;
  ctx.beginPath();
  ctx.ellipse(0, -2, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawMiniMainPipe(ctx, time) {
  ctx.strokeStyle = "#3a4255";
  ctx.lineWidth = 18;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-50, -30);
  ctx.lineTo(-20, -30);
  ctx.lineTo(-20, 10);
  ctx.lineTo(40, 10);
  ctx.lineTo(40, 30);
  ctx.stroke();
  ctx.strokeStyle = "#161a26";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-50, -30);
  ctx.lineTo(-20, -30);
  ctx.lineTo(-20, 10);
  ctx.lineTo(40, 10);
  ctx.lineTo(40, 30);
  ctx.stroke();
  ctx.fillStyle = `rgba(255,107,61,${0.4 + Math.sin(time * 3) * 0.2})`;
  ctx.beginPath();
  ctx.arc(40, 30, 8, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(ctx, cx, cy, r, filled) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 === 0 ? r : r * 0.45;
    const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(ang) * rr;
    const y = Math.sin(ang) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? "#f6d96a" : "rgba(80,90,110,0.5)";
  ctx.strokeStyle = filled ? "#a07c20" : "rgba(40,50,70,0.7)";
  ctx.lineWidth = 1.5;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(/(\s|·|—)/);
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line + w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, cy);
      cy += lineH;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line.trim(), x, cy);
}

export function drawHeroSelect(ctx, ui, time, levelName) {
  drawScreenBg(ctx, time, "#1a2238");
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 32px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("영웅 선택 · CHOOSE YOUR HERO", CANVAS.width / 2, 86);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "13px -apple-system, sans-serif";
  ctx.fillText(`스테이지: ${levelName}`, CANVAS.width / 2, 110);

  const heroes = Object.values(HEROES);
  const cardW = 340;
  const cardH = 400;
  const gap = 28;
  const totalW = cardW * 3 + gap * 2;
  const startX = (CANVAS.width - totalW) / 2;
  const yCard = 154;
  for (let i = 0; i < heroes.length; i++) {
    const h = heroes[i];
    const x = startX + i * (cardW + gap);
    const isHover = ui.hovered === `hero_${h.id}`;
    drawHeroCard(ctx, x, yCard, cardW, cardH, h, isHover, time);
    ui.button({
      id: `hero_${h.id}`,
      x,
      y: yCard,
      w: cardW,
      h: cardH,
      label: "",
    });
  }

  ui.drawMenuButton(
    ctx,
    ui.button({
      id: "hero_back",
      x: 40,
      y: 640,
      w: 160,
      h: 44,
      label: "← 뒤로",
    }),
  );
}

function drawHeroCard(ctx, x, y, w, h, hero, hover, time) {
  ctx.save();
  ctx.fillStyle = hover ? "rgba(40,50,76,0.95)" : "rgba(20,26,40,0.92)";
  ctx.strokeStyle = hover ? hero.color : "#2a3148";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = `rgba(${hexToRgb(hero.color)},0.15)`;
  roundRect(ctx, x + 20, y + 20, w - 40, 130, 8);
  ctx.fill();
  ctx.font = "70px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(hero.icon, x + w / 2, y + 110);

  ctx.fillStyle = hero.color;
  ctx.font = "bold 22px -apple-system, sans-serif";
  ctx.fillText(hero.name, x + w / 2, y + 184);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "12px -apple-system, sans-serif";
  ctx.fillText(hero.role, x + w / 2, y + 204);

  ctx.textAlign = "left";
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "11px -apple-system, sans-serif";
  ctx.fillText("PASSIVE", x + 20, y + 232);
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "12px -apple-system, sans-serif";
  wrapText(ctx, hero.passive, x + 20, y + 250, w - 40, 16);

  ctx.fillStyle = "#a9b3c7";
  ctx.font = "11px -apple-system, sans-serif";
  ctx.fillText("ACTIVE", x + 20, y + 296);
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "12px -apple-system, sans-serif";
  wrapText(ctx, hero.active, x + 20, y + 314, w - 40, 16);

  ctx.fillStyle = "rgba(246,217,106,0.6)";
  ctx.font = 'italic 11px "Apple SD Gothic Neo", sans-serif';
  ctx.textAlign = "center";
  ctx.fillText(`"${hero.quote}"`, x + w / 2, y + 376);

  ctx.restore();
}

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

export function drawDifficultySelect(ctx, ui, time, hero) {
  drawScreenBg(ctx, time, "#1a223a");
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 32px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("난이도 선택 · DIFFICULTY", CANVAS.width / 2, 100);
  ctx.fillStyle = hero?.color || "#a9b3c7";
  ctx.font = "14px -apple-system, sans-serif";
  ctx.fillText(`영웅: ${hero?.name || "—"}`, CANVAS.width / 2, 124);

  const diffs = Object.values(DIFFICULTY);
  const cardW = 280;
  const cardH = 320;
  const gap = 28;
  const totalW = cardW * 3 + gap * 2;
  const startX = (CANVAS.width - totalW) / 2;
  const yCard = 200;
  for (let i = 0; i < diffs.length; i++) {
    const d = diffs[i];
    const x = startX + i * (cardW + gap);
    const isHover = ui.hovered === `diff_${d.id}`;
    drawDifficultyCard(ctx, x, yCard, cardW, cardH, d, isHover);
    ui.button({
      id: `diff_${d.id}`,
      x,
      y: yCard,
      w: cardW,
      h: cardH,
      label: "",
    });
  }
  ui.drawMenuButton(
    ctx,
    ui.button({
      id: "diff_back",
      x: 40,
      y: 640,
      w: 160,
      h: 44,
      label: "← 뒤로",
    }),
  );
}

function drawDifficultyCard(ctx, x, y, w, h, d, hover) {
  ctx.save();
  const accent =
    d.id === "easy" ? "#5acf80" : d.id === "normal" ? "#4ea1ff" : "#e9534b";
  ctx.fillStyle = hover ? "rgba(40,52,80,0.95)" : "rgba(22,28,44,0.9)";
  ctx.strokeStyle = hover ? accent : "#2a3148";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.font = "bold 32px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(d.name, x + w / 2, y + 70);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "13px -apple-system, sans-serif";
  ctx.fillText(d.nameEn.toUpperCase(), x + w / 2, y + 94);
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "12px -apple-system, sans-serif";
  ctx.textAlign = "left";
  wrapText(ctx, d.description, x + 24, y + 130, w - 48, 16);
  ctx.textAlign = "center";
  const badges = [
    {
      label: `HP ${d.hpMul >= 1 ? "+" : ""}${Math.round((d.hpMul - 1) * 100)}%`,
      good: d.hpMul <= 1,
    },
    {
      label: `속도 ${d.speedMul >= 1 ? "+" : ""}${Math.round((d.speedMul - 1) * 100)}%`,
      good: d.speedMul <= 1,
    },
    {
      label: `보상 ${d.moneyMul >= 1 ? "+" : ""}${Math.round((d.moneyMul - 1) * 100)}%`,
      good: d.moneyMul >= 1,
    },
    {
      label: `목숨 ${3 + d.livesBonus}/${3 + d.livesBonus}`,
      good: d.livesBonus >= 0,
    },
  ];
  for (let i = 0; i < badges.length; i++) {
    const by = y + 200 + i * 26;
    const bx = x + 30;
    const bw = w - 60;
    const bh = 22;
    const goodColor = badges[i].good ? "rgba(94,207,128,0.18)" : "rgba(233,83,75,0.18)";
    const borderColor = badges[i].good ? "#5acf80" : "#e9534b";
    ctx.fillStyle = goodColor;
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1;
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f3f5ff";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(badges[i].label, bx + bw / 2, by + bh / 2);
  }
  ctx.textBaseline = "alphabetic";
  ctx.restore();
}

function drawScreenBg(ctx, time, base) {
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS.height);
  grad.addColorStop(0, "#0e1422");
  grad.addColorStop(1, base);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  ctx.fillStyle = "rgba(246,217,106,0.04)";
  for (let i = 0; i < 60; i++) {
    const px = (i * 73 + (time * 25) % 1200) % CANVAS.width;
    const py = (i * 131) % CANVAS.height;
    ctx.beginPath();
    ctx.arc(px, py, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawHud(ctx, ui, game, time) {
  if (game.lives <= 1 && game.lives > 0) drawLowLifeWarning(ctx, time);
  drawBossHpBar(ctx, game, time);
  if (game.speedFlash > 0) drawSpeedFlash(ctx, game);
  if (game.buildMode) drawBuildBanner(ctx, game);
  if (game.comboCount >= 3) drawComboCounter(ctx, game);
  drawWavePreview(ctx, game);
  if (game.towers.length === 0 && !game.buildMode) drawFirstGameHint(ctx, time);
  drawSpeedBadge(ctx, game);
  drawMuteBadge(ctx, ui, game);
  drawToolbar(ctx, ui, game);
  drawBarricades(ctx, game);
  drawStatsTicker(ctx, game);
  drawBossRadar(ctx, game);
  drawRotatingTipStrip(ctx, game, time);
  if (ui.hovered === "wave_start") drawWavePreviewTooltip(ctx, game);
  if (game.paused) drawPausedOverlay(ctx, time, game);
  const x = CANVAS.width - 240;
  const w = 240;
  ctx.save();
  ctx.fillStyle = "rgba(14,18,30,0.88)";
  ctx.fillRect(x, 0, w, CANVAS.height);
  ctx.strokeStyle = "#2a3148";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, CANVAS.height);
  ctx.stroke();

  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 13px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`STAGE · ${game.level.name}`, x + 14, 24);

  const wave = game.waveManager.waveIndex + 1;
  const totalWaves = game.waveManager.waves.length;
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "11px -apple-system, sans-serif";
  ctx.fillText(`WAVE ${wave}/${totalWaves}`, x + 14, 44);
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 22px -apple-system, sans-serif";
  if (game.waveManager.active) {
    const left = game.enemies.filter((e) => e.alive).length;
    const pending = game.waveManager.spawnSchedule.length;
    ctx.fillText(`적 ${left + pending}마리`, x + 14, 70);
  } else if (game.waveManager.waitingAutoStart) {
    ctx.fillText(
      `다음 웨이브 ${Math.ceil(game.waveManager.preTimer)}s`,
      x + 14,
      70,
    );
  } else {
    ctx.fillText("청소 완료!", x + 14, 70);
  }

  drawPipeMeter(ctx, x + 14, 82, w - 28, game);

  ctx.fillStyle = "#f6d96a";
  ctx.font = "bold 26px -apple-system, sans-serif";
  ctx.fillText(`₩${formatNum(game.money)}`, x + 14, 156);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "10px -apple-system, sans-serif";
  ctx.fillText("자금 · MONEY", x + 14, 170);
  const waveEarned = game.waveEarnedThisWave || 0;
  if (waveEarned > 0) {
    ctx.fillStyle = "#5acf80";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`+₩${formatNum(waveEarned)} (이번 웨이브)`, x + w - 14, 170);
    ctx.textAlign = "left";
  }

  drawHeroCardHud(ctx, ui, x + 14, 188, w - 28, game, time);

  drawTowerPalette(ctx, ui, x + 14, 320, w - 28, game, time);

  drawWaveButton(ctx, ui, x + 14, 568, w - 28, game);
  drawSpeedButtons(ctx, ui, x + 14, 612, w - 28, game);
  drawPauseQuit(ctx, ui, x + 14, 660, w - 28, game);

  ctx.restore();
}

function drawPipeMeter(ctx, x, y, w, game) {
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "10px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("배관 무결성 · PIPE INTEGRITY", x, y);
  ctx.fillStyle = "rgba(60,30,30,0.6)";
  ctx.fillRect(x, y + 6, w, 14);
  const ratio = game.lives / game.maxLives;
  let col = COLORS.pipeMeterGood;
  if (ratio < 0.66) col = COLORS.pipeMeterMid;
  if (ratio < 0.34) col = COLORS.pipeMeterBad;
  ctx.fillStyle = col;
  ctx.fillRect(x, y + 6, w * ratio, 14);
  ctx.strokeStyle = "rgba(0,0,0,0.5)";
  ctx.strokeRect(x, y + 6, w, 14);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${game.lives} / ${game.maxLives}`, x + w / 2, y + 17);
}

function drawHeroCardHud(ctx, ui, x, y, w, game, time) {
  const h = 110;
  const castFlash = game.heroAbilityFlash || 0;
  if (castFlash > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(246,217,106,${castFlash * 0.5})`;
    ctx.shadowColor = "#ffea66";
    ctx.shadowBlur = 18 + castFlash * 16;
    roundRect(ctx, x - 6, y - 6, w + 12, h + 12, 12);
    ctx.fill();
    ctx.restore();
  }
  const isReady = game.heroCooldown === 0 && game.money >= game.hero.abilityCost;
  const readyForSec =
    isReady && game.heroReadyJustNow
      ? Math.max(0, (game.time || 0) - game.heroReadyJustNow)
      : 999;
  const pulse = isReady
    ? 0.4 + Math.sin((time || 0) * 4) * 0.3
    : 0;
  if (isReady && readyForSec < 1.6) {
    ctx.fillStyle = `rgba(246,217,106,${0.18 + pulse * 0.15})`;
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 10);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(20,28,46,0.6)";
  ctx.strokeStyle = isReady ? `rgba(246,217,106,${0.55 + pulse * 0.45})` : "#2a3148";
  ctx.lineWidth = isReady ? 1.8 : 1;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = game.hero.color;
  ctx.font = "30px sans-serif";
  ctx.textAlign = "left";
  if (isReady) {
    ctx.shadowColor = "#ffea66";
    ctx.shadowBlur = 8 + pulse * 6;
  }
  ctx.fillText(game.hero.icon, x + 8, y + 38);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 13px -apple-system, sans-serif";
  ctx.fillText(game.hero.name, x + 46, y + 24);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "10px -apple-system, sans-serif";
  ctx.fillText(game.hero.role, x + 46, y + 40);
  const passiveIcons = {
    cheolsable: "💰",
    jeffrey: "📋",
    seongjin: "🩺",
  };
  const passiveBadge = passiveIcons[game.hero.id];
  if (passiveBadge) {
    ctx.fillStyle = "rgba(78,161,255,0.7)";
    ctx.beginPath();
    ctx.arc(x + w - 18, y + 38, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(passiveBadge, x + w - 18, y + 38);
    ctx.textBaseline = "alphabetic";
  }
  if (isReady) {
    ctx.fillStyle = `rgba(246,217,106,${0.7 + pulse * 0.3})`;
    ctx.font = "bold 9px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("⚡ Q READY", x + w - 8, y + 22);
  }

  const btn = ui.button({
    id: "hero_active",
    x: x + 6,
    y: y + 56,
    w: w - 12,
    h: 44,
    label: game.hero.abilityName,
    sub:
      game.heroCooldown > 0
        ? `재사용 ${game.heroCooldown.toFixed(1)}s`
        : `₩${formatNum(game.hero.abilityCost)} · 즉발`,
    disabled: game.heroCooldown > 0 || game.money < game.hero.abilityCost,
  });
  drawButton(ctx, btn);
}

function drawLowLifeWarning(ctx, time) {
  const pulse = (Math.sin(time * 6) + 1) * 0.5;
  const alpha = 0.25 + pulse * 0.35;
  ctx.save();
  const gradTop = ctx.createLinearGradient(0, 0, 0, 100);
  gradTop.addColorStop(0, `rgba(233,30,30,${alpha})`);
  gradTop.addColorStop(1, "rgba(233,30,30,0)");
  ctx.fillStyle = gradTop;
  ctx.fillRect(0, 0, CANVAS.width - 240, 100);
  const gradBot = ctx.createLinearGradient(0, CANVAS.height - 100, 0, CANVAS.height);
  gradBot.addColorStop(0, "rgba(233,30,30,0)");
  gradBot.addColorStop(1, `rgba(233,30,30,${alpha})`);
  ctx.fillStyle = gradBot;
  ctx.fillRect(0, CANVAS.height - 100, CANVAS.width - 240, 100);
  const gradLeft = ctx.createLinearGradient(0, 0, 100, 0);
  gradLeft.addColorStop(0, `rgba(233,30,30,${alpha})`);
  gradLeft.addColorStop(1, "rgba(233,30,30,0)");
  ctx.fillStyle = gradLeft;
  ctx.fillRect(0, 0, 100, CANVAS.height);
  ctx.fillStyle = "#ff2a2a";
  ctx.font = "bold 14px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`⚠ 배관 무결성 임박! · 한 방 더 새면 ₩1,500,000 ⚠`, (CANVAS.width - 240) / 2, 28);
  ctx.restore();
}

function drawBossHpBar(ctx, game, time) {
  const boss = game.enemies.find((e) => e.alive && e.type === "boss");
  if (!boss) return;
  const w = 540;
  const h = 28;
  const x = ((CANVAS.width - 240) - w) / 2;
  const y = 56;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.85)";
  roundRect(ctx, x - 6, y - 6, w + 12, h + 24, 6);
  ctx.fill();
  ctx.strokeStyle = "#ff3a3a";
  ctx.lineWidth = 2;
  roundRect(ctx, x - 6, y - 6, w + 12, h + 24, 6);
  ctx.stroke();
  ctx.fillStyle = "#1a0808";
  ctx.fillRect(x, y, w, h);
  const ratio = Math.max(0, boss.hp / boss.maxHp);
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, "#ff6a3a");
  grad.addColorStop(0.5, "#c8302a");
  grad.addColorStop(1, "#7a1a18");
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w * ratio, h);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(x + (w / 6) * i, y, 1, h);
  }
  ctx.fillStyle = "#ff3a3a";
  ctx.font = "bold 13px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("👹 정체불명의 물질", x + 4, y - 4);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${Math.ceil(boss.hp)} / ${boss.maxHp}`, x + w - 4, y - 4);
  ctx.textAlign = "center";
  ctx.fillStyle = "#f6d96a";
  ctx.font = "10px -apple-system, sans-serif";
  ctx.fillText(
    `면역: ${boss.immunityType || "—"} (다양화 필수)`,
    x + w / 2,
    y + h + 14,
  );
  ctx.restore();
}

function drawSpeedFlash(ctx, game) {
  const a = Math.min(1, game.speedFlash);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  const cx = (CANVAS.width - 240) / 2;
  const cy = CANVAS.height / 2 - 40;
  roundRect(ctx, cx - 70, cy - 50, 140, 100, 12);
  ctx.fill();
  ctx.fillStyle = "#ffea66";
  ctx.shadowColor = "#ffea66";
  ctx.shadowBlur = 20;
  ctx.font = "bold 64px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(`${game.speed}×`, cx, cy);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.font = "11px -apple-system, sans-serif";
  ctx.fillText(game.speed === 1 ? "보통 속도" : game.speed === 2 ? "빨리감기" : "초고속", cx, cy + 40);
  ctx.restore();
}

function drawSpeedBadge(ctx, game) {
  const x = 14;
  const y = 14;
  const w = 76;
  const h = 28;
  ctx.save();
  ctx.fillStyle = "rgba(14,18,30,0.85)";
  ctx.strokeStyle = game.speed === 3
    ? "#ff6b3d"
    : game.speed === 2
      ? "#f6d96a"
      : "rgba(140,180,235,0.6)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "9px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("SPEED", x + 8, y + 9);
  ctx.fillStyle = game.speed === 3
    ? "#ff8a3a"
    : game.speed === 2
      ? "#ffea66"
      : "#f3f5ff";
  ctx.font = "bold 14px -apple-system, sans-serif";
  ctx.fillText(`${game.speed}×`, x + 8, y + 20);
  if (game.paused) {
    ctx.fillStyle = "#e9534b";
    ctx.font = "bold 10px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("⏸", x + w - 8, y + 14);
  }
  ctx.restore();
}

const IN_GAME_TIPS = [
  "Tip: T 키로 타워 타겟 모드 변경 (선두/위협/최강/후미/근접)",
  "Tip: 1·2·3·4 두 번 누르면 해당 타입 타워 순회",
  "Tip: U 키 — 5초 내 직전 판매 취소 가능",
  "Tip: H 키 — 단축키 도움말 / O 키 — 설정",
  "Tip: 콤보 ×10+ = 매출 +50% / 콤보 ×3+ = +10%",
  "Tip: 마우스 호버로 타워 통계 + 사거리 확인",
  "Tip: 영웅 능력 Q · 자금 충족 시 카드 골드 펄스",
  "Tip: 키친타월은 공업용 석션이 ×2.4 보너스",
  "Tip: 진공 뚫어뻥 II → AOE 흡입 (블랙홀)",
  "Tip: 산성 웅덩이 II는 보스에게 +60% 데미지",
  "Tip: 보스는 매번 다른 타워 면역. 4종 다양화 필수",
  "Tip: 견습 분대 II — 동료 사망 시 +35% 격분 (8초)",
  "Tip: H+카운트 = 누적 처리 잔해 / O = 사운드 조절",
  "Tip: 조기 시작 시 ₩50/초 보너스. 카운트다운 링 참고",
];

function drawRotatingTipStrip(ctx, game, time) {
  const gameW = CANVAS.width - 240;
  const tipIdx = Math.floor((time || 0) / 9) % IN_GAME_TIPS.length;
  const tip = IN_GAME_TIPS[tipIdx];
  const cycleT = ((time || 0) / 9) - Math.floor((time || 0) / 9);
  const alpha =
    cycleT < 0.1
      ? cycleT * 10
      : cycleT > 0.9
        ? (1 - cycleT) * 10
        : 1;
  ctx.save();
  ctx.globalAlpha = 0.7 * alpha;
  ctx.fillStyle = "rgba(14,18,30,0.65)";
  ctx.strokeStyle = "rgba(140,180,235,0.3)";
  ctx.lineWidth = 1;
  const padX = 14;
  const tipH = 22;
  const tipY = CANVAS.height - 68;
  const w = gameW - 290;
  const x = 270;
  roundRect(ctx, x, tipY, w, tipH, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#a9efe5";
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(tip, x + w / 2, tipY + tipH / 2);
  ctx.restore();
}

function drawToolbar(ctx, ui, game) {
  const tools = Object.values(TOOLS);
  const x0 = 270;
  const y0 = CANVAS.height - 100;
  const w = 80;
  const h = 56;
  const gap = 8;
  for (let i = 0; i < tools.length; i++) {
    const t = tools[i];
    const x = x0 + i * (w + gap);
    const state = game.tools?.[t.id] || { cooldown: 0 };
    const cdRatio = t.cooldownSec > 0 ? state.cooldown / t.cooldownSec : 0;
    const canAfford = game.money >= t.cost;
    const ready = state.cooldown <= 0 && canAfford;
    const isActive = game.activeTool === t.id;
    ctx.save();
    ctx.fillStyle = isActive
      ? "rgba(60,90,140,0.95)"
      : ready
        ? "rgba(20,28,46,0.85)"
        : "rgba(20,28,46,0.55)";
    ctx.strokeStyle = isActive
      ? t.color
      : ready
        ? "rgba(140,180,235,0.6)"
        : "rgba(80,90,110,0.6)";
    ctx.lineWidth = isActive ? 2.2 : 1.4;
    roundRect(ctx, x, y0, w, h, 7);
    ctx.fill();
    ctx.stroke();
    if (cdRatio > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y0, w, h);
      ctx.clip();
      ctx.fillStyle = "rgba(40,52,80,0.7)";
      ctx.fillRect(x, y0 + h * (1 - cdRatio), w, h * cdRatio);
      ctx.restore();
    }
    ctx.font = "22px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = ready ? t.color : "rgba(160,180,200,0.55)";
    ctx.fillText(t.icon, x + 6, y0 + 18);
    ctx.fillStyle = ready ? "#f3f5ff" : "rgba(160,180,200,0.55)";
    ctx.font = "bold 9px monospace";
    ctx.fillText(`[${t.key}]`, x + 36, y0 + 13);
    ctx.font = "8px -apple-system, sans-serif";
    ctx.fillStyle = ready ? "#a9b3c7" : "rgba(160,180,200,0.5)";
    ctx.fillText(t.name, x + 36, y0 + 25);
    if (cdRatio > 0) {
      ctx.fillStyle = "#ff8a3a";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${state.cooldown.toFixed(1)}s`, x + w / 2, y0 + 44);
    } else if (t.cost > 0) {
      ctx.fillStyle = canAfford ? "#f6d96a" : "#e9534b";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`₩${formatNum(t.cost)}`, x + w / 2, y0 + 44);
    } else {
      ctx.fillStyle = "#5acf80";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("FREE", x + w / 2, y0 + 44);
    }
    ctx.restore();
    ui.button({ id: `tool_${t.id}`, x, y: y0, w, h });
  }
}

function drawBarricades(ctx, game) {
  if (!game.barricades || game.barricades.length === 0) return;
  ctx.save();
  for (const b of game.barricades) {
    const ratio = b.timeLeft / b.maxTime;
    const pulse = 0.6 + Math.sin((game.time || 0) * 8) * 0.3;
    ctx.fillStyle = `rgba(246,217,106,${0.18 * ratio})`;
    ctx.strokeStyle = `rgba(246,217,106,${pulse * ratio})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(255,234,102,${pulse * ratio})`;
    ctx.font = "bold 14px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🛑", b.x, b.y - 4);
    ctx.fillStyle = "#a9b3c7";
    ctx.font = "9px monospace";
    ctx.fillText(`${b.timeLeft.toFixed(1)}s`, b.x, b.y + 10);
  }
  ctx.restore();
}

function drawMuteBadge(ctx, ui, game) {
  const x = 100;
  const y = 14;
  const w = 110;
  const h = 28;
  const vol = getMasterVolume();
  const sfxOn = vol > 0.001 && isAudioEnabled();
  ctx.save();
  ctx.fillStyle = "rgba(14,18,30,0.85)";
  ctx.strokeStyle = sfxOn ? "rgba(140,180,235,0.6)" : "rgba(233,83,75,0.65)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = sfxOn ? "#a8e07d" : "#a9b3c7";
  ctx.font = "13px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(sfxOn ? "🔊" : "🔇", x + 6, y + h / 2 + 1);
  const trackX = x + 28;
  const trackY = y + h / 2;
  const trackW = 64;
  ctx.fillStyle = "rgba(60,72,100,0.65)";
  ctx.fillRect(trackX, trackY - 3, trackW, 6);
  ctx.fillStyle = sfxOn ? "#5acf80" : "rgba(140,150,170,0.5)";
  ctx.fillRect(trackX, trackY - 3, Math.max(2, trackW * vol), 6);
  ctx.fillStyle = "#f6d96a";
  ctx.beginPath();
  ctx.arc(trackX + trackW * vol, trackY, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "9px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(vol * 100)}%`, x + w - 6, y + h / 2 + 1);
  ctx.restore();
  ui.button({ id: "mute_toggle", x, y, w, h });
}

export function drawBossRadar(ctx, rs) {
  const boss = rs.enemies?.find((e) => e.alive && e.type === "boss");
  if (!boss) return;
  const gameW = CANVAS.width - 240;
  const gameH = CANVAS.height;
  const cx = gameW / 2;
  const cy = gameH / 2;
  const dx = boss.x - cx;
  const dy = boss.y - cy;
  const dist = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  const radius = Math.min(gameW, gameH) * 0.42;
  const arrowX = cx + Math.cos(ang) * radius;
  const arrowY = cy + Math.sin(ang) * radius;
  ctx.save();
  ctx.translate(arrowX, arrowY);
  ctx.rotate(ang);
  const pulse = 0.7 + Math.sin(performance.now() / 200) * 0.3;
  ctx.fillStyle = `rgba(255,58,58,${pulse})`;
  ctx.shadowColor = "#ff3a3a";
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-8, -10);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-8, 10);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("BOSS", 2, -14);
  ctx.fillStyle = "#ff3a3a";
  ctx.fillText("BOSS", 0, -14);
  ctx.fillStyle = "#fff";
  ctx.font = "9px monospace";
  ctx.fillText(`${Math.round(dist)}px`, 0, 18);
  ctx.restore();
}

export function drawSpawnWarning(ctx, rs, time) {
  const wm = rs.waveManager;
  if (!wm || !wm.spawnSchedule || wm.spawnSchedule.length === 0) return;
  const nextSpawns = wm.spawnSchedule.slice(0, 4);
  const pathsAboutToFire = new Set();
  for (const s of nextSpawns) {
    if (s.timer < 1.5) pathsAboutToFire.add(s.path);
  }
  if (pathsAboutToFire.size === 0) return;
  const pulse = (Math.sin(time * 8) + 1) * 0.5;
  for (const pathIdx of pathsAboutToFire) {
    const path = rs.paths[pathIdx];
    if (!path || !path.points || path.points.length < 2) continue;
    const start = path.points[0];
    const next = path.points[1];
    const ang = Math.atan2(next.y - start.y, next.x - start.x);
    ctx.save();
    ctx.translate(start.x, start.y);
    ctx.rotate(ang);
    ctx.fillStyle = `rgba(255,140,60,${0.5 + pulse * 0.45})`;
    ctx.shadowColor = "#ff8a3a";
    ctx.shadowBlur = 10 + pulse * 6;
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(8, -10);
    ctx.lineTo(14, 0);
    ctx.lineTo(8, 10);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

function drawWavePreviewTooltip(ctx, game) {
  const wm = game.waveManager;
  if (!wm || !wm.waitingAutoStart) return;
  const wave = wm.waves[wm.waveIndex];
  if (!wave) return;
  const counts = {};
  for (const grp of wave.groups || []) {
    counts[grp.type] = (counts[grp.type] || 0) + grp.count;
  }
  const items = Object.entries(counts);
  if (items.length === 0) return;
  const w = 250;
  const lineH = 22;
  const h = 38 + items.length * lineH + 22;
  const x = CANVAS.width - 240 - w - 18;
  const y = CANVAS.height - h - 80;
  ctx.save();
  ctx.fillStyle = "rgba(14,18,30,0.96)";
  ctx.strokeStyle = wave.boss ? "#ff3a3a" : "#4ea1ff";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = wave.boss ? "#ff3a3a" : "#f6d96a";
  ctx.font = "bold 12px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(
    `WAVE ${wm.waveIndex + 1}/${wm.waves.length}${wave.boss ? " · ⚠ BOSS" : ""}`,
    x + 12,
    y + 22,
  );
  let totalThreat = 0;
  for (const [type, n] of items) {
    const def = ENEMIES[type];
    if (def) totalThreat += (def.threat || 1) * n;
  }
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`총 위협도 ${totalThreat}`, x + w - 12, y + 22);
  let ly = y + 44;
  for (const [type, n] of items) {
    const def = ENEMIES[type];
    if (!def) continue;
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(x + 18, ly - 4, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f3f5ff";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`${def.name}`, x + 32, ly);
    ctx.fillStyle = "#a9b3c7";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    ctx.fillText(
      `×${n} · ${Math.round(def.hp * game.difficulty.hpMul)}HP`,
      x + w - 12,
      ly,
    );
    ly += lineH;
  }
  ctx.fillStyle = "#7c89a8";
  ctx.font = "9px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(
    `보너스 +₩${formatNum(Math.round((wave.bonus || 1500) * (game.difficulty.moneyMul || 1)))} · 조기 시작 보너스 ${(wm.preTimer * 50).toFixed(0)}원`,
    x + w / 2,
    ly + 6,
  );
  ctx.restore();
}

function drawStatsTicker(ctx, game) {
  const elapsedMs = performance.now() - (game.gameStartTime || performance.now());
  const totalSec = Math.floor(elapsedMs / 1000);
  const mm = Math.floor(totalSec / 60).toString().padStart(2, "0");
  const ss = (totalSec % 60).toString().padStart(2, "0");
  const x = 14;
  const y = CANVAS.height - 36;
  const w = 240;
  const h = 24;
  ctx.save();
  ctx.fillStyle = "rgba(14,18,30,0.78)";
  ctx.strokeStyle = "rgba(140,180,235,0.4)";
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  const peak = game.peakCombo || 0;
  const kills = game.totalKills || 0;
  ctx.fillText(`🔫 ${kills}`, x + 10, y + h / 2);
  ctx.fillStyle = "#f3f5ff";
  ctx.fillText(`⏱ ${mm}:${ss}`, x + 90, y + h / 2);
  ctx.fillStyle = peak >= 5 ? "#ff8a3a" : "#f6d96a";
  ctx.fillText(`🔥 ×${peak}`, x + 168, y + h / 2);
  ctx.restore();
}

function drawPausedOverlay(ctx, time, game) {
  const gameW = CANVAS.width - 240;
  ctx.save();
  ctx.fillStyle = "rgba(6,8,16,0.55)";
  ctx.fillRect(0, 0, gameW, CANVAS.height);
  const cx = gameW / 2;
  const cy = CANVAS.height / 2;
  const pulse = 0.85 + Math.sin(time * 3) * 0.15;
  ctx.fillStyle = "rgba(14,18,30,0.92)";
  ctx.strokeStyle = "#f6d96a";
  ctx.lineWidth = 2;
  const panelH = game ? 240 : 140;
  roundRect(ctx, cx - 220, cy - panelH / 2, 440, panelH, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(246,217,106,${pulse})`;
  ctx.shadowColor = "#f6d96a";
  ctx.shadowBlur = 20;
  ctx.font = "bold 44px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⏸ 일시정지", cx, cy - panelH / 2 + 50);
  ctx.shadowBlur = 0;
  if (game) {
    const elapsedSec = Math.floor(
      (performance.now() - (game.gameStartTime || performance.now())) / 1000,
    );
    const mm = Math.floor(elapsedSec / 60).toString().padStart(2, "0");
    const ss = (elapsedSec % 60).toString().padStart(2, "0");
    const stats = [
      [`자금`, `₩${formatNum(game.money || 0)}`],
      [`목숨`, `${game.lives}/${game.maxLives}`],
      [`웨이브`, `${game.waveManager.waveIndex + 1}/${game.waveManager.waves.length}`],
      [`처리 잔해`, `${game.totalKills || 0}마리`],
      [`누수`, `${game.totalEscaped || 0}마리`],
      [`최고 콤보`, `×${game.peakCombo || 0}`],
      [`경과 시간`, `${mm}:${ss}`],
      [`타워`, `${(game.towers || []).length}기`],
    ];
    ctx.textBaseline = "alphabetic";
    ctx.font = "11px monospace";
    for (let i = 0; i < stats.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const sx = cx - 200 + col * 220;
      const sy = cy - 40 + row * 22;
      ctx.fillStyle = "#a9b3c7";
      ctx.textAlign = "left";
      ctx.fillText(stats[i][0], sx, sy);
      ctx.fillStyle = "#f3f5ff";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "right";
      ctx.fillText(stats[i][1], sx + 200, sy);
      ctx.font = "11px monospace";
    }
  }
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Space 재개 · O 설정 · H 도움말", cx, cy + panelH / 2 - 14);
  ctx.restore();
}

function drawFirstGameHint(ctx, time) {
  const bob = Math.sin(time * 3) * 4;
  const x = CANVAS.width - 240 - 320 + 10;
  const y = 320 + bob;
  ctx.save();
  ctx.fillStyle = "rgba(78,161,255,0.95)";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, 290, 78, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("👉 1·2·3·4 키로 타워 선택", x + 16, y + 24);
  ctx.font = "11px -apple-system, sans-serif";
  ctx.fillText("그 다음 빈 슬롯 클릭해서 설치", x + 16, y + 42);
  ctx.fillText("Q = 영웅 능력, Space = 일시정지", x + 16, y + 58);
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(x + 290, y + 30);
  ctx.lineTo(x + 305, y + 38);
  ctx.lineTo(x + 290, y + 46);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawBuildBanner(ctx, game) {
  const t = TOWERS[game.buildMode];
  if (!t) return;
  const cost = Math.round(t.base.cost * (game.hero.id === "jeffrey" ? 0.92 : 1));
  const canAfford = game.money >= cost;
  const bw = 620;
  const bx = CANVAS.width / 2 - bw / 2;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.82)";
  roundRect(ctx, bx, 12, bw, 64, 8);
  ctx.fill();
  ctx.strokeStyle = canAfford ? t.color : "#e9534b";
  ctx.lineWidth = 2;
  roundRect(ctx, bx, 12, bw, 64, 8);
  ctx.stroke();
  ctx.fillStyle = canAfford ? "#f3f5ff" : "#e9534b";
  ctx.font = "bold 14px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const msg = canAfford
    ? `🛠 ${t.name} 설치 모드 · 슬롯 클릭해서 설치 · Esc/우클릭으로 취소`
    : `⚠ ${t.name} 자금 부족 (₩${formatNum(cost - game.money)} 더 필요)`;
  ctx.fillText(msg, CANVAS.width / 2, 28);
  const base = t.base;
  const rateText = base.fireRate ? `${(1 / base.fireRate).toFixed(2)}/s` : base.unitCount ? `유닛 ${base.unitCount}명` : "—";
  const dmgText = base.damage != null
    ? base.damage
    : base.unitDamage != null
      ? `${base.unitDamage}/유닛`
      : "—";
  const stats = [
    `₩${formatNum(cost)}`,
    `RNG ${base.range || "—"}`,
    `DMG ${dmgText}`,
    `RATE ${rateText}`,
  ];
  ctx.fillStyle = canAfford ? "#a9b3c7" : "rgba(233,83,75,0.7)";
  ctx.font = "11px monospace";
  const segW = bw / stats.length;
  for (let i = 0; i < stats.length; i++) {
    ctx.fillText(stats[i], bx + segW * (i + 0.5), 56);
  }
  ctx.restore();
}

function drawComboCounter(ctx, game) {
  const cx = CANVAS.width - 280;
  const cy = 100;
  const ratio = game.comboTimer / 1.2;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  roundRect(ctx, cx - 80, cy - 24, 130, 48, 8);
  ctx.fill();
  ctx.strokeStyle = game.comboCount >= 5 ? "#ff6a3a" : "#f6d96a";
  ctx.lineWidth = 2;
  roundRect(ctx, cx - 80, cy - 24, 130, 48, 8);
  ctx.stroke();
  ctx.fillStyle = "#f6d96a";
  ctx.font = "bold 11px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("COMBO", cx - 15, cy - 8);
  ctx.fillStyle = game.comboCount >= 5 ? "#ff6a3a" : "#fff";
  ctx.font = "bold 22px -apple-system, sans-serif";
  ctx.fillText(`×${game.comboCount}`, cx - 15, cy + 14);
  ctx.fillStyle = "rgba(246,217,106,0.3)";
  ctx.fillRect(cx - 78, cy + 20, 126, 3);
  ctx.fillStyle = "#f6d96a";
  ctx.fillRect(cx - 78, cy + 20, 126 * ratio, 3);
  ctx.restore();
}

function drawWavePreview(ctx, game) {
  const wm = game.waveManager;
  const next = wm.waves[wm.waveIndex];
  if (!next) return;
  const counts = {};
  for (const grp of next.groups) {
    counts[grp.type] = (counts[grp.type] || 0) + grp.count;
  }
  const types = Object.keys(counts);
  if (!types.length) return;

  const phase = wm.waitingAutoStart
    ? `▶ 다음 웨이브 (${Math.ceil(wm.preTimer)}s)`
    : wm.active
      ? `🔥 진행중 · WAVE ${wm.waveIndex + 1}`
      : "✓ 청소중...";
  const phaseColor = wm.waitingAutoStart
    ? "#f6d96a"
    : wm.active
      ? "#ff8a3a"
      : "#5acf80";

  const itemW = 72;
  const w = 24 + types.length * itemW;
  const x = 16;
  const y = 60;
  const h = 116;

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.82)";
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = phaseColor;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, w, h, 10);
  ctx.stroke();

  ctx.fillStyle = phaseColor;
  ctx.font = "bold 12px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(phase, x + 14, y + 20);
  ctx.fillStyle = "#7c89a8";
  ctx.font = "9px -apple-system, sans-serif";
  ctx.fillText("적 아이콘 hover로 정보 · 추천:", x + 14, y + h - 6);
  ctx.fillStyle = "#5acf80";
  ctx.font = "bold 9px -apple-system, sans-serif";
  const rec = recommendForWave(counts);
  ctx.fillText(rec, x + 138, y + h - 6);

  const hovered = { type: null, x: 0, y: 0 };
  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const def = ENEMIES[type];
    const ex = x + 12 + itemW / 2 + i * itemW;
    const ey = y + 48;
    const mx = game._mouseX ?? -1000;
    const my = game._mouseY ?? -1000;
    const isHover = Math.hypot(mx - ex, my - ey) < 20;
    if (isHover) {
      hovered.type = type;
      hovered.x = ex;
      hovered.y = ey;
    }
    if (isHover) {
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.arc(ex, ey, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = def.color;
    ctx.beginPath();
    ctx.arc(ex, ey, isHover ? 17 : 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isHover ? "#fff" : "rgba(255,255,255,0.4)";
    ctx.lineWidth = isHover ? 2 : 1.5;
    ctx.stroke();
    if (type === "boss") {
      ctx.fillStyle = "#ff3a3a";
      ctx.font = "bold 9px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("BOSS", ex, ey + 3);
    } else if (type === "kitchen") {
      ctx.fillStyle = "#1a1814";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("KT", ex, ey + 4);
    }
    ctx.fillStyle = "#f3f5ff";
    ctx.font = "bold 11px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(def.name.length > 5 ? def.nameEn.slice(0, 7) : def.name, ex, ey + 26);
    ctx.fillStyle = "#f6d96a";
    ctx.font = "bold 12px monospace";
    ctx.fillText(`×${counts[type]}`, ex, ey + 42);
  }
  ctx.restore();
  if (hovered.type) drawEnemyTooltip(ctx, hovered, game);
}

function recommendForWave(counts) {
  const score = { plunger: 0, suction: 0, chemical: 0, barracks: 0 };
  for (const [type, n] of Object.entries(counts)) {
    if (type === "wetwipe") { score.plunger += n * 3; score.suction += n * 2; }
    else if (type === "paper") { score.chemical += n * 2; }
    else if (type === "lens") { score.chemical += n * 3; }
    else if (type === "cap") { score.barracks += n * 4; score.chemical += n; }
    else if (type === "micro") { score.chemical += n * 2; }
    else if (type === "kitchen") { score.suction += n * 5; }
    else if (type === "boss") { score.suction += 20; score.chemical += 10; }
  }
  const best = Object.entries(score).sort((a, b) => b[1] - a[1])[0];
  const names = {
    plunger: "뚫어뻥",
    suction: "석션",
    chemical: "배수구 세정제",
    barracks: "배관공 양성소",
  };
  return names[best[0]] || "—";
}

function drawEnemyTooltip(ctx, hovered, game) {
  const def = ENEMIES[hovered.type];
  const tw = 280;
  const th = 132;
  let tx = hovered.x + 28;
  let ty = hovered.y - 20;
  if (tx + tw > CANVAS.width - 240) tx = hovered.x - tw - 28;
  ctx.save();
  ctx.fillStyle = "rgba(10,14,24,0.97)";
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 2;
  roundRect(ctx, tx, ty, tw, th, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(tx + 22, ty + 22, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 14px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(def.name, tx + 46, ty + 22);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "10px -apple-system, sans-serif";
  ctx.fillText(def.nameEn, tx + 46, ty + 36);
  ctx.font = "11px monospace";
  const stats = [
    ["체력", `${Math.round(def.hp * game.difficulty.hpMul)}`],
    ["속도", `${Math.round(def.speed * game.difficulty.speedMul)}`],
    ["갑옷", `${def.armor}`],
    ["보상", `₩${formatNum(Math.round(def.money * game.difficulty.moneyMul))}`],
  ];
  for (let i = 0; i < stats.length; i++) {
    const sx = tx + 14 + (i % 2) * 130;
    const sy = ty + 64 + Math.floor(i / 2) * 18;
    ctx.fillStyle = "#7c89a8";
    ctx.fillText(stats[i][0], sx, sy);
    ctx.fillStyle = "#f3f5ff";
    ctx.fillText(stats[i][1], sx + 36, sy);
  }
  if (def.weakness) {
    ctx.fillStyle = "#5acf80";
    ctx.font = "bold 10px -apple-system, sans-serif";
    ctx.fillText("⚔ 약점", tx + 14, ty + 110);
    ctx.fillStyle = "#f3f5ff";
    ctx.font = "10px -apple-system, sans-serif";
    ctx.fillText(def.weakness, tx + 56, ty + 110);
  }
  if (def.flags?.chemicalResist) {
    ctx.fillStyle = "#e9534b";
    ctx.font = "bold 10px -apple-system, sans-serif";
    ctx.fillText("🛡 화학 저항", tx + 14, ty + 124);
  }
  if (def.flags?.evasive) {
    ctx.fillStyle = "#a9efe5";
    ctx.font = "bold 10px -apple-system, sans-serif";
    ctx.fillText(`💨 회피 ${(def.flags.evasive * 100) | 0}%`, tx + 120, ty + 124);
  }
  ctx.restore();
}

function drawTowerPalette(ctx, ui, x, y, w, game, time) {
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "10px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("타워 · 1·2·3·4 또는 클릭", x, y);
  const towers = Object.values(TOWERS);
  for (let i = 0; i < towers.length; i++) {
    const t = towers[i];
    const ty = y + 14 + i * 56;
    const id = `palette_${t.id}`;
    const isActive = game.buildMode === t.id;
    const cost = Math.round(t.base.cost * (game.hero.id === "jeffrey" ? 0.92 : 1));
    const canAfford = game.money >= cost;
    const isHover = ui.hovered === id;
    ctx.fillStyle = isActive
      ? "rgba(60,90,140,0.95)"
      : isHover && canAfford
        ? "rgba(40,52,80,0.85)"
        : "rgba(20,28,46,0.6)";
    ctx.strokeStyle = isActive
      ? t.color
      : isHover && canAfford
        ? "#4ea1ff"
        : "#2a3148";
    ctx.lineWidth = isActive ? 2 : 1.5;
    roundRect(ctx, x, ty, w, 50, 6);
    ctx.fill();
    ctx.stroke();
    ui.button({ id, x, y: ty, w, h: 50, label: "", disabled: !canAfford });
    ctx.fillStyle = t.color;
    ctx.fillRect(x + 4, ty + 4, 4, 42);
    ctx.fillStyle = isActive ? "#fff" : "#f6d96a";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`[${i + 1}]`, x + 12, ty + 14);
    ctx.fillStyle = canAfford ? "#f3f5ff" : "#5e6883";
    ctx.font = "bold 12px -apple-system, sans-serif";
    ctx.fillText(t.name, x + 32, ty + 16);
    ctx.fillStyle = canAfford ? "#a9b3c7" : "#5e6883";
    ctx.font = "9px -apple-system, sans-serif";
    ctx.fillText(t.nameEn, x + 32, ty + 28);
    ctx.fillStyle = canAfford ? "#f6d96a" : "#5e6883";
    ctx.font = "bold 11px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`₩${formatNum(cost)}`, x + w - 8, ty + 16);
    ctx.fillStyle = canAfford ? "#a9b3c7" : "#5e6883";
    ctx.font = "9px monospace";
    ctx.fillText(`DMG ${t.base.damage || "—"}`, x + w - 8, ty + 28);
    ctx.textAlign = "left";
    const typeIcons = {
      plunger: "🔨",
      suction: "💨",
      chemical: "🧪",
      barracks: "👥",
    };
    const typeLabels = {
      plunger: "물리",
      suction: "흡입",
      chemical: "화학·광역",
      barracks: "근접",
    };
    ctx.fillStyle = canAfford ? "#7c89a8" : "#5e6883";
    ctx.font = "10px -apple-system, sans-serif";
    ctx.fillText(`${typeIcons[t.id] || "•"} ${typeLabels[t.id] || ""}`, x + 12, ty + 42);
    const descRest = t.desc.slice(0, 18) + (t.desc.length > 18 ? "…" : "");
    ctx.fillStyle = canAfford ? "#7c89a8" : "#5e6883";
    ctx.font = "9px -apple-system, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(descRest, x + w - 8, ty + 42);
    ctx.textAlign = "left";
    if (isActive) {
      ctx.fillStyle = t.color;
      ctx.font = "bold 8px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText("● 선택중", x + w - 8, ty + 42);
    }
  }
}

function drawWaveButton(ctx, ui, x, y, w, game) {
  const wm = game.waveManager;
  let label, sub, disabled, primary;
  if (wm.allCleared) {
    label = "✓ 모든 웨이브 완료";
    sub = "Pipe Cleared";
    disabled = true;
  } else if (wm.waitingAutoStart) {
    const bonus = Math.floor(wm.preTimer * 50);
    label = `▶ 웨이브 시작 (${Math.ceil(wm.preTimer)}s)`;
    sub = bonus > 0 ? `조기 시작 +₩${bonus.toLocaleString("ko-KR")}` : "조기 시작 보너스";
    primary = true;
  } else {
    label = "🚿 청소중...";
    sub = "wave in progress";
    disabled = true;
  }
  if (wm.waitingAutoStart && wm.preTimer > 0) {
    const total = wm.waves[wm.waveIndex]?.delay || 10;
    const remaining = wm.preTimer;
    const ratio = Math.max(0, Math.min(1, remaining / total));
    ctx.save();
    ctx.strokeStyle = "rgba(94,207,128,0.85)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.shadowColor = "#5acf80";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    const startA = -Math.PI / 2;
    ctx.arc(x + 14, y + 22, 13, startA, startA + Math.PI * 2 * (1 - ratio));
    ctx.stroke();
    ctx.restore();
  }
  drawButton(
    ctx,
    ui.button({
      id: "wave_start",
      x,
      y,
      w,
      h: 36,
      label,
      sub,
      disabled,
      primary,
    }),
  );
}

function drawSpeedButtons(ctx, ui, x, y, w, game) {
  const speeds = [1, 2, 3];
  const bw = (w - 8) / 3;
  for (let i = 0; i < speeds.length; i++) {
    const s = speeds[i];
    const bx = x + i * (bw + 4);
    const isActive = game.speed === s;
    drawButton(
      ctx,
      ui.button({
        id: `speed_${s}`,
        x: bx,
        y,
        w: bw,
        h: 36,
        label: `${s}×`,
        primary: isActive,
      }),
    );
  }
}

function drawPauseQuit(ctx, ui, x, y, w, game) {
  const bw = (w - 6) / 2;
  drawButton(
    ctx,
    ui.button({
      id: "pause",
      x,
      y,
      w: bw,
      h: 38,
      label: game.paused ? "▶ 재개" : "⏸ 일시정지",
    }),
  );
  drawButton(
    ctx,
    ui.button({
      id: "quit",
      x: x + bw + 6,
      y,
      w: bw,
      h: 38,
      label: "🚪 나가기",
      danger: true,
    }),
  );
}

export function drawBuildMenu(ctx, ui, game, slot, time) {
  const towers = Object.values(TOWERS);
  const menuW = 360;
  const itemH = 64;
  const totalH = 32 + towers.length * (itemH + 6) + 18;
  let mx = slot.x + 24;
  let my = slot.y - totalH / 2;
  if (mx + menuW > CANVAS.width - 240) mx = slot.x - menuW - 24;
  if (my < 12) my = 12;
  if (my + totalH > CANVAS.height - 12) my = CANVAS.height - totalH - 12;
  ctx.save();
  ctx.fillStyle = COLORS.panelBg;
  ctx.strokeStyle = "#4ea1ff";
  ctx.lineWidth = 2;
  roundRect(ctx, mx, my, menuW, totalH, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 13px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("타워 설치 · BUILD TOWER", mx + 16, my + 22);
  for (let i = 0; i < towers.length; i++) {
    const t = towers[i];
    const iy = my + 32 + i * (itemH + 6);
    const id = `build_${t.id}`;
    const isHover = ui.hovered === id;
    const canAfford = game.money >= t.base.cost;
    ctx.fillStyle = isHover && canAfford ? "rgba(60,80,120,0.7)" : "rgba(30,38,58,0.6)";
    ctx.strokeStyle = isHover && canAfford ? "#4ea1ff" : "#2a3148";
    roundRect(ctx, mx + 8, iy, menuW - 16, itemH, 6);
    ctx.fill();
    ctx.stroke();
    ui.button({
      id,
      x: mx + 8,
      y: iy,
      w: menuW - 16,
      h: itemH,
      label: "",
      disabled: !canAfford,
    });
    ctx.fillStyle = t.color;
    ctx.fillRect(mx + 12, iy + 6, 4, itemH - 12);
    ctx.fillStyle = canAfford ? "#f3f5ff" : "#5e6883";
    ctx.font = "bold 14px -apple-system, sans-serif";
    ctx.fillText(t.name, mx + 24, iy + 22);
    ctx.fillStyle = canAfford ? "#a9b3c7" : "#5e6883";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText(t.desc, mx + 24, iy + 40);
    ctx.fillStyle = canAfford ? "#7c89a8" : "#5e6883";
    ctx.font = "10px monospace";
    const dmg = t.base.damage ? `DMG ${t.base.damage}` : "수비형";
    ctx.fillText(
      `${dmg} · RNG ${t.base.range} · ${t.base.fireRate ? "초당 " + (1 / t.base.fireRate).toFixed(1) : "유닛"}`,
      mx + 24,
      iy + 56,
    );
    ctx.fillStyle = canAfford ? "#f6d96a" : "#5e6883";
    ctx.font = "bold 16px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`₩${formatNum(t.base.cost)}`, mx + menuW - 18, iy + 28);
    ctx.textAlign = "left";
  }
  ctx.fillStyle = "#7c89a8";
  ctx.font = "10px -apple-system, sans-serif";
  ctx.fillText("ESC 또는 빈 공간 클릭으로 취소", mx + 16, my + totalH - 6);
  ctx.restore();
}

export function drawTowerMenu(ctx, ui, game, tower, time) {
  const opts = tower.getUpgradeOptions();
  const menuW = 360;
  const totalH = 240 + opts.length * 64;
  let mx = tower.x + 24;
  let my = tower.y - totalH / 2;
  if (mx + menuW > CANVAS.width - 240) mx = tower.x - menuW - 24;
  if (my < 12) my = 12;
  if (my + totalH > CANVAS.height - 12) my = CANVAS.height - totalH - 12;
  ctx.save();
  ctx.fillStyle = COLORS.panelBg;
  ctx.strokeStyle = tower.def.color;
  ctx.lineWidth = 2;
  roundRect(ctx, mx, my, menuW, totalH, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = tower.def.color;
  ctx.font = "bold 16px -apple-system, sans-serif";
  ctx.textAlign = "left";
  let title = tower.def.name;
  if (tower.level >= 1) title += " · " + tower.def.branches[tower.branch].name;
  if (tower.level >= 2) title += " II";
  ctx.fillText(title, mx + 16, my + 22);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "11px -apple-system, sans-serif";
  ctx.fillText(tower.def.nameEn, mx + 16, my + 38);
  const stats = tower.getStats();
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "11px monospace";
  const modeKor = { first: "선두", threat: "위협도", strongest: "최강", last: "후미", closest: "근접" };
  const lines = [
    `RANGE   ${stats.range || "—"}`,
    `DAMAGE  ${stats.damage || (stats.unitDamage ? `유닛 ${stats.unitDamage}` : "—")}`,
    `RATE    ${stats.fireRate ? (1 / stats.fireRate).toFixed(2) + "/s" : "n/a"}`,
    `타겟    ${modeKor[tower.targetMode] || tower.targetMode}  (T키 전환)`,
    `시너지  +${(tower.synergyBonus * 100).toFixed(0)}%  (인접 ${Math.round(tower.synergyBonus / 0.05)}개)`,
    `투자     ₩${formatNum(tower.totalSpent)}`,
  ];
  if (stats.dot) lines.push(`DOT     ${stats.dot.dps}/s × ${stats.dot.duration}s`);
  if (stats.stun) lines.push(`STUN    ${stats.stun.duration}s`);
  if (stats.unitCount) lines.push(`유닛    ${stats.unitCount}명, HP ${stats.unitHp}`);
  if (stats.bonusVs)
    lines.push(`보너스   ${stats.bonusVs.join(",")} ×${stats.bonusMul}`);
  if (stats.armorPierce) lines.push(`관통    ${stats.armorPierce}`);
  if (stats.acidPool)
    lines.push(`산성웅덩이 ${stats.acidPool.dps}dps·${stats.acidPool.duration}s`);
  if (stats.passive)
    lines.push(`★ ${stats.passive.label}`);
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], mx + 16, my + 58 + i * 14);
  }
  let oy = my + 58 + lines.length * 14 + 12;
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "11px -apple-system, sans-serif";
  if (opts.length > 0) ctx.fillText("업그레이드 · UPGRADES", mx + 16, oy);
  oy += 8;
  for (let i = 0; i < opts.length; i++) {
    const opt = opts[i];
    const iy = oy + i * 92;
    const id = `upg_${i}`;
    const canAfford = game.money >= opt.cost;
    const isHover = ui.hovered === id;
    ctx.fillStyle =
      isHover && canAfford ? "rgba(60,90,140,0.7)" : "rgba(30,38,58,0.6)";
    ctx.strokeStyle = isHover && canAfford ? "#4ea1ff" : "#2a3148";
    roundRect(ctx, mx + 12, iy, menuW - 24, 86, 6);
    ctx.fill();
    ctx.stroke();
    ui.button({
      id,
      x: mx + 12,
      y: iy,
      w: menuW - 24,
      h: 86,
      label: "",
      disabled: !canAfford,
    });
    ctx.fillStyle = canAfford ? "#f3f5ff" : "#5e6883";
    ctx.font = "bold 13px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(opt.name, mx + 22, iy + 20);
    ctx.fillStyle = canAfford ? "#a9b3c7" : "#5e6883";
    ctx.font = "10px -apple-system, sans-serif";
    ctx.fillText(opt.desc, mx + 22, iy + 36);
    ctx.fillStyle = canAfford ? "#f6d96a" : "#5e6883";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`₩${formatNum(opt.cost)}`, mx + menuW - 22, iy + 20);
    ctx.textAlign = "left";
    const next = opt.nextStats;
    const deltas = [];
    if (next.damage != null && stats.damage != null) {
      const d = next.damage - (stats.damage || 0);
      deltas.push({ label: "DMG", from: stats.damage, to: next.damage, delta: d });
    }
    if (next.range != null && stats.range != null) {
      const d = next.range - stats.range;
      deltas.push({ label: "RNG", from: stats.range, to: next.range, delta: d });
    }
    if (next.fireRate != null && stats.fireRate) {
      const fromDps = (1 / stats.fireRate).toFixed(1);
      const toDps = (1 / next.fireRate).toFixed(1);
      const d = parseFloat(toDps) - parseFloat(fromDps);
      deltas.push({ label: "RATE", from: fromDps + "/s", to: toDps + "/s", delta: d });
    }
    if (next.unitCount != null && stats.unitCount != null) {
      const d = next.unitCount - stats.unitCount;
      deltas.push({ label: "유닛", from: stats.unitCount, to: next.unitCount, delta: d });
    }
    if (next.unitDamage != null && stats.unitDamage != null) {
      const d = next.unitDamage - stats.unitDamage;
      deltas.push({ label: "DMG", from: stats.unitDamage, to: next.unitDamage, delta: d });
    }
    let dx = mx + 22;
    const dy = iy + 60;
    ctx.font = "9px monospace";
    for (let k = 0; k < Math.min(deltas.length, 4); k++) {
      const e = deltas[k];
      ctx.fillStyle = "#7c89a8";
      ctx.fillText(e.label, dx, dy);
      ctx.fillStyle = "#f3f5ff";
      ctx.fillText(String(e.from), dx, dy + 12);
      ctx.fillStyle = "#f6d96a";
      ctx.fillText("→", dx + 26, dy + 12);
      const deltaColor = e.delta > 0 ? "#5acf80" : e.delta < 0 ? "#e9534b" : "#a9b3c7";
      ctx.fillStyle = deltaColor;
      ctx.font = "bold 9px monospace";
      ctx.fillText(String(e.to), dx + 36, dy + 12);
      ctx.font = "9px monospace";
      dx += 76;
    }
  }
  oy += opts.length * 92 + 12;
  drawButton(
    ctx,
    ui.button({
      id: "sell",
      x: mx + 12,
      y: oy,
      w: menuW - 24,
      h: 38,
      label: `💰 매각 · SELL`,
      sub: `회수 ₩${formatNum(tower.getSellValue())}`,
      danger: true,
    }),
  );
  ctx.fillStyle = "rgba(140,170,210,0.55)";
  ctx.font = "10px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("ESC · 우클릭 · 빈 공간 클릭으로 닫기", mx + menuW / 2, my + totalH - 8);
  ctx.restore();
}

function drawGradeBadge(ctx, cx, cy, grade, time) {
  const colors = {
    S: { fill: "#ffea66", glow: "#ffd54a", text: "#3a2818" },
    A: { fill: "#a8e07d", glow: "#7ed14a", text: "#1a2810" },
    B: { fill: "#6fb8ff", glow: "#4ea1ff", text: "#0a1a30" },
    C: { fill: "#d4b86c", glow: "#a08a3a", text: "#1a1810" },
    D: { fill: "#a0a4b0", glow: "#707080", text: "#0a0a18" },
    F: { fill: "#e9534b", glow: "#a01a18", text: "#1a0608" },
  };
  const c = colors[grade] || colors.C;
  const pulse = 0.85 + Math.sin((time || 0) * 3) * 0.15;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.shadowColor = c.glow;
  ctx.shadowBlur = grade === "S" ? 24 * pulse : 14;
  ctx.fillStyle = c.fill;
  ctx.beginPath();
  ctx.arc(0, 0, 32, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = c.text;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = c.text;
  ctx.font = "bold 36px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(grade, 0, 2);
  ctx.font = "8px monospace";
  ctx.fillText("GRADE", 0, 24);
  ctx.restore();
}

export function drawSettingsOverlay(ctx, game, time, ui) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.78)";
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  const panelW = 480;
  const panelH = 420;
  const px = (CANVAS.width - panelW) / 2;
  const py = (CANVAS.height - panelH) / 2;
  ctx.fillStyle = "#0e1422";
  ctx.strokeStyle = "#5acf80";
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, panelW, panelH, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 28px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("⚙ 설정 · SETTINGS", CANVAS.width / 2, py + 50);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "12px -apple-system, sans-serif";
  ctx.fillText("O 키로 닫기 · 클릭으로 조절", CANVAS.width / 2, py + 76);
  const settings = game?.progress?.settings || {};
  const vol = typeof settings.volume === "number" ? settings.volume : 0.35;
  ctx.textAlign = "left";
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 14px -apple-system, sans-serif";
  ctx.fillText("🔊 마스터 볼륨", px + 30, py + 124);
  const trackX = px + 30;
  const trackY = py + 144;
  const trackW = panelW - 60;
  ctx.fillStyle = "rgba(60,72,100,0.65)";
  ctx.fillRect(trackX, trackY, trackW, 10);
  ctx.fillStyle = "#5acf80";
  ctx.fillRect(trackX, trackY, Math.max(2, trackW * vol), 10);
  ctx.fillStyle = "#f6d96a";
  ctx.beginPath();
  ctx.arc(trackX + trackW * vol, trackY + 5, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "11px monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(vol * 100)}%`, trackX + trackW, trackY + 28);
  const levels = [0, 0.15, 0.35, 0.6, 0.85];
  const labels = ["🔇 OFF", "낮음", "보통", "큼", "최대"];
  for (let i = 0; i < levels.length; i++) {
    const bx = trackX + (trackW / (levels.length - 1)) * i - 32;
    const by = trackY + 36;
    const isActive = Math.abs(vol - levels[i]) < 0.04;
    ctx.fillStyle = isActive ? "rgba(94,207,128,0.85)" : "rgba(40,52,80,0.75)";
    ctx.strokeStyle = isActive ? "#5acf80" : "#2a3148";
    ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, 64, 26, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isActive ? "#fff" : "#a9b3c7";
    ctx.font = "10px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[i], bx + 32, by + 17);
  }
  const cbOn = !!settings.colorblind;
  const cbX = px + 30;
  const cbY = py + 230;
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 13px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("♿ 색맹 모드 (적 outline 강화)", cbX, cbY);
  const tBX = cbX + 230;
  const tBY = cbY - 14;
  const tBW = 70;
  const tBH = 22;
  ctx.fillStyle = cbOn ? "rgba(94,207,128,0.85)" : "rgba(140,150,170,0.4)";
  ctx.strokeStyle = cbOn ? "#5acf80" : "#5e6883";
  ctx.lineWidth = 1.5;
  roundRect(ctx, tBX, tBY, tBW, tBH, 11);
  ctx.fill();
  ctx.stroke();
  const knob = cbOn ? tBX + tBW - 12 : tBX + 10;
  ctx.fillStyle = "#f3f5ff";
  ctx.beginPath();
  ctx.arc(knob, tBY + tBH / 2, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "10px monospace";
  ctx.textAlign = "right";
  ctx.fillText(cbOn ? "ON" : "OFF", tBX + tBW + 22, tBY + tBH / 2 + 3);
  if (ui) {
    ui.button({ id: "cb_toggle", x: tBX - 4, y: tBY - 2, w: tBW + 8, h: tBH + 4 });
  }
  ctx.fillStyle = "#7c89a8";
  ctx.font = "11px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("⌨ 단축키 안내:  M 사운드 · 1·2·3 속도 · H 도움말 · O 설정", px + 30, py + 268);
  ctx.fillText(
    "💡 ESC 또는 O 키로 닫기. 설정은 자동 저장됩니다.",
    px + 30,
    py + 282,
  );
  const stats = [
    `누적 처리 잔해: ${formatNum(game?.progress?.lifetime?.totalKills || 0)}마리`,
    `완주 출장: ${game?.progress?.lifetime?.runsCompleted || 0}회`,
    `획득 업적: ${Object.keys(game?.progress?.achievements || {}).length}/10`,
    `최고 등급: ${game?.progress?.lifetime?.bestGrade || "—"}`,
  ];
  ctx.fillStyle = "rgba(78,161,255,0.15)";
  ctx.strokeStyle = "rgba(78,161,255,0.5)";
  ctx.lineWidth = 1;
  roundRect(ctx, px + 30, py + 290, panelW - 60, 88, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f6d96a";
  ctx.font = "bold 11px -apple-system, sans-serif";
  ctx.fillText("📊 진행 상황", px + 42, py + 308);
  ctx.font = "11px monospace";
  ctx.fillStyle = "#a9b3c7";
  for (let i = 0; i < stats.length; i++) {
    ctx.fillText(stats[i], px + 42, py + 328 + i * 14);
  }
  ctx.restore();
}

export function drawHelpOverlay(ctx, time) {
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.78)";
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  const panelW = 540;
  const panelH = 520;
  const px = (CANVAS.width - panelW) / 2;
  const py = (CANVAS.height - panelH) / 2;
  ctx.fillStyle = "#0e1422";
  ctx.strokeStyle = "#4ea1ff";
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, panelW, panelH, 14);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 28px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("⌨ 단축키 · KEYBINDS", CANVAS.width / 2, py + 50);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "12px -apple-system, sans-serif";
  ctx.fillText("H · ? · / 키로 닫기", CANVAS.width / 2, py + 76);
  const items = [
    ["1 · 2 · 3 · 4", "타워 선택 (뚫어뻥/석션/세정제/배관공)"],
    ["빈 슬롯 클릭", "선택한 타워 설치"],
    ["타워 클릭", "업그레이드 / 매각 메뉴"],
    ["T", "타겟 모드 변경 (선두/위협/최강/후미/근접)"],
    ["Q", "영웅 능력 발동"],
    ["Space", "일시정지 / 재개"],
    ["1 · 2 · 3 (게임속도)", "정상 · 빠름 · 초고속 (속도 패널 활성)"],
    ["+ · -", "게임 속도 ±1"],
    ["M", "🔊 사운드 토글"],
    ["U", "↩ 직전 판매 취소 (5초 윈도우)"],
    ["Esc / 우클릭", "메뉴 / 빌드모드 닫기"],
    ["H / ? / /", "이 도움말 토글"],
  ];
  const cheats = [
    ["150", "₩1,500,000 + 보스 즉시 소환"],
    ["demoday", "₩500,000 + 라이프 +5"],
    ["kim", "키친타월 5개 즉시 투기"],
    ["tossme", "10초 모든 타워 +50% DMG"],
    ["wifi", "전체 적 진단 정보 노출"],
  ];
  ctx.textAlign = "left";
  ctx.font = "11px -apple-system, sans-serif";
  let ly = py + 110;
  for (const [k, v] of items) {
    ctx.fillStyle = "#f6d96a";
    ctx.fillText(k, px + 30, ly);
    ctx.fillStyle = "#a9b3c7";
    ctx.fillText(v, px + 180, ly);
    ly += 17;
  }
  ctx.fillStyle = "#7c89a8";
  ctx.font = "10px -apple-system, sans-serif";
  ctx.fillText("🚽 숨겨진 치트 (글자 입력)", px + 30, ly + 6);
  ctx.font = "11px monospace";
  ly += 24;
  for (const [k, v] of cheats) {
    ctx.fillStyle = "#5acf80";
    ctx.fillText(k, px + 30, ly);
    ctx.fillStyle = "#a9b3c7";
    ctx.fillText(v, px + 180, ly);
    ly += 16;
  }
  ctx.restore();
}

export function drawCheatBuffer(ctx, buffer) {
  if (!buffer) return;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(20, CANVAS.height - 50, 130, 28);
  ctx.fillStyle = "#5acf80";
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`> ${buffer}_`, 30, CANVAS.height - 32);
  ctx.restore();
}

export function drawFlashes(ctx, ui) {
  for (const f of ui.flashes) {
    const alpha = Math.min(1, f.life / f.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    const w = ctx.measureText(f.text).width + 40;
    ctx.fillRect(f.x - w / 2, f.y - f.size / 2 - 4, w, f.size + 12);
    ctx.fillStyle = f.color;
    ctx.font = `bold ${f.size}px -apple-system, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(f.text, f.x, f.y);
    ctx.restore();
  }
}

export function drawToasts(ctx, ui) {
  let y = CANVAS.height - 100;
  for (let i = ui.toasts.length - 1; i >= 0; i--) {
    const t = ui.toasts[i];
    const alpha = Math.min(1, t.life / t.maxLife * 1.5);
    const w = ctx.measureText(t.text).width + 40;
    const x = (CANVAS.width - 240 - w) / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = t.bg;
    roundRect(ctx, x, y, w, 32, 8);
    ctx.fill();
    ctx.fillStyle = t.color;
    ctx.font = "bold 13px -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(t.text, x + w / 2, y + 16);
    ctx.restore();
    y -= 40;
  }
}

export function drawPause(ctx, ui) {
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 48px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("⏸ 일시정지", CANVAS.width / 2, 260);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "14px -apple-system, sans-serif";
  ctx.fillText("스페이스 키 또는 '재개' 버튼", CANVAS.width / 2, 296);

  drawButton(
    ctx,
    ui.button({
      id: "resume",
      x: CANVAS.width / 2 - 130,
      y: 340,
      w: 260,
      h: 48,
      label: "▶ 재개 · RESUME",
      primary: true,
    }),
  );
  drawButton(
    ctx,
    ui.button({
      id: "pause_quit",
      x: CANVAS.width / 2 - 130,
      y: 400,
      w: 260,
      h: 44,
      label: "🚪 메인 메뉴",
      danger: true,
    }),
  );
}

export function drawGameOver(ctx, ui, game, time) {
  ctx.fillStyle = "rgba(0,0,0,0.75)";
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

  const invoiceW = 640;
  const invoiceH = 620;
  const ix = (CANVAS.width - invoiceW) / 2;
  const iy = (CANVAS.height - invoiceH) / 2 - 10;

  ctx.fillStyle = "#fbf6e7";
  ctx.shadowColor = "rgba(0,0,0,0.8)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.fillRect(ix, iy, invoiceW, invoiceH);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = "#1a1814";
  ctx.font = "bold 26px monospace";
  ctx.textAlign = "center";
  ctx.fillText("거래 명세서 · INVOICE", ix + invoiceW / 2, iy + 40);
  ctx.font = "10px monospace";
  ctx.fillStyle = "#7a6b50";
  ctx.fillText("─".repeat(80), ix + invoiceW / 2, iy + 56);
  drawGradeBadge(ctx, ix + invoiceW - 60, iy + 50, game.grade || "F", time);

  ctx.textAlign = "left";
  ctx.fillStyle = "#1a1814";
  ctx.font = "bold 14px monospace";
  ctx.fillText(INVOICE.company, ix + 32, iy + 90);
  ctx.font = "11px monospace";
  ctx.fillText("TEL: " + INVOICE.phone, ix + 32, iy + 110);
  ctx.fillText("주소: " + INVOICE.address, ix + 32, iy + 126);

  ctx.textAlign = "right";
  const ts = new Date().toLocaleString("ko-KR");
  ctx.fillText(`발행일: ${ts}`, ix + invoiceW - 32, iy + 110);
  ctx.fillText(`담당: 김반장`, ix + invoiceW - 32, iy + 126);

  ctx.fillStyle = "#1a1814";
  ctx.fillRect(ix + 32, iy + 152, invoiceW - 64, 1);

  ctx.textAlign = "left";
  ctx.font = "bold 12px monospace";
  ctx.fillText("항목 · ITEM", ix + 40, iy + 174);
  ctx.textAlign = "right";
  ctx.fillText("금액 · AMOUNT", ix + invoiceW - 40, iy + 174);

  ctx.font = "12px monospace";
  let y = iy + 196;
  for (const item of INVOICE.items) {
    ctx.textAlign = "left";
    ctx.fillText(item.label, ix + 40, y);
    ctx.textAlign = "right";
    ctx.fillText(`₩${formatNum(item.price)}`, ix + invoiceW - 40, y);
    y += 20;
  }

  ctx.fillStyle = "#7a6b50";
  ctx.font = "10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("─".repeat(80), ix + invoiceW / 2, y + 10);

  ctx.textAlign = "left";
  ctx.fillStyle = "#1a1814";
  ctx.font = "bold 16px monospace";
  ctx.fillText("합계 · TOTAL", ix + 40, y + 38);
  ctx.textAlign = "right";
  ctx.fillStyle = "#a01a18";
  ctx.font = "bold 22px monospace";
  ctx.fillText(`₩${formatNum(INVOICE.total)}`, ix + invoiceW - 40, y + 40);

  ctx.fillStyle = "#7a6b50";
  ctx.font = "11px monospace";
  ctx.textAlign = "center";
  ctx.fillText(
    `${INVOICE.vat} · ${INVOICE.dispatch} · ${INVOICE.warranty}`,
    ix + invoiceW / 2,
    y + 70,
  );

  ctx.textAlign = "center";
  ctx.fillStyle = "#1a1814";
  ctx.font = "bold 16px -apple-system, sans-serif";
  ctx.fillText("배관 무결성이 0이 되었습니다.", ix + invoiceW / 2, y + 100);
  ctx.fillStyle = "#a01a18";
  ctx.fillText("청구서를 받아주세요.", ix + invoiceW / 2, y + 122);

  ctx.fillStyle = "rgba(40,30,20,0.08)";
  ctx.fillRect(ix + 40, y + 142, invoiceW - 80, 56);
  ctx.fillStyle = "#7a6b50";
  ctx.font = "11px monospace";
  ctx.textAlign = "left";
  ctx.fillText("👷 김반장:", ix + 50, y + 158);
  ctx.fillStyle = "#1a1814";
  ctx.font = 'italic 12px "Apple SD Gothic Neo", monospace';
  const qs = [
    '"이거 키친타월 넣으셨네요... 출장비 별도입니다."',
    '"제가 5층까지 호스 끌고 올라오는 게 진짜 힘들거든요."',
    '"녹화 안 하셨죠? 현금하면 부가세 빼드릴게요."',
    '"기사 30년에 이런 막힘은 처음 봅니다."',
  ];
  ctx.fillText(qs[Math.floor(game.time / 4) % qs.length], ix + 50, y + 178);
  ctx.font = "10px monospace";
  ctx.fillStyle = "#7a6b50";
  ctx.fillText(
    `통계 · 처리 잔해 ${game.totalKills}마리 · 누수 ${game.totalEscaped}마리 · 최고 콤보 ×${game.peakCombo} · 최종 WAVE ${game.waveManager.waveIndex + 1}/${game.waveManager.waves.length}`,
    ix + 50,
    y + 195,
  );
  ctx.textAlign = "center";

  const baseY = iy + invoiceH - 60;
  drawButton(
    ctx,
    ui.button({
      id: "retry",
      x: ix + 40,
      y: baseY,
      w: (invoiceW - 96) / 2,
      h: 44,
      label: "🔁 다시 시도",
      primary: true,
    }),
  );
  drawButton(
    ctx,
    ui.button({
      id: "menu",
      x: ix + 56 + (invoiceW - 96) / 2,
      y: baseY,
      w: (invoiceW - 96) / 2,
      h: 44,
      label: "🚪 메인 메뉴",
      danger: true,
    }),
  );
}

export function drawVictory(ctx, ui, game, time) {
  ctx.fillStyle = "rgba(0,0,0,0.78)";
  ctx.fillRect(0, 0, CANVAS.width, CANVAS.height);

  const panelW = 620;
  const panelH = 540;
  const px = (CANVAS.width - panelW) / 2;
  const py = (CANVAS.height - panelH) / 2;
  ctx.fillStyle = "#1c2240";
  ctx.strokeStyle = "#f6d96a";
  ctx.lineWidth = 3;
  roundRect(ctx, px, py, panelW, panelH, 18);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f6d96a";
  ctx.font = "bold 38px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(246,217,106,0.6)";
  ctx.shadowBlur = 16;
  ctx.fillText("🎉 청소 완료!", CANVAS.width / 2, py + 56);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "16px -apple-system, sans-serif";
  ctx.fillText(`${game.level.name} 클리어 · ${game.difficulty.name}`, CANVAS.width / 2, py + 86);
  drawGradeBadge(ctx, px + panelW - 70, py + 70, game.grade || "B", time);

  for (let i = 0; i < 3; i++) {
    const sx = CANVAS.width / 2 - 80 + i * 80;
    const sy = py + 150;
    const filled = i < game.stars;
    const sz = filled ? 36 : 30;
    drawStar(ctx, sx, sy, sz, filled);
  }

  const elapsedSec = (performance.now() - game.gameStartTime) / 1000;
  const mins = Math.floor(elapsedSec / 60);
  const secs = Math.floor(elapsedSec % 60);
  const mvpTower = game.towers.reduce(
    (best, t) => (t.kills > (best?.kills || 0) ? t : best),
    null,
  );

  ctx.fillStyle = "rgba(0,0,0,0.25)";
  roundRect(ctx, px + 30, py + 200, panelW - 60, 200, 8);
  ctx.fill();

  ctx.textAlign = "left";
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "11px -apple-system, sans-serif";
  ctx.fillText("📊 통계", px + 50, py + 222);

  const statsLeft = [
    [`처리한 잔해`, `${game.totalKills}마리`],
    [`누수 (탈출)`, `${game.totalEscaped}마리`],
    [`최고 콤보`, `×${game.peakCombo}`],
    [`소요 시간`, `${mins}분 ${secs}초`],
  ];
  const statsRight = [
    [`잔여 무결성`, `${game.lives}/${game.maxLives}`],
    [`잔여 자금`, `₩${formatNum(game.money)}`],
    [`총 획득`, `₩${formatNum(game.totalEarned)}`],
    [
      `MVP 타워`,
      mvpTower
        ? `${mvpTower.def.name} (${mvpTower.kills}킬)`
        : "—",
    ],
  ];

  ctx.font = "12px -apple-system, sans-serif";
  for (let i = 0; i < statsLeft.length; i++) {
    const yy = py + 248 + i * 22;
    ctx.fillStyle = "#a9b3c7";
    ctx.fillText(statsLeft[i][0], px + 50, yy);
    ctx.fillStyle = "#f3f5ff";
    ctx.font = "bold 12px monospace";
    ctx.fillText(statsLeft[i][1], px + 150, yy);
    ctx.font = "12px -apple-system, sans-serif";

    ctx.fillStyle = "#a9b3c7";
    ctx.fillText(statsRight[i][0], px + 320, yy);
    ctx.fillStyle = "#f3f5ff";
    ctx.font = "bold 12px monospace";
    ctx.fillText(statsRight[i][1], px + 410, yy);
    ctx.font = "12px -apple-system, sans-serif";
  }

  if (game.bossKilled) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#ff6a3a";
    ctx.font = "bold 13px -apple-system, sans-serif";
    ctx.fillText("👹 정체불명의 물질 격파 ✓", CANVAS.width / 2, py + 388);
  }
  const sortedTowers = [...game.towers]
    .filter((t) => t.kills > 0 || (t.dmgDealt || 0) > 0)
    .sort((a, b) => (b.dmgDealt || 0) - (a.dmgDealt || 0))
    .slice(0, 4);
  if (sortedTowers.length > 0) {
    const tx = px + 30;
    const tyStart = py + 406;
    const tw = panelW - 60;
    ctx.fillStyle = "rgba(78,161,255,0.12)";
    ctx.strokeStyle = "rgba(78,161,255,0.45)";
    ctx.lineWidth = 1;
    roundRect(ctx, tx, tyStart, tw, 16 + sortedTowers.length * 18, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f6d96a";
    ctx.font = "bold 11px -apple-system, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("⚔ 타워 DPS · 데미지 기여", tx + 10, tyStart + 14);
    for (let i = 0; i < sortedTowers.length; i++) {
      const t = sortedTowers[i];
      const ry = tyStart + 32 + i * 18;
      ctx.fillStyle = t.def.color;
      ctx.beginPath();
      ctx.arc(tx + 18, ry - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f3f5ff";
      ctx.font = "11px -apple-system, sans-serif";
      ctx.fillText(`${t.def.name}${t.level >= 1 ? " · " + t.def.branches[t.branch].name : ""}`, tx + 30, ry);
      ctx.fillStyle = "#a9b3c7";
      ctx.font = "10px monospace";
      ctx.textAlign = "right";
      ctx.fillText(
        `${t.kills}킬 · ${Math.round((t.dmgDealt || 0) / 1000)}k DMG`,
        tx + tw - 10,
        ry,
      );
      ctx.textAlign = "left";
    }
  }

  drawButton(
    ctx,
    ui.button({
      id: "v_next",
      x: px + 30,
      y: py + 320,
      w: (panelW - 80) / 2,
      h: 48,
      label: game.nextLevelId ? "▶ 다음 스테이지" : "🏆 끝났습니다!",
      primary: true,
      disabled: !game.nextLevelId,
    }),
  );
  drawButton(
    ctx,
    ui.button({
      id: "v_menu",
      x: px + 50 + (panelW - 80) / 2,
      y: py + 320,
      w: (panelW - 80) / 2,
      h: 48,
      label: "🚪 메인 메뉴",
    }),
  );
  if (!game.nextLevelId) {
    ctx.fillStyle = "#f6d96a";
    ctx.font = "13px -apple-system, sans-serif";
    ctx.fillText(
      "모든 배관을 청소했습니다. 변기톤 우승!",
      CANVAS.width / 2,
      py + 392,
    );
  }
}

export function drawTutorial(ctx, ui, time) {
  drawScreenBg(ctx, time, "#1a2238");
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 32px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("도움말 · HOW TO PLAY", CANVAS.width / 2, 80);

  const panelW = 900;
  const panelH = 480;
  const px = (CANVAS.width - panelW) / 2;
  const py = 120;
  ctx.fillStyle = "rgba(20,28,46,0.85)";
  ctx.strokeStyle = "#2a3148";
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, panelW, panelH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.fillStyle = "#f6d96a";
  ctx.font = "bold 16px -apple-system, sans-serif";
  ctx.fillText("🎯 목표", px + 32, py + 36);
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "13px -apple-system, sans-serif";
  ctx.fillText(
    "배관을 따라 흘러오는 잔해를 막아 메인 오수관 진입을 저지하세요.",
    px + 32,
    py + 58,
  );
  ctx.fillText(
    "잔해 3마리가 통과하면 배관이 완전 막혀 ₩1,500,000짜리 청구서가 발생합니다.",
    px + 32,
    py + 78,
  );

  ctx.fillStyle = "#f6d96a";
  ctx.font = "bold 16px -apple-system, sans-serif";
  ctx.fillText("🛠 타워", px + 32, py + 118);
  ctx.font = "12px -apple-system, sans-serif";
  ctx.fillStyle = "#f3f5ff";
  const towers = Object.values(TOWERS);
  for (let i = 0; i < towers.length; i++) {
    const t = towers[i];
    ctx.fillStyle = t.color;
    ctx.fillRect(px + 32, py + 130 + i * 32, 8, 26);
    ctx.fillStyle = "#f3f5ff";
    ctx.font = "bold 13px -apple-system, sans-serif";
    ctx.fillText(`${t.name} (${t.nameEn})`, px + 48, py + 145 + i * 32);
    ctx.fillStyle = "#a9b3c7";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText(t.desc, px + 48, py + 161 + i * 32);
  }

  ctx.fillStyle = "#f6d96a";
  ctx.font = "bold 16px -apple-system, sans-serif";
  ctx.fillText("⚠ 적", px + 480, py + 118);
  const enemyEntries = [
    "물티슈 — 느리고 단단함. 화학 공격 저항.",
    "휴지 — 빠르고 약함. 무리지어 등장.",
    "콘택트렌즈 — 작고 민첩. 회피 능력.",
    "인공눈물 껍데기 — 죽으면 둘로 분열.",
    "키친타월 — 엘리트, 중장갑.",
    "정체불명의 물질 — 보스, 매번 다른 면역.",
  ];
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "12px -apple-system, sans-serif";
  for (let i = 0; i < enemyEntries.length; i++) {
    ctx.fillText("• " + enemyEntries[i], px + 480, py + 142 + i * 22);
  }

  ctx.fillStyle = "#f6d96a";
  ctx.font = "bold 16px -apple-system, sans-serif";
  ctx.fillText("⌨ 조작", px + 32, py + 304);
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "12px -apple-system, sans-serif";
  const controls = [
    "마우스 클릭 — 슬롯 선택 / 타워 설치 / 업그레이드",
    "스페이스 — 일시정지",
    "1 / 2 / 3 — 게임 속도",
    "ESC — 메뉴 닫기",
    'Q — 영웅 능력 발동',
    'Hidden: "150" 타이핑 → 자금 +₩1,500,000 (보스 즉시 등장)',
  ];
  for (let i = 0; i < controls.length; i++) {
    ctx.fillText("• " + controls[i], px + 32, py + 326 + i * 20);
  }

  drawButton(
    ctx,
    ui.button({
      id: "tut_back",
      x: CANVAS.width / 2 - 80,
      y: 626,
      w: 160,
      h: 44,
      label: "← 뒤로",
      primary: true,
    }),
  );
}

export function drawBestiary(ctx, ui, time) {
  drawScreenBg(ctx, time, "#1c2230");
  ctx.fillStyle = "#f6d96a";
  ctx.font = "bold 32px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("📖 잔해 도감 · BESTIARY", CANVAS.width / 2, 60);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "13px -apple-system, sans-serif";
  ctx.fillText("노마다마스 5층 화장실에서 발견된 모든 적의 분석 자료", CANVAS.width / 2, 82);

  const enemies = Object.values(ENEMIES).filter((e) => !e.flags?.spawned);
  const cols = 3;
  const cardW = 380;
  const cardH = 150;
  const gap = 18;
  const totalW = cardW * cols + gap * (cols - 1);
  const startX = (CANVAS.width - totalW) / 2;
  const startY = 110;

  for (let i = 0; i < enemies.length; i++) {
    const def = enemies[i];
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + gap);
    drawBestiaryCard(ctx, x, y, cardW, cardH, def, time);
  }

  ui.drawMenuButton(
    ctx,
    ui.button({
      id: "bestiary_back",
      x: 40,
      y: 640,
      w: 160,
      h: 44,
      label: "← 뒤로",
    }),
  );
}

function drawBestiaryCard(ctx, x, y, w, h, def, time) {
  ctx.save();
  ctx.fillStyle = "rgba(20,28,46,0.92)";
  ctx.strokeStyle = def.flags?.boss ? "#ff3a3a" : def.flags?.elite ? "#f6d96a" : "#2a3148";
  ctx.lineWidth = def.flags?.boss ? 2.5 : 1.5;
  roundRect(ctx, x, y, w, h, 10);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(x + 38, y + 56, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (def.flags?.boss) {
    ctx.fillStyle = "#ff3a3a";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BOSS", x + 38, y + 58);
  } else if (def.flags?.elite) {
    ctx.fillStyle = "#1a1814";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ELITE", x + 38, y + 60);
  }
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 16px -apple-system, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(def.name, x + 76, y + 26);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "11px -apple-system, sans-serif";
  ctx.fillText(def.nameEn, x + 76, y + 42);
  ctx.font = "11px monospace";
  const cols = [
    ["HP", def.hp],
    ["속도", def.speed],
    ["갑옷", def.armor],
    ["보상", `₩${def.money}`],
  ];
  for (let i = 0; i < cols.length; i++) {
    const cx = x + 76 + i * 70;
    ctx.fillStyle = "#7c89a8";
    ctx.fillText(cols[i][0], cx, y + 64);
    ctx.fillStyle = "#f3f5ff";
    ctx.fillText(String(cols[i][1]), cx, y + 78);
  }
  if (def.weakness) {
    ctx.fillStyle = "#5acf80";
    ctx.font = "bold 11px -apple-system, sans-serif";
    ctx.fillText("⚔ 약점:", x + 76, y + 100);
    ctx.fillStyle = "#f3f5ff";
    ctx.font = "11px -apple-system, sans-serif";
    ctx.fillText(def.weakness, x + 132, y + 100);
  }
  const flags = [];
  if (def.flags?.chemicalResist)
    flags.push(`🛡 화학저항 ${(def.flags.chemicalResist * 100) | 0}%`);
  if (def.flags?.evasive) flags.push(`💨 회피 ${(def.flags.evasive * 100) | 0}%`);
  if (def.flags?.cluster) flags.push("👥 군집 스폰");
  if (def.flags?.split)
    flags.push(`💢 사망 시 ${def.flags.split.count}개로 분열`);
  if (def.flags?.forbidden) flags.push("⚠ 금기 항목");
  if (def.flags?.randomImmunity) flags.push("❓ 매번 다른 타워에 면역");
  if (flags.length) {
    ctx.fillStyle = "#e9534b";
    ctx.font = "10px -apple-system, sans-serif";
    let fy = y + 118;
    for (const f of flags) {
      ctx.fillText(f, x + 76, fy);
      fy += 12;
    }
  }
  ctx.restore();
}

export function drawCredits(ctx, ui, time) {
  drawScreenBg(ctx, time, "#1c1a2f");
  ctx.fillStyle = "#f6d96a";
  ctx.font = "bold 38px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("크레딧 · CREDITS", CANVAS.width / 2, 90);

  const panelW = 640;
  const panelH = 460;
  const px = (CANVAS.width - panelW) / 2;
  const py = 130;
  ctx.fillStyle = "rgba(20,28,46,0.85)";
  ctx.strokeStyle = "#f6d96a";
  ctx.lineWidth = 2;
  roundRect(ctx, px, py, panelW, panelH, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f3f5ff";
  ctx.font = "bold 24px -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(CREDITS.studio, CANVAS.width / 2, py + 50);
  ctx.fillStyle = "#a9b3c7";
  ctx.font = "16px -apple-system, sans-serif";
  ctx.fillText(`presents · ${CREDITS.event}`, CANVAS.width / 2, py + 76);

  ctx.fillStyle = "#f6d96a";
  ctx.font = "bold 18px -apple-system, sans-serif";
  ctx.fillText(`team · ${CREDITS.team}`, CANVAS.width / 2, py + 118);

  ctx.fillStyle = "#5acf80";
  ctx.font = "13px -apple-system, sans-serif";
  ctx.fillText(CREDITS.sponsor, CANVAS.width / 2, py + 150);

  ctx.fillStyle = "#a9b3c7";
  ctx.font = "13px -apple-system, sans-serif";
  ctx.fillText("─── 감사의 말 ───", CANVAS.width / 2, py + 190);
  ctx.fillStyle = "#f3f5ff";
  ctx.font = "13px -apple-system, sans-serif";
  for (let i = 0; i < CREDITS.thanks.length; i++) {
    ctx.fillText(CREDITS.thanks[i], CANVAS.width / 2, py + 220 + i * 22);
  }

  ctx.fillStyle = "#7c89a8";
  ctx.font = "italic 12px -apple-system, sans-serif";
  ctx.fillText(
    "이 게임은 실화에 기반하지 않았습니다. 그저… 영감을 받았을 뿐.",
    CANVAS.width / 2,
    py + 380,
  );
  ctx.fillStyle = "#5e6883";
  ctx.font = "11px monospace";
  ctx.fillText("v1.0 · 5F 변기 충성", CANVAS.width / 2, py + 412);

  drawButton(
    ctx,
    ui.button({
      id: "credits_back",
      x: CANVAS.width / 2 - 80,
      y: 626,
      w: 160,
      h: 44,
      label: "← 뒤로",
      primary: true,
    }),
  );
}

function formatNum(n) {
  if (!isFinite(n)) return "0";
  return Math.round(n).toLocaleString("ko-KR");
}

export { formatNum };
