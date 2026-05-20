export class WaveManager {
  constructor(level, difficulty) {
    this.level = level;
    this.difficulty = difficulty;
    this.waves = level.waves;
    this.waveIndex = -1;
    this.preTimer = 0;
    this.active = null;
    this.spawnSchedule = [];
    this.lastSpawnTime = 0;
    this.totalSpawned = 0;
    this.totalKilled = 0;
    this.totalEscaped = 0;
    this.allCleared = false;
    this.waitingAutoStart = false;
    this.bossSpawned = false;
  }

  currentWave() {
    return this.waveIndex >= 0 && this.waveIndex < this.waves.length
      ? this.waves[this.waveIndex]
      : null;
  }

  isFinalWave() {
    return this.waveIndex === this.waves.length - 1;
  }

  hasMore() {
    return this.waveIndex < this.waves.length - 1;
  }

  prepareNextWave() {
    this.waveIndex++;
    const wave = this.currentWave();
    if (!wave) return;
    this.preTimer = wave.delay;
    this.waitingAutoStart = true;
    this.spawnSchedule = [];
    this.active = null;
  }

  startWave(gameState) {
    const wave = this.currentWave();
    if (!wave) return;
    this.active = wave;
    this.waitingAutoStart = false;
    this.preTimer = 0;
    this.spawnSchedule = [];
    for (const grp of wave.groups) {
      const groupDelay = grp.delay || 0;
      for (let i = 0; i < grp.count; i++) {
        this.spawnSchedule.push({
          type: grp.type,
          path: grp.path || 0,
          at: groupDelay + i * grp.spacing,
        });
      }
    }
    this.spawnSchedule.sort((a, b) => a.at - b.at);
    this.spawnElapsed = 0;
    gameState.onWaveStart(this.waveIndex, wave);
  }

  update(dt, gameState) {
    if (this.waitingAutoStart) {
      this.preTimer -= dt;
      if (this.preTimer <= 0) {
        this.startWave(gameState);
      }
      return;
    }
    if (this.active) {
      this.spawnElapsed += dt;
      while (
        this.spawnSchedule.length > 0 &&
        this.spawnSchedule[0].at <= this.spawnElapsed
      ) {
        const entry = this.spawnSchedule.shift();
        gameState.spawnEnemy({ type: entry.type, pathIndex: entry.path });
        this.totalSpawned++;
      }
      if (
        this.spawnSchedule.length === 0 &&
        gameState.enemies.filter((e) => e.alive).length === 0
      ) {
        this.endWave(gameState);
      }
    }
  }

  endWave(gameState) {
    const wave = this.active;
    this.active = null;
    gameState.onWaveCleared(this.waveIndex, wave);
    if (this.hasMore()) {
      this.prepareNextWave();
    } else {
      this.allCleared = true;
      gameState.onAllWavesClear();
    }
  }

  skipPreparation() {
    if (this.waitingAutoStart) {
      this.preTimer = 0;
    }
  }
}
