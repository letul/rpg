// ===== 저장 및 영구 성장 특성판, 모험 도감, 다채로운 업적, 키 설정 관리 시스템 =====

const SAVE_KEY = 'ROGUE_RPG_SAVE_V2';

class SaveManager {
  constructor() {
    this.data = this.getDefaultSave();
    this.load();
  }

  getDefaultKeybinds() {
    return {
      skillQ: 'q',
      skillE: 'e',
      skillR: 'r',
      skillUlt: 'f',
      dash: ' ',
      interact: 'g',
      pot1: '1',
      pot2: '2',
      pot3: '3',
      pot4: '4',
      inventory: 'i',
      skills: 'k',
      codex: 'b'
    };
  }

  getDefaultSave() {
    return {
      soulStones: 60, // 초기 영혼석 지급 (영구성장제단 즉시 체험 및 특성 해금 가능)
      unlockedClasses: ['warrior', 'assassin', 'mage', 'archer', 'paladin', 'summoner'],
      talents: {},    // 신규 영구 성장 특성판 (무기/스킬/궁극기/생존)
      upgrades: {},   // 구버전 호환용
      stats: {
        monstersKilled: 0,
        bossesKilled: 0,
        shopPurchases: 0,
        goldCollected: 0,
        soulsCollected: 0,
        skillsUsed: 0,
        dashesUsed: 0,
        legendaryFound: 0,
        runsStarted: 0,
        demonKingKilled: 0
      },
      settings: {
        masterVol: 70,
        sfxVol: 80,
        bgmVol: 50,
        showDmgText: true,
        screenShake: true,
        keybinds: this.getDefaultKeybinds()
      },
      codex: {
        monsters: {},
        bosses: {},
        weapons: {},
        armors: {},
        accessories: {},
        relics: {}
      },
      achievements: {}
    };
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const def = this.getDefaultSave();
        this.data = {
          ...def,
          ...parsed,
          stats: { ...def.stats, ...(parsed && typeof parsed.stats === 'object' ? parsed.stats : {}) },
          talents: { ...(parsed && typeof parsed.talents === 'object' ? parsed.talents : {}) },
          settings: {
            ...def.settings,
            ...(parsed && typeof parsed.settings === 'object' ? parsed.settings : {}),
            keybinds: {
              ...this.getDefaultKeybinds(),
              ...(parsed?.settings && typeof parsed.settings.keybinds === 'object' ? parsed.settings.keybinds : {})
            }
          },
          codex: {
            monsters: { ...(parsed?.codex?.monsters || {}) },
            bosses: { ...(parsed?.codex?.bosses || {}) },
            weapons: { ...(parsed?.codex?.weapons || {}) },
            armors: { ...(parsed?.codex?.armors || {}) },
            accessories: { ...(parsed?.codex?.accessories || {}) },
            relics: { ...(parsed?.codex?.relics || {}) }
          },
          achievements: { ...(parsed && typeof parsed.achievements === 'object' ? parsed.achievements : {}) }
        };
        if (!this.data.soulStones || this.data.soulStones < 60) this.data.soulStones = 60;
      }
    } catch (e) {
      console.warn('저장 데이터 로드 실패, 기본값 초기화', e);
      this.data = this.getDefaultSave();
    }
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('저장 실패', e);
    }
  }

  // 영혼석 추가
  addSoulStones(amount) {
    this.data.soulStones = (this.data.soulStones || 0) + amount;
    this.recordStat('soulsCollected', amount);
    this.save();
    if (window.UI) window.UI.updatePlayerHUD();
  }

  // 특성 레벨 조회
  getTalentLevel(talentId) {
    return (this.data.talents && this.data.talents[talentId]) || 0;
  }

  // 영구 성장 특성판 구매
  buyTalent(talentId) {
    const tDef = TALENT_TREE.find(t => t.id === talentId);
    if (!tDef) return false;
    const curLv = this.getTalentLevel(talentId);
    if (curLv >= tDef.maxLv) return false;

    const cost = tDef.baseCost + curLv * tDef.costMul;
    if ((this.data.soulStones || 0) < cost) return false;

    this.data.soulStones -= cost;
    this.data.talents[talentId] = curLv + 1;
    this.save();

    // 현재 플레이어 실시간 스탯 및 효과 갱신
    if (window.Game && window.Game.player) {
      window.Game.player.applyPermanentUpgrades();
      if (window.UI) {
        window.UI.updatePlayerHUD();
        window.UI.renderInventory();
      }
    }
    return true;
  }

  // 통계 누적 기록 및 업적 달성 검사
  recordStat(key, amount = 1) {
    if (!this.data.stats) this.data.stats = this.getDefaultSave().stats;
    this.data.stats[key] = (this.data.stats[key] || 0) + amount;
    this.checkAchievements();
    this.save();
  }

  // 업적 달성 검사
  checkAchievements() {
    ACHIEVEMENTS.forEach(ach => {
      if (!this.data.achievements[ach.id]) {
        const current = this.data.stats[ach.statKey] || 0;
        if (current >= ach.target) {
          this.data.achievements[ach.id] = true;
          this.addSoulStones(ach.reward);
          if (window.UI) {
            window.UI.showToast(`🏆 업적 달성: [${ach.name}]! (보상: 💎 ${ach.reward})`);
          }
          if (window.Sound) Sound.playLevelUp();
        }
      }
    });
  }

  // 특정 업적 강제 해금
  unlockAchievement(achId) {
    if (!this.data.achievements) this.data.achievements = {};
    // 별칭 매핑 (호환성)
    if (achId === 'legendary_finder') achId = 'legendary_1';
    if (achId === 'first_blood') achId = 'kill_10';

    if (!this.data.achievements[achId]) {
      this.data.achievements[achId] = true;
      const ach = (typeof ACHIEVEMENTS !== 'undefined') ? ACHIEVEMENTS.find(a => a.id === achId) : null;
      if (ach) {
        this.addSoulStones(ach.reward);
        if (window.UI) {
          window.UI.showToast(`🏆 업적 달성: [${ach.name}]! (보상: 💎 ${ach.reward})`);
        }
        if (window.Sound) Sound.playLevelUp();
      }
      this.save();
    }
  }

  // 도감 등록
  recordCodex(category, id) {
    if (!id) return;
    if (!this.data.codex[category]) this.data.codex[category] = {};
    if (!this.data.codex[category][id]) {
      this.data.codex[category][id] = true;
      this.save();
    }
  }

  // 키 바인딩 제어
  getKeybinds() {
    return this.data.settings.keybinds || this.getDefaultKeybinds();
  }

  getKeybind(action) {
    const binds = this.getKeybinds();
    const val = (binds && binds[action]) || this.getDefaultKeybinds()[action];
    return typeof val === 'string' ? val : ' ';
  }

  setKeybind(action, key) {
    if (!this.data.settings.keybinds) {
      this.data.settings.keybinds = this.getDefaultKeybinds();
    }
    this.data.settings.keybinds[action] = String(key).toLowerCase();
    this.save();
    if (window.UI) window.UI.updateHUDKeyLabels();
  }

  resetKeybinds() {
    this.data.settings.keybinds = this.getDefaultKeybinds();
    this.save();
    if (window.UI) {
      window.UI.updateHUDKeyLabels();
      window.UI.renderSettings();
      window.UI.showToast('⌨️ 조작 키 설정이 기본값으로 초기화되었습니다.');
    }
  }
}

const Save = new SaveManager();
window.Save = Save;
