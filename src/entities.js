import { ENEMIES, TOWERS, BOSS_ABILITIES } from "./config.js";

let nextId = 1;
const uid = () => nextId++;

export class Enemy {
  constructor({ type, path, pathIndex, hpMul = 1, speedMul = 1, isSpawned = false }) {
    this.id = uid();
    this.type = type;
    this.def = ENEMIES[type];
    this.path = path;
    this.pathIndex = pathIndex;
    this.dist = 0;
    this.maxHp = Math.round(this.def.hp * hpMul);
    this.hp = this.maxHp;
    this.baseSpeed = this.def.speed * speedMul;
    this.armor = this.def.armor;
    this.x = path.points[0].x;
    this.y = path.points[0].y;
    this.alive = true;
    this.escaped = false;
    this.seed = Math.random() * 1000;
    this.effects = { slow: 0, slowAmt: 0, stun: 0, poison: 0, poisonDps: 0, confuse: 0 };
    this.bossVariant = type === "boss" ? Math.floor(Math.random() * 6) : 0;
    this.immunityType = type === "boss" ? randomTowerType() : null;
    this.isSpawned = isSpawned;
    this.blockedBy = null;
    this.discoveredByDiagnostic = false;
    this.hitFlash = 0;
    this._immunityRotateT = 0;
    this._acidBurstT = 0;
    this._sludgeT = 0;
    this._phaseAnnounced = { enraged: false, sludge: false, death: false };
  }

  tickFlash(dt) {
    if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
  }

  update(dt, gameState) {
    if (!this.alive) return;
    this.tickFlash(dt);
    if (this.effects.poison > 0) {
      this.hp -= this.effects.poisonDps * dt;
      this.effects.poison = Math.max(0, this.effects.poison - dt);
      if (this.hp <= 0) {
        this.killBy(gameState, { source: "poison" });
        return;
      }
    }
    if (this.type === "boss") this._bossTick(dt, gameState);
    if (this.effects.stun > 0) {
      this.effects.stun = Math.max(0, this.effects.stun - dt);
      return;
    }
    if (this.blockedBy && this.blockedBy.hp > 0) {
      this.attackBlocker(dt, gameState);
      return;
    } else {
      this.blockedBy = null;
    }
    let speed = this.baseSpeed;
    if (this.effects.slow > 0) {
      speed *= 1 - this.effects.slowAmt;
      this.effects.slow = Math.max(0, this.effects.slow - dt);
    }
    if (this.effects.confuse > 0) {
      this.effects.confuse = Math.max(0, this.effects.confuse - dt);
      speed *= this.confuseDir ?? 0.4;
      if (Math.random() < 0.02) this.confuseDir = Math.random() < 0.5 ? -0.5 : 0.5;
    }
    if (this.type === "boss") {
      const hpRatio = this.hp / this.maxHp;
      if (hpRatio < BOSS_ABILITIES.deathThroesHpThreshold) {
        speed = this.baseSpeed * BOSS_ABILITIES.deathThroesSpeedMul;
      } else if (hpRatio < BOSS_ABILITIES.enragedHpThreshold) {
        speed *= BOSS_ABILITIES.enragedSpeedMul;
      }
    }
    this.dist += speed * dt;
    if (this.dist < 0) this.dist = 0;
    if (this.dist >= this.path.totalLength) {
      this.escape(gameState);
      return;
    }
    const pos = this.path.positionAt(this.dist);
    this.x = pos.x;
    this.y = pos.y;
  }

