const KEY = "nomadamas_toilet_defense_v1";

const DEFAULT_DATA = {
  scores: {},
  unlocked: { sink: true, toilet: false, mainpipe: false },
  settings: { sfxOn: true, muteMusic: true, volume: 0.35 },
  totalRuns: 0,
  lifetime: {
    totalKills: 0,
    totalEarned: 0,
    totalEscaped: 0,
    peakCombo: 0,
    bestWaveReached: 0,
    bestGrade: "—",
    bossesKilled: 0,
    runsCompleted: 0,
    runsLost: 0,
  },
  achievements: {},
  lastConfig: null,
};

export const ACHIEVEMENTS = [
  { id: "first_kill", icon: "🩸", name: "첫 처리", desc: "잔해 첫 처리" },
  { id: "first_wave", icon: "🌊", name: "첫 청소", desc: "웨이브 1 완료" },
  { id: "first_boss", icon: "👹", name: "보스 헌터", desc: "정체불명의 물질 격파" },
  { id: "no_escape", icon: "🛡️", name: "완벽한 차단", desc: "단 한 마리도 누수 없이 웨이브 클리어" },
  { id: "millionaire", icon: "💰", name: "₩100만 매출", desc: "누적 ₩1,000,000 획득" },
  { id: "grade_s", icon: "🏆", name: "S 등급", desc: "S 등급 달성" },
  { id: "combo_10", icon: "🔥", name: "콤보 마스터", desc: "콤보 ×10 도달" },
  { id: "all_stages", icon: "🚽", name: "5층 책임자", desc: "세면대·변기·메인오수관 모두 클리어" },
  { id: "hard_clear", icon: "💀", name: "고압세척 정복", desc: "고압세척 난이도 클리어" },
  { id: "cheat_master", icon: "🤫", name: "내부자", desc: "치트 사용 (150/demoday/kim/tossme/wifi)" },
];

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw);
    const merged = { ...structuredClone(DEFAULT_DATA), ...parsed };
    merged.lifetime = {
      ...structuredClone(DEFAULT_DATA.lifetime),
      ...(parsed.lifetime || {}),
    };
    merged.settings = {
      ...structuredClone(DEFAULT_DATA.settings),
      ...(parsed.settings || {}),
    };
    merged.achievements = { ...(parsed.achievements || {}) };
    return merged;
  } catch (e) {
    return structuredClone(DEFAULT_DATA);
  }
}

function write(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {}
}

export function loadProgress() {
  return read();
}

export function saveLevelScore(levelId, payload) {
  const data = read();
  const prev = data.scores[levelId];
  const next = {
    stars: Math.max(prev?.stars ?? 0, payload.stars),
    bestPipeIntegrity: Math.max(
      prev?.bestPipeIntegrity ?? 0,
      payload.pipeIntegrity,
    ),
    bestUnusedFunds: Math.max(
      prev?.bestUnusedFunds ?? 0,
      payload.unusedFunds,
    ),
    bestDifficulty:
      rankDifficulty(payload.difficulty) >
      rankDifficulty(prev?.bestDifficulty ?? "easy")
        ? payload.difficulty
        : (prev?.bestDifficulty ?? "easy"),
    completed: true,
  };
  data.scores[levelId] = next;
  data.totalRuns += 1;
  if (levelId === "sink") data.unlocked.toilet = true;
  if (levelId === "toilet") data.unlocked.mainpipe = true;
  write(data);
  return data;
}

function rankDifficulty(d) {
  return { easy: 1, normal: 2, hard: 3 }[d] || 0;
}

export function setSetting(key, value) {
  const data = read();
  data.settings[key] = value;
  write(data);
  return data;
}

export function resetAll() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {}
  return structuredClone(DEFAULT_DATA);
}

const GRADE_RANK = { S: 6, A: 5, B: 4, C: 3, D: 2, F: 1, "—": 0 };

export function saveLastConfig(config) {
  const data = read();
  data.lastConfig = {
    levelId: config.levelId,
    heroId: config.heroId,
    difficultyId: config.difficultyId,
    savedAt: Date.now(),
  };
  write(data);
  return data;
}

export function unlockAchievement(id) {
  const data = read();
  if (data.achievements[id]) return { data, newlyUnlocked: false };
  const def = ACHIEVEMENTS.find((a) => a.id === id);
  if (!def) return { data, newlyUnlocked: false };
  data.achievements[id] = { unlockedAt: Date.now() };
  write(data);
  return { data, newlyUnlocked: true, def };
}

export function recordRunStats(runStats) {
  const data = read();
  const lt = data.lifetime;
  lt.totalKills += runStats.kills || 0;
  lt.totalEarned += runStats.earned || 0;
  lt.totalEscaped += runStats.escaped || 0;
  if ((runStats.peakCombo || 0) > lt.peakCombo) lt.peakCombo = runStats.peakCombo;
  if ((runStats.waveReached || 0) > lt.bestWaveReached) lt.bestWaveReached = runStats.waveReached;
  if (runStats.bossKilled) lt.bossesKilled += 1;
  if (runStats.outcome === "win") lt.runsCompleted += 1;
  if (runStats.outcome === "loss") lt.runsLost += 1;
  if (runStats.grade && (GRADE_RANK[runStats.grade] || 0) > (GRADE_RANK[lt.bestGrade] || 0)) {
    lt.bestGrade = runStats.grade;
  }
  write(data);
  return data;
}
