import {
  CANVAS,
  COLORS,
  ECONOMY,
  DIFFICULTY,
  TOWERS,
  HEROES,
  ENEMIES,
  TIPS,
  INVOICE,
  CREDITS,
  TOOLS,
} from "./config.js";
import { LEVELS } from "./levels.js";
import { Path } from "./path.js";
import {
  Enemy,
  Tower,
  Projectile,
  Particle,
  Hazard,
} from "./entities.js";
import { WaveManager } from "./waves.js";
import {
  drawTileBackground,
  drawPath,
  drawToiletEntry,
  drawSinkEntry,
  drawJunctionEntry,
  drawSewerExit,
  drawSlot,
  drawEnemy,
  drawTower,
  drawPlumber,
  drawProjectile,
  drawParticle,
  drawSign,
  drawRangeIndicator,
  drawGhostTower,
  drawHazard,
} from "./sprites.js";
import {
  PLUMBER_LINES,
  BOSS_REVEAL_LINES,
  COMBO_LINES,
  ENEMY_DEATH_LINES,
  NEAR_LOSS_LINES,
  pick,
} from "./humor.js";
import {
  UI,
  drawMainMenu,
  drawLevelSelect,
  drawHeroSelect,
  drawDifficultySelect,
  drawHud,
  drawBuildMenu,
  drawTowerMenu,
  drawCheatBuffer,
  drawFlashes,
  drawToasts,
  drawPause,
  drawGameOver,
  drawVictory,
  drawTutorial,
  drawCredits,
  drawBestiary,
  drawHelpOverlay,
  drawSpawnWarning,
  drawSettingsOverlay,
} from "./ui.js";
import { Input } from "./input.js";
import { sfx, unlockAudio, setAudioEnabled, setMasterVolume } from "./audio.js";
import {
  loadProgress,
  saveLevelScore,
  setSetting,
  recordRunStats,
  unlockAchievement,
  saveLastConfig,
  ACHIEVEMENTS,
} from "./storage.js";