  _bossTick(dt, gameState) {
    const towerTypes = ["plunger", "suction", "chemical", "barracks"];
    this._immunityRotateT += dt;
    if (this._immunityRotateT >= BOSS_ABILITIES.immunityRotationSec) {
      this._immunityRotateT = 0;
      const cur = this.immunityType;
      const others = towerTypes.filter((t) => t !== cur);
      this.immunityType = others[Math.floor(Math.random() * others.length)];
      if (gameState.spawnParticle) {
        gameState.spawnParticle({
          kind: "ring",
          x: this.x,
          y: this.y,
          color: "rgba(255,90,40,0.8)",
          size: this.def.radius + 12,
          life: 0.6,
          maxLife: 0.6,
        });
        gameState.spawnParticle({
          kind: "text",
          x: this.x,
          y: this.y - this.def.radius - 22,
          text: `🛡 ${this.immunityType} 면역!`,
          size: 13,
          color: "#ff8a3a",
          life: 1.1,
          maxLife: 1.1,
          vy: -28,
        });
      }
    }
    this._acidBurstT += dt;
    if (this._acidBurstT >= BOSS_ABILITIES.acidBurstCooldownSec) {
      this._acidBurstT = 0;
      let nearest = null;
      let bestD = BOSS_ABILITIES.acidBurstRange;
      for (const t of gameState.towers || []) {
        const d = Math.hypot(t.x - this.x, t.y - this.y);
        if (d < bestD) {
          bestD = d;
          nearest = t;
        }
      }
      if (nearest) {
        nearest.acidDisableTimer = Math.max(
          nearest.acidDisableTimer || 0,
          BOSS_ABILITIES.acidBurstTowerDisableSec,
        );
        if (gameState.spawnParticle) {
          gameState.spawnParticle({
            kind: "ring",
            x: this.x,
            y: this.y,
            color: "rgba(168,224,125,0.85)",
            size: BOSS_ABILITIES.acidBurstRange,
            life: 0.5,
            maxLife: 0.5,
          });
          gameState.spawnParticle({
            kind: "ring",
            x: nearest.x,
            y: nearest.y,
            color: "rgba(168,224,125,0.95)",
            size: 28,
            life: 0.8,
            maxLife: 0.8,
          });
          gameState.spawnParticle({
            kind: "text",
            x: nearest.x,
            y: nearest.y - 22,
            text: "🧪 산성 차단",
            size: 12,
            color: "#a8e07d",
            life: 1.2,
            maxLife: 1.2,
            vy: -30,
          });
        }
      }
    }
    const hpRatio = this.hp / this.maxHp;
    if (hpRatio < BOSS_ABILITIES.sludgeSpawnHpThreshold) {
      if (!this._phaseAnnounced.sludge && gameState.flash) {
        this._phaseAnnounced.sludge = true;
        gameState.flash("👹 보스 2단계 — 미세 잔해 소환 시작!", "#ff8a3a");
      }
      this._sludgeT += dt;
      if (this._sludgeT >= BOSS_ABILITIES.sludgeSpawnCooldownSec) {
        this._sludgeT = 0;
        if (gameState.spawnEnemy) {
          const child = new Enemy({
            type: "micro",
            path: this.path,
            pathIndex: this.pathIndex,
            hpMul: 1,
            speedMul: 1,
            isSpawned: true,
          });
          child.dist = Math.max(0, this.dist + 12);
          gameState.enemies.push(child);
          const child2 = new Enemy({
            type: "micro",
            path: this.path,
            pathIndex: this.pathIndex,
            hpMul: 1,
            speedMul: 1,
            isSpawned: true,
          });
          child2.dist = Math.max(0, this.dist - 12);
          gameState.enemies.push(child2);
        }
      }
    }
    if (
      hpRatio < BOSS_ABILITIES.deathThroesHpThreshold &&
      !this._phaseAnnounced.death &&
      gameState.flash
    ) {
      this._phaseAnnounced.death = true;
      gameState.flash("💀 보스 광폭화 — 모든 저항 해제, ×2.2 속도!", "#ff3a3a");
      gameState.addShake?.(14, 0.8);
    } else if (
      hpRatio < BOSS_ABILITIES.enragedHpThreshold &&
      hpRatio >= BOSS_ABILITIES.deathThroesHpThreshold &&
      !this._phaseAnnounced.enraged &&
      gameState.flash
    ) {
      this._phaseAnnounced.enraged = true;
      gameState.flash("⚠ 보스 격분 — 속도 +35%", "#f6d96a");
    }
  }

  attackBlocker(dt, gameState) {
    if (!this.attackCd) this.attackCd = 0;
    this.attackCd -= dt;
    if (this.attackCd <= 0) {
      this.attackCd = 0.7;
      const damage = Math.max(4, this.def.threat * 2);
      this.blockedBy.takeDamage(damage, gameState);
    }
  }

