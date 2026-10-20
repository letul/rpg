// ===== 랜덤 던전 생성 및 방 노드 흐름 시스템 =====

class DungeonManager {
  constructor() {
    this.currentAreaIndex = 0; // 0~5 (지역 1~6)
    this.currentRoomIndex = 0;
    this.rooms = [];
    this.currentRoom = null;
  }

  // 새로운 지역 생성
  generateArea(areaIndex = 0) {
    this.currentAreaIndex = areaIndex;
    const areaDef = DUNGEON_AREAS[this.currentAreaIndex];

    // 방 시퀀스 구조: 빈 방 없이 바로 전투 시작 & 상점 자주 출현 (2회 확정 배치)
    // 0: 전투(입구) -> 1: 상점(교차로) -> 2: 심층 전투 -> 3: 도전방/이벤트 -> 4: 두번째 상점(암시장) -> 5: 정예방 -> 6: 모닥불 휴식 -> 7: 보스전
    const roomPlan = [
      { type: 'BATTLE', name: '던전 전초기지' },
      { type: 'SHOP', name: '방랑 상인의 교차로' },
      { type: 'BATTLE', name: '심층 전투 구역' },
      { type: Math.random() < 0.6 ? 'CHALLENGE' : 'EVENT', name: '미지의 회랑' },
      { type: 'SHOP', name: '지하 암시장' },
      { type: 'ELITE', name: '정예 군주의 회랑' },
      { type: 'REST', name: '안식의 모닥불' },
      { type: 'BOSS', name: `${areaDef.name} 심장부` }
    ];

    this.rooms = roomPlan.map((p, idx) => ({
      index: idx,
      type: p.type,
      name: p.name,
      cleared: false,
      visited: idx === 0,
      chest: null,
      portalActive: false
    }));

    this.currentRoomIndex = 0;
    this.currentRoom = this.rooms[0];

    if (window.UI) {
      window.UI.renderMinimap();
      window.UI.showToast(`🗺️ ${areaDef.name} (${areaDef.stars}) 에 진입했습니다!`);
    }
  }

  // 다음 방으로 진행
  advanceToNextRoom() {
    if (this.currentRoomIndex + 1 < this.rooms.length) {
      this.currentRoomIndex++;
      this.currentRoom = this.rooms[this.currentRoomIndex];
      this.currentRoom.visited = true;

      // 3D 씬 세팅 및 오브젝트/몬스터 스폰
      Game.loadRoomScene(this.currentRoom);
      if (window.UI) window.UI.renderMinimap();
    } else {
      // 보스방 클리어 후 다음 지역으로
      if (this.currentAreaIndex + 1 < DUNGEON_AREAS.length) {
        this.generateArea(this.currentAreaIndex + 1);
        Game.loadRoomScene(this.rooms[0]);
      } else {
        // 최종 마왕 처치 -> 게임 승리!
        Game.onGameVictory();
      }
    }
  }

  // 무작위 장비 드랍 생성 (희귀도 및 무작위 옵션 부여 - 등급별 스탯 완벽 스케일링)
  generateLoot(minRarity = 'COMMON', bonusLuck = 0) {
    const rarityTiers = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];
    const minTierIdx = Math.max(0, rarityTiers.indexOf(minRarity));

    // 1. 등급 결정
    const roll = Math.random() + bonusLuck;
    let rIdx = 0;
    if (roll > 0.94) rIdx = 5;      // MYTHIC
    else if (roll > 0.78) rIdx = 4; // LEGENDARY
    else if (roll > 0.55) rIdx = 3; // EPIC
    else if (roll > 0.32) rIdx = 2; // RARE
    else if (roll > 0.15) rIdx = 1; // UNCOMMON
    else rIdx = 0;                  // COMMON

    // minRarity 보장
    if (rIdx < minTierIdx) rIdx = minTierIdx;
    const rKey = rarityTiers[rIdx];
    const rarityDef = RARITY[rKey] || RARITY.COMMON;

    // 2. 종류 선택 (무기, 방어구, 장신구 중 1개)
    const categoryRoll = Math.random();
    let baseItem = null;

    if (categoryRoll < 0.4) {
      // 무기
      const keys = Object.keys(WEAPONS);
      const chosen = keys[Math.floor(Math.random() * keys.length)];
      baseItem = { ...WEAPONS[chosen] };
    } else if (categoryRoll < 0.75) {
      // 방어구
      const keys = Object.keys(ARMORS);
      const chosen = keys[Math.floor(Math.random() * keys.length)];
      baseItem = { ...ARMORS[chosen] };
    } else {
      // 장신구
      const keys = Object.keys(ACCESSORIES);
      const chosen = keys[Math.floor(Math.random() * keys.length)];
      baseItem = { ...ACCESSORIES[chosen] };
    }

