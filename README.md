# 🚽 NomaDamas Toilet Defense — 변기톤

> **🏆 변기톤 (Toilet-thon) 우승작** — NomaDamas hacker house · Sisyphus Labs · 토큰 후원 by 연규 Kim

5층 배관에 **키친타월·물티슈·콘택트렌즈**가 흘러들어오기 전에 막아내는 Kingdom Rush-style 타워 디펜스.
한 번 막히면 **₩1,500,000** 청구서가 도착합니다.

**Plain HTML + Canvas 2D + ES modules. 빌드 체인 없음. 의존성 0. 백엔드 없음. 정적 호스팅 가능.**

---

## 🎮 데모 / 즉시 플레이

```bash
# 정적 서버 한 줄
python3 -m http.server 9999
# → http://127.0.0.1:9999/
```

또는 Node:

```bash
npx --yes serve -l 9999 .
```

ES modules가 `file://`에서 안 되니까 반드시 HTTP로 띄워야 함.

---

## ⚡ 빠른 시작

| 단축키 | 동작 |
|---|---|
| `1`·`2`·`3`·`4` | 타워 선택 (두 번 누르면 같은 타입 빌트 타워 순회) |
| 빈 슬롯 클릭 | 타워 설치 |
| 타워 클릭 | 업그레이드 / 매각 |
| `T` | 타겟 모드 변경 (선두 / 위협 / 최강 / 후미 / 근접) |
| `Q` | 영웅 능력 발동 |
| **`E`** | 🚿 응급 분사 (도구) |
| **`R`** | 🛑 임시 차단막 (도구) |
| **`F`** | 📞 김반장 출장 (도구) |
| `Space` | 일시정지 (8 통계 패널) |
| `+` / `-` | 게임 속도 |
| `M` | 사운드 토글 |
| `O` | 설정 (볼륨 슬라이더 · 색맹 모드) |
| `U` | 직전 판매 취소 (5초 윈도우) |
| `H` / `?` | 단축키 도움말 |
| `Esc` / 우클릭 | 메뉴 닫기 |

---

## 🏗️ 게임 구성

### 스테이지 3개

1. **🚿 세면대 (Sink)** — 10 웨이브 · 입문용
2. **🚽 변기 (Toilet)** — 14 웨이브 · 2개 입구 · 물티슈 도미넌트
3. **🌊 메인 오수관 (Main Pipe)** — 18 웨이브 · 3개 입구 · **정체불명의 물질 보스**

### 난이도 (모디파이어 컬러 배지로 표시)

- 🟢 **출장 (Easy)** — HP −30% / 보상 +40% / 목숨 **5**
- 🟢 **관통기 (Normal)** — 표준 / 목숨 **3**
- 🔴 **고압세척 (Hard)** — HP +40% / 보상 −15% / 목숨 **2**

### 영웅 3명 (HUD 카드에 패시브 아이콘 배지)

- **💰 철사블 / Cheolsable** — Funder. 시작 자금 +30% · 처치 보상 +5%
  *"Pay the Invoice"* (₩80,000) — 화면 모든 적 즉사 + 보스 −30% HP
- **📋 제프리 / Jeffrey** — Organizer. 타워 비용 −8%
  *"Rules Poster"* (무료, 50초 쿨다운) — 적 4초 혼란
- **🩺 민성진 / Min Seongjin** — Diagnostician. 적 HP 상시 표시 · 모든 타워 +10% DMG
  *"Diagnostic Scan"* (₩40,000) — 6초간 +50% DMG + 보스 면역 무효

### 타워 4종 + 각 A/B 분기 업그레이드

| 키 | 타워 | 비용 | 타입 | 분기 A | 분기 B |
|---|---|---|---|---|---|
| `1` | 🔨 **뚫어뻥** | ₩12,000 | 물리·푸시백 | 더블 액션 (속도 ×2) | 진공 (블랙홀 흡입) |
| `2` | 💨 **석션** | ₩20,000 | 흡입·HP <30% 처형 ×2.5 | 공업용 (키친타월 ×2.4) | 역류 (스턴 + 연쇄) |
| `3` | 🧪 **배수구 세정제** | ₩20,000 | 화학·광역 | 강산성 (웅덩이) | 렌즈 용해제 |
| `4` | 👥 **배관공 양성소** | ₩18,000 | 근접·유닛 | 마스터 배관공 | 견습 분대 ×4 |

각 타워는 **킬 카운트에 따라 랭크 링**이 둘러쌈:
🥉 Bronze (10+) · 🥈 Silver (30+) · 🥇 Gold (100+) · 💎 Diamond (200+) · 👑 Legend (500+)

### 적 6종

