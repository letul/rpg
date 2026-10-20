// ===== 2D 도트 플레이어 (WASD 이동, Space 대쉬 잔상, 공격/피격 모션, 스킬 및 인벤토리) =====

class Player {
  constructor(classId = 'warrior', startX = 500, startY = 350) {
    this.isPlayer = true;
    this.classId = classId;
    this.classDef = PLAYER_CLASSES[classId];

    // 스탯 초기화
    this.baseStats = { ...DEFAULT_PLAYER_STATS, ...(this.classDef.bonusStats || {}) };
    this.stats = { ...this.baseStats };

    // 2D 위치 및 모션 제어
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.radius = 16;
    this.aimAngle = 0;

    // 모션 타이머
    this.attackMotionTimer = 0;
    this.attackMotionMax = 0.18;
    this.skillMotionTimer = 0;
    this.skillMotionMax = 0.35;
    this.currentCastSkill = null;
    this.hurtTimer = 0;
    this.isDashing = false;
    this.dashTimer = 0;
    this.dashCooldown = 0;

    // 레벨 및 성장
    this.level = 1;
    this.exp = 0;
    this.nextExp = 60;
    this.gold = 50;

    // 장비 슬롯 (8칸 명확한 슬롯)
    this.equipped = {
      weapon: null,
      helm: null,
      chest: null,
      gloves: null,
      boots: null,
      ring1: null,
      ring2: null,
      amulet: null
    };

    // 소지품 가방 (무제한 스크롤 지원)
    this.bag = [];

    // 유물 슬롯 (최대 6개)
    this.relics = [];

    // 소비품 슬롯 (1, 2, 3, 4 키)
    this.consumables = [
      { item: CONSUMABLES.hp_pot_small, count: 3 },
      { item: CONSUMABLES.mp_pot_small, count: 2 },
      { item: null, count: 0 },
      { item: null, count: 0 }
    ];

    // 습득 특성 목록
    this.perks = [];

    // 버프 및 상태이상
    this.buffs = {};
    this.statusEffects = {};
    this.barrier = 0;

    // 스킬 쿨다운 타이머 (Q, E, R, F-궁극기, attack, dash)
    this.cooldowns = { q: 0, e: 0, r: 0, ult: 0, attack: 0, dash: 0 };

    // 소환수 목록
    this.minions = [];

    // 시작 직업 고유 기본 무기 착용 (특성판 명품 무기 개시 t_wep_starter 반영)
    let starterWeaponKey = this.classDef.baseWeapon;
    const starterTalent = Save.getTalentLevel('t_wep_starter');
    if (starterTalent >= 1 && WEAPONS[starterWeaponKey]) {
      const baseType = WEAPONS[starterWeaponKey].type;
      const targetRarity = starterTalent === 1 ? 'RARE' : (starterTalent === 2 ? 'EPIC' : (starterTalent === 3 ? 'LEGENDARY' : 'MYTHIC'));
      const candidates = Object.values(WEAPONS).filter(w => w.type === baseType && w.rarity === targetRarity);
      if (candidates.length > 0) {
        starterWeaponKey = candidates[Math.floor(Math.random() * candidates.length)].id;
      }
    }

    if (starterWeaponKey && WEAPONS[starterWeaponKey]) {
      const weaponObj = { ...WEAPONS[starterWeaponKey] };
      this.equipItem(weaponObj, 'weapon');
      Save.recordCodex('weapons', weaponObj.id);
    } else {
      this.updateWeaponSkills();
    }

    // 영구 성장 보너스 반영
    this.applyPermanentUpgrades();
    this.recalculateStats();

    this.stats.hp = this.stats.maxHp;
    this.stats.mp = this.stats.maxMp;
  }

  // 무기 타입에 따른 실시간 스킬셋 동적 전환
  updateWeaponSkills() {
    const weapon = this.equipped.weapon;
    const weaponType = weapon ? weapon.type : 'fist';
    this.currentSkills = WEAPON_SKILLS[weaponType] || WEAPON_SKILLS.fist;
    if (window.UI) window.UI.updatePlayerHUD();
  }

  // 영구 성장 특성판 및 스탯 실시간 완벽 반영
  applyPermanentUpgrades() {
    this.baseStats = { ...DEFAULT_PLAYER_STATS, ...(this.classDef.bonusStats || {}) };

    // 1. 특성판 (TALENT_TREE)
    const tHp = Save.getTalentLevel('t_srv_hp');
    const tIron = Save.getTalentLevel('t_srv_iron');
    const tGold = Save.getTalentLevel('t_srv_gold');
    const tDash = Save.getTalentLevel('t_srv_dash');
    const tSpeed = Save.getTalentLevel('t_wep_speed');
    const tCrit = Save.getTalentLevel('t_wep_crit');
    const tVamp = Save.getTalentLevel('t_wep_vamp');
    const tPenetrate = Save.getTalentLevel('t_wep_penetrate');
    const tElemental = Save.getTalentLevel('t_wep_elemental');
    const tCdr = Save.getTalentLevel('t_skl_cdr');
    const tSklCrit = Save.getTalentLevel('t_skl_crit');

    if (tHp) this.baseStats.maxHp += tHp * 45;
    if (tIron) {
      this.baseStats.def += tIron * 8;
      this.baseStats.mdef += tIron * 8;
    }
    if (tGold) {
      this.gold = Math.max(this.gold, 50 + tGold * 120);
      this.baseStats.goldGain += tGold * 0.12;
    }
    if (tSpeed) this.baseStats.atkSpd += tSpeed * 0.08;
    if (tCrit) {
      this.baseStats.critRate += tCrit * 0.025;
      this.baseStats.critDmg += tCrit * 0.15;
    }
    if (tVamp) this.baseStats.lifesteal += tVamp * 0.025;
    if (tPenetrate) this.baseStats.penetration = tPenetrate * 0.05;
    if (tElemental) {
      this.baseStats.atk += tElemental * 4;
      this.baseStats.matk += tElemental * 4;
    }
    if (tCdr) this.baseStats.cdr += tCdr * 0.045;
    if (tSklCrit) {
      this.baseStats.critRate += tSklCrit * 0.015;
    }
    if (tDash) {
      this.baseStats.moveSpd += tDash * 0.25;
    }

    // 2. 레거시 upgrades 호환
    const ups = Save.data.upgrades || {};
    if (ups.up_hp) this.baseStats.maxHp += ups.up_hp * 25;
    if (ups.up_atk) this.baseStats.atk += ups.up_atk * 5;
    if (ups.up_matk) this.baseStats.matk += ups.up_matk * 5;
    if (ups.up_def) this.baseStats.def += ups.up_def * 4;

    this.recalculateStats();
  }