  takeDamage(amount, options = {}, gameState) {
    if (!this.alive) return;
    const towerType = options.towerType;
    let dmg = amount;
    if (this.type === "wetwipe" && towerType === "chemical") {
      dmg *= 1 - (this.def.flags.chemicalResist ?? 0);
    }
    if (
      this.type === "boss" &&
      this.immunityType === towerType &&
      !options.bypassImmunity
    ) {
      dmg *= 0.15;
    }
    if (
      this.def.flags?.evasive &&
      Math.random() < this.def.flags.evasive &&
      !options.unevadable
    ) {
      return;
    }
    if (options.armorPierce !== undefined) {
      const piercedArmor = Math.max(0, this.armor - options.armorPierce);
      dmg = Math.max(1, dmg - piercedArmor * 1.5);
    } else {
      dmg = Math.max(1, dmg - this.armor * 1.5);
    }
    if (options.bonusVs && options.bonusVs.includes(this.type)) {
      dmg *= options.bonusMul || 2;
    }
    if (options.cleanKill && options.cleanKill.includes(this.type)) {
      this.hp = 0;
      this.killBy(gameState, { source: "cleanKill", cleanKill: true });
      return;
    }
    this.hp -= dmg;
    this.hitFlash = 1;
    if (gameState?.spawnDamageNumber) {
      gameState.spawnDamageNumber(this.x, this.y - this.def.radius, dmg, options);
    }
    if (options.pushback && options.pushback !== 0) {
      const kbResist = this.def.flags?.knockbackResist || 0;
      const effectivePushback = options.pushback * (1 - kbResist);
      this.dist = Math.max(0, this.dist - effectivePushback);
    }
    if (options.stun) {
      const stunResist = this.def.flags?.stunResist || 0;
      const effectiveStun = options.stun * (1 - stunResist);
      this.effects.stun = Math.max(this.effects.stun, effectiveStun);
    }
    if (options.slow) {
      const slowResist = this.def.flags?.slowResist || 0;
      this.effects.slow = Math.max(this.effects.slow, options.slow.duration);
      this.effects.slowAmt = Math.max(
        this.effects.slowAmt,
        options.slow.amount * (1 - slowResist),
      );
    }
    if (options.dot) {
      this.effects.poison = Math.max(this.effects.poison, options.dot.duration);
      this.effects.poisonDps = Math.max(
        this.effects.poisonDps,
        options.dot.dps,
      );
    }
    if (this.hp <= 0) {
      this.killBy(gameState, { source: options.source || "damage" });
    }
  }

  killBy(gameState, opts = {}) {
    if (!this.alive) return;
    this.alive = false;
    gameState.onEnemyKilled(this, opts);
  }

  escape(gameState) {
    if (this.escaped) return;
    this.escaped = true;
    this.alive = false;
    gameState.onEnemyEscaped(this);
  }
}

function randomTowerType() {
  const types = ["plunger", "suction", "chemical", "barracks"];
  return types[Math.floor(Math.random() * types.length)];
}

export class Tower {
  constructor({ type, x, y }) {
    this.id = uid();
    this.type = type;
    this.def = TOWERS[type];
    this.x = x;
    this.y = y;
    this.level = 0;
    this.branch = null;
    this.cooldown = 0;
    this.target = null;
    this.totalSpent = this.def.base.cost;
    this.units = [];
    this.unitRespawnTimers = [];
    this.aimAngle = 0;
    this.lastFired = 0;
    this.recoil = 0;
    this.kills = 0;
    this.dmgDealt = 0;
    this.targetMode = "first";
    this.synergyBonus = 0;
    this.furyTimer = 0;
  }

  cycleTargetMode() {
    const modes = ["first", "threat", "strongest", "last", "closest"];
    const idx = modes.indexOf(this.targetMode);
    this.targetMode = modes[(idx + 1) % modes.length];
    return this.targetMode;
  }

  getStats() {
    if (this.level === 0) return this.def.base;
    const branchDef = this.def.branches[this.branch];
    if (this.level === 1) return { ...this.def.base, ...branchDef.tier1 };
    return { ...this.def.base, ...branchDef.tier1, ...branchDef.tier2 };
  }

  canUpgrade() {
    return this.level < 2;
  }

  getUpgradeOptions() {
    if (this.level === 0) {
      return [
        {
          branch: "A",
          name: this.def.branches.A.name,
          desc: this.def.branches.A.desc,
          cost: this.def.branches.A.tier1.cost,
          nextStats: this.def.branches.A.tier1,
        },
        {
          branch: "B",
          name: this.def.branches.B.name,
          desc: this.def.branches.B.desc,
          cost: this.def.branches.B.tier1.cost,
          nextStats: this.def.branches.B.tier1,
        },
      ];
    }
    if (this.level === 1) {
      const b = this.def.branches[this.branch];
      return [
        {
          branch: this.branch,
          name: b.name + " II",
          desc: b.desc,
          cost: b.tier2.cost,
          nextStats: b.tier2,
        },
      ];
    }
    return [];
  }