| 적 | HP | 약점 |
|---|---|---|
| 🧻 물티슈 | 95 + 화학저항 40% | 뚫어뻥 / 석션 / 산성 웅덩이 |
| 📜 휴지 | 30 (빠름·무리) | 화학 광역 |
| 👁 콘택트렌즈 | 28 + **35% 회피** | 렌즈 용해제 (즉사) |
| 💊 인공눈물 캡 | 70 + 분열 | 마스터 배관공 (분열 X) |
| 🟨 키친타월 | 260 + 갑옷 4 | **공업용 석션 ×2.4** |
| 👹 **정체불명의 물질** (보스) | 6,000 + 갑옷 5 + 모든 저항 | **4종 타워 다양화 + 능동 도구 (E·R·F)** |

---

## 👹 보스전 — 진짜 보스 메커니즘

**정체불명의 물질**은 단순한 거대 HP 적이 아닙니다:

### Stats
- HP **6,000** · 속도 **14** (느림) · 갑옷 **5**
- **넉백 저항 92%** (진공 뚫어뻥에 거의 안 밀림)
- **스턴 저항 85%** · **슬로우 저항 70%**

### 4단계 페이즈

| HP % | 페이즈 | 행동 |
|---|---|---|
| 100% → 50% | **정상** | 갈색 그라데이션 |
| < 50% | **격분** | 오렌지 + 외곽 글로우 + 속도 **+35%** · "⚠ 보스 격분" flash |
| < 50% 지속 | **점액 소환** | 매 **5초** 미세 잔해 2마리 좌우 spawn |
| < 15% | **광폭화** | 빨강 + 골든 스파크 + **속도 ×2.2** + **모든 저항 해제** |

### 능동 능력

- **🛡 적응형 면역** — 매 **5.5초** 4종 타워 면역 자동 로테이션. 빨간 ring + 라벨로 알림
- **🧪 산성 분사** — 매 **10초** 가장 가까운 타워를 **3초 비활성화**
- **👹 점액 소환** (50% HP 이하) — 매 5초 미세 잔해 spawn

→ 단일 타워 화력으로는 절대 못 잡음. **4종 타워 균형 + 능동 도구 타이밍**이 필수.

---

## 🧰 능동 도구 (타워 디펜스 ⊕ 능동 개입)

타워만 짓고 끝이 아닙니다. 위기에 직접 개입할 수 있는 3개 도구:

| 키 | 도구 | 비용 | 쿨다운 | 효과 |
|---|---|---|---|---|
| `E` | 🚿 **응급 분사** | **무료** | 18초 | 클릭 지점 90px 반경 적에 24 dmg + 70px 밀어내기 |
| `R` | 🛑 **임시 차단막** | ₩30,000 | 28초 | 클릭 지점 38px 반경 5초간 적 차단 (스턴 묶음) |
| `F` | 📞 **김반장 출장** | ₩150,000 | 75초 | 보스/최강 적 320 dmg (면역 무시) + 화면 모든 적 3초 스턴 |

HUD 좌하단에 3개 박스로 표시 — 쿨다운 시 비율 차오름, 자금 부족 시 빨간 라벨.

---

## 🏆 업적 10개 (영속)

🩸 첫 처리 · 🌊 첫 청소 · 👹 보스 헌터 · 🛡️ 완벽 차단 (누수 0 웨이브) · 💰 ₩100만 매출 · 🏆 S 등급 · 🔥 콤보 ×10 · 🚽 3 스테이지 클리어 · 💀 고압세척 정복 · 🤫 치트 사용

메인 메뉴 우측에 진행 상황 + 해금 배지 아이콘 표시. 누적 통계 (kill·완주·실패·보스·콤보·등급) 영속화.

---

## 🤫 숨겨진 치트 (글자/시퀀스 입력)

| 입력 | 효과 |
|---|---|
| `150` | ₩1,500,000 + 보스 즉시 소환 |
| `demoday` | ₩500,000 + 라이프 +5 |
| `kim` | 키친타월 5개 즉시 투기 |
| `tossme` | ₩100,000 + 10초간 모든 타워 +50% DMG |
| `wifi` | 모든 적 진단 정보 노출 |
| **`↑↑↓↓←→←→BA`** | 🎮 **코나미** — ₩999,999 + 30초 무적 + 10 라이프 |

---

## 🎯 핵심 메커니즘

- **콤보 시스템**: ×3 = +10%, ×5 = +25%, ×8 = +50%, ×10 = +50% + 콤보 마스터 업적
- **시너지 보너스**: 인접 타워 100px 이내 1대당 +5% DMG (최대 +20%)
- **호버 미니카드**: 타워에 마우스 올리면 RNG/DMG/RATE/DPS/킬수 즉시 표시
- **빌드 모드 커버리지**: 빌드 시 모든 기존 타워 사거리 반투명 원 표시
- **타게팅 라인**: 발사 중 타워에서 타겟까지 색상별 점선
- **자동 일시정지**: 탭 블러 시 자동 일시정지
- **판매 안전장치**: ₩30,000+ 투자 타워는 1.5초 내 두 번째 클릭 필요
- **판매 취소**: `U` 키로 5초 내 직전 판매 복구
- **웨이브 회상 토스트**: 매 웨이브 종료 시 "+N킬 · +₩Y · Z 누수"
- **보스 레이더**: 보스 등장 시 화면 가장자리 빨간 화살표
- **새 타워 타겟 모드 상속**: `T`로 모드 변경하면 이후 신규 타워 기본값으로
- **마지막 출장 재도전**: 메인 메뉴 🔁 버튼으로 즉시 직전 설정 재시작

