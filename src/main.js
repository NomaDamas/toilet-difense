import { Game } from "./game.js";
import { TIPS } from "./config.js";

const loading = document.getElementById("loading");
const tipEl = document.getElementById("loadingTip");
let tipIdx = 0;
const rotateTip = () => {
  tipIdx = (tipIdx + 1) % TIPS.length;
  if (tipEl) tipEl.textContent = TIPS[tipIdx];
};
const tipInterval = setInterval(rotateTip, 2200);

const canvas = document.getElementById("game");
const game = new Game(canvas);
window.__game = game;

const startedAt = performance.now();
const finishLoading = () => {
  loading.classList.add("hidden");
  clearInterval(tipInterval);
};

const isReady = () => game.scene === "menu" && !!game.ui;
const tryHide = () => {
  const elapsed = performance.now() - startedAt;
  if (isReady() && elapsed >= 800) {
    finishLoading();
    return;
  }
  if (elapsed >= 4000) {
    finishLoading();
    return;
  }
  requestAnimationFrame(tryHide);
};
requestAnimationFrame(tryHide);