  // 실시간 스탯 재계산
  recalculateStats() {
    const curHpRatio = this.stats.maxHp > 0 ? this.stats.hp / this.stats.maxHp : 1.0;
    const curMpRatio = this.stats.maxMp > 0 ? this.stats.mp / this.stats.maxMp : 1.0;

    this.stats = { ...this.baseStats };

    // 1. 착용 장비 스탯 합산
    for (const slotKey of Object.keys(this.equipped)) {
      const item = this.equipped[slotKey];
      if (item) {
        if (item.baseAtk) this.stats.atk += item.baseAtk;
        if (item.baseMatk) this.stats.matk += item.baseMatk;
        if (item.def) this.stats.def += item.def;
        if (item.mdef) this.stats.mdef += item.mdef;
        if (item.maxHp) this.stats.maxHp += item.maxHp;
        if (item.maxMp) this.stats.maxMp += item.maxMp;
        if (item.atk) this.stats.atk += item.atk;
        if (item.matk) this.stats.matk += item.matk;
        if (item.critRate) this.stats.critRate += item.critRate;
        if (item.critDmg) this.stats.critDmg += item.critDmg;
        if (item.dodge) this.stats.dodge += item.dodge;
        if (item.moveSpd) this.stats.moveSpd += item.moveSpd;
        if (item.atkSpd) this.stats.atkSpd += item.atkSpd;
        if (item.lifesteal) this.stats.lifesteal += item.lifesteal;
        if (item.cdr) this.stats.cdr += item.cdr;
        if (item.magicFind) this.stats.magicFind += item.magicFind;

        if (item.randomOptions) {
          for (const opt of item.randomOptions) {
            if (this.stats[opt.stat] !== undefined) {
              this.stats[opt.stat] += opt.val;
            }
          }
        }
      }
    }

    // 2. 유물 효과 합산 (무제한 보유 & 중복 획득 시 배수 증폭)
    const relicCounts = {};
    for (const relic of this.relics) {
      relicCounts[relic.id] = (relicCounts[relic.id] || 0) + 1;
    }

    if (relicCounts['blood_pact']) {
      const c = relicCounts['blood_pact'];
      this.stats.maxHp = Math.round(this.stats.maxHp * Math.pow(0.85, c));
      this.stats.atk = Math.round(this.stats.atk * (1 + 0.8 * c));
    }
    if (relicCounts['kings_crown']) {
      const c = relicCounts['kings_crown'];
      const mul = 1 + 0.20 * c;
      this.stats.atk = Math.round(this.stats.atk * mul);
      this.stats.matk = Math.round(this.stats.matk * mul);
      this.stats.def = Math.round(this.stats.def * mul);
      this.stats.mdef = Math.round(this.stats.mdef * mul);
      this.stats.maxHp = Math.round(this.stats.maxHp * mul);
    }
    if (relicCounts['crown_of_king']) {
      const c = relicCounts['crown_of_king'];
      const mul = 1 + 0.30 * c;
      this.stats.atk = Math.round(this.stats.atk * mul);
      this.stats.matk = Math.round(this.stats.matk * mul);
      this.stats.def = Math.round(this.stats.def * mul);
      this.stats.mdef = Math.round(this.stats.mdef * mul);
      this.stats.maxHp = Math.round(this.stats.maxHp * mul);
    }
    if (relicCounts['vampire_fang']) {
      this.stats.lifesteal += 0.15 * relicCounts['vampire_fang'];
    }
    if (relicCounts['dragon_scale']) {
      this.stats.def += 50 * relicCounts['dragon_scale'];
      this.stats.mdef += 30 * relicCounts['dragon_scale'];
    }
    if (relicCounts['clockwork_gear']) {
      this.stats.cdr += 0.20 * relicCounts['clockwork_gear'];
    }
    if (relicCounts['heart_of_colossus']) {
      const c = relicCounts['heart_of_colossus'];
      this.stats.maxHp += 500 * c;
      this.stats.def += 50 * c;
      this.stats.mdef += 50 * c;
    }
    if (relicCounts['blade_of_infinity']) {
      const c = relicCounts['blade_of_infinity'];
      this.stats.critRate += 0.20 * c;
      this.stats.critDmg += 0.80 * c;
    }
    if (relicCounts['philosophers_stone']) {
      this.stats.goldGain += 1.0 * relicCounts['philosophers_stone'];
    }
    if (relicCounts['golden_coin']) {
      this.stats.goldGain += 1.0 * relicCounts['golden_coin'];
    }
    if (relicCounts['frozen_heart']) {
      this.stats.def += 35 * relicCounts['frozen_heart'];
      this.stats.mdef += 35 * relicCounts['frozen_heart'];
    }
    if (relicCounts['eye_of_providence']) {
      const c = relicCounts['eye_of_providence'];
      this.stats.critRate += 0.25 * c;
      this.stats.critDmg += 1.0 * c;
    }
    if (relicCounts['aegis_of_immortality']) {
      const c = relicCounts['aegis_of_immortality'];
      this.stats.def += 60 * c;
      this.stats.mdef += 60 * c;
      this.stats.maxHp += 350 * c;
    }
    if (relicCounts['ouroboros_ring']) {
      this.stats.cdr += 0.25 * relicCounts['ouroboros_ring'];
    }
    if (relicCounts['pandoras_box']) {
      const c = relicCounts['pandoras_box'];
      this.stats.atk = Math.round(this.stats.atk * (1 + 0.6 * c));
      this.stats.matk = Math.round(this.stats.matk * (1 + 0.6 * c));
      this.stats.critRate += 0.15 * c;
    }

    // 3. 습득 런 내 특성 합산 (중복 선택 지원 및 단계별 배수 누적)
    const perkCounts = {};
    for (const perk of this.perks) {
      perkCounts[perk.id] = (perkCounts[perk.id] || 0) + 1;
    }

    if (perkCounts['p_str']) this.stats.atk *= Math.pow(1.20, perkCounts['p_str']);
    if (perkCounts['p_crit']) {
      this.stats.critRate += 0.10 * perkCounts['p_crit'];
      this.stats.critDmg += 0.35 * perkCounts['p_crit'];
    }
    if (perkCounts['p_spd']) this.stats.atkSpd += 0.25 * perkCounts['p_spd'];
    if (perkCounts['p_pierce']) this.stats.penetration = (this.stats.penetration || 0) + 0.25 * perkCounts['p_pierce'];
    if (perkCounts['p_lifesteal']) this.stats.lifesteal += 0.08 * perkCounts['p_lifesteal'];
    if (perkCounts['p_iron']) {
      this.stats.def += 25 * perkCounts['p_iron'];
      this.stats.mdef += 25 * perkCounts['p_iron'];
    }
    if (perkCounts['p_dodge']) this.stats.dodge += 0.12 * perkCounts['p_dodge'];
    if (perkCounts['p_hp_up']) this.stats.maxHp *= Math.pow(1.30, perkCounts['p_hp_up']);
    if (perkCounts['p_spell_amp']) this.stats.matk *= Math.pow(1.25, perkCounts['p_spell_amp']);
    if (perkCounts['p_cdr']) this.stats.cdr += 0.15 * perkCounts['p_cdr'];
    if (perkCounts['p_greed']) this.stats.goldGain += 0.50 * perkCounts['p_greed'];
    if (perkCounts['p_luck']) this.stats.magicFind += 0.35 * perkCounts['p_luck'];
    if (perkCounts['p_exp']) this.stats.expGain += 0.35 * perkCounts['p_exp'];

    // 신규 추가 특성들
    if (perkCounts['p_combo_master']) {
      this.stats.atkSpd += 0.18 * perkCounts['p_combo_master'];
      this.stats.atk *= Math.pow(1.10, perkCounts['p_combo_master']);
    }
    if (perkCounts['p_elemental_master']) {
      this.stats.matk *= Math.pow(1.30, perkCounts['p_elemental_master']);
    }
    if (perkCounts['p_shield_master']) {
      this.stats.def += 30 * perkCounts['p_shield_master'];
      this.stats.mdef += 30 * perkCounts['p_shield_master'];
    }
    if (perkCounts['p_shadow_veil']) {
      this.stats.dodge += 0.14 * perkCounts['p_shadow_veil'];
    }
    if (perkCounts['p_bounty_hunter']) {
      this.stats.goldGain += 0.60 * perkCounts['p_bounty_hunter'];
    }
    if (perkCounts['p_mana_spring']) {
      this.stats.cdr += 0.12 * perkCounts['p_mana_spring'];
    }

    this.stats.cdr = Math.min(0.75, this.stats.cdr);
    this.stats.hp = Math.min(this.stats.maxHp, Math.round(this.stats.maxHp * curHpRatio));
    this.stats.mp = Math.min(this.stats.maxMp, Math.round(this.stats.maxMp * curMpRatio));

    if (window.UI) UI.updatePlayerHUD();
  }