  applyUpgrade(opt) {
    if (this.level === 0) {
      this.branch = opt.branch;
      this.level = 1;
    } else if (this.level === 1) {
      this.level = 2;
    }
    this.totalSpent += opt.cost;
    if (this.type === "barracks") {
      const newStats = this.getStats();
      for (const unit of this.units) {
        unit.stats = newStats;
        const hpRatio = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
        unit.maxHp = newStats.unitHp;
        unit.hp = Math.max(1, newStats.unitHp * hpRatio);
      }
      this._needsReposition = true;
    }
  }

  getSellValue(rate = 0.55) {
    return Math.floor(this.totalSpent * rate);
  }

  update(dt, gameState) {
    if (this.recoil > 0) this.recoil = Math.max(0, this.recoil - dt * 8);
    if (this.furyTimer > 0) this.furyTimer = Math.max(0, this.furyTimer - dt);
    if (this.acidDisableTimer > 0) {
      this.acidDisableTimer = Math.max(0, this.acidDisableTimer - dt);
      return;
    }
    if (!this._synergyTimer) this._synergyTimer = 0;
    this._synergyTimer -= dt;
    if (this._synergyTimer <= 0) {
      this._synergyTimer = 0.4;
      let adjacent = 0;
      for (const t of gameState.towers) {
        if (t === this) continue;
        const d = Math.hypot(t.x - this.x, t.y - this.y);
        if (d < 100) adjacent++;
      }
      this.synergyBonus = Math.min(0.2, adjacent * 0.05);
    }
    if (this.type === "barracks") return this.updateBarracks(dt, gameState);
    this.cooldown -= dt;
    if (this.cooldown > 0) return;
    const stats = this.getStats();
    const target = this.findTarget(stats, gameState);
    if (!target) return;
    this.aimAngle = Math.atan2(target.y - this.y, target.x - this.x);
    this.fire(target, stats, gameState);
    this.cooldown = stats.fireRate;
  }

  updateBarracks(dt, gameState) {
    const stats = this.getStats();
    while (this.units.length + this.unitRespawnTimers.length < stats.unitCount) {
      this.unitRespawnTimers.push(0);
    }
    let safety = 8;
    while (
      this.units.length + this.unitRespawnTimers.length > stats.unitCount &&
      safety-- > 0
    ) {
      if (this.unitRespawnTimers.length > 0) {
        this.unitRespawnTimers.pop();
      } else if (this.units.length > 0) {
        const removed = this.units.pop();
        removed.alive = false;
      } else {
        break;
      }
    }
    for (let i = this.unitRespawnTimers.length - 1; i >= 0; i--) {
      this.unitRespawnTimers[i] -= dt;
      if (this.unitRespawnTimers[i] <= 0) {
        this.unitRespawnTimers.splice(i, 1);
        const slot = this.units.length;
        const offset = (slot - (stats.unitCount - 1) / 2) * 22;
        const p = gameState.findClosestPathPoint(this.x, this.y, stats.range);
        const px = p ? p.x : this.x;
        const py = p ? p.y : this.y;
        const tangent = p?.tangent || { x: 1, y: 0 };
        const unit = new PlumberUnit({
          x: px + tangent.x * offset,
          y: py + tangent.y * offset,
          stats,
          owner: this,
        });
        this.units.push(unit);
        gameState.spawnPlumber(unit);
      }
    }
    for (let i = this.units.length - 1; i >= 0; i--) {
      const u = this.units[i];
      if (!u.alive) {
        this.units.splice(i, 1);
        this.unitRespawnTimers.push(stats.unitRespawn);
        if (stats.passive?.comradeFurySec) {
          this.furyTimer = stats.passive.comradeFurySec;
        }
      }
    }
    if (this._needsReposition && this.units.length > 0) {
      const p = gameState.findClosestPathPoint(this.x, this.y, stats.range);
      if (p) {
        const tangent = p.tangent || { x: 1, y: 0 };
        for (let i = 0; i < this.units.length; i++) {
          const offset = (i - (this.units.length - 1) / 2) * 22;
          this.units[i].homeX = p.x + tangent.x * offset;
          this.units[i].homeY = p.y + tangent.y * offset;
        }
      }
      this._needsReposition = false;
    }
  }