    baseItem.rarity = rKey;

    // 등급별 기본 스탯 스케일링 (높은 등급일수록 기본 수치가 강력하게 곱연산 증폭)
    const statMul = rarityDef.statMultiplier || 1.0;
    if (baseItem.baseAtk) baseItem.baseAtk = Math.round(baseItem.baseAtk * (statMul / (RARITY[baseItem.rarity]?.statMultiplier || 1.0)));
    if (baseItem.baseMatk) baseItem.baseMatk = Math.round(baseItem.baseMatk * (statMul / (RARITY[baseItem.rarity]?.statMultiplier || 1.0)));
    if (baseItem.def) baseItem.def = Math.round(baseItem.def * (statMul / (RARITY[baseItem.rarity]?.statMultiplier || 1.0)));
    if (baseItem.mdef) baseItem.mdef = Math.round(baseItem.mdef * (statMul / (RARITY[baseItem.rarity]?.statMultiplier || 1.0)));
    if (baseItem.maxHp) baseItem.maxHp = Math.round(baseItem.maxHp * (statMul / (RARITY[baseItem.rarity]?.statMultiplier || 1.0)));
    if (baseItem.maxMp) baseItem.maxMp = Math.round(baseItem.maxMp * (statMul / (RARITY[baseItem.rarity]?.statMultiplier || 1.0)));
    if (baseItem.atk) baseItem.atk = Math.round(baseItem.atk * (statMul / (RARITY[baseItem.rarity]?.statMultiplier || 1.0)));
    if (baseItem.matk) baseItem.matk = Math.round(baseItem.matk * (statMul / (RARITY[baseItem.rarity]?.statMultiplier || 1.0)));

    // 이름 테마형 고유 스탯 보장 (흡혈의 반지는 반드시 흡혈 보장)
    if (baseItem.id === 'ring_vampire' || baseItem.name.includes('흡혈')) {
      baseItem.lifesteal = Math.max(0.12, Math.min(0.35, 0.14 * (rarityDef.optMultiplier || 1.0)));
    }
    if (baseItem.id === 'ring_crit' || baseItem.name.includes('치명타')) {
      baseItem.critRate = Math.min(0.40, 0.15 * (rarityDef.optMultiplier || 1.0));
      baseItem.critDmg = Math.min(1.20, 0.40 * (rarityDef.optMultiplier || 1.0));
    }

    // 3. 랜덤 옵션 부여 (등급에 따라 optCount 개수 및 optMultiplier로 수치 대폭 상승)
    baseItem.randomOptions = [];
    const optMul = rarityDef.optMultiplier || 1.0;
    const possibleStats = [
      { stat: 'atk', name: '공격력', min: 6, max: 18 },
      { stat: 'matk', name: '마법력', min: 6, max: 18 },
      { stat: 'def', name: '방어력', min: 5, max: 15 },
      { stat: 'maxHp', name: '최대 HP', min: 25, max: 70 },
      { stat: 'critRate', name: '치명타 확률', min: 0.03, max: 0.08, isPct: true },
      { stat: 'critDmg', name: '치명타 피해', min: 0.15, max: 0.35, isPct: true },
      { stat: 'moveSpd', name: '이동속도', min: 0.2, max: 0.6 },
      { stat: 'atkSpd', name: '공격속도', min: 0.06, max: 0.18, isPct: true },
      { stat: 'lifesteal', name: '생명력 흡수', min: 0.03, max: 0.08, isPct: true },
      { stat: 'cdr', name: '쿨타임 감소', min: 0.04, max: 0.12, isPct: true }
    ];

    for (let i = 0; i < rarityDef.optCount; i++) {
      const optDef = possibleStats[Math.floor(Math.random() * possibleStats.length)];
      const rawVal = (optDef.min + Math.random() * (optDef.max - optDef.min)) * optMul;
      const val = optDef.isPct ? Number(rawVal.toFixed(3)) : Math.round(rawVal);
      baseItem.randomOptions.push({
        stat: optDef.stat,
        name: optDef.name,
        val: val,
        isPct: optDef.isPct
      });
    }

    if (rKey === 'LEGENDARY' || rKey === 'MYTHIC') {
      Save.unlockAchievement('legendary_finder');
    }

    return baseItem;
  }
}

const Dungeon = new DungeonManager();
window.Dungeon = Dungeon;