---

## ♿ 접근성

- **색맹 모드** (설정 → ♿ 토글): 모든 적 위에 흰색 outline + 라벨 `[W][P][L][C][m][K][B]`
- **사운드**: 5단계 볼륨 슬라이더 + `M` 키 토글
- **모든 기능 키보드 접근 가능** (`H` 키로 단축키 도움말)

---

## 📊 통계 + 등급

게임 종료 시 **S/A/B/C/D/F 등급 배지** 표시 (HP·웨이브·콤보·보스 처치 등 가중 점수).

거래 명세서 (인보이스) 풀 렌더링: 7개 line item, ₩1,500,000, 김반장 정신적 피해 +₩90k, A/S 불가, 약관 9조 3항. 등급 배지 + DPS 패널 (상위 4 타워 킬·누적 데미지) 포함.

---

## 💾 저장 데이터

`localStorage["nomadamas_toilet_defense_v1"]` 키로 영속화:
- 스테이지별 별점·최고 난이도·최고 라이프·잔여 자금
- 누적 통계 (kill/earned/escaped/peakCombo/bestWave/bestGrade/bossesKilled/runsCompleted/runsLost)
- 업적 해금 + 해금 시각
- 설정 (sfxOn, volume, colorblind)
- 마지막 출장 설정 (재도전용)

리셋: 브라우저 콘솔에서 `localStorage.clear()`.

---

## 🚀 배포

### GitHub Pages (추천)

```bash
./deploy.sh "your-username/backflow"
```

자세한 건 [`deploy.sh`](./deploy.sh) 참고. `gh` CLI ([설치](https://cli.github.com)) 필요.

수동:

```bash
git init
git add -A
git commit -m "변기톤 빌드"
gh repo create backflow --public --source=. --push
gh api -X POST "repos/{owner}/backflow/pages" -f "source[branch]=main" -f "source[path]=/"
# → https://{owner}.github.io/backflow/
```

### Vercel

```bash
npx vercel --prod
```

### Netlify Drop

[netlify.com/drop](https://app.netlify.com/drop) 에 폴더 드래그.

### 그냥 친구한테 zip 보내기

```bash
zip -r backflow.zip . -x ".git/*" "*.png" ".sisyphus/*" ".playwright-mcp/*"
```

받은 사람은 압축 풀고 `python3 -m http.server` 한 줄.

---

## 🗂️ 프로젝트 구조

```
index.html                entry, canvas, loading screen
style.css                 global styles + loading animation
deploy.sh                 GitHub Pages one-command deploy
src/
  main.js                 bootstrap + loading screen ready-check
  game.js                 Game class, scene manager, run state, tools, cheats
  config.js               타워/적/영웅/난이도/도구/보스능력/인보이스/팁/크레딧
  levels.js               3 levels (paths, slots, waves, bg stickers)
  path.js                 path math (waypoints → position lookup)
  entities.js             Enemy / Tower / Projectile / PlumberUnit / Particle / Hazard
  waves.js                WaveManager (spawn schedule, wave bonuses)
  sprites.js              procedural canvas drawing (towers, enemies, FX)
  ui.js                   menus, HUD, dialogs, build/upgrade panels, overlays
  input.js                mouse + keyboard handlers, cheat buffer
  audio.js                Web Audio API SFX (procedural, volume control)
  storage.js              localStorage + achievements + lifetime stats + lastConfig
  humor.js                plumber lines, wave intros, death lines, tower tooltips
```

총 **~9,800 LOC** 순수 JS · 의존성 0 · 빌드 없음

---

## ✅ 테스트 환경

- Chrome 119+ · Safari 17+ · Firefox 120+
- 데스크탑 · iPad (Safari) · 노트북 모두 동작
- 키친타월 검출 시 즉시 A/S 무효 ⚠

---

## 🙏 크레딧

- **Studio**: Sisyphus Labs
- **Event**: 변기톤 (Toilet-thon) at NomaDamas hacker house
- **Token sponsor**: 연규 Kim
- **김반장**: 노마다마스 5F 단골 배관 출장기사 (Q4 단가 인상 예정)
- **5층 변기**: 진짜 antagonist

---

**키친타월 절대 금물.** 🚽

— 노마다마스 5F 화장실 벽 글귀