  findTarget(stats, gameState) {
    const candidates = [];
    for (const e of gameState.enemies) {
      if (!e.alive) continue;
      const d = Math.hypot(e.x - this.x, e.y - this.y);
      if (d > stats.range) continue;
      candidates.push({ e, distToTower: d });
    }
    if (!candidates.length) return null;
    if (this.targetMode === "first") {
      return candidates.reduce((a, b) => (b.e.dist > a.e.dist ? b : a)).e;
    }
    if (this.targetMode === "last") {
      return candidates.reduce((a, b) => (b.e.dist < a.e.dist ? b : a)).e;
    }
    if (this.targetMode === "strongest") {
      return candidates.reduce((a, b) => (b.e.hp > a.e.hp ? b : a)).e;
    }
    if (this.targetMode === "closest") {
      return candidates.reduce((a, b) =>
        b.distToTower < a.distToTower ? b : a,
      ).e;
    }
    if (this.targetMode === "threat") {
      return candidates.reduce((a, b) => {
        const ta = (a.e.def.threat || 1) + (a.e.dist || 0) * 0.001;
        const tb = (b.e.def.threat || 1) + (b.e.dist || 0) * 0.001;
        return tb > ta ? b : a;
      }).e;
    }
    return candidates[0].e;
  }

  fire(target, stats, gameState) {
    gameState.spawnProjectile({
      type: stats.projectileType,
      x: this.x,
      y: this.y - 4,
      target,
      stats,
      towerType: this.type,
      branch: this.branch,
      owner: this,
    });
    this.lastFired = gameState.time;
    this.recoil = 1;
    gameState.playSfx(this.type);
    if (gameState.spawnParticle) {
      const flashColors = {
        plunger: "#ffd28a",
        suction: "#a8e0ba",
        chemical: "#cfffb0",
      };
      const color = flashColors[this.type] || "#ffffff";
      gameState.spawnParticle({
        kind: "ring",
        x: this.x,
        y: this.y - 10,
        color,
        size: 10,
        life: 0.14,
        maxLife: 0.14,
      });
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        gameState.spawnParticle({
          kind: "spark",
          x: this.x,
          y: this.y - 10,
          color,
          life: 0.18 + Math.random() * 0.12,
          maxLife: 0.3,
          vx: Math.cos(a) * (50 + Math.random() * 60),
          vy: Math.sin(a) * (50 + Math.random() * 60) - 20,
        });
      }
    }
  }
}

export class PlumberUnit {
  constructor({ x, y, stats, owner }) {
    this.id = uid();
    this.x = x;
    this.y = y;
    this.homeX = x;
    this.homeY = y;
    this.stats = stats;
    this.owner = owner;
    this.maxHp = stats.unitHp;
    this.hp = stats.unitHp;
    this.alive = true;
    this.target = null;
    this.attackCd = 0;
    this.attackFlash = 0;
    this.weaponSide = Math.random() < 0.5 ? -6 : 6;
  }

  get hpRatio() {
    return this.maxHp > 0 ? this.hp / this.maxHp : 0;
  }