const PLAY_AREA_W = 1040;
const PLAY_AREA_H = 720;

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.input = new Input(canvas);
    this.ui = new UI();
    this.scene = "menu";
    this.time = 0;
    this.lastFrame = performance.now();
    this.progress = loadProgress();
    const vol =
      typeof this.progress.settings.volume === "number"
        ? this.progress.settings.volume
        : 0.35;
    setMasterVolume(vol);
    setAudioEnabled(this.progress.settings.sfxOn !== false && vol > 0.001);
    this.transition = { from: null, to: null, t: 0 };

    this.selection = {
      levelId: null,
      heroId: null,
      difficultyId: null,
    };

    this.runState = null;
    this.helpOpen = false;
    this.settingsOpen = false;
    this._lastTowerKeyPress = { key: null, time: 0 };
    this._konamiBuffer = [];
    this._konamiSeq = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "b", "a",
    ];

    this.input.onClick = (x, y, button) => this._onClick(x, y, button);
    this.input.onKey = (e) => this._onKey(e);

    this._onBlur = () => {
      if (this.scene === "playing" && this.runState && !this.runState.paused) {
        this.runState.paused = true;
        this.runState.autoPausedByBlur = true;
      }
    };
    window.addEventListener("blur", this._onBlur);

    this._loop = this._loop.bind(this);
    requestAnimationFrame(this._loop);
  }

  _onClick(x, y, button) {
    unlockAudio();
    if (this.settingsOpen && this.ui.hovered === "cb_toggle") {
      const cur = !!this.progress.settings.colorblind;
      this.progress = setSetting("colorblind", !cur);
      sfx.uiClick();
      this.ui.toast(`♿ 색맹 모드 ${!cur ? "ON" : "OFF"}`, {
        color: "#5acf80",
        duration: 1.2,
      });
      return;
    }
    if (this.scene === "playing" && this.runState && !this.runState.paused) {
      const handled = this._handlePlayingUiClick();
      if (!handled) this._handlePlayingWorldClick(x, y, button);
      return;
    }
    if (this.scene === "playing" && this.runState?.paused) {
      this._handlePauseClick();
      return;
    }
    if (this.scene === "menu") return this._handleMenuClick();
    if (this.scene === "bestiary") return this._handleBestiaryClick();
    if (this.scene === "levelSelect") return this._handleLevelSelectClick();
    if (this.scene === "heroSelect") return this._handleHeroSelectClick();
    if (this.scene === "difficultySelect")
      return this._handleDifficultySelectClick();
    if (this.scene === "tutorial") return this._handleTutorialClick();
    if (this.scene === "credits") return this._handleCreditsClick();
    if (this.scene === "gameOver") return this._handleGameOverClick();
    if (this.scene === "victory") return this._handleVictoryClick();
  }

  _onKey(e) {
    if (e.key === "Escape") {
      if (this.scene === "playing" && this.runState?.openMenu) {
        this.runState.openMenu = null;
        sfx.uiBack();
      } else if (this.scene === "tutorial" || this.scene === "credits" || this.scene === "bestiary") {
        this.scene = "menu";
        sfx.uiBack();
      } else if (this.scene === "levelSelect") {
        this.scene = "menu";
        sfx.uiBack();
      } else if (this.scene === "heroSelect") {
        this.scene = "levelSelect";
        sfx.uiBack();
      } else if (this.scene === "difficultySelect") {
        this.scene = "heroSelect";
        sfx.uiBack();
      } else if (this.scene === "playing" && this.runState?.buildMode) {
        this.runState.buildMode = null;
        sfx.uiBack();
      }
    }
    if (this.scene === "playing" && this.runState) {
      const rs = this.runState;
      if (e.key === " ") {
        rs.paused = !rs.paused;
        sfx.uiClick();
        e.preventDefault?.();
      }
      const towerKeys = { "1": "plunger", "2": "suction", "3": "chemical", "4": "barracks" };
      if (towerKeys[e.key]) {
        const type = towerKeys[e.key];
        const now = rs.time;
        const recent =
          this._lastTowerKeyPress.key === e.key &&
          now - this._lastTowerKeyPress.time < 0.6;
        this._lastTowerKeyPress = { key: e.key, time: now };
        const sameTypeTowers = rs.towers.filter((t) => t.type === type);
        if (recent && sameTypeTowers.length > 0) {
          const curIdx = rs._cycleIdx?.[type] ?? -1;
          const nextIdx = (curIdx + 1) % sameTypeTowers.length;
          rs._cycleIdx = { ...(rs._cycleIdx || {}), [type]: nextIdx };
          rs.buildMode = null;
          rs.openMenu = { type: "tower", tower: sameTypeTowers[nextIdx] };
          this.ui.toast(
            `🎯 ${type} ${nextIdx + 1}/${sameTypeTowers.length}`,
            { color: "#4ea1ff", duration: 1.0 },
          );
        } else {
          rs.buildMode = rs.buildMode === type ? null : type;
          rs.openMenu = null;
        }
        sfx.uiClick();
      }
      if (e.key === "+" || e.key === "=") { rs.speed = Math.min(3, rs.speed + 1); rs.speedFlash = 1; }
      if (e.key === "-" || e.key === "_") { rs.speed = Math.max(1, rs.speed - 1); rs.speedFlash = 1; }
      if (e.key.toLowerCase() === "q") this._tryActivateHero();
      if (e.key.toLowerCase() === "t" && rs.openMenu?.type === "tower") {
        const mode = rs.openMenu.tower.cycleTargetMode();
        rs._defaultTargetMode = mode;
        this.ui.toast(`타겟 모드: ${mode} (이후 신규 타워 기본값)`, { color: "#4ea1ff", duration: 1.6 });
        sfx.uiClick();
      }
      if (e.key.toLowerCase() === "m") {
        this._toggleMute();
      }
      if (e.key.toLowerCase() === "u") {
        if (this._undoLastSell()) sfx.uiClick();
      }
      if (e.key.toLowerCase() === "e") this._selectTool("rapidFlush");
      if (e.key.toLowerCase() === "r") this._selectTool("barricade");
      if (e.key.toLowerCase() === "f") this._selectTool("kimDispatch");
    }
    const keyVal = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (keyVal.startsWith("Arrow") || keyVal === "b" || keyVal === "a") {
      this._konamiBuffer.push(keyVal);
      if (this._konamiBuffer.length > this._konamiSeq.length) {
        this._konamiBuffer.shift();
      }
      const match =
        this._konamiBuffer.length === this._konamiSeq.length &&
        this._konamiBuffer.every((k, i) => k === this._konamiSeq[i]);
      if (match) {
        this._konamiBuffer = [];
        this._handleKonami();
      }
    } else if (keyVal !== " ") {
      this._konamiBuffer = [];
    }
    if (e.key.toLowerCase() === "h" || e.key === "?" || e.key === "/") {
      this.helpOpen = !this.helpOpen;
      this.settingsOpen = false;
      sfx.uiClick();
    } else if (e.key.toLowerCase() === "o") {
      this.settingsOpen = !this.settingsOpen;
      this.helpOpen = false;
      sfx.uiClick();
    } else if (e.key === "Escape") {
      if (this.helpOpen) {
        this.helpOpen = false;
        sfx.uiBack();
      } else if (this.settingsOpen) {
        this.settingsOpen = false;
        sfx.uiBack();
      }
    }
    if (this.input.keyBuffer.endsWith("150")) {
      this._handleCheat150();
      this.input.clearBuffer();
    } else if (this.input.keyBuffer.toLowerCase().endsWith("demoday")) {
      this._handleCheatDemoday();
      this.input.clearBuffer();
    } else if (this.input.keyBuffer.toLowerCase().endsWith("kim")) {
      this._handleCheatKim();
      this.input.clearBuffer();
    } else if (this.input.keyBuffer.toLowerCase().endsWith("tossme")) {
      this._handleCheatTossme();
      this.input.clearBuffer();
    } else if (this.input.keyBuffer.toLowerCase().endsWith("wifi")) {
      this._handleCheatWifi();
      this.input.clearBuffer();
    }
  }

  _handleMenuClick() {
    const h = this.ui.hovered;
    if (h === "menu_start") {
      this.scene = "levelSelect";
      sfx.uiClick();
    } else if (h === "menu_tutorial") {
      this.scene = "tutorial";
      sfx.uiClick();
    } else if (h === "menu_credits") {
      this.scene = "credits";
      sfx.uiClick();
    } else if (h === "menu_bestiary") {
      this.scene = "bestiary";
      sfx.uiClick();
    } else if (h === "menu_replay_last") {
      const last = this.progress.lastConfig;
      if (last && last.levelId && last.heroId && last.difficultyId) {
        this.selection.levelId = last.levelId;
        this.selection.heroId = last.heroId;
        this.selection.difficultyId = last.difficultyId;
        this._startRun();
        this.scene = "playing";
        sfx.uiClick();
        this.ui.toast(`🔁 마지막 출장 재도전: ${last.levelId} / ${last.heroId} / ${last.difficultyId}`, {
          color: "#5acf80",
          duration: 2.4,
        });
      }
    }
  }

  _handleBestiaryClick() {
    if (this.ui.hovered === "bestiary_back") {
      this.scene = "menu";
      sfx.uiBack();
    }
  }

  _handleLevelSelectClick() {
    const h = this.ui.hovered;
    if (!h) return;
    if (h === "level_back") {
      this.scene = "menu";
      sfx.uiBack();
      return;
    }
    if (h.startsWith("level_")) {
      const id = h.slice("level_".length);
      this.selection.levelId = id;
      this.scene = "heroSelect";
      sfx.uiClick();
    }
  }

  _handleHeroSelectClick() {
    const h = this.ui.hovered;
    if (!h) return;
    if (h === "hero_back") {
      this.scene = "levelSelect";
      sfx.uiBack();
      return;
    }
    if (h.startsWith("hero_")) {
      const id = h.slice("hero_".length);
      this.selection.heroId = id;
      this.scene = "difficultySelect";
      sfx.uiClick();
    }
  }

  _handleDifficultySelectClick() {
    const h = this.ui.hovered;
    if (!h) return;
    if (h === "diff_back") {
      this.scene = "heroSelect";
      sfx.uiBack();
      return;
    }
    if (h.startsWith("diff_")) {
      const id = h.slice("diff_".length);
      this.selection.difficultyId = id;
      this._startRun();
      sfx.uiClick();
    }
  }

  _handleTutorialClick() {
    if (this.ui.hovered === "tut_back") {
      this.scene = "menu";
      sfx.uiBack();
    }
  }

  _handleCreditsClick() {
    if (this.ui.hovered === "credits_back") {
      this.scene = "menu";
      sfx.uiBack();
    }
  }

  _handleGameOverClick() {
    const h = this.ui.hovered;
    if (h === "retry") {
      this._startRun();
      sfx.uiClick();
    } else if (h === "menu") {
      this.scene = "menu";
      this.runState = null;
      sfx.uiBack();
    }
  }

  _handleVictoryClick() {
    const h = this.ui.hovered;
    if (h === "v_next" && this.runState.nextLevelId) {
      this.selection.levelId = this.runState.nextLevelId;
      this._startRun();
      sfx.uiClick();
    } else if (h === "v_menu") {
      this.scene = "menu";
      this.runState = null;
      sfx.uiBack();
    }
  }

  _handlePauseClick() {
    const h = this.ui.hovered;
    if (h === "resume") {
      this.runState.paused = false;
      sfx.uiClick();
    } else if (h === "pause_quit") {
      this.scene = "menu";
      this.runState = null;
      sfx.uiBack();
    }
  }

  _handlePlayingUiClick() {
    const h = this.ui.hovered;
    if (!h) return false;
    const rs = this.runState;
    if (h === "wave_start") {
      if (rs.waveManager.waitingAutoStart) {
        const early = rs.waveManager.preTimer;
        rs.waveManager.preTimer = 0;
        const bonus = Math.floor(early * 50);
        if (bonus > 0) {
          rs.money += bonus;
          this.ui.toast(`조기 시작 보너스 +₩${bonus}`, { color: "#f6d96a" });
        }
        sfx.uiClick();
      }
      return true;
    }
    if (h === "pause") {
      rs.paused = !rs.paused;
      sfx.uiClick();
      return true;
    }
    if (h === "quit") {
      this.scene = "menu";
      this.runState = null;
      sfx.uiBack();
      return true;
    }
    if (h === "speed_1") { rs.speed = 1; rs.speedFlash = 1; sfx.uiClick(); return true; }
    if (h === "speed_2") { rs.speed = 2; rs.speedFlash = 1; sfx.uiClick(); return true; }
    if (h === "speed_3") { rs.speed = 3; rs.speedFlash = 1; sfx.uiClick(); return true; }
    if (h === "mute_toggle") {
      this._cycleVolume();
      return true;
    }
    if (h && h.startsWith("tool_")) {
      const toolId = h.slice("tool_".length);
      this._selectTool(toolId);
      return true;
    }
    if (h === "hero_active") {
      this._tryActivateHero();
      return true;
    }
    if (h && h.startsWith("build_")) {
      const towerType = h.slice("build_".length);
      this._buildTower(towerType);
      return true;
    }
    if (h && h.startsWith("palette_")) {
      const towerType = h.slice("palette_".length);
      rs.buildMode = rs.buildMode === towerType ? null : towerType;
      rs.openMenu = null;
      sfx.uiClick();
      return true;
    }
    if (h && h.startsWith("upg_")) {
      const i = parseInt(h.slice("upg_".length));
      this._upgradeTower(i);
      return true;
    }
    if (h === "sell") {
      this._sellTower();
      return true;
    }
    return false;
  }

  _handlePlayingWorldClick(x, y, button) {
    const rs = this.runState;
    if (x > CANVAS.width - 240) return;
    if (button === 2) {
      rs.buildMode = null;
      rs.openMenu = null;
      rs.activeTool = null;
      sfx.uiBack();
      return;
    }
    if (rs.activeTool) {
      this._activateTool(x, y);
      return;
    }
    if (rs.buildMode) {
      for (const slot of rs.level.slots) {
        if (rs.towers.some((t) => t.x === slot.x && t.y === slot.y)) continue;
        const d = Math.hypot(x - slot.x, y - slot.y);
        if (d < 26) {
          rs.openMenu = { type: "build", slot };
          this._buildTower(rs.buildMode);
          return;
        }
      }
      rs.buildMode = null;
      return;
    }
    if (rs.openMenu) {
      const m = rs.openMenu;
      const inMenu = this._isInMenu(x, y, m);
      if (!inMenu) {
        rs.openMenu = null;
      }
      return;
    }
    for (const t of rs.towers) {
      const d = Math.hypot(x - t.x, y - t.y);
      if (d < 22) {
        rs.openMenu = { type: "tower", tower: t };
        sfx.uiClick();
        return;
      }
    }
    for (const slot of rs.level.slots) {
      if (rs.towers.some((t) => t.x === slot.x && t.y === slot.y)) continue;
      const d = Math.hypot(x - slot.x, y - slot.y);
      if (d < 22) {
        rs.openMenu = { type: "build", slot };
        sfx.uiClick();
        return;
      }
    }
  }

  _isInMenu(x, y, m) {
    const buttons = this.ui.buttons.filter((b) =>
      m.type === "build" ? b.id?.startsWith("build_") : (b.id?.startsWith("upg_") || b.id === "sell"),
    );
    for (const b of buttons) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true;
    }
    return false;
  }

  _buildTower(towerType) {
    const rs = this.runState;
    if (!rs.openMenu || rs.openMenu.type !== "build") return;
    const def = TOWERS[towerType];
    const cost = Math.round(def.base.cost * (rs.hero.id === "jeffrey" ? 0.95 : 1));
    if (rs.money < cost) {
      this.ui.toast("자금 부족", { color: "#e9534b" });
      return;
    }
    rs.money -= cost;
    const tower = new Tower({
      type: towerType,
      x: rs.openMenu.slot.x,
      y: rs.openMenu.slot.y,
    });
    tower.totalSpent = cost;
    if (rs._defaultTargetMode) {
      tower.targetMode = rs._defaultTargetMode;
    }
    rs.towers.push(tower);
    rs.spawnParticle({
      kind: "bubble",
      x: tower.x,
      y: tower.y - 28,
      text: pick(PLUMBER_LINES),
      life: 2.6,
      maxLife: 2.6,
      vy: -8,
    });
    rs.addShake(2, 0.18);
    rs.openMenu = null;
    sfx.place();
  }

  _upgradeTower(i) {
    const rs = this.runState;
    if (!rs.openMenu || rs.openMenu.type !== "tower") return;
    const tower = rs.openMenu.tower;
    const opts = tower.getUpgradeOptions();
    const opt = opts[i];
    if (!opt) return;
    let cost = opt.cost;
    if (rs.hero.id === "jeffrey") cost = Math.round(cost * 0.95);
    if (rs.money < cost) {
      this.ui.toast("자금 부족", { color: "#e9534b" });
      return;
    }
    rs.money -= cost;
    tower.applyUpgrade({ ...opt, cost });
    sfx.upgrade();
  }

  _sellTower() {
    const rs = this.runState;
    if (!rs.openMenu || rs.openMenu.type !== "tower") return;
    const tower = rs.openMenu.tower;
    if (tower.totalSpent >= 30000) {
      const now = rs.time;
      const lastConfirm = rs._sellConfirmTower === tower ? rs._sellConfirmAt : 0;
      if (now - lastConfirm > 1.5) {
        rs._sellConfirmTower = tower;
        rs._sellConfirmAt = now;
        this.ui.toast(
          `⚠ 고가 타워 (₩${tower.totalSpent.toLocaleString("ko-KR")} 투자) — 1.5초 내 다시 클릭`,
          { color: "#ff8a3a", duration: 1.6 },
        );
        sfx.uiBack();
        return;
      }
    }
    rs._sellConfirmTower = null;
    rs._sellConfirmAt = 0;
    const refund = tower.getSellValue();
    rs.money += refund;
    rs.lastSold = {
      type: tower.type,
      x: tower.x,
      y: tower.y,
      level: tower.level,
      branch: tower.branch,
      totalSpent: tower.totalSpent,
      kills: tower.kills,
      targetMode: tower.targetMode,
      refund,
      soldAt: rs.time,
    };
    rs.towers = rs.towers.filter((t) => t !== tower);
    rs.plumbers = rs.plumbers.filter((p) => p.owner !== tower);
    rs.openMenu = null;
    sfx.sell();
    this.ui.toast(`매각 +₩${refund.toLocaleString("ko-KR")} · U=취소`, {
      color: "#f6d96a",
      duration: 4.5,
    });
  }

  _tryActivateHero() {
    const rs = this.runState;
    if (!rs || rs.heroCooldown > 0) return;
    const hero = rs.hero;
    if (rs.money < hero.abilityCost) {
      this.ui.toast("자금 부족", { color: "#e9534b" });
      return;
    }
    rs.money -= hero.abilityCost;
    rs.heroCooldown = hero.abilityCooldown;
    rs.heroAbilityFlash = 1;
    sfx.hero();
    if (hero.id === "cheolsable") {
      let killed = 0;
      for (const e of rs.enemies) {
        if (e.alive) {
          killed++;
          rs.spawnParticle({
            kind: "ring",
            x: e.x,
            y: e.y,
            color: "rgba(246,217,106,0.8)",
            size: 12,
            life: 0.4,
            maxLife: 0.4,
          });
          e.takeDamage(
            e.maxHp * 999,
            { source: "hero", bypassImmunity: true, unevadable: true },
            rs,
          );
        }
      }
      const boss = rs.enemies.find((e) => e.alive && e.type === "boss");
      if (boss) {
        const bossDmg = boss.maxHp * 0.3;
        boss.takeDamage(
          bossDmg,
          { source: "hero", bypassImmunity: true, unevadable: true },
          rs,
        );
      }
      this.ui.flash(`💸 청구서 결제! ${killed}마리 일소${boss ? " · 보스 -30% HP" : ""}`, {
        color: "#f6d96a",
        duration: 2.5,
        size: 28,
      });
      rs.addShake(12, 0.8);
      for (let i = 0; i < 30; i++) {
        rs.spawnParticle({
          kind: "splat",
          x: Math.random() * (CANVAS.width - 240),
          y: -20,
          color: i % 2 ? "#fbf6e7" : "#f6d96a",
          size: 4 + Math.random() * 4,
          life: 1.4 + Math.random() * 0.6,
          maxLife: 2,
          vx: (Math.random() - 0.5) * 40,
          vy: 80 + Math.random() * 100,
        });
      }
      rs.spawnParticle({
        kind: "text",
        x: (CANVAS.width - 240) / 2,
        y: CANVAS.height / 2,
        text: "₩300,000 결제됨",
        size: 32,
        color: "#f6d96a",
        life: 1.5,
        maxLife: 1.5,
        vy: -30,
      });
    } else if (hero.id === "jeffrey") {
      for (const e of rs.enemies) {
        if (e.alive) {
          e.effects.confuse = 4;
          e.confuseDir = Math.random() < 0.5 ? -0.6 : 0.6;
        }
      }
      this.ui.flash("📋 규칙 안내문! 적 혼란 4초", {
        color: "#6fb8ff",
        duration: 2.5,
        size: 26,
      });
      for (let i = 0; i < 12; i++) {
        rs.spawnParticle({
          kind: "splat",
          x: Math.random() * (CANVAS.width - 240),
          y: -10,
          color: "#fffae0",
          size: 8 + Math.random() * 4,
          life: 2,
          maxLife: 2,
          vx: (Math.random() - 0.5) * 60,
          vy: 50 + Math.random() * 50,
        });
      }
    } else if (hero.id === "seongjin") {
      for (const e of rs.enemies) {
        if (e.alive) {
          e.immunityType = null;
          e.discoveredByDiagnostic = true;
          e.effects.poison = Math.max(e.effects.poison, 6);
          e.effects.poisonDps = Math.max(e.effects.poisonDps, 30);
          rs.spawnParticle({
            kind: "ring",
            x: e.x,
            y: e.y,
            color: "rgba(168,224,125,0.95)",
            size: 8,
            life: 0.7,
            maxLife: 0.7,
          });
        }
      }
      rs.scanBuffTimer = 6;
      this.ui.flash("🩺 진단 스캔! 모든 타워 +50% DMG · 면역 무효 6초", {
        color: "#a8e07d",
        duration: 2.8,
        size: 26,
      });
      rs.addShake(4, 0.3);
    }
  }

  _cycleVolume() {
    const cur = this.progress.settings.volume ?? 0.35;
    const levels = [0, 0.15, 0.35, 0.6, 0.85];
    let idx = levels.findIndex((v) => Math.abs(v - cur) < 0.04);
    if (idx === -1) idx = 2;
    const next = levels[(idx + 1) % levels.length];
    this._setVolume(next);
    this.ui.toast(
      next === 0
        ? "🔇 사운드 OFF"
        : `🔊 볼륨 ${Math.round(next * 100)}%`,
      {
        color: next === 0 ? "#a9b3c7" : "#5acf80",
        duration: 1.2,
      },
    );
    if (next > 0) sfx.uiClick();
  }

  _unlock(id) {
    const res = unlockAchievement(id);
    this.progress = res.data;
    if (res.newlyUnlocked && res.def) {
      this.ui.toast(`🏅 업적 해금: ${res.def.icon} ${res.def.name}`, {
        color: "#ffea66",
        duration: 3.4,
      });
      if (typeof sfx.milestone === "function") sfx.milestone();
    }
  }

  _setVolume(v) {
    const clamped = Math.max(0, Math.min(1, v));
    this.progress = setSetting("volume", clamped);
    setMasterVolume(clamped);
    setAudioEnabled(clamped > 0.001);
  }

  _selectTool(toolId) {
    const rs = this.runState;
    if (!rs) return;
    const tool = TOOLS[toolId];
    if (!tool) return;
    if (rs.tools[toolId].cooldown > 0) {
      this.ui.toast(`${tool.icon} 쿨다운 ${rs.tools[toolId].cooldown.toFixed(1)}s`, {
        color: "#a9b3c7",
        duration: 1.0,
      });
      return;
    }
    if (rs.money < tool.cost) {
      this.ui.toast(`${tool.icon} 자금 부족 (₩${tool.cost.toLocaleString("ko-KR")} 필요)`, {
        color: "#e9534b",
        duration: 1.2,
      });
      return;
    }
    if (toolId === "kimDispatch") {
      this._activateKimDispatch();
      return;
    }
    rs.activeTool = rs.activeTool === toolId ? null : toolId;
    rs.buildMode = null;
    rs.openMenu = null;
    this.ui.toast(`${tool.icon} ${tool.name} — 경로 클릭`, {
      color: tool.color,
      duration: 1.6,
    });
    sfx.uiClick();
  }

  _activateTool(x, y) {
    const rs = this.runState;
    if (!rs.activeTool) return false;
    const toolId = rs.activeTool;
    const tool = TOOLS[toolId];
    if (rs.tools[toolId].cooldown > 0 || rs.money < tool.cost) {
      rs.activeTool = null;
      return false;
    }
    rs.money -= tool.cost;
    rs.tools[toolId].cooldown = tool.cooldownSec;
    if (toolId === "rapidFlush") {
      let hits = 0;
      for (const e of rs.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - x, e.y - y);
        if (d <= tool.radius) {
          hits++;
          e.takeDamage(tool.damage, { source: "tool", pushback: tool.pushback, unevadable: true }, rs);
        }
      }
      rs.spawnParticle({
        kind: "ring",
        x, y,
        color: "rgba(111,184,255,0.85)",
        size: tool.radius,
        life: 0.5,
        maxLife: 0.5,
      });
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        rs.spawnParticle({
          kind: "spark",
          x, y,
          color: "#a8c8ff",
          life: 0.4,
          maxLife: 0.4,
          vx: Math.cos(a) * 140,
          vy: Math.sin(a) * 140,
        });
      }
      this.ui.toast(`🚿 응급 분사 — ${hits}개 적 밀어냄`, { color: "#6fb8ff", duration: 1.5 });
      sfx.suction();
    } else if (toolId === "barricade") {
      rs.barricades.push({
        x, y,
        radius: tool.radius,
        timeLeft: tool.durationSec,
        maxTime: tool.durationSec,
      });
      rs.spawnParticle({
        kind: "ring",
        x, y,
        color: "rgba(246,217,106,0.85)",
        size: tool.radius,
        life: 0.45,
        maxLife: 0.45,
      });
      this.ui.toast(`🛑 임시 차단막 ${tool.durationSec}초간 활성`, { color: "#f6d96a", duration: 1.6 });
      sfx.place();
    }
    rs.activeTool = null;
    rs.addShake?.(4, 0.25);
    return true;
  }

  _activateKimDispatch() {
    const rs = this.runState;
    const tool = TOOLS.kimDispatch;
    rs.money -= tool.cost;
    rs.tools.kimDispatch.cooldown = tool.cooldownSec;
    const boss = rs.enemies.find((e) => e.alive && e.type === "boss");
    let primaryTarget = boss;
    if (!primaryTarget) {
      let best = null, bestHp = 0;
      for (const e of rs.enemies) {
        if (e.alive && e.hp > bestHp) { bestHp = e.hp; best = e; }
      }
      primaryTarget = best;
    }
    if (primaryTarget) {
      primaryTarget.takeDamage(tool.damage, { source: "kim", bypassImmunity: true, unevadable: true }, rs);
      rs.spawnParticle({
        kind: "ring",
        x: primaryTarget.x,
        y: primaryTarget.y,
        color: "rgba(233,83,75,0.95)",
        size: 40,
        life: 0.7,
        maxLife: 0.7,
      });
      rs.spawnParticle({
        kind: "text",
        x: primaryTarget.x,
        y: primaryTarget.y - primaryTarget.def.radius - 24,
        text: `김반장 −${tool.damage}`,
        size: 18,
        color: "#ff6a3a",
        life: 1.2,
        maxLife: 1.2,
        vy: -50,
      });
    }
    for (const e of rs.enemies) {
      if (e.alive) e.effects.stun = Math.max(e.effects.stun, tool.stunSec);
    }
    rs.addShake?.(12, 0.6);
    this.ui.flash(`📞 김반장 출장! 보스 −${tool.damage} · 전체 ${tool.stunSec}초 스턴`, {
      color: "#ff6a3a",
      duration: 2.6,
      size: 22,
    });
    sfx.cheat();
  }

  _toggleMute() {
    const cur = this.progress.settings.sfxOn !== false;
    const next = !cur;
    setAudioEnabled(next);
    this.progress = setSetting("sfxOn", next);
    this.ui.toast(next ? "🔊 사운드 ON" : "🔇 사운드 OFF", {
      color: next ? "#5acf80" : "#a9b3c7",
      duration: 1.2,
    });
    if (next) sfx.uiClick();
  }

  _undoLastSell() {
    const rs = this.runState;
    if (!rs || !rs.lastSold) return false;
    const ls = rs.lastSold;
    if (rs.time - ls.soldAt > 5) {
      rs.lastSold = null;
      return false;
    }
    if (rs.money < ls.refund) {
      this.ui.toast("자금 부족 — 환불 회수 불가", {
        color: "#e9534b",
        duration: 1.6,
      });
      return false;
    }
    rs.money -= ls.refund;
    const tower = new Tower({ type: ls.type, x: ls.x, y: ls.y });
    tower.level = ls.level;
    tower.branch = ls.branch;
    tower.totalSpent = ls.totalSpent;
    tower.kills = ls.kills;
    tower.targetMode = ls.targetMode;
    rs.towers.push(tower);
    rs.lastSold = null;
    this.ui.toast("↩ 판매 취소 (5초 윈도우)", { color: "#5acf80", duration: 1.4 });
    return true;
  }

  _handleCheat150() {
    if (this.scene !== "playing" || !this.runState) return;
    this._unlock("cheat_master");
    const rs = this.runState;
    rs.money += 1500000;
    this.ui.flash("💸 ₩1,500,000 — 청구서 도착!", {
      color: "#f6d96a",
      duration: 3,
      size: 26,
    });
    sfx.cheat();
    rs.spawnEnemy({ type: "boss", pathIndex: 0 });
  }

  _handleCheatDemoday() {
    if (this.scene !== "playing" || !this.runState) return;
    this._unlock("cheat_master");
    const rs = this.runState;
    rs.lives = Math.min(rs.maxLives + 5, rs.lives + 5);
    rs.money += 500000;
    this.ui.flash("🎤 데모데이 모드 — 5층 임시 보강", {
      color: "#5acf80",
      duration: 3,
      size: 22,
    });
    sfx.cheat();
  }

  _handleCheatKim() {
    if (this.scene !== "playing" || !this.runState) return;
    this._unlock("cheat_master");
    const rs = this.runState;
    for (let i = 0; i < 5; i++) {
      rs.spawnEnemy({ type: "kitchen", pathIndex: i % rs.paths.length });
    }
    this.ui.flash("🟨 김반장 — 키친타월 5개 직접 투기", {
      color: "#e9534b",
      duration: 3,
      size: 22,
    });
    sfx.cheat();
  }

  _handleCheatTossme() {
    if (this.scene !== "playing" || !this.runState) return;
    this._unlock("cheat_master");
    const rs = this.runState;
    rs.scanBuffTimer = Math.max(rs.scanBuffTimer || 0, 10);
    rs.money += 100000;
    this.ui.flash("💳 토스 송금 완료 — 10초 모든 타워 +50% DMG", {
      color: "#4ea1ff",
      duration: 3,
      size: 22,
    });
    sfx.cheat();
  }

  _handleKonami() {
    this._unlock("cheat_master");
    if (this.runState) {
      const rs = this.runState;
      rs.money += 999999;
      rs.lives = Math.max(rs.lives, rs.maxLives + 10);
      rs.scanBuffTimer = Math.max(rs.scanBuffTimer || 0, 30);
      this.ui.flash("🎮 KONAMI: ₩999,999 + 30초 무적 + 10 라이프", {
        color: "#a8e07d",
        duration: 4,
        size: 24,
      });
      sfx.cheat();
      sfx.milestone();
      rs.addShake?.(14, 1.0);
    } else {
      this.ui.toast("🎮 KONAMI 인식 — 게임 중에 사용하세요", {
        color: "#a8e07d",
        duration: 3,
      });
    }
  }

  _handleCheatWifi() {
    if (!this.runState) {
      this.ui?.flash?.("📶 5F WiFi: tuesday2024_demoday (게임중에 시도하세요)", {
        color: "#a8e07d",
        duration: 4,
        size: 16,
      });
      return;
    }
    this._unlock("cheat_master");
    const rs = this.runState;
    rs.enemies.forEach((e) => {
      if (e.alive) e.discoveredByDiagnostic = true;
    });
    this.ui.flash("📶 5F WiFi 연결 — 모든 적 진단 정보 노출", {
      color: "#a8e07d",
      duration: 3,
      size: 22,
    });
    sfx.cheat();
  }

  _startRun() {
    const levelDef = LEVELS.find((l) => l.id === this.selection.levelId);
    const heroDef = HEROES[this.selection.heroId];
    const diff = DIFFICULTY[this.selection.difficultyId];
    if (!levelDef || !heroDef || !diff) return;
    this.progress = saveLastConfig(this.selection);
    const paths = levelDef.paths.map((pts) => new Path(pts));
    const startingMoney = Math.round(
      (levelDef.startingMoney || ECONOMY.startingMoney) *
        (heroDef.id === "cheolsable" ? 1.3 : 1) *
        diff.moneyMul,
    );
    const maxLives = Math.max(1, ECONOMY.startingLives + diff.livesBonus);
    const waveManager = new WaveManager(levelDef, diff);
    const nextLevelIndex = LEVELS.findIndex((l) => l.id === levelDef.id) + 1;
    const nextLevelId =
      nextLevelIndex < LEVELS.length ? LEVELS[nextLevelIndex].id : null;
    const ui = this.ui;
    const game = this;
    this.runState = {
      level: levelDef,
      hero: heroDef,
      difficulty: diff,
      paths,
      waveManager,
      money: startingMoney,
      startMoney: startingMoney,
      lives: maxLives,
      maxLives,
      enemies: [],
      towers: [],
      projectiles: [],
      particles: [],
      plumbers: [],
      hazards: [],
      time: 0,
      speed: 1,
      paused: false,
      openMenu: null,
      heroCooldown: 0,
      bossKilled: false,
      stars: 0,
      nextLevelId,
      ended: false,
      totalKills: 0,
      totalEarned: 0,
      totalEscaped: 0,
      enemyDiscovered: new Set(),
      buildMode: null,
      screenShake: 0,
      screenShakeMag: 0,
      comboCount: 0,
      comboTimer: 0,
      lastKillTime: 0,
      peakCombo: 0,
      gameStartTime: performance.now(),
      speedFlash: 0,
      scanBuffTimer: 0,
      tools: {
        rapidFlush: { cooldown: 0 },
        barricade: { cooldown: 0 },
        kimDispatch: { cooldown: 0 },
      },
      activeTool: null,
      barricades: [],
      flash(text, color) { ui.flash(text, { color: color || "#f6d96a", duration: 2.4, size: 18 }); },

      addShake(mag, dur = 0.3) {
        this.screenShakeMag = Math.max(this.screenShakeMag, mag);
        this.screenShake = Math.max(this.screenShake, dur);
      },
      _towerMilestone(tower, kills) {
        const tiers = { 10: "🥉 Bronze", 30: "🥈 Silver", 100: "🥇 Gold", 200: "💎 Diamond", 500: "👑 Legend" };
        ui.toast(`${tiers[kills] || "★"} ${tower.def.name} · ${kills}킬 달성!`, {
          color: kills >= 200 ? "#bff0ff" : kills >= 100 ? "#ffea66" : kills >= 30 ? "#d8d8e0" : "#d99a55",
          duration: 2.6,
        });
        this.spawnParticle({
          kind: "ring",
          x: tower.x,
          y: tower.y,
          color: kills >= 200 ? "rgba(191,240,255,0.85)" : "rgba(255,234,102,0.85)",
          size: 28 + kills / 20,
          life: 0.5,
          maxLife: 0.5,
        });
        if (typeof sfx.milestone === "function") sfx.milestone();
      },
      spawnDamageNumber(x, y, dmg, options) {
        if (dmg < 1) return;
        const isCrit = options?.bonusMul >= 3 || dmg > 80;
        this.spawnParticle({
          kind: "damage",
          x: x + (Math.random() - 0.5) * 12,
          y: y - 4,
          text: isCrit ? `${Math.round(dmg)}!` : `${Math.round(dmg)}`,
          size: isCrit ? 16 : 12,
          color: isCrit ? "#ffea66" : "#ff8a6a",
          life: 0.7,
          maxLife: 0.7,
          vy: -50,
          vx: (Math.random() - 0.5) * 30,
        });
        if (isCrit) this.addShake(3, 0.18);
      },
      playSfx(type) {
        if (type === "plunger") sfx.plunger();
        else if (type === "suction") sfx.suction();
        else if (type === "chemical") sfx.chemical();
      },
      spawnEnemy({ type, pathIndex }) {
        const path = this.paths[pathIndex] || this.paths[0];
        const e = new Enemy({
          type,
          path,
          pathIndex,
          hpMul: this.difficulty.hpMul,
          speedMul: this.difficulty.speedMul,
        });
        this.enemies.push(e);
        if (type === "boss") {
          sfx.boss();
          this.addShake(10, 1.4);
          ui.flash("⚠ 정체불명의 물질 강림", {
            color: "#ff3a3a",
            duration: 3.2,
            size: 30,
          });
          this.spawnParticle({
            kind: "bubble",
            x: e.x,
            y: e.y - 40,
            text: pick(BOSS_REVEAL_LINES),
            life: 3.5,
            maxLife: 3.5,
            vy: -4,
          });
        } else if (type === "kitchen") {
          this.addShake(4, 0.35);
        }
      },
      spawnProjectile(opts) {
        this.projectiles.push(new Projectile(opts));
      },
      spawnParticle(opts) {
        this.particles.push(new Particle(opts));
      },
      spawnPlumber(unit) {
        this.plumbers.push(unit);
      },
      spawnHazard(opts) {
        this.hazards.push(new Hazard(opts));
      },
      onEnemyKilled(enemy, opts) {
        this.totalKills++;
        this.waveKillsThisWave = (this.waveKillsThisWave || 0) + 1;
        this.waveEarnedThisWave = this.waveEarnedThisWave || 0;
        if (this.totalKills === 1) game._unlock("first_kill");
        const baseReward = Math.round(enemy.def.money * 1.1);
        let reward = Math.round(baseReward * this.difficulty.moneyMul);
        if (this.hero.id === "cheolsable") {
          reward = Math.round(reward * 1.05);
        }
        if (
          this.hero.id === "seongjin" &&
          !this.enemyDiscovered.has(enemy.type)
        ) {
          reward = Math.round(reward * 1.1);
          this.enemyDiscovered.add(enemy.type);
        }
        if (this.time - this.lastKillTime < 0.9) {
          this.comboCount++;
        } else {
          this.comboCount = 1;
        }
        this.lastKillTime = this.time;
        this.comboTimer = 1.5;
        if (this.comboCount > this.peakCombo) this.peakCombo = this.comboCount;
        let comboMul = 1;
        if (this.comboCount >= 8) comboMul = 1.5;
        else if (this.comboCount >= 5) comboMul = 1.25;
        else if (this.comboCount >= 3) comboMul = 1.1;
        const finalReward = Math.round(reward * comboMul);
        this.money += finalReward;
        this.totalEarned += finalReward;
        this.waveEarnedThisWave += finalReward;
        if (this.comboCount >= 10) game._unlock("combo_10");
        if (this.comboCount >= 3 && COMBO_LINES[this.comboCount]) {
          this.spawnParticle({
            kind: "text",
            x: enemy.x,
            y: enemy.y - 36,
            text: COMBO_LINES[this.comboCount] || `${this.comboCount}× COMBO!`,
            size: 14 + Math.min(8, this.comboCount),
            color: this.comboCount >= 5 ? "#ff6a3a" : "#f6d96a",
            life: 1.0,
            maxLife: 1.0,
            vy: -60,
          });
        }
        sfx.enemyDie();
        this.spawnParticle({
          kind: "money",
          x: enemy.x,
          y: enemy.y - 20,
          value: finalReward,
          size: comboMul > 1 ? 14 : 12,
          color: comboMul > 1.2 ? "#ff8a3a" : "#f6d96a",
          life: 0.9,
          maxLife: 0.9,
          vy: -28,
        });
        const burstCount = enemy.type === "kitchen"
          ? 16
          : enemy.type === "wetwipe"
            ? 12
            : enemy.type === "cap"
              ? 10
              : 8;
        const baseSpeed = enemy.type === "kitchen" || enemy.type === "wetwipe" ? 160 : 120;
        for (let i = 0; i < burstCount; i++) {
          const angle = (i / burstCount) * Math.PI * 2 + Math.random() * 0.5;
          const speed = baseSpeed * (0.4 + Math.random() * 0.9);
          this.spawnParticle({
            kind: "splat",
            x: enemy.x,
            y: enemy.y,
            color: i % 3 === 0 && enemy.def.accent
              ? enemy.def.accent
              : enemy.def.color,
            size: 1.8 + Math.random() * (enemy.type === "kitchen" ? 5 : 3.5),
            life: 0.45 + Math.random() * 0.35,
            maxLife: 0.8,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 20,
          });
        }
        const sparkCount = enemy.type === "kitchen" ? 6 : 3;
        for (let i = 0; i < sparkCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          this.spawnParticle({
            kind: "spark",
            x: enemy.x,
            y: enemy.y,
            color: enemy.type === "kitchen"
              ? "#ffea66"
              : enemy.type === "wetwipe"
                ? "#cfe5ff"
                : "#ffffff",
            life: 0.3 + Math.random() * 0.25,
            maxLife: 0.55,
            vx: Math.cos(angle) * (140 + Math.random() * 80),
            vy: Math.sin(angle) * (140 + Math.random() * 80) - 30,
          });
        }
        this.spawnParticle({
          kind: "ring",
          x: enemy.x,
          y: enemy.y,
          color: enemy.type === "kitchen"
            ? "rgba(255,180,80,0.85)"
            : enemy.type === "wetwipe"
              ? "rgba(160,210,255,0.8)"
              : "rgba(255,255,255,0.75)",
          size: enemy.def.radius + 4,
          life: 0.3,
          maxLife: 0.3,
        });
        const deathPool = ENEMY_DEATH_LINES[enemy.type];
        if (
          deathPool &&
          enemy.type !== "boss" &&
          enemy.type !== "micro" &&
          Math.random() < (enemy.type === "kitchen" ? 0.7 : 0.12)
        ) {
          this.spawnParticle({
            kind: "bubble",
            x: enemy.x,
            y: enemy.y - enemy.def.radius - 14,
            text: pick(deathPool),
            life: 1.2,
            maxLife: 1.2,
            vy: -18,
          });
        }
        if (enemy.def.flags?.split && !opts.cleanKill) {
          for (let i = 0; i < enemy.def.flags.split.count; i++) {
            const child = new Enemy({
              type: enemy.def.flags.split.childType,
              path: enemy.path,
              pathIndex: enemy.pathIndex,
              hpMul: this.difficulty.hpMul,
              speedMul: this.difficulty.speedMul,
              isSpawned: true,
            });
            child.dist = Math.max(0, enemy.dist - 4 - i * 4);
            this.enemies.push(child);
          }
        }
        if (enemy.type === "boss") {
          this.bossKilled = true;
          game._unlock("first_boss");
          this.addShake(16, 1.6);
          ui.flash("👹 정체불명의 물질 격파!", {
            color: "#5acf80",
            duration: 3,
            size: 30,
          });
          for (let i = 0; i < 24; i++) {
            this.spawnParticle({
              kind: "splat",
              x: enemy.x,
              y: enemy.y,
              color: i % 2 ? "#8b5a2b" : "#3a2818",
              size: 4 + Math.random() * 6,
              life: 0.7 + Math.random() * 0.5,
              maxLife: 1.2,
              vx: (Math.random() - 0.5) * 320,
              vy: (Math.random() - 0.5) * 320 - 60,
            });
          }
          this.spawnParticle({
            kind: "ring",
            x: enemy.x,
            y: enemy.y,
            color: "rgba(246,217,106,0.9)",
            size: 30,
            life: 0.6,
            maxLife: 0.6,
          });
        } else if (enemy.type === "kitchen") {
          this.addShake(5, 0.4);
        }
      },
      onEnemyEscaped(enemy) {
        this.lives -= 1;
        this.totalEscaped++;
        this.waveEscapedThisWave = (this.waveEscapedThisWave || 0) + 1;
        this.addShake(8, 0.5);
        sfx.enemyEscape();
        ui.flash(`💧 누수! 배관 무결성 -1 (잔여 ${Math.max(0, this.lives)})`, {
          color: "#e9534b",
          duration: 1.6,
          size: 18,
          y: 50,
        });
        if (this.lives === 1) {
          sfx.lowLivesAlarm();
          ui.flash(pick(NEAR_LOSS_LINES), {
            color: "#ff6a3a",
            duration: 2.4,
            size: 20,
            y: 88,
          });
        }
        if (this.lives <= 0) {
          this.lives = 0;
          this.ended = "loss";
          sfx.invoice();
        }
      },
      onPlumberDied(p) {
        sfx.enemyDie();
      },
      onWaveStart(idx, wave) {
        sfx.waveStart();
        sfx.waveFanfare();
        this.waveKillsThisWave = 0;
        this.waveEarnedThisWave = 0;
        this.waveEscapedThisWave = 0;
        const milestones = {
          5: { text: "📊 WAVE 5 — 야근 직후 화장실 러시", color: "#f6d96a" },
          7: { text: "⚠ WAVE 7 — 키친타월 등장. 절대 금물.", color: "#ff8a3a" },
          10: { text: "🚨 WAVE 10 — 김반장 출동 대기. ₩100만 청구선.", color: "#e9534b" },
          15: { text: "💀 WAVE 15 — P0 INCIDENT 발령.", color: "#ff3a3a" },
        };
        if (milestones[idx + 1]) {
          setTimeout(() => {
            ui.toast(milestones[idx + 1].text, {
              color: milestones[idx + 1].color,
              duration: 3.5,
            });
          }, 800);
        }
        if (wave.boss) {
          setTimeout(() => {
            ui.toast("💀 보스 웨이브 — 다양화 필수 (4종 타워 균형)", {
              color: "#ff3a3a",
              duration: 4,
            });
          }, 1200);
        }
        const wavePhrases = [
          "WAVE 1 — 슬슬 흘러옵니다",
          "WAVE 2 — 물티슈 정찰병",
          "WAVE 3 — 휴지 무리",
          "WAVE 4 — 다양화 시작",
          "WAVE 5 — 물티슈 ARMY",
          "WAVE 6 — 압박 강화",
          "WAVE 7 — 키친타월 등장 (금물)",
          "WAVE 8 — 막힘 가속",
          "WAVE 9 — 최종 압박",
          "WAVE 10 — 모두 동원",
        ];
        const label = wave.boss
          ? `WAVE ${idx + 1} — ⚠ 정체불명의 물질 접근`
          : wavePhrases[idx] || `WAVE ${idx + 1}`;
        ui.flash(label, {
          color: wave.boss ? "#e9534b" : "#f6d96a",
          duration: 2.5,
          size: 22,
        });
        const hasKitchen = wave.groups?.some((g) => g.type === "kitchen");
        if (hasKitchen && !wave.boss) {
          sfx.kitchenAlert();
          setTimeout(() => {
            ui.flash("⚠ 키친타월 감지 — 절대 금물 (공업용 석션 추천)", {
              color: "#ff8a3a",
              duration: 2.4,
              size: 16,
              y: 96,
            });
          }, 400);
        }
      },
      onWaveCleared(idx, wave) {
        sfx.waveClear();
        const rawBonus = wave.bonus || 1500;
        const bonus = Math.round(rawBonus * (this.difficulty?.moneyMul ?? 1));
        const earnedBefore = this.totalEarned;
        this.money += bonus;
        this.totalEarned += bonus;
        this.waveEarnedThisWave += bonus;
        ui.flash(`✓ 웨이브 ${idx + 1} 청소! +₩${bonus.toLocaleString("ko-KR")}`, {
          color: "#5acf80",
          duration: 1.6,
          size: 18,
        });
        const wk = this.waveKillsThisWave || 0;
        const we = this.waveEscapedThisWave || 0;
        const wm = this.waveEarnedThisWave || 0;
        setTimeout(() => {
          ui.toast(
            `📊 ${wk}킬 · +₩${wm.toLocaleString("ko-KR")} · ${we ? we + " 누수" : "완벽 차단"}`,
            {
              color: we === 0 ? "#5acf80" : "#a9b3c7",
              duration: 2.4,
            },
          );
        }, 800);
        game._unlock("first_wave");
        if (we === 0 && wk >= 3) game._unlock("no_escape");
        if (earnedBefore < 1000000 && this.totalEarned >= 1000000 && !this.milestone1M) {
          this.milestone1M = true;
          sfx.milestone();
          ui.flash("🏆 ₩1,000,000 돌파 — 데모데이 자금 확보", {
            color: "#ffea66",
            duration: 3,
            size: 22,
            y: 80,
          });
          game._unlock("millionaire");
        }
      },
      onAllWavesClear() {
        sfx.victory();
        this.ended = "win";
      },
      findClosestPathPoint(x, y, range) {
        let best = null;
        let bestD = Infinity;
        for (const path of this.paths) {
          for (let d = 0; d <= path.totalLength; d += 8) {
            const p = path.positionAt(d);
            const dist = Math.hypot(p.x - x, p.y - y);
            if (dist > range) continue;
            if (dist < bestD) {
              bestD = dist;
              const seg = path.segments[p.segIndex];
              best = {
                x: p.x,
                y: p.y,
                tangent: seg ? { x: seg.dx, y: seg.dy } : { x: 1, y: 0 },
              };
            }
          }
        }
        return best;
      },
    };
    waveManager.prepareNextWave();
    this.scene = "playing";
    this.ui.flash(`▶ ${levelDef.name} · ${diff.name} · ${heroDef.name}`, {
      color: heroDef.color,
      duration: 2,
      size: 22,
    });
  }

  _endRun() {
    const rs = this.runState;
    if (!rs || rs.scored) return;
    rs.scored = true;
    rs.grade = this._calculateGrade(rs);
    const runStats = {
      kills: rs.totalKills,
      earned: rs.totalEarned,
      escaped: rs.totalEscaped,
      peakCombo: rs.peakCombo,
      waveReached: rs.waveManager.waveIndex + 1,
      bossKilled: !!rs.bossKilled,
      grade: rs.grade,
      outcome: rs.ended,
    };
    if (rs.ended === "win") {
      rs.stars = this._calculateStars(rs);
      const data = saveLevelScore(rs.level.id, {
        stars: rs.stars,
        pipeIntegrity: rs.lives,
        unusedFunds: rs.money,
        difficulty: rs.difficulty.id,
      });
      this.progress = recordRunStats(runStats);
      Object.assign(this.progress, data);
      if (rs.grade === "S") this._unlock("grade_s");
      if (rs.difficulty.id === "hard") this._unlock("hard_clear");
      const scoredLevels = Object.keys(this.progress.scores || {});
      if (
        scoredLevels.includes("sink") &&
        scoredLevels.includes("toilet") &&
        scoredLevels.includes("mainpipe")
      ) {
        this._unlock("all_stages");
      }
      this.scene = "victory";
    } else {
      this.progress = recordRunStats(runStats);
      this.scene = "gameOver";
    }
  }

  _calculateStars(rs) {
    let stars = 1;
    if (rs.lives >= Math.ceil(rs.maxLives * 0.66)) stars++;
    if (rs.lives === rs.maxLives) stars++;
    if (rs.money >= rs.startMoney * 0.4) stars = Math.min(3, stars + 0);
    return Math.min(3, Math.max(1, stars));
  }

  _calculateGrade(rs) {
    const totalWaves = rs.waveManager.waves.length;
    const wavesCleared = Math.max(0, rs.waveManager.waveIndex);
    const wavesPct = totalWaves > 0 ? wavesCleared / totalWaves : 0;
    const livesPct = rs.maxLives > 0 ? rs.lives / rs.maxLives : 0;
    const escapeRatio =
      rs.totalKills + rs.totalEscaped > 0
        ? rs.totalKills / (rs.totalKills + rs.totalEscaped)
        : 0;
    const comboBonus = Math.min(15, (rs.peakCombo || 0) * 1.5);
    const bossBonus = rs.bossKilled ? 10 : 0;
    let score = wavesPct * 45 + livesPct * 25 + escapeRatio * 15 + comboBonus + bossBonus;
    if (rs.ended === "loss") score *= 0.7;
    if (score >= 95) return "S";
    if (score >= 82) return "A";
    if (score >= 68) return "B";
    if (score >= 50) return "C";
    if (score >= 30) return "D";
    return "F";
  }

  _loop(now) {
    const dt = Math.min(0.05, (now - this.lastFrame) / 1000);
    this.lastFrame = now;
    this.time += dt;
    this.input.update(dt);
    this.ui.update(dt);
    this.ui.setMouse(this.input.mouse.x, this.input.mouse.y);
    if (this.scene === "playing" && this.runState && !this.runState.paused) {
      this._updatePlaying(dt);
    }
    if (this.runState && this.runState.ended && this.scene === "playing") {
      this._endRun();
    }
    this._render();
    this.input.consumeClick();
    requestAnimationFrame(this._loop);
  }

  _updatePlaying(dt) {
    const rs = this.runState;
    const speed = rs.speed || 1;
    const subSteps = speed > 1 ? speed : 1;
    const subDt = dt / subSteps * speed;
    for (let s = 0; s < subSteps; s++) {
      rs.time += subDt;
      rs.heroCooldown = Math.max(0, rs.heroCooldown - subDt);
      rs.waveManager.update(subDt, rs);
      for (const e of rs.enemies) e.update(subDt, rs);
      for (const t of rs.towers) t.update(subDt, rs);
      for (const p of rs.projectiles) p.update(subDt, rs);
      for (const p of rs.plumbers) p.update(subDt, rs);
      for (const h of rs.hazards) h.update(subDt, rs);
      for (const pt of rs.particles) pt.update(subDt);
      rs.enemies = rs.enemies.filter((e) => e.alive);
      rs.projectiles = rs.projectiles.filter((p) => p.alive);
      rs.plumbers = rs.plumbers.filter((p) => p.alive);
      rs.hazards = rs.hazards.filter((h) => h.alive);
      rs.particles = rs.particles.filter((p) => p.alive);
    }
    if (rs.screenShake > 0) rs.screenShake = Math.max(0, rs.screenShake - dt);
    if (rs.screenShake === 0) rs.screenShakeMag = 0;
    if (rs.comboTimer > 0) {
      rs.comboTimer = Math.max(0, rs.comboTimer - dt);
      if (rs.comboTimer === 0) rs.comboCount = 0;
    }
    if (rs.speedFlash > 0) rs.speedFlash = Math.max(0, rs.speedFlash - dt * 2);
    if (rs.scanBuffTimer > 0) rs.scanBuffTimer = Math.max(0, rs.scanBuffTimer - dt);
    if (rs.heroAbilityFlash > 0) rs.heroAbilityFlash = Math.max(0, rs.heroAbilityFlash - dt * 1.2);
    if (rs.tools) {
      for (const tid of Object.keys(rs.tools)) {
        if (rs.tools[tid].cooldown > 0) {
          rs.tools[tid].cooldown = Math.max(0, rs.tools[tid].cooldown - dt);
        }
      }
    }
    if (rs.barricades && rs.barricades.length > 0) {
      for (const b of rs.barricades) b.timeLeft -= dt;
      rs.barricades = rs.barricades.filter((b) => b.timeLeft > 0);
      for (const e of rs.enemies) {
        if (!e.alive || e.effects.stun > 0) continue;
        for (const b of rs.barricades) {
          if (Math.hypot(e.x - b.x, e.y - b.y) <= b.radius) {
            e.effects.stun = Math.max(e.effects.stun, 0.08);
            break;
          }
        }
      }
    }
    if (rs.heroReadyJustNow !== undefined) {
      if (rs.heroCooldown === 0 && !rs.heroReadyJustNow) {
        rs.heroReadyJustNow = rs.time;
      } else if (rs.heroCooldown > 0) {
        rs.heroReadyJustNow = 0;
      }
    } else if (rs.heroCooldown === 0) {
      rs.heroReadyJustNow = rs.time;
    }
    rs.chatterTimer = (rs.chatterTimer || 18) - dt;
    if (rs.chatterTimer <= 0 && rs.enemies.some((e) => e.alive)) {
      rs.chatterTimer = 18 + Math.random() * 14;
      const line = pick(PLUMBER_LINES);
      this.ui.toast(`👷 ${line}`, {
        color: "#a8c8ff",
        duration: 3.5,
      });
    } else if (rs.chatterTimer <= 0) {
      rs.chatterTimer = 8;
    }
  }

  _render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, CANVAS.width, CANVAS.height);
    this.ui.beginFrame();

    if (this.scene === "menu") {
      drawMainMenu(ctx, this.ui, this.time, this.progress);
    } else if (this.scene === "levelSelect") {
      drawLevelSelect(ctx, this.ui, this.time, this.progress, LEVELS);
    } else if (this.scene === "heroSelect") {
      const lvl = LEVELS.find((l) => l.id === this.selection.levelId);
      drawHeroSelect(ctx, this.ui, this.time, lvl?.name || "");
    } else if (this.scene === "difficultySelect") {
      const hero = HEROES[this.selection.heroId];
      drawDifficultySelect(ctx, this.ui, this.time, hero);
    } else if (this.scene === "tutorial") {
      drawTutorial(ctx, this.ui, this.time);
    } else if (this.scene === "credits") {
      drawCredits(ctx, this.ui, this.time);
    } else if (this.scene === "bestiary") {
      drawBestiary(ctx, this.ui, this.time);
    } else if (this.scene === "playing" || this.scene === "gameOver" || this.scene === "victory") {
      this._renderPlaying(ctx);
      if (this.scene === "playing" && this.runState?.paused) {
        drawPause(ctx, this.ui);
      }
      if (this.scene === "gameOver") {
        drawGameOver(ctx, this.ui, this.runState, this.time);
      }
      if (this.scene === "victory") {
        drawVictory(ctx, this.ui, this.runState, this.time);
      }
    }

    drawFlashes(ctx, this.ui);
    drawToasts(ctx, this.ui);
    drawCheatBuffer(ctx, this.input.keyBuffer);
    if (this.helpOpen) drawHelpOverlay(ctx, this.time);
    if (this.settingsOpen) drawSettingsOverlay(ctx, this, this.time, this.ui);
    this.ui.setMouse(this.input.mouse.x, this.input.mouse.y);
    this.ui.endFrame();
  }

  _renderPlaying(ctx) {
    const rs = this.runState;
    if (!rs) return;
    rs._mouseX = this.input.mouse.x;
    rs._mouseY = this.input.mouse.y;
    ctx.save();
    if (rs.screenShake > 0 && rs.screenShakeMag > 0) {
      const intensity = rs.screenShake * 5;
      const sx = (Math.random() - 0.5) * rs.screenShakeMag * intensity;
      const sy = (Math.random() - 0.5) * rs.screenShakeMag * intensity;
      ctx.translate(sx, sy);
    }
    drawTileBackground(ctx, CANVAS.width, CANVAS.height, rs.level.decor.bathroom);
    for (const sign of rs.level.decor.signs || []) drawSign(ctx, sign);
    const totalWaves = rs.waveManager.waves.length;
    const wIdx = rs.waveManager.waveIndex;
    const curWave = rs.waveManager.waves[wIdx];
    const hasBoss = !!curWave?.boss || curWave?.groups?.some((g) => g.type === "boss");
    const wavePct = totalWaves > 0 ? wIdx / totalWaves : 0;
    const intensity = hasBoss ? 0.85 : Math.max(0, (wavePct - 0.4) * 1.4);
    for (const path of rs.paths) {
      drawPath(ctx, path.points, { time: rs.time, intensity });
    }
    drawSpawnWarning(ctx, rs, rs.time);
    for (const entry of rs.level.entries) {
      if (entry.kind === "toilet") drawToiletEntry(ctx, entry.x, entry.y, rs.time);
      else if (entry.kind === "sink") drawSinkEntry(ctx, entry.x, entry.y, rs.time);
      else drawJunctionEntry(ctx, entry.x, entry.y, rs.time);
    }
    for (const exit of rs.level.exits) {
      drawSewerExit(ctx, exit.x, exit.y, rs.time);
    }
    const mx = this.input.mouse.x;
    const my = this.input.mouse.y;
    let cursorWantsPointer = false;
    for (const slot of rs.level.slots) {
      if (rs.towers.some((t) => t.x === slot.x && t.y === slot.y)) continue;
      const hover =
        Math.hypot(mx - slot.x, my - slot.y) < 24 && (!rs.openMenu || rs.buildMode);
      if (hover) cursorWantsPointer = true;
      drawSlot(ctx, slot.x, slot.y, hover, rs.time, false, !!rs.buildMode);
    }
    if (rs.buildMode) {
      for (const t of rs.towers) {
        const stats = t.getStats();
        const color =
          t.type === "plunger"
            ? "rgba(212,74,74,0.18)"
            : t.type === "suction"
              ? "rgba(77,140,102,0.18)"
              : t.type === "chemical"
                ? "rgba(126,99,209,0.18)"
                : "rgba(199,155,86,0.18)";
        ctx.save();
        ctx.fillStyle = color;
        ctx.strokeStyle = color.replace("0.18", "0.5");
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.arc(t.x, t.y, stats.range || 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
      let hoverSlot = null;
      for (const slot of rs.level.slots) {
        if (rs.towers.some((t) => t.x === slot.x && t.y === slot.y)) continue;
        const d = Math.hypot(mx - slot.x, my - slot.y);
        if (d < 26) { hoverSlot = slot; break; }
      }
      const def = TOWERS[rs.buildMode];
      const cost = Math.round(def.base.cost * (rs.hero.id === "jeffrey" ? 0.92 : 1));
      const canAfford = rs.money >= cost;
      if (hoverSlot) {
        drawRangeIndicator(ctx, hoverSlot.x, hoverSlot.y, def.base.range,
          canAfford ? "rgba(94,207,128,0.7)" : "rgba(233,83,75,0.8)");
        drawGhostTower(ctx, rs.buildMode, hoverSlot.x, hoverSlot.y, rs.time, canAfford);
      } else if (mx < CANVAS.width - 240 && my < CANVAS.height) {
        drawRangeIndicator(ctx, mx, my, def.base.range,
          canAfford ? "rgba(94,207,128,0.55)" : "rgba(233,83,75,0.65)");
        drawGhostTower(ctx, rs.buildMode, mx, my, rs.time, false);
      }
    }

    let hoverTower = null;
    if (!rs.buildMode && !rs.openMenu) {
      for (const t of rs.towers) {
        if (Math.hypot(mx - t.x, my - t.y) < 26) { hoverTower = t; break; }
      }
      if (hoverTower) cursorWantsPointer = true;
    }
    if (rs.buildMode) cursorWantsPointer = true;
    const desired = cursorWantsPointer ? "pointer" : "default";
    if (this.canvas.style.cursor !== desired) this.canvas.style.cursor = desired;
    if (rs.openMenu?.type === "tower" || hoverTower) {
      const t = rs.openMenu?.type === "tower" ? rs.openMenu.tower : hoverTower;
      const stats = t.getStats();
      const color =
        t.type === "plunger"
          ? "rgba(212,74,74,0.7)"
          : t.type === "suction"
            ? "rgba(77,140,102,0.7)"
            : t.type === "chemical"
              ? "rgba(126,99,209,0.7)"
              : "rgba(199,155,86,0.7)";
      drawRangeIndicator(ctx, t.x, t.y, stats.range, color);
      if (hoverTower && rs.openMenu?.type !== "tower") {
        const dps = stats.fireRate && stats.damage
          ? (stats.damage / stats.fireRate).toFixed(0)
          : stats.unitDamage && stats.unitAttackRate
            ? (stats.unitDamage / stats.unitAttackRate * (stats.unitCount || 1)).toFixed(0)
            : "—";
        const tipX = Math.min(t.x + 22, CANVAS.width - 260);
        const tipY = Math.max(20, t.y - 60);
        ctx.save();
        ctx.fillStyle = "rgba(14,18,30,0.92)";
        ctx.strokeStyle = t.def.color;
        ctx.lineWidth = 1.5;
        const lines = [
          `${t.def.name}${t.level >= 1 ? " · " + t.def.branches[t.branch].name : ""}${t.level >= 2 ? " II" : ""}`,
          `RNG ${stats.range || "—"}  DMG ${stats.damage || stats.unitDamage || "—"}`,
          `RATE ${stats.fireRate ? (1 / stats.fireRate).toFixed(2) + "/s" : "—"}  DPS ~${dps}`,
          `★ ${t.kills} kills · 클릭하여 업그레이드`,
        ];
        const tipW = 220;
        const tipH = 18 * lines.length + 12;
        ctx.beginPath();
        ctx.rect(tipX, tipY, tipW, tipH);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f3f5ff";
        ctx.font = "11px monospace";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        for (let i = 0; i < lines.length; i++) {
          ctx.fillStyle = i === 0 ? t.def.color : i === lines.length - 1 ? "#a9b3c7" : "#f3f5ff";
          if (i === 0) ctx.font = "bold 12px -apple-system, sans-serif";
          else ctx.font = "11px monospace";
          ctx.fillText(lines[i], tipX + 10, tipY + 6 + i * 18);
        }
        ctx.restore();
      }
    }
    if (rs.openMenu?.type === "build") {
      drawRangeIndicator(
        ctx,
        rs.openMenu.slot.x,
        rs.openMenu.slot.y,
        110,
        "rgba(78,161,255,0.6)",
      );
    }

    for (const h of rs.hazards) drawHazard(ctx, h, rs.time);
    for (const t of rs.towers) {
      if (t.target && t.target.alive && (t.recoil || 0) > 0.05) {
        const towerColor =
          t.type === "plunger"
            ? "rgba(212,74,74,"
            : t.type === "suction"
              ? "rgba(77,140,102,"
              : t.type === "chemical"
                ? "rgba(126,99,209,"
                : "rgba(199,155,86,";
        ctx.save();
        ctx.strokeStyle = towerColor + (0.35 + (t.recoil || 0) * 0.4) + ")";
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(t.x, t.y);
        ctx.lineTo(t.target.x, t.target.y);
        ctx.stroke();
        ctx.restore();
      }
    }
    for (const t of rs.towers) {
      drawTower(ctx, t, rs.time, rs.openMenu?.type === "tower" && rs.openMenu.tower === t);
    }
    for (const p of rs.plumbers) {
      drawPlumber(ctx, p, rs.time);
    }
    const colorblind = !!this.progress?.settings?.colorblind;
    for (const e of rs.enemies) {
      drawEnemy(ctx, e, rs.time);
      if (colorblind) {
        const codes = {
          wetwipe: { letter: "W", color: "#7eb8ff" },
          paper: { letter: "P", color: "#f7e8c8" },
          lens: { letter: "L", color: "#a9efe5" },
          cap: { letter: "C", color: "#dfe7f3" },
          micro: { letter: "m", color: "#cfd6e3" },
          kitchen: { letter: "K", color: "#f2bf5d" },
          boss: { letter: "B", color: "#5e3b1f" },
        };
        const code = codes[e.type];
        if (code) {
          ctx.save();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.def.radius + 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "rgba(0,0,0,0.8)";
          ctx.font = "bold 11px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`[${code.letter}]`, e.x, e.y - e.def.radius - 18);
          ctx.fillStyle = code.color;
          ctx.fillText(`[${code.letter}]`, e.x - 1, e.y - e.def.radius - 19);
          ctx.restore();
        }
      }
      if (rs.hero.id === "seongjin" || e.discoveredByDiagnostic) {
        ctx.save();
        ctx.fillStyle = "rgba(168,224,125,0.8)";
        ctx.font = "9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          `${Math.ceil(e.hp)}/${e.maxHp}`,
          e.x,
          e.y + e.def.radius + 14,
        );
        ctx.fillStyle = "rgba(168,224,125,0.7)";
        ctx.fillText(e.def.name, e.x, e.y + e.def.radius + 24);
        ctx.restore();
      }
    }
    for (const p of rs.projectiles) drawProjectile(ctx, p, rs.time);
    for (const p of rs.particles) drawParticle(ctx, p);

    ctx.restore();

    drawHud(ctx, this.ui, rs, rs.time);

    if (rs.openMenu?.type === "build") {
      drawBuildMenu(ctx, this.ui, rs, rs.openMenu.slot, rs.time);
    } else if (rs.openMenu?.type === "tower") {
      drawTowerMenu(ctx, this.ui, rs, rs.openMenu.tower, rs.time);
    }
  }
}