  // 소지품 가방에 아이템 추가 & 도감 등록 & 업적 체크
  addItemToBag(item) {
    if (!item) return;
    this.bag.push(item);

    // 도감 자동 등록
    if (item.slot) {
      if (item.slot === 'weapon') Save.recordCodex('weapons', item.id);
      else if (item.slot === 'amulet' || item.slot === 'ring') Save.recordCodex('accessories', item.id);
      else Save.recordCodex('armors', item.id);
    } else if (item.type && WEAPONS[item.id]) {
      Save.recordCodex('weapons', item.id);
    } else if (item.healHp || item.bomb || item.buff) {
      Save.recordCodex('consumables', item.id);
    }

    // 전설/신화 업적
    if (item.rarity === 'LEGENDARY' || item.rarity === 'MYTHIC') {
      Save.recordStat('legendaryFound', 1);
    }
  }

  // 장비 착용
  equipItem(item, slotKey) {
    if (!item) return;
    const oldItem = this.equipped[slotKey];
    this.equipped[slotKey] = item;

    const idx = this.bag.indexOf(item);
    if (idx !== -1) this.bag.splice(idx, 1);
    if (oldItem) this.bag.push(oldItem);

    if (item.slot === 'weapon' || item.type) Save.recordCodex('weapons', item.id);
    else if (item.slot === 'amulet' || item.slot === 'ring') Save.recordCodex('accessories', item.id);
    else if (item.slot) Save.recordCodex('armors', item.id);

    this.recalculateStats();

    if (slotKey === 'weapon') {
      this.updateWeaponSkills();
      if (window.UI) UI.showToast(`⚔️ [${item.name}] 착용! 스킬이 [${this.currentSkills.typeName}] 스킬로 변경되었습니다.`);
    }
  }

  // 장비 해제
  unequipItem(slotKey) {
    const item = this.equipped[slotKey];
    if (!item) return;
    this.equipped[slotKey] = null;
    this.bag.push(item);
    this.recalculateStats();

    if (slotKey === 'weapon') {
      this.updateWeaponSkills();
      if (window.UI) UI.showToast(`👊 무기 해제! 맨손 격투 스킬로 변경되었습니다.`);
    }
  }