  update(dt, gameState) {
    if (!this.alive) return;
    this.attackFlash = Math.max(0, this.attackFlash - dt * 3);
    if (this.stats.passive?.regenPerSec && this.hp < this.maxHp) {
      this.hp = Math.min(
        this.maxHp,
        this.hp + this.stats.passive.regenPerSec * dt,
      );
    }
    if (!this.target || !this.target.alive) {
      this.target = null;
      let best = null;
      let bestD = 36;
      for (const e of gameState.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
      this.target = best;
    }
    if (this.target) {
      this.target.blockedBy = this;
      this.attackCd -= dt;
      if (this.attackCd <= 0) {
        this.attackCd = this.stats.unitAttackRate;
        this.attackFlash = 1;
        const opts = {
          armorPierce: 0,
          source: "plumber",
        };
        if (this.stats.cleanKill) opts.cleanKill = this.stats.cleanKill;
        let dmg = this.stats.unitDamage;
        if (this.owner?.furyTimer > 0) dmg *= 1.25;
        if (gameState.hero?.id === "seongjin") dmg *= 1.1;
        if (gameState.scanBuffTimer > 0) dmg *= 1.5;
        this.target.takeDamage(dmg, opts, gameState);
      }
    } else {
      const dx = this.homeX - this.x;
      const dy = this.homeY - this.y;
      const d = Math.hypot(dx, dy);
      if (d > 1) {
        const speed = 60;
        this.x += (dx / d) * Math.min(d, speed * dt);
        this.y += (dy / d) * Math.min(d, speed * dt);
      }
    }
  }

  takeDamage(amount, gameState) {
    if (!this.alive) return;
    this.hp -= amount;
    if (this.hp <= 0) {
      this.alive = false;
      gameState.onPlumberDied(this);
    }
  }
}

export class Projectile {
  constructor({ type, x, y, target, stats, towerType, branch, owner }) {
    this.id = uid();
    this.type = type;
    this.x = x;
    this.y = y;
    this.target = target;
    this.stats = stats;
    this.towerType = towerType;
    this.branch = branch;
    this.owner = owner || null;
    this.speed = stats.projectileSpeed || 600;
    this.life = 2.5;
    this.alive = true;
    this.dx = 0;
    this.dy = 0;
  }

  update(dt, gameState) {
    if (!this.alive) return;
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    const targetDead = !this.target || !this.target.alive;
    const isAreaProj = this.stats?.aoeRadius || this.stats?.acidPool;
    if (targetDead) {
      if (isAreaProj) {
        this._hitAtPosition(gameState);
      }
      this.alive = false;
      return;
    }
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 6) {
      this.hit(gameState);
      this.alive = false;
      return;
    }
    this.dx = (dx / d) * this.speed;
    this.dy = (dy / d) * this.speed;
    this.x += this.dx * dt;
    this.y += this.dy * dt;
  }

  _hitAtPosition(gameState) {
    const s = this.stats;
    const cx = this.x;
    const cy = this.y;
    if (s.aoeRadius) {
      gameState.spawnParticle({
        kind: "ring",
        x: cx,
        y: cy,
        color: "rgba(168,224,125,0.7)",
        size: s.aoeRadius,
        life: 0.35,
        maxLife: 0.35,
      });
      for (const e of gameState.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - cx, e.y - cy);
        if (d <= s.aoeRadius) {
          const falloff = 1 - (d / s.aoeRadius) * 0.5;
          const wasAlive = e.alive;
          e.takeDamage(
            s.damage * falloff,
            { towerType: this.towerType, source: "tower" },
            gameState,
          );
          if (wasAlive && !e.alive && this.owner) this.owner.kills += 1;
        }
      }
    }
    if (s.acidPool && gameState.spawnHazard) {
      gameState.spawnHazard({
        x: cx,
        y: cy,
        radius: s.acidPool.radius,
        dps: s.acidPool.dps,
        duration: s.acidPool.duration,
        type: "acid",
        owner: this.owner,
      });
    }
  }

  hit(gameState) {
    const s = this.stats;
    const options = {
      towerType: this.towerType,
      pushback: s.pushback,
      armorPierce: s.armorPierce,
      bonusVs: s.bonusVs,
      bonusMul: s.bonusMul,
      dot: s.dot,
      stun: s.stun?.duration,
      source: "tower",
    };
    let dmg = s.damage;
    if (this.owner?.synergyBonus) dmg *= 1 + this.owner.synergyBonus;
    if (this.owner?.furyTimer > 0) dmg *= 1.25;
    if (gameState.hero?.id === "seongjin") dmg *= 1.1;
    if (gameState.scanBuffTimer > 0) dmg *= 1.5;
    const passive = s.passive;
    let isCrit = false;
    let isInstakill = false;
    let isExecute = false;
    if (
      this.towerType === "suction" &&
      this.target.maxHp > 0 &&
      this.target.hp / this.target.maxHp < 0.3
    ) {
      dmg *= 2.5;
      isExecute = true;
    }
    if (s.critChance && Math.random() < s.critChance) {
      dmg *= s.critMul || 4;
      isCrit = true;
      if (passive?.critInstakillTypes?.includes(this.target.type)) {
        dmg = this.target.hp * 999;
        isInstakill = true;
      }
      gameState.spawnParticle({
        kind: "text",
        x: this.target.x,
        y: this.target.y - 20,
        text: isInstakill ? "🚽 즉사!" : "✦ CRIT! ✦",
        size: isInstakill ? 22 : 18,
        color: isInstakill ? "#ff6a3a" : "#ffea66",
        life: 0.9,
        maxLife: 0.9,
        vy: -60,
      });
      gameState.spawnParticle({
        kind: "ring",
        x: this.target.x,
        y: this.target.y,
        color: isInstakill ? "rgba(255,90,60,0.85)" : "rgba(255,234,102,0.75)",
        size: isInstakill ? 24 : 18,
        life: 0.3,
        maxLife: 0.3,
      });
      if (gameState.addShake) gameState.addShake(isInstakill ? 6 : 3, 0.18);
      if (isInstakill) {
        gameState.spawnParticle({
          kind: "ring",
          x: this.target.x,
          y: this.target.y,
          color: "rgba(77,140,102,0.85)",
          size: 18,
          life: 0.45,
          maxLife: 0.45,
        });
      }
    }
    if (isExecute && !isInstakill) {
      gameState.spawnParticle({
        kind: "text",
        x: this.target.x,
        y: this.target.y - 24,
        text: "⚡ 처리!",
        size: 13,
        color: "#a8e0ba",
        life: 0.7,
        maxLife: 0.7,
        vy: -45,
      });
    }
    if (
      passive?.instakillTypes?.includes(this.target.type) &&
      this.target.hp < 1000
    ) {
      dmg = this.target.hp * 999;
      isInstakill = true;
      gameState.spawnParticle({
        kind: "text",
        x: this.target.x,
        y: this.target.y - 20,
        text: "💥 절멸!",
        size: 16,
        color: "#a888ff",
        life: 0.8,
        maxLife: 0.8,
        vy: -50,
      });
    }
    if (s.bonusVs?.includes(this.target.type)) {
      gameState.spawnParticle({
        kind: "text",
        x: this.target.x + (Math.random() - 0.5) * 16,
        y: this.target.y - 32,
        text: "EFFECTIVE!",
        size: 12,
        color: "#5acf80",
        life: 0.6,
        maxLife: 0.6,
        vy: -40,
      });
    }
    if (s.aoeRadius) {
      gameState.spawnParticle({
        kind: "ring",
        x: this.target.x,
        y: this.target.y,
        color: "rgba(168,224,125,0.7)",
        size: s.aoeRadius,
        life: 0.35,
        maxLife: 0.35,
      });
      for (const e of gameState.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - this.target.x, e.y - this.target.y);
        if (d <= s.aoeRadius) {
          const falloff = 1 - (d / s.aoeRadius) * 0.5;
          const wasAlive = e.alive;
          e.takeDamage(dmg * falloff, options, gameState);
          if (wasAlive && !e.alive && this.owner) this.owner.kills += 1;
        }
      }
      if (s.stun?.radius) {
        const stunnedSet = new Set();
        for (const e of gameState.enemies) {
          if (!e.alive) continue;
          const d = Math.hypot(e.x - this.target.x, e.y - this.target.y);
          if (d <= s.stun.radius) {
            e.effects.stun = Math.max(e.effects.stun, s.stun.duration);
            stunnedSet.add(e);
          }
        }
        if (s.passive?.cascadeRadius) {
          for (const stunned of stunnedSet) {
            for (const e of gameState.enemies) {
              if (!e.alive || stunnedSet.has(e)) continue;
              const d = Math.hypot(e.x - stunned.x, e.y - stunned.y);
              if (d <= s.passive.cascadeRadius) {
                e.effects.stun = Math.max(
                  e.effects.stun,
                  s.passive.cascadeStunDuration,
                );
                gameState.spawnParticle({
                  kind: "spark",
                  x: e.x,
                  y: e.y,
                  color: "#d6ecff",
                  life: 0.3,
                  maxLife: 0.3,
                });
              }
            }
          }
        }
        gameState.spawnParticle({
          kind: "ring",
          x: this.target.x,
          y: this.target.y,
          color: "rgba(214,236,255,0.8)",
          size: s.stun.radius,
          life: 0.4,
          maxLife: 0.4,
        });
      }
    } else {
      const wasAlive = this.target.alive;
      const hpBefore = this.target.hp;
      this.target.takeDamage(dmg, options, gameState);
      if (this.owner) {
        this.owner.dmgDealt += Math.max(0, hpBefore - this.target.hp);
      }
      if (wasAlive && !this.target.alive && this.owner) {
        this.owner.kills += 1;
        const k = this.owner.kills;
        if (k === 10 || k === 30 || k === 100 || k === 200 || k === 500) {
          gameState._towerMilestone?.(this.owner, k);
        }
      }
    }
    if (s.acidPool && gameState.spawnHazard) {
      gameState.spawnHazard({
        x: this.target.x,
        y: this.target.y,
        radius: s.acidPool.radius,
        dps: s.acidPool.dps,
        duration: s.acidPool.duration,
        type: "acid",
        owner: this.owner,
      });
    }
    gameState.spawnParticle({
      kind: "splat",
      x: this.target.x,
      y: this.target.y,
      color: "rgba(80,40,20,0.7)",
      size: 4 + Math.random() * 3,
      life: 0.35,
      maxLife: 0.35,
      vx: (Math.random() - 0.5) * 30,
      vy: (Math.random() - 0.5) * 30,
    });
    const rippleColors = {
      plunger: "rgba(212,74,74,0.7)",
      suction: "rgba(168,224,186,0.75)",
      chemical: "rgba(168,224,125,0.7)",
    };
    gameState.spawnParticle({
      kind: "ring",
      x: this.target.x,
      y: this.target.y,
      color: rippleColors[this.towerType] || "rgba(255,255,255,0.55)",
      size: (this.target.def?.radius || 10) + 3,
      life: 0.22,
      maxLife: 0.22,
    });
    for (let i = 0; i < 2; i++) {
      const a = Math.random() * Math.PI * 2;
      gameState.spawnParticle({
        kind: "spark",
        x: this.target.x,
        y: this.target.y,
        color: rippleColors[this.towerType] || "#ffffff",
        life: 0.2 + Math.random() * 0.1,
        maxLife: 0.3,
        vx: Math.cos(a) * (60 + Math.random() * 50),
        vy: Math.sin(a) * (60 + Math.random() * 50) - 10,
      });
    }
  }
}