  // 유물 추가 (최대치 제한 해제: 무제한 보유 & 중복 획득 시 배수 증폭)
  addRelic(relic) {
    this.relics.push(relic);
    Save.recordCodex('relics', relic.id);
    this.recalculateStats();
    const count = this.getRelicCount(relic.id);
    if (window.UI) {
      if (count > 1) {
        UI.showToast(`✨ 유물 중복 강화: [${relic.name}] x${count} 누적! (효과 ${count}배 증폭)`);
      } else {
        UI.showToast(`✨ 유물 획득: [${relic.name}]!`);
      }
      UI.updatePlayerHUD();
    }
    return true;
  }

  getRelicCount(relicId) {
    return this.relics.filter(r => r.id === relicId).length;
  }

  hasRelic(relicId) {
    return this.getRelicCount(relicId) > 0;
  }

  hasStatus(statusKey) {
    return !!(this.statusEffects && this.statusEffects[statusKey]);
  }

  // 대쉬 모션 (Space 키) - 특성 바람의 도약(t_srv_dash) 반영
  performDash() {
    if (this.cooldowns.dash > 0) return;

    Save.recordStat('dashesUsed', 1);
    const tDash = Save.getTalentLevel('t_srv_dash');
    const baseCd = 1.4 * (1.0 - tDash * 0.2);
    this.cooldowns.dash = Math.max(0.6, baseCd * (1.0 - this.stats.cdr));
    this.isDashing = true;
    this.dashTimer = 0.22 + tDash * 0.04;

    // 대쉬 방향
    let dirX = this.vx;
    let dirY = this.vy;
    if (dirX === 0 && dirY === 0) {
      dirX = Math.cos(this.aimAngle);
      dirY = Math.sin(this.aimAngle);
    } else {
      const len = Math.hypot(dirX, dirY);
      dirX /= len;
      dirY /= len;
    }

    this.dashDirX = dirX;
    this.dashDirY = dirY;

    if (window.Sound) Sound.playTone(500, 'sawtooth', 0.12, 0.35);

    if (window.Game && window.Game.renderer) {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          if (window.Game && window.Game.renderer) {
            window.Game.renderer.ghostTrails.push({
              x: this.x,
              y: this.y,
              life: 0.3,
              maxLife: 0.3,
              color: this.classDef.spriteColor
            });
          }
        }, i * 40);
      }
    }
  }

  // 기본 공격 (마우스 좌클릭 - 특성 검기의 극의 t_wep_slash 반영)
  performBasicAttack() {
    if (this.cooldowns.attack > 0) return;
    const interval = 1.0 / (this.stats.atkSpd || 1.2);
    this.cooldowns.attack = interval;

    this.attackMotionTimer = this.attackMotionMax;

    const weapon = this.equipped.weapon;
    const weaponType = weapon ? weapon.type : 'fist';
    const dmgType = weapon ? (weapon.dmgType || 'PHYSICAL') : 'PHYSICAL';

    // 검기의 극의 특성 배율
    const tSlash = Save.getTalentLevel('t_wep_slash');
    const rangeMul = 1.0 + tSlash * 0.15;

    // 1. 시각 슬래시 / 궤적 이펙트
    if (window.Game && window.Game.renderer) {
      const isGreat = weaponType === 'greatsword' || (weapon && weapon.name && weapon.name.includes('대검'));
      const baseR = isGreat ? 56 : (weaponType === 'spear' ? 52 : (weaponType === 'dagger' ? 28 : (weaponType === 'hammer' ? 46 : 40)));
      const baseArc = isGreat ? Math.PI * 0.95 : (weaponType === 'spear' ? Math.PI * 0.4 : (weaponType === 'dagger' ? Math.PI * 0.5 : (weaponType === 'hammer' ? Math.PI * 0.85 : Math.PI * 0.75)));

      window.Game.renderer.slashEffects.push({
        x: this.x + Math.cos(this.aimAngle) * 20,
        y: this.y + Math.sin(this.aimAngle) * 20,
        angle: this.aimAngle,
        radius: baseR * rangeMul,
        arc: baseArc,
        life: isGreat ? 0.22 : 0.16,
        maxLife: isGreat ? 0.22 : 0.16,
        color: DAMAGE_TYPES[dmgType] ? DAMAGE_TYPES[dmgType].color : '#ffd700'
      });
    }

    // 검기의 극의 Lv 2 이상 시 전방 검기 참격 투사체 보너스 발사
    if (tSlash >= 2 && (weaponType === 'sword' || weaponType === 'greatsword' || weaponType === 'axe' || weaponType === 'spear' || weaponType === 'hammer')) {
      Game.spawnProjectile(this.x, this.y, this.aimAngle, dmgType, this, 0.4 * tSlash, 11.0, true);
    }

    // 2. 무기 타입별 공격 분기
    if (weaponType === 'bow') {
      Game.spawnProjectile(this.x, this.y, this.aimAngle, dmgType, this, 1.0, 11.5);
      if (window.Sound) Sound.playTone(600, 'triangle', 0.08, 0.25);
    } else if (weaponType === 'staff') {
      Game.spawnProjectile(this.x, this.y, this.aimAngle, dmgType, this, 1.0, 9.2);
      if (window.Sound) Sound.playMagicSpell(dmgType.toLowerCase());
    } else if (weaponType === 'spear') {
      if (window.Sound) Sound.playSlash();
      Game.checkMeleeHit(this, 75 * rangeMul, Math.PI * 0.5, dmgType, 1.05);
    } else if (weaponType === 'dagger') {
      if (window.Sound) Sound.playSlash();
      Game.checkMeleeHit(this, 45 * rangeMul, Math.PI * 0.6, dmgType, 0.95);
    } else if (weaponType === 'axe') {
      if (window.Sound) Sound.playSlash();
      Game.checkMeleeHit(this, 62 * rangeMul, Math.PI * 0.9, dmgType, 1.25);
    } else if (weaponType === 'greatsword' || (weapon && weapon.name && weapon.name.includes('대검'))) {
      if (window.Sound) Sound.playSlash();
      Game.checkMeleeHit(this, 72 * rangeMul, Math.PI * 0.95, dmgType, 1.35);
    } else if (weaponType === 'hammer') {
      if (window.Sound) Sound.playSlash();
      Game.checkMeleeHit(this, 60 * rangeMul, Math.PI * 0.85, dmgType, 1.3);
    } else {
      if (window.Sound) Sound.playSlash();
      Game.checkMeleeHit(this, 55 * rangeMul, Math.PI * 0.7, dmgType, 1.0);
    }
  }

  // 스킬 시전 (Q, E, R, F-궁극기) - 특성판 전면 연동
  castSkill(slotKey) {
    if (this.hasStatus('silence') || this.hasStatus('stun') || this.hasStatus('freeze')) {
      if (window.UI) UI.showToast('상태 이상으로 스킬을 사용할 수 없습니다!');
      return;
    }

    const skills = this.currentSkills || (this.classDef ? this.classDef.skills : WEAPON_SKILLS.sword);
    const skill = skills[slotKey];
    if (!skill) return;

    if (this.cooldowns[slotKey] > 0) {
      if (window.UI) UI.showToast('재사용 대기시간입니다.');
      return;
    }

    // 마나 소모 (마나의 샘 특성 t_skl_mp 반영)
    const tMp = Save.getTalentLevel('t_skl_mp');
    const rawCost = skill.mp || 0;
    const mpCost = Math.round(rawCost * (1.0 - tMp * 0.07));

    if (this.stats.mp < mpCost) {
      if (window.UI) UI.showToast('마나가 부족합니다!');
      return;
    }

    this.stats.mp -= mpCost;
    Save.recordStat('skillsUsed', 1);

    // 쿨다운 계산 (궁극기는 t_ult_cd 반영)
    let cdBase = skill.cd;
    if (slotKey === 'ult') {
      const tUltCd = Save.getTalentLevel('t_ult_cd');
      cdBase = Math.max(5.0, skill.cd - tUltCd * 3.0);
    }
    const finalCd = cdBase * (1.0 - this.stats.cdr);
    this.cooldowns[slotKey] = finalCd;

    // 연쇄 주문 특성 (t_skl_reset) - 쿨다운 즉시 초기화 행운
    const tReset = Save.getTalentLevel('t_skl_reset');
    if (tReset > 0 && Math.random() < tReset * 0.12) {
      this.cooldowns[slotKey] = 0;
      if (window.UI) UI.showToast(`🔄 [연쇄 주문] [${skill.name}] 쿨타임 즉시 초기화!`);
    }

    // 시전자의 수호 특성 (t_skl_barrier) - 보호막 생성
    const tBarrier = Save.getTalentLevel('t_skl_barrier');
    if (tBarrier > 0) {
      const barAmount = Math.round(this.stats.maxHp * tBarrier * 0.07);
      this.barrier = (this.barrier || 0) + barAmount;
      Combat.showFloatingText(this, `🛡️ 보호막 +${barAmount}`, 'heal', '#00d2d3');
    }

    // 스킬 모션 및 시각 이펙트 활성화
    this.skillMotionTimer = this.skillMotionMax;
    this.currentCastSkill = skill;
    this.attackMotionTimer = this.attackMotionMax;

    // 조준 방향 순간 전진 펄스
    this.x += Math.cos(this.aimAngle) * 12;
    this.y += Math.sin(this.aimAngle) * 12;

    if (window.Game && window.Game.renderer && window.Game.renderer.addSkillEffect) {
      window.Game.renderer.addSkillEffect(this.x, this.y, this.aimAngle, skill);
    }
    Combat.showFloatingText(this, `[ ${skill.name} ]`, 'buff', '#ffd700');

    // 스킬 상세 로직 발동
    this.executeSkillLogic(slotKey, skill);
    if (window.UI) UI.updatePlayerHUD();
  }

  // 무기 타입별 스킬 상세 로직 실행 (특성 파괴력 증폭 & 궁극기 각성 효과)
  executeSkillLogic(slotKey, skill) {
    const sId = skill.id;

    // 일반 스킬 파워 증폭 (t_skl_power) & 궁극기 증폭 (t_ult_power)
    let dmgMul = skill.dmgMul || 1.0;
    const tPower = Save.getTalentLevel('t_skl_power');
    if (tPower > 0) dmgMul *= (1.0 + tPower * 0.15);

    if (slotKey === 'ult') {
      const tUltPower = Save.getTalentLevel('t_ult_power');
      if (tUltPower > 0) dmgMul *= (1.0 + tUltPower * 0.35);

      // 궁극기 1: 불멸의 권능 (완전 무적)
      const tInv = Save.getTalentLevel('t_ult_invincible');
      if (tInv > 0) {
        this.invincibleTimer = tInv * 1.5;
        Combat.showFloatingText(this, '☀️ 완전 무적!', 'buff', '#ffd700');
      }

      // 궁극기 2: 대재앙의 충격 (광역 적 기절)
      const tStun = Save.getTalentLevel('t_ult_stun');
      if (tStun > 0 && window.Game && window.Game.enemies) {
        window.Game.enemies.forEach(e => {
          if (e.stats.hp > 0) {
            Combat.applyStatus(e, 'stun', 1.0 + tStun);
          }
        });
        if (window.UI) UI.showToast('💫 [대재앙의 충격] 모든 적 기절!');
      }

      // 궁극기 3: 영혼 수확의 장 (생명력 회복 & 영혼석)
      const tDrain = Save.getTalentLevel('t_ult_drain');
      if (tDrain > 0) {
        Combat.heal(this, Math.round(this.stats.maxHp * tDrain * 0.2));
        Save.addSoulStones(1);
      }
    }

    // 1. 검 스킬
    if (sId === 'sword_smash') {
      Game.checkMeleeHit(this, 75, Math.PI * 0.8, 'PHYSICAL', skill.dmgMul, true);
      if (window.Sound) Sound.playHit(true);
    } else if (sId === 'sword_spin') {
      Game.checkMeleeHit(this, 90, Math.PI * 2, 'PHYSICAL', skill.dmgMul);
      if (window.Sound) Sound.playSlash();
    } else if (sId === 'sword_wave') {
      Game.spawnProjectile(this.x, this.y, this.aimAngle, 'PHYSICAL', this, skill.dmgMul, 12.0, true);
      if (window.Sound) Sound.playSlash();
    } else if (sId === 'sword_cleave') {
      const tx = this.x + Math.cos(this.aimAngle) * 90;
      const ty = this.y + Math.sin(this.aimAngle) * 90;
      Game.triggerAoeExplosion(tx, ty, 130, skill.dmgMul, 'PHYSICAL', this);
      if (window.Sound) Sound.playExplosion();
    }

    // 2. 단검 스킬
    else if (sId === 'dagger_thrust') {
      const savedCrit = this.stats.critRate;
      this.stats.critRate = 1.0;
      Game.checkMeleeHit(this, 55, Math.PI * 0.5, 'PHYSICAL', skill.dmgMul);
      this.stats.critRate = savedCrit;
      if (window.Sound) Sound.playSlash();
    } else if (sId === 'dagger_poison_fan') {
      for (let off of [-0.25, 0, 0.25]) {
        Game.spawnProjectile(this.x, this.y, this.aimAngle + off, 'POISON', this, skill.dmgMul, 11.0);
      }
      if (window.Sound) Sound.playSlash();
    } else if (sId === 'dagger_shadow_dash') {
      this.buffs.smokescreen = 4.0;
      Combat.showFloatingText(this, '🌫️ 그림자 은신!', 'buff', '#a4b0be');
      if (window.Sound) Sound.playTone(300, 'sine', 0.15, 0.3);
    } else if (sId === 'dagger_death_blossom') {
      Game.checkMeleeHit(this, 80, Math.PI * 2, 'DARK', skill.dmgMul, true);
      if (window.Sound) Sound.playHit(true);
    }

    // 3. 마법 지팡이 스킬
    else if (sId === 'staff_fireball') {
      Game.spawnProjectile(this.x, this.y, this.aimAngle, 'FIRE', this, skill.dmgMul, 10.0);
      if (window.Sound) Sound.playMagicSpell('fire');
    } else if (sId === 'staff_frost_beam') {
      Game.spawnProjectile(this.x, this.y, this.aimAngle, 'COLD', this, skill.dmgMul, 12.0, true);
      if (window.Sound) Sound.playMagicSpell('ice');
    } else if (sId === 'staff_chain_lightning') {
      Game.triggerChainLightning(this, skill.dmgMul);
      if (window.Sound) Sound.playMagicSpell('lightning');
    } else if (sId === 'staff_meteor') {
      const tx = this.x + Math.cos(this.aimAngle) * 130;
      const ty = this.y + Math.sin(this.aimAngle) * 130;
      Game.triggerAoeExplosion(tx, ty, 150, skill.dmgMul, 'EXPLOSION', this);
      if (window.Sound) Sound.playExplosion();
    }

    // 4. 활 스킬
    else if (sId === 'bow_rapid') {
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          Game.spawnProjectile(this.x, this.y, this.aimAngle + (Math.random() - 0.5) * 0.1, 'PHYSICAL', this, skill.dmgMul, 13.0);
        }, i * 75);
      }
      if (window.Sound) Sound.playTone(650, 'triangle', 0.1, 0.2);
    } else if (sId === 'bow_pierce') {
      Game.spawnProjectile(this.x, this.y, this.aimAngle, 'PHYSICAL', this, skill.dmgMul, 15.0, true);
      if (window.Sound) Sound.playTone(700, 'triangle', 0.1, 0.3);
    } else if (sId === 'bow_bomb') {
      Game.spawnProjectile(this.x, this.y, this.aimAngle, 'EXPLOSION', this, skill.dmgMul, 10.5);
    } else if (sId === 'bow_rain') {
      const tx = this.x + Math.cos(this.aimAngle) * 110;
      const ty = this.y + Math.sin(this.aimAngle) * 110;
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          const rx = tx + (Math.random() - 0.5) * 100;
          const ry = ty + (Math.random() - 0.5) * 100;
          Game.triggerAoeExplosion(rx, ry, 60, skill.dmgMul * 0.45, 'PHYSICAL', this);
        }, i * 90);
      }
    }

    // 5. 창 스킬
    else if (sId === 'spear_triple_thrust') {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          Game.checkMeleeHit(this, 85, Math.PI * 0.4, 'PHYSICAL', skill.dmgMul / 2.0);
          if (window.Sound) Sound.playSlash();
        }, i * 80);
      }
    } else if (sId === 'spear_sweep') {
      Game.checkMeleeHit(this, 80, Math.PI * 1.2, 'PHYSICAL', skill.dmgMul);
      if (window.Sound) Sound.playSlash();
    } else if (sId === 'spear_charge') {
      this.x += Math.cos(this.aimAngle) * 90;
      this.y += Math.sin(this.aimAngle) * 90;
      Game.checkMeleeHit(this, 75, Math.PI * 0.8, 'PHYSICAL', skill.dmgMul);
      if (window.Sound) Sound.playHit(true);
    } else if (sId === 'spear_dragon_dive') {
      const tx = this.x + Math.cos(this.aimAngle) * 100;
      const ty = this.y + Math.sin(this.aimAngle) * 100;
      Game.triggerAoeExplosion(tx, ty, 140, skill.dmgMul, 'FIRE', this);
      if (window.Sound) Sound.playExplosion();
    }

    // 6. 도끼 스킬
    else if (sId === 'axe_slam') {
      Game.checkMeleeHit(this, 75, Math.PI * 0.7, 'PHYSICAL', skill.dmgMul, true);
      if (window.Sound) Sound.playHit(true);
    } else if (sId === 'axe_cyclone') {
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          Game.checkMeleeHit(this, 85, Math.PI * 2, 'PHYSICAL', skill.dmgMul * 0.4);
          if (window.Sound) Sound.playSlash();
        }, i * 110);
      }
    } else if (sId === 'axe_blood_roar') {
      this.buffs.bloodRoar = 5.0;
      Combat.showFloatingText(this, '🩸 피의 포효!', 'buff', '#e74c3c');
      if (window.Sound) Sound.playTone(220, 'sawtooth', 0.25, 0.4);
    } else if (sId === 'axe_guillotine') {
      Game.checkMeleeHit(this, 70, Math.PI * 0.6, 'PHYSICAL', skill.dmgMul, true);
      if (window.Sound) Sound.playHit(true);
    }

    // 7. 특수 무기 스킬
    else if (sId === 'special_slash') {
      Game.spawnProjectile(this.x, this.y, this.aimAngle, 'DARK', this, skill.dmgMul, 13.0, true);
    } else if (sId === 'special_soul_drain') {
      Game.checkMeleeHit(this, 80, Math.PI * 1.5, 'DARK', skill.dmgMul);
      Combat.heal(this, Math.round(this.stats.maxHp * 0.15));
    } else if (sId === 'special_dragon_breath') {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          Game.spawnProjectile(this.x, this.y, this.aimAngle + (Math.random() - 0.5) * 0.3, 'FIRE', this, skill.dmgMul * 0.4, 9.0);
        }, i * 60);
      }
    } else if (sId === 'special_apocalypse') {
      Game.triggerAoeExplosion(this.x, this.y, 200, skill.dmgMul, 'DARK', this);
      if (window.Sound) Sound.playExplosion();
    }

    // 8. 맨손 및 레거시 스킬 폴백
    else {
      Game.checkMeleeHit(this, 55, Math.PI * 0.7, 'PHYSICAL', skill.dmgMul || 1.5);
      if (window.Sound) Sound.playHit(false);
    }
  }

  // 소환수 스폰
  spawnMinion(type, maxLimit = 4) {
    const cur = this.minions.filter(m => m.type === type).length;
    if (cur >= maxLimit) {
      if (window.UI) UI.showToast(`해당 소환수는 최대 ${maxLimit}마리까지 가능합니다.`);
      return;
    }
    const minion = {
      isMinion: true,
      type: type,
      x: this.x + (Math.random() - 0.5) * 40,
      y: this.y + (Math.random() - 0.5) * 40,
      stats: {
        hp: type === 'golem' ? 240 : 90,
        maxHp: type === 'golem' ? 240 : 90,
        atk: type === 'golem' ? 32 : 22,
        matk: 20,
        def: type === 'golem' ? 18 : 6,
        spd: type === 'golem' ? 2.0 : 3.5
      }
    };
    this.minions.push(minion);
    Combat.showFloatingText(this, `💀 소환!`, 'buff', '#8e44ad');
  }

  // 소비품 사용
  useConsumable(slotIndex) {
    const slot = this.consumables[slotIndex];
    if (!slot || !slot.item || slot.count <= 0) return;
    const item = slot.item;
    slot.count--;

    if (item.healHp) Combat.heal(this, Math.round(this.stats.maxHp * item.healHp));
    if (item.healMp) {
      this.stats.mp = Math.min(this.stats.maxMp, this.stats.mp + Math.round(this.stats.maxMp * item.healMp));
      Combat.showFloatingText(this, `+MP`, 'heal', '#3498db');
    }
    if (item.buff) {
      this.buffs[item.buff] = item.dur || 30;
      if (window.UI) UI.showToast(`${item.name} 활성화 (${item.dur}초)`);
    }
    if (item.bomb && window.Game) {
      Game.triggerAoeExplosion(this.x + Math.cos(this.aimAngle) * 90, this.y + Math.sin(this.aimAngle) * 90, 90, 2.5, item.bomb, this);
    }
    if (slot.count <= 0) slot.item = null;
    if (window.Sound) Sound.playPotion();
    if (window.UI) UI.updatePlayerHUD();
  }

  // 경험치 및 레벨업
  gainExp(amount) {
    amount = Math.round(amount * this.stats.expGain);
    this.exp += amount;
    Combat.showFloatingText(this, `+${amount} EXP`, 'exp', '#f1c40f');

    while (this.exp >= this.nextExp && this.level < 30) {
      this.exp -= this.nextExp;
      this.level++;
      this.nextExp = Math.round(this.nextExp * 1.35 + 40);

      // 레벨업 시 확실한 화력과 내구도 성장 (공격력/마법력 +6, HP +30, 방어/저항 +2)
      this.baseStats.atk += 6;
      this.baseStats.matk += 6;
      this.baseStats.maxHp += 30;
      this.baseStats.def += 2;
      this.baseStats.mdef += 2;
      this.stats.hp = this.stats.maxHp;
      this.stats.mp = this.stats.maxMp;

      if (window.Sound) Sound.playLevelUp();
      if (window.UI) {
        UI.showToast(`🎉 레벨 업! Lv.${this.level} 달성! (능력치 대폭 강화)`);
        UI.showPerkSelection();
      }
    }
    this.recalculateStats();
  }

  gainGold(amount) {
    amount = Math.round(amount * this.stats.goldGain);
    this.gold += amount;
    Save.recordStat('goldCollected', amount);
    Combat.showFloatingText(this, `+${amount} G`, 'gold', '#ffd700');
    if (window.Sound) Sound.playCoin();
    if (window.UI) UI.updatePlayerHUD();
  }

  // 매 프레임 업데이트 (장애물 충돌 및 함정 판정)
  update(dt, mapBounds, obstacles, hazards) {
    if (this.stats.hp <= 0) {
      if (window.Game && window.Game.isRunning) window.Game.onPlayerDeath();
      return;
    }

    Combat.updateStatuses(this, dt);

    // 무적 타이머
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;

    // 모션 타이머 감소
    if (this.attackMotionTimer > 0) this.attackMotionTimer -= dt;
    if (this.skillMotionTimer > 0) {
      this.skillMotionTimer -= dt;
      if (this.skillMotionTimer <= 0) this.currentCastSkill = null;
    }
    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.hazardCooldown > 0) this.hazardCooldown -= dt;

    // 쿨다운 타이머 감소
    for (const k of Object.keys(this.cooldowns)) {
      if (this.cooldowns[k] > 0) this.cooldowns[k] = Math.max(0, this.cooldowns[k] - dt);
    }

    // 버프 타이머
    for (const b of Object.keys(this.buffs)) {
      this.buffs[b] -= dt;
      if (this.buffs[b] <= 0) delete this.buffs[b];
    }

    // 자연 회복 (생존 상태일 때만, 악몽 지옥 난이도는 회복 효율 40%로 페널티)
    if (this.stats.hp > 0) {
      const regenCount = this.perks.filter(p => p.id === 'p_regen').length;
      if (regenCount > 0) {
        const diffHealMul = (window.Game && window.Game.difficulty === 'hard') ? 0.4 : 1.0;
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + (this.stats.maxHp * 0.025 * regenCount * diffHealMul) * dt);
      }
      this.stats.mp = Math.min(this.stats.maxMp, this.stats.mp + 5.0 * dt);
    }

    // 이동 처리
    if (this.isDashing) {
      this.dashTimer -= dt;
      this.x += this.dashDirX * (this.stats.moveSpd * 140) * dt;
      this.y += this.dashDirY * (this.stats.moveSpd * 140) * dt;
      if (this.dashTimer <= 0) this.isDashing = false;
    } else {
      let spd = this.stats.moveSpd * 42;
      if (this.buffs.spdBuff) spd *= 1.35;
      if (this.hasStatus('slow')) spd *= 0.5;

      this.x += this.vx * spd * dt;
      this.y += this.vy * spd * dt;
    }

    // 지형지물(돌기둥, 배럴) 충돌 판정
    if (obstacles) {
      obstacles.forEach(ob => {
        const d = Math.hypot(this.x - ob.x, this.y - ob.y);
        const minDist = this.radius + ob.radius;
        if (d < minDist && d > 0) {
          const overlap = minDist - d;
          this.x += ((this.x - ob.x) / d) * overlap;
          this.y += ((this.y - ob.y) / d) * overlap;
        }
      });
    }

    // 가시 함정(Hazards) 밟음 판정
    if (hazards && (!this.hazardCooldown || this.hazardCooldown <= 0)) {
      hazards.forEach(h => {
        if (h.isActive && Math.hypot(this.x - h.x, this.y - h.y) < this.radius + h.size / 2) {
          this.hazardCooldown = 0.9;
          Combat.calculateDamage({ stats: { atk: 15 }, isEnemy: true }, this, 1.0, 'PHYSICAL');
          Combat.showFloatingText(this, '⚠️ 가시 함정!', 'dmg', '#ff4757');
        }
      });
    }

    // 던전 맵 경계 제한 (벽 밖으로 나가지 못함)
    if (mapBounds) {
      this.x = Math.max(mapBounds.x + 24, Math.min(mapBounds.x + mapBounds.width - 24, this.x));
      this.y = Math.max(mapBounds.y + 24, Math.min(mapBounds.y + mapBounds.height - 24, this.y));
    }

    // 소환수 업데이트
    for (let i = this.minions.length - 1; i >= 0; i--) {
      const m = this.minions[i];
      if (m.stats.hp <= 0) {
        this.minions.splice(i, 1);
        continue;
      }
      // 가장 가까운 적 추적
      let nearest = null;
      let minD = 9999;
      if (window.Game && window.Game.enemies) {
        window.Game.enemies.forEach(e => {
          if (e.stats.hp > 0) {
            const d = Math.hypot(e.x - m.x, e.y - m.y);
            if (d < minD) { minD = d; nearest = e; }
          }
        });
      }
      if (nearest) {
        const dx = (nearest.x - m.x) / minD;
        const dy = (nearest.y - m.y) / minD;
        m.x += dx * (m.stats.spd * 35) * dt;
        m.y += dy * (m.stats.spd * 35) * dt;
        if (minD < 30) {
          Combat.calculateDamage(m, nearest, 1.0, m.type === 'beetle' ? 'POISON' : 'PHYSICAL');
        }
      } else {
        // 플레이어 근처 머물기
        const toP = Math.hypot(this.x - m.x, this.y - m.y);
        if (toP > 60) {
          m.x += ((this.x - m.x) / toP) * (m.stats.spd * 30) * dt;
          m.y += ((this.y - m.y) / toP) * (m.stats.spd * 30) * dt;
        }
      }
    }

    // 사망 체크
    if (this.stats.hp <= 0) {
      const ankhIdx = this.relics.findIndex(r => r.id === 'resurrection_ankh');
      const tRevive = (typeof Save !== 'undefined') ? Save.getTalentLevel('t_srv_revive') : 0;

      if (ankhIdx !== -1) {
        this.relics.splice(ankhIdx, 1);
        this.stats.hp = Math.round(this.stats.maxHp * 0.5);
        Combat.showFloatingText(this, '⚰️ 부활의 십자가 발동!', 'heal', '#ffd700');
        if (window.Sound) Sound.playLevelUp();
      } else if (tRevive > 0 && !this.talentRevived) {
        this.talentRevived = true;
        this.stats.hp = Math.round(this.stats.maxHp * Math.min(1.0, tRevive * 0.2));
        Combat.showFloatingText(this, '🪶 불사조의 깃털 부활!', 'heal', '#ff9f43');
        if (window.Sound) Sound.playLevelUp();
        if (window.UI) UI.showToast('🪶 [불사조의 깃털] 특성으로 부활했습니다!');
      } else {
        if (window.Game) Game.onPlayerDeath();
      }
    }
  }
}

window.Player = Player;