export class Hazard {
  constructor({ x, y, radius, dps, duration, type = "acid", owner = null }) {
    this.id = uid();
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.dps = dps;
    this.duration = duration;
    this.maxDuration = duration;
    this.type = type;
    this.owner = owner;
    this.alive = true;
    this.tickInterval = 0.3;
    this.tickTimer = 0;
    this.seed = Math.random() * 1000;
  }

  update(dt, gameState) {
    if (!this.alive) return;
    this.duration -= dt;
    if (this.duration <= 0) {
      this.alive = false;
      return;
    }
    this.tickTimer -= dt;
    if (this.tickTimer <= 0) {
      this.tickTimer = this.tickInterval;
      const baseTickDmg = this.dps * this.tickInterval;
      const ownerStats = this.owner?.getStats?.();
      const bossBonus = ownerStats?.passive?.bossBonusMul || 1;
      for (const e of gameState.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(e.x - this.x, e.y - this.y);
        if (d <= this.radius) {
          let tickDmg = baseTickDmg;
          if (e.type === "boss" && bossBonus > 1) tickDmg *= bossBonus;
          if (gameState.hero?.id === "seongjin") tickDmg *= 1.1;
          if (gameState.scanBuffTimer > 0) tickDmg *= 1.5;
          const wasAlive = e.alive;
          e.takeDamage(
            tickDmg,
            { source: "acid", towerType: "chemical", armorPierce: 4 },
            gameState,
          );
          if (wasAlive && !e.alive && this.owner) this.owner.kills += 1;
        }
      }
    }
  }
}

export class Particle {
  constructor(opts) {
    this.id = uid();
    Object.assign(this, opts);
    if (this.vx === undefined) this.vx = 0;
    if (this.vy === undefined) this.vy = 0;
    if (this.maxLife === undefined) this.maxLife = this.life;
    this.alive = true;
  }

  update(dt) {
    this.life -= dt;
    if (this.life <= 0) {
      this.alive = false;
      return;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.kind === "splat" || this.kind === "spark") {
      this.vy += 80 * dt;
    }
    if (this.kind === "ring") {
      this.size += 60 * dt;
    }
    if (this.kind === "money" || this.kind === "text") {
      this.vy *= 0.95;
    }
  }
}
