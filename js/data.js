// ===== 게임 핵심 데이터 정의 (밸런스 정상화: 플레이어 생존력/공격력 강화, 장비 스탯 대폭 상향, 몬스터 밸런스 패치) =====

// 1. 기본 플레이어 스탯 (기존보다 체력, 방어력, 기본 화력 대폭 상향하여 생존력과 액션 쾌감 확보)
const DEFAULT_PLAYER_STATS = {
  maxHp: 180,
  hp: 180,
  maxMp: 120,
  mp: 120,
  atk: 35,
  matk: 35,
  def: 15,
  mdef: 15,
  atkSpd: 1.3,
  moveSpd: 5.5,
  critRate: 0.08,
  critDmg: 1.6,
  dodge: 0.06,
  lifesteal: 0.03, // 기본 흡혈 3% 부여로 전투 지속력 확보
  cdr: 0.0,
  magicFind: 0.05,
  goldGain: 1.0,
  expGain: 1.0,
};

// 2. 피해 종류 (8종)
const DAMAGE_TYPES = {
  PHYSICAL: { name: '물리', icon: '⚔️', color: '#bdc3c7', desc: '검, 도끼, 창 등의 기본 물리 타격' },
  FIRE: { name: '화염', icon: '🔥', color: '#ff4d4d', desc: '화상 효과를 유발하는 화염 피해' },
  COLD: { name: '냉기', icon: '❄️', color: '#00d2d3', desc: '빙결 및 감속을 유발하는 냉기 피해' },
  LIGHTNING: { name: '번개', icon: '⚡', color: '#feca57', desc: '주변 적들에게 연쇄 타격을 입히는 번개 피해' },
  POISON: { name: '독', icon: '☠️', color: '#1dd1a1', desc: '지속 피해를 입히는 치명적인 독' },
  DARK: { name: '암흑', icon: '🌑', color: '#9b59b6', desc: '상대의 방어와 저항을 무시하는 암흑 마법' },
  HOLY: { name: '신성', icon: '✨', color: '#ffd700', desc: '언데드 몬스터에게 2배 피해를 입히는 성스러운 힘' },
  EXPLOSION: { name: '폭발', icon: '💥', color: '#ff9f43', desc: '넓은 반경에 강력한 광역 피해' }
};

// 3. 상태 이상 (10종)
const STATUS_EFFECTS = {
  burn: { name: '화상', icon: '🔥', duration: 4.0, interval: 0.8, color: '#ff4d4d', desc: '지속적인 화염 피해를 입습니다.' },
  poison: { name: '독', icon: '☠️', duration: 5.0, interval: 1.0, color: '#1dd1a1', desc: '지속적인 독 피해를 입습니다.' },
  bleed: { name: '출혈', icon: '🩸', duration: 4.0, interval: 0.5, color: '#ee5253', desc: '행동 시 지속 피해를 입습니다.' },
  freeze: { name: '빙결', icon: '❄️', duration: 2.0, color: '#48dbfb', desc: '일정 시간 동안 완전히 행동이 불가능해집니다.' },
  slow: { name: '감속', icon: '🧊', duration: 3.5, color: '#54a0ff', desc: '이동속도가 50% 감소합니다.' },
  stun: { name: '기절', icon: '💫', duration: 1.5, color: '#feca57', desc: '공격 및 이동이 불가능해집니다.' },
  silence: { name: '침묵', icon: '🤐', duration: 3.0, color: '#8395a7', desc: '스킬을 사용할 수 없습니다.' },
  weaken: { name: '약화', icon: '🥀', duration: 5.0, color: '#ff6b6b', desc: '공격력이 30% 감소합니다.' },
  armorBreak: { name: '방어감소', icon: '🛡️⬇️', duration: 5.0, color: '#ff9f43', desc: '방어력과 마법저항이 40% 감소합니다.' },
  fear: { name: '공포', icon: '😱', duration: 2.0, color: '#5f27cd', desc: '통제를 잃고 적에게서 도망칩니다.' }
};

// 4. 장비 등급 (6단계 - 등급이 높을수록 능력치와 랜덤 옵션 수치가 압도적으로 강력해짐)
const RARITY = {
  COMMON: { key: 'common', name: '일반', color: '#bdc3c7', border: '#7f8c8d', statMultiplier: 1.0, optMultiplier: 1.0, optCount: 1 },
  UNCOMMON: { key: 'uncommon', name: '고급', color: '#2ecc71', border: '#27ae60', statMultiplier: 1.5, optMultiplier: 1.4, optCount: 2 },
  RARE: { key: 'rare', name: '희귀', color: '#3498db', border: '#2980b9', statMultiplier: 2.4, optMultiplier: 2.2, optCount: 3 },
  EPIC: { key: 'epic', name: '영웅', color: '#9b59b6', border: '#8e44ad', statMultiplier: 3.8, optMultiplier: 3.4, optCount: 4 },
  LEGENDARY: { key: 'legendary', name: '전설', color: '#e67e22', border: '#d35400', statMultiplier: 6.0, optMultiplier: 5.2, optCount: 5 },
  MYTHIC: { key: 'mythic', name: '신화', color: '#e74c3c', border: '#c0392b', statMultiplier: 9.0, optMultiplier: 8.0, optCount: 6 }
};

// 5. 플레이어 클래스 (직업별 특성 및 기본 보너스 상향)
const PLAYER_CLASSES = {
  warrior: {
    id: 'warrior',
    name: '전사',
    icon: '⚔️',
    spriteColor: '#e74c3c',
    desc: '강력한 근접 공격과 탄탄한 방어력의 전투 전문가',
    baseWeapon: 'iron_sword',
    bonusStats: { maxHp: 240, hp: 240, def: 25, atk: 45, moveSpd: 5.5 },
    skills: {
      q: { id: 'smash', name: '강타', key: 'Q', cd: 2.8, mp: 15, dmgMul: 2.5, type: 'PHYSICAL', icon: '🔨', desc: '전방에 묵직한 일격을 날려 기절과 큰 물리 피해를 입힙니다.' },
      e: { id: 'whirlwind', name: '회전베기', key: 'E', cd: 4.0, mp: 25, dmgMul: 2.0, type: 'PHYSICAL', icon: '🌀', desc: '주변 모든 적을 360도 연속 베어냅니다.' },
      r: { id: 'shield_block', name: '방패방어', key: 'R', cd: 6.0, mp: 20, icon: '🛡️', desc: '5초 동안 받는 피해 60% 경감 및 방어력 2배.' },
      ult: { id: 'earthquake', name: '지진', key: 'F', cd: 20.0, mp: 45, dmgMul: 5.5, type: 'EXPLOSION', icon: '🌋', desc: '지면을 강타하여 화면 전체 적에게 궤멸적인 충격을 줍니다.' }
    }
  },
  assassin: {
    id: 'assassin',
    name: '암살자',
    icon: '🗡️',
    spriteColor: '#34495e',
    desc: '치명타와 압도적인 공격속도로 적의 숨통을 끊는 자객',
    baseWeapon: 'assassin_dagger',
    bonusStats: { maxHp: 170, hp: 170, critRate: 0.25, critDmg: 2.2, atkSpd: 1.6, dodge: 0.20, moveSpd: 6.2, atk: 40 },
    skills: {
      q: { id: 'ambush', name: '암습', key: 'Q', cd: 3.0, mp: 18, dmgMul: 3.2, type: 'PHYSICAL', icon: '🗡️', desc: '치명타 100% 보장되는 치명적인 기습.' },
      e: { id: 'poison_blade', name: '독칼', key: 'E', cd: 4.5, mp: 18, dmgMul: 2.0, type: 'POISON', icon: '🧪', desc: '부채꼴로 3개의 독 단검 투척.' },
      r: { id: 'smokescreen', name: '연막', key: 'R', cd: 7.0, mp: 20, icon: '🌫️', desc: '연막탄을 투척하여 5초간 회피율 50% 증가.' },
      ult: { id: 'death_strike', name: '죽음의 일격', key: 'F', cd: 18.0, mp: 40, dmgMul: 6.5, type: 'DARK', icon: '💀', desc: '적에게 쇄도하여 방어 무시 극대 피해를 입힙니다.' }
    }
  },
  mage: {
    id: 'mage',
    name: '마법사',
    icon: '🧙',
    spriteColor: '#2980b9',
    desc: '원거리에서 광역 속성 마법으로 전장을 초토화하는 현자',
    baseWeapon: 'fire_staff',
    bonusStats: { maxMp: 200, mp: 200, matk: 55, def: 12, mdef: 30, moveSpd: 5.3 },
    skills: {
      q: { id: 'fireball', name: '화염구', key: 'Q', cd: 1.8, mp: 15, dmgMul: 2.4, type: 'FIRE', icon: '🔥', desc: '화염구를 발사하여 폭발 및 화상 부여.' },
      e: { id: 'ice_spear', name: '얼음창', key: 'E', cd: 3.2, mp: 20, dmgMul: 2.2, type: 'COLD', icon: '🧊', desc: '모든 적을 관통하며 빙결시킵니다.' },
      r: { id: 'chain_lightning', name: '번개', key: 'R', cd: 4.5, mp: 25, dmgMul: 2.4, type: 'LIGHTNING', icon: '⚡', desc: '최대 6명의 적에게 전이되는 연쇄 충격.' },
      ult: { id: 'meteor', name: '메테오', key: 'F', cd: 22.0, mp: 55, dmgMul: 6.0, type: 'EXPLOSION', icon: '☄️', desc: '거대한 운석을 소환하여 전장 일대를 융단폭격합니다.' }
    }
  },
  archer: {
    id: 'archer',
    name: '궁수',
    icon: '🏹',
    spriteColor: '#27ae60',
    desc: '안전한 거리에서 적을 꿰뚫는 원거리 저격수',
    baseWeapon: 'hunter_bow',
    bonusStats: { maxHp: 180, hp: 180, atkSpd: 1.5, critRate: 0.18, moveSpd: 5.8, atk: 42 },
    skills: {
      q: { id: 'rapid_fire', name: '연속사격', key: 'Q', cd: 2.5, mp: 12, dmgMul: 1.0, type: 'PHYSICAL', icon: '🏹', desc: '4연발 고속 화살을 쏟아붓습니다.' },
      e: { id: 'piercing_arrow', name: '관통화살', key: 'E', cd: 3.5, mp: 18, dmgMul: 2.8, type: 'PHYSICAL', icon: '🎯', desc: '모든 적을 관통하는 마력 화살 발사.' },
      r: { id: 'explosive_arrow', name: '폭발화살', key: 'R', cd: 5.0, mp: 22, dmgMul: 3.0, type: 'EXPLOSION', icon: '💣', desc: '주변 적들에게 넓은 범위 폭발 피해.' },
      ult: { id: 'arrow_storm', name: '폭풍의 화살', key: 'F', cd: 20.0, mp: 45, dmgMul: 5.2, type: 'PHYSICAL', icon: '🌪️', desc: '화살비를 쏟아부어 지속적인 치명타 낙하.' }
    }
  },
  paladin: {
    id: 'paladin',
    name: '성기사',
    icon: '🛡️',
    spriteColor: '#f39c12',
    desc: '신성한 치유와 굳건한 방호벽으로 무장한 불멸의 수호자',
    baseWeapon: 'knight_sword',
    bonusStats: { maxHp: 270, hp: 270, def: 32, mdef: 30, matk: 35, atk: 38, moveSpd: 5.2 },
    skills: {
      q: { id: 'shield_bash', name: '방패강타', key: 'Q', cd: 2.8, mp: 15, dmgMul: 2.2, type: 'HOLY', icon: '🛡️', desc: '방패로 적을 쳐 기절시키고 방어력을 감소시킵니다.' },
      e: { id: 'holy_light', name: '신성한 빛', key: 'E', cd: 5.5, mp: 25, icon: '✨', desc: '체력을 40% 회복하고 주변 적에게 신성 피해.' },
      r: { id: 'barrier', name: '보호막', key: 'R', cd: 7.0, mp: 20, icon: '🔮', desc: '최대 체력의 35% 신성 보호막을 6초간 전개.' },
      ult: { id: 'holy_explosion', name: '신성 폭발', key: 'F', cd: 20.0, mp: 45, dmgMul: 5.5, type: 'HOLY', icon: '☀️', desc: '성스러운 빛을 폭발시켜 적을 심판합니다.' }
    }
  },
  summoner: {
    id: 'summoner',
    name: '소환사',
    icon: '☠️',
    spriteColor: '#8e44ad',
    desc: '언데드 군단과 골렘을 지휘하여 전장을 지배하는 네크로맨서',
    baseWeapon: 'dark_staff',
    bonusStats: { maxMp: 220, mp: 220, matk: 48, maxHp: 170, hp: 170, moveSpd: 5.4 },
    skills: {
      q: { id: 'summon_skeleton', name: '해골 소환', key: 'Q', cd: 3.0, mp: 18, icon: '💀', desc: '해골 전사를 소환합니다 (최대 5마리).' },
      e: { id: 'summon_beetle', name: '독충 소환', key: 'E', cd: 4.0, mp: 22, icon: '🦗', desc: '독을 뿜는 독충을 소환합니다 (최대 4마리).' },
      r: { id: 'summon_golem', name: '골렘 소환', key: 'R', cd: 9.0, mp: 35, icon: '🗿', desc: '강력한 체력을 가진 바위 골렘을 소환합니다.' },
      ult: { id: 'army_of_dead', name: '군단 소환', key: 'F', cd: 22.0, mp: 55, icon: '👑', desc: '망자의 군대를 대거 소환하여 일제히 습격합니다.' }
    }
  }
};

// 5-1. 무기 타입별 고유 스킬 세트 (무기 교체 시 스킬도 무기에 맞게 동적 전환)
const WEAPON_SKILLS = {
  sword: {
    typeName: '검 / 대검',
    q: { id: 'sword_smash', name: '강타', key: 'Q', cd: 2.2, mp: 14, dmgMul: 2.8, type: 'PHYSICAL', icon: '⚔️', desc: '전방에 강력한 검기를 내리꽂아 기절과 물리 피해를 입힙니다.' },
    e: { id: 'sword_spin', name: '회전베기', key: 'E', cd: 3.5, mp: 18, dmgMul: 2.2, type: 'PHYSICAL', icon: '🌀', desc: '검을 360도 크게 회전시켜 주변 모든 적을 휩씁니다.' },
    r: { id: 'sword_wave', name: '검기 방출', key: 'R', cd: 4.5, mp: 20, dmgMul: 2.5, type: 'PHYSICAL', icon: '🗡️', desc: '전방으로 날카로운 반월형 검기 투사체를 날립니다.' },
    ult: { id: 'sword_cleave', name: '대지 가르기', key: 'F', cd: 16.0, mp: 38, dmgMul: 6.0, type: 'EXPLOSION', icon: '🌋', desc: '거대한 검기로 대지를 갈라 전방 일대를 궤멸시킵니다.' }
  },
  dagger: {
    typeName: '단검',
    q: { id: 'dagger_thrust', name: '급소 찌르기', key: 'Q', cd: 1.8, mp: 10, dmgMul: 3.0, type: 'PHYSICAL', icon: '🔪', desc: '100% 치명타가 적중하는 치명적인 급소 찌르기.' },
    e: { id: 'dagger_poison_fan', name: '독칼 투척', key: 'E', cd: 3.2, mp: 16, dmgMul: 2.0, type: 'POISON', icon: '🧪', desc: '전방 부채꼴로 맹독 단검 3개를 투척합니다.' },
    r: { id: 'dagger_shadow_dash', name: '그림자 은신', key: 'R', cd: 5.5, mp: 18, icon: '🌫️', desc: '그림자 속으로 숨어 4초간 회피율 +60%와 이동속도가 급증합니다.' },
    ult: { id: 'dagger_death_blossom', name: '사신의 난무', key: 'F', cd: 15.0, mp: 35, dmgMul: 6.5, type: 'DARK', icon: '💀', desc: '초고속으로 주변 적들의 숨통을 연속 난도질합니다.' }
  },
  staff: {
    typeName: '마법 지팡이',
    q: { id: 'staff_fireball', name: '화염구', key: 'Q', cd: 1.8, mp: 15, dmgMul: 2.6, type: 'FIRE', icon: '🔥', desc: '원거리 화염 마법구를 발사하여 착탄 시 폭발합니다.' },
    e: { id: 'staff_frost_beam', name: '서리 광선', key: 'E', cd: 3.2, mp: 20, dmgMul: 2.4, type: 'COLD', icon: '🧊', desc: '일직선상의 모든 적을 관통하며 2초간 빙결시킵니다.' },
    r: { id: 'staff_chain_lightning', name: '연쇄 번개', key: 'R', cd: 4.2, mp: 24, dmgMul: 2.6, type: 'LIGHTNING', icon: '⚡', desc: '주변 적들에게 연속으로 튀어가는 뇌전을 방출합니다.' },
    ult: { id: 'staff_meteor', name: '메테오 스트라이크', key: 'F', cd: 18.0, mp: 50, dmgMul: 6.5, type: 'EXPLOSION', icon: '☄️', desc: '조준 지점에 거대한 운석을 낙하시켜 초토화합니다.' }
  },
  bow: {
    typeName: '활',
    q: { id: 'bow_rapid', name: '연사 사격', key: 'Q', cd: 2.0, mp: 12, dmgMul: 1.1, type: 'PHYSICAL', icon: '🏹', desc: '전방에 고속 화살 4발을 연속으로 난사합니다.' },
    e: { id: 'bow_pierce', name: '관통 화살', key: 'E', cd: 3.2, mp: 16, dmgMul: 3.0, type: 'PHYSICAL', icon: '🎯', desc: '적들을 일렬로 꿰뚫고 지나가는 강화 화살을 쏩니다.' },
    r: { id: 'bow_bomb', name: '폭발 화살', key: 'R', cd: 4.5, mp: 20, dmgMul: 3.2, type: 'EXPLOSION', icon: '💣', desc: '화약이 장착된 화살을 쏘아 주변에 광역 폭발을 일으킵니다.' },
    ult: { id: 'bow_rain', name: '화살비', key: 'F', cd: 16.0, mp: 40, dmgMul: 5.5, type: 'PHYSICAL', icon: '🌧️', desc: '공중으로 화살을 쏘아올려 목표 일대에 치명적인 화살비를 쏟아붓습니다.' }
  },
  spear: {
    typeName: '장창',
    q: { id: 'spear_triple_thrust', name: '삼연 찌르기', key: 'Q', cd: 2.0, mp: 14, dmgMul: 2.7, type: 'PHYSICAL', icon: '🔱', desc: '긴 사거리로 전방을 신속하게 3연속 찌릅니다.' },
    e: { id: 'spear_sweep', name: '창대 휩쓸기', key: 'E', cd: 3.2, mp: 16, dmgMul: 2.3, type: 'PHYSICAL', icon: '🌀', desc: '창을 크게 휘둘러 전방 부채꼴의 적들을 밀쳐냅니다.' },
    r: { id: 'spear_charge', name: '돌진 꿰뚫기', key: 'R', cd: 5.0, mp: 22, dmgMul: 3.0, type: 'PHYSICAL', icon: '⚡', desc: '전방으로 순식간에 돌진하며 경로 상의 모든 적을 꿰뚫습니다.' },
    ult: { id: 'spear_dragon_dive', name: '용의 강림', key: 'F', cd: 16.0, mp: 42, dmgMul: 6.0, type: 'FIRE', icon: '🐉', desc: '하늘 높이 도약하여 화염의 창으로 지면을 폭파합니다.' }
  },
  axe: {
    typeName: '전투도끼',
    q: { id: 'axe_slam', name: '대지 파쇄', key: 'Q', cd: 2.4, mp: 14, dmgMul: 3.2, type: 'PHYSICAL', icon: '🪓', desc: '무거운 도끼로 지면을 내리쳐 큰 피해와 파편을 날립니다.' },
    e: { id: 'axe_cyclone', name: '광란의 회전', key: 'E', cd: 3.8, mp: 20, dmgMul: 2.5, type: 'PHYSICAL', icon: '🌪️', desc: '도끼를 양손으로 잡고 회전하며 적들을 갈아버립니다.' },
    r: { id: 'axe_blood_roar', name: '피의 포효', key: 'R', cd: 6.5, mp: 22, icon: '🩸', desc: '포효를 내질러 5초간 공격력 +50% 및 흡혈 15%를 얻습니다.' },
    ult: { id: 'axe_guillotine', name: '단두대 처형', key: 'F', cd: 16.0, mp: 38, dmgMul: 7.0, type: 'PHYSICAL', icon: '⚰️', desc: '전방 적에게 일격필살의 분쇄 처형을 가합니다.' }
  },
  special: {
    typeName: '전설 특수 무기',
    q: { id: 'special_slash', name: '차원참', key: 'Q', cd: 2.0, mp: 15, dmgMul: 3.2, type: 'DARK', icon: '🌌', desc: '공간을 베어 적에게 암흑 참격을 남깁니다.' },
    e: { id: 'special_soul_drain', name: '영혼 수확', key: 'E', cd: 3.8, mp: 20, dmgMul: 2.8, type: 'DARK', icon: '💀', desc: '적들의 영혼을 흡수하여 체력을 회복합니다.' },
    r: { id: 'special_dragon_breath', name: '용의 숨결', key: 'R', cd: 5.0, mp: 26, dmgMul: 3.5, type: 'FIRE', icon: '🐲', desc: '전방으로 고열의 화염 폭풍을 방출합니다.' },
    ult: { id: 'special_apocalypse', name: '종말의 심판', key: 'F', cd: 18.0, mp: 48, dmgMul: 7.5, type: 'DARK', icon: '👑', desc: '마왕의 힘을 개방하여 화면 전체를 파멸시킵니다.' }
  },
  fist: {
    typeName: '맨손',
    q: { id: 'fist_punch', name: '정권 지르기', key: 'Q', cd: 1.5, mp: 5, dmgMul: 1.5, type: 'PHYSICAL', icon: '👊', desc: '전방에 빠른 정권 지르기.' },
    e: { id: 'fist_kick', name: '회전 발차기', key: 'E', cd: 3.0, mp: 10, dmgMul: 1.8, type: 'PHYSICAL', icon: '🦶', desc: '주변 적들을 차서 밀어냅니다.' },
    r: { id: 'fist_focus', name: '기합', key: 'R', cd: 5.5, mp: 12, icon: '💥', desc: '일시적으로 공격력을 대폭 끌어올립니다.' },
    ult: { id: 'fist_barrage', name: '연속 난타', key: 'F', cd: 14.0, mp: 25, dmgMul: 4.2, type: 'PHYSICAL', icon: '🔥', desc: '전방에 무수한 주먹을 퍼붓습니다.' }
  }
};

// 6. 무기 목록 (32종, 대폭 상향된 공격력 및 밸런스 정상화)
const WEAPONS = {
  // 검
  iron_sword: { id: 'iron_sword', name: '철검', icon: '🗡️', type: 'sword', dmgType: 'PHYSICAL', baseAtk: 45, rarity: 'COMMON', desc: '가장 기초적인 훈련용 철검.' },
  steel_sword: { id: 'steel_sword', name: '강철검', icon: '⚔️', type: 'sword', dmgType: 'PHYSICAL', baseAtk: 70, rarity: 'UNCOMMON', desc: '단단하게 벼려낸 기사의 강철검.' },
  knight_sword: { id: 'knight_sword', name: '기사검', icon: '🗡️', type: 'sword', dmgType: 'PHYSICAL', baseAtk: 105, defBonus: 15, rarity: 'RARE', desc: '왕실 기사단에 지급되는 명검.' },
  flame_sword: { id: 'flame_sword', name: '화염검', icon: '🔥⚔️', type: 'sword', dmgType: 'FIRE', baseAtk: 145, rarity: 'EPIC', desc: '칼날에 꺼지지 않는 화염이 깃들어 있습니다.' },
  frost_sword: { id: 'frost_sword', name: '얼음검', icon: '❄️⚔️', type: 'sword', dmgType: 'COLD', baseAtk: 145, rarity: 'EPIC', desc: '베인 자의 혈관을 얼어붙게 만드는 칼날.' },
  thunder_sword: { id: 'thunder_sword', name: '번개의 검', icon: '⚡⚔️', type: 'sword', dmgType: 'LIGHTNING', baseAtk: 185, rarity: 'LEGENDARY', desc: '번개를 품은 검으로 휘두를 때마다 뇌전이 튑니다.' },
  holy_sword: { id: 'holy_sword', name: '성검', icon: '✨🗡️', type: 'sword', dmgType: 'HOLY', baseAtk: 240, rarity: 'MYTHIC', desc: '태양의 축복을 받은 전설 속의 성검.' },
  demon_sword: { id: 'demon_sword', name: '마왕검', icon: '🌑🗡️', type: 'sword', dmgType: 'DARK', baseAtk: 280, lifestealBonus: 0.15, rarity: 'MYTHIC', desc: '마왕의 암흑 마력이 서린 파멸의 대검.' },

  // 도끼
  battle_axe: { id: 'battle_axe', name: '전투도끼', icon: '🪓', type: 'axe', dmgType: 'PHYSICAL', baseAtk: 65, atkSpdMod: -0.1, rarity: 'COMMON', desc: '묵직한 무게로 갑옷을 짓누르는 전투도끼.' },
  berserk_axe: { id: 'berserk_axe', name: '광전사의 도끼', icon: '🩸🪓', type: 'axe', dmgType: 'PHYSICAL', baseAtk: 120, critRateBonus: 0.15, rarity: 'RARE', desc: '피를 볼수록 광기를 불러일으키는 도끼.' },
  giant_axe: { id: 'giant_axe', name: '거인의 도끼', icon: '🪓', type: 'axe', dmgType: 'PHYSICAL', baseAtk: 165, rarity: 'EPIC', desc: '거인이 휘두르던 거대한 도끼.' },
  blood_axe: { id: 'blood_axe', name: '피의 도끼', icon: '🩸🪓', type: 'axe', dmgType: 'PHYSICAL', baseAtk: 220, lifestealBonus: 0.2, rarity: 'LEGENDARY', desc: '적의 생명력을 흡수하는 흉포한 무기.' },

  // 단검
  assassin_dagger: { id: 'assassin_dagger', name: '암살자의 단검', icon: '🔪', type: 'dagger', dmgType: 'PHYSICAL', baseAtk: 40, atkSpdMod: 0.35, critRateBonus: 0.15, rarity: 'UNCOMMON', desc: '날렵하고 치명적인 암살용 단도.' },
  poison_dagger: { id: 'poison_dagger', name: '독단검', icon: '🧪🔪', type: 'dagger', dmgType: 'POISON', baseAtk: 75, atkSpdMod: 0.3, rarity: 'RARE', desc: '치명적인 독액이 스며든 단검.' },
  shadow_dagger: { id: 'shadow_dagger', name: '그림자 단검', icon: '🌑🔪', type: 'dagger', dmgType: 'DARK', baseAtk: 130, atkSpdMod: 0.4, rarity: 'EPIC', desc: '어둠 속에서 적을 기습하는 무형의 단검.' },
  reaper_dagger: { id: 'reaper_dagger', name: '사신의 단검', icon: '💀🔪', type: 'dagger', dmgType: 'DARK', baseAtk: 180, critDmgBonus: 0.9, rarity: 'LEGENDARY', desc: '치명타 적중 시 폭발적인 피해를 입힙니다.' },

  // 창
  iron_spear: { id: 'iron_spear', name: '철창', icon: '🔱', type: 'spear', dmgType: 'PHYSICAL', baseAtk: 50, rangeMod: 1.3, rarity: 'COMMON', desc: '사거리가 긴 튼튼한 장창.' },
  knight_spear: { id: 'knight_spear', name: '기사창', icon: '🔱', type: 'spear', dmgType: 'PHYSICAL', baseAtk: 95, rangeMod: 1.4, rarity: 'RARE', desc: '기병들이 돌격할 때 쓰는 창.' },
  lightning_spear: { id: 'lightning_spear', name: '번개창', icon: '⚡🔱', type: 'spear', dmgType: 'LIGHTNING', baseAtk: 155, rarity: 'EPIC', desc: '전격을 방출하여 먼 거리의 적을 꿰뚫습니다.' },
  dragon_spear: { id: 'dragon_spear', name: '용의 창', icon: '🐉🔱', type: 'spear', dmgType: 'FIRE', baseAtk: 230, rarity: 'LEGENDARY', desc: '고대 용의 뿔로 깎아 만든 화염창.' },

  // 활
  hunter_bow: { id: 'hunter_bow', name: '사냥꾼의 활', icon: '🏹', type: 'bow', dmgType: 'PHYSICAL', baseAtk: 48, rarity: 'COMMON', desc: '숲 사냥꾼들이 짐승을 잡을 때 쓰는 활.' },
  poison_bow: { id: 'poison_bow', name: '독활', icon: '☠️🏹', type: 'bow', dmgType: 'POISON', baseAtk: 85, rarity: 'RARE', desc: '화살촉에 맹독이 발려 있습니다.' },
  flame_bow: { id: 'flame_bow', name: '화염활', icon: '🔥🏹', type: 'bow', dmgType: 'FIRE', baseAtk: 140, rarity: 'EPIC', desc: '불화살을 난사하여 적들을 불태웁니다.' },
  celestial_bow: { id: 'celestial_bow', name: '천상의 활', icon: '✨🏹', type: 'bow', dmgType: 'HOLY', baseAtk: 220, rarity: 'MYTHIC', desc: '빛의 화살을 쏘아보내는 천상의 활.' },

  // 마법 지팡이
  fire_staff: { id: 'fire_staff', name: '화염 지팡이', icon: '🪄🔥', type: 'staff', dmgType: 'FIRE', baseMatk: 80, rarity: 'RARE', desc: '화염 마법 구체를 발사합니다.' },
  frost_staff: { id: 'frost_staff', name: '얼음 지팡이', icon: '🪄❄️', type: 'staff', dmgType: 'COLD', baseMatk: 80, rarity: 'RARE', desc: '적을 얼어붙게 하는 서리 결정체를 발사합니다.' },
  thunder_staff: { id: 'thunder_staff', name: '번개 지팡이', icon: '🪄⚡', type: 'staff', dmgType: 'LIGHTNING', baseMatk: 135, rarity: 'EPIC', desc: '연쇄 전격을 방출하는 마력 지팡이.' },
  dark_staff: { id: 'dark_staff', name: '암흑 지팡이', icon: '🪄🌑', type: 'staff', dmgType: 'DARK', baseMatk: 175, rarity: 'EPIC', desc: '영혼을 파괴하는 흑마법 지팡이.' },
  holy_staff: { id: 'holy_staff', name: '신성 지팡이', icon: '🪄✨', type: 'staff', dmgType: 'HOLY', baseMatk: 240, rarity: 'LEGENDARY', desc: '치유와 성스러운 심판의 힘이 깃든 지팡이.' },

  // 특수 무기 & 신화 무기
  death_scythe: { id: 'death_scythe', name: '죽음의 낫', icon: '⚰️', type: 'special', dmgType: 'DARK', baseAtk: 250, lifestealBonus: 0.25, rarity: 'LEGENDARY', desc: '영혼을 거두는 사신의 대형 낫.' },
  void_scythe: { id: 'void_scythe', name: '공허의 낫', icon: '🌌⚰️', type: 'special', dmgType: 'DARK', baseAtk: 290, lifestealBonus: 0.22, rarity: 'LEGENDARY', desc: '공간을 왜곡하며 적의 영혼을 베어내는 공허의 대낫.' },
  dragon_sword: { id: 'dragon_sword', name: '용의 검', icon: '🐉⚔️', type: 'special', dmgType: 'FIRE', baseAtk: 310, rarity: 'MYTHIC', desc: '공격 시 용의 숨결이 폭발하는 전설의 명검.' },
  overlord_blade: { id: 'overlord_blade', name: '마왕의 검', icon: '👑🗡️', type: 'special', dmgType: 'DARK', baseAtk: 350, rarity: 'MYTHIC', desc: '던전의 모든 마력을 흡수하여 휘두르는 파멸의 검.' },
  gungnir: { id: 'gungnir', name: '궁니르', icon: '⚡🔱', type: 'spear', dmgType: 'LIGHTNING', baseAtk: 320, rangeMod: 1.5, rarity: 'MYTHIC', desc: '절대 빗나가지 않는 주신의 신화 장창.' },
  mjolnir: { id: 'mjolnir', name: '묠니르', icon: '⚡🪓', type: 'axe', dmgType: 'LIGHTNING', baseAtk: 340, critDmgBonus: 1.0, rarity: 'MYTHIC', desc: '천둥과 번개를 부르는 고대 신화의 뇌신 망치.' },
  artemis_bow: { id: 'artemis_bow', name: '아르테미스의 달빛 활', icon: '🌙🏹', type: 'bow', dmgType: 'COLD', baseAtk: 300, atkSpdMod: 0.35, rarity: 'MYTHIC', desc: '달빛의 가호로 적을 추적 섬멸하는 순은의 신궁.' },
  excalibur: { id: 'excalibur', name: '엑스칼리버', icon: '✨⚔️', type: 'sword', dmgType: 'HOLY', baseAtk: 360, critRateBonus: 0.25, rarity: 'MYTHIC', desc: '진정한 용사만이 쥘 수 있는 황금빛 성검.' },
  muramasa: { id: 'muramasa', name: '요도 무라마사', icon: '🩸🗡️', type: 'dagger', dmgType: 'DARK', baseAtk: 240, atkSpdMod: 0.55, critRateBonus: 0.35, lifestealBonus: 0.25, rarity: 'MYTHIC', desc: '피를 갈구하며 극한의 치명타와 흡혈을 쏟아내는 마도.' },
  celestial_blade: { id: 'celestial_blade', name: '천상의 성검', icon: '🗡️✨', type: 'sword', dmgType: 'HOLY', baseAtk: 380, critRateBonus: 0.28, rarity: 'MYTHIC', desc: '신성한 광채로 전방의 모든 어둠을 단칼에 소멸시키는 신화의 성검.' },
  dragon_slayer_spear: { id: 'dragon_slayer_spear', name: '용살자의 창', icon: '🔱🐉', type: 'spear', dmgType: 'FIRE', baseAtk: 330, rangeMod: 1.6, rarity: 'LEGENDARY', desc: '고대 거룡의 심장을 꿰뚫었던 전설적인 용살자 창.' },
  shadow_scythe: { id: 'shadow_scythe', name: '그림자 사신의 낫', icon: '💀🌙', type: 'special', dmgType: 'DARK', baseAtk: 360, lifestealBonus: 0.28, rarity: 'MYTHIC', desc: '공간을 베어내며 적의 영혼을 흡수하는 암흑 사신의 대낫.' },
  phoenix_bow: { id: 'phoenix_bow', name: '불사조의 강궁', icon: '🏹🔥', type: 'bow', dmgType: 'FIRE', baseAtk: 330, atkSpdMod: 0.40, rarity: 'MYTHIC', desc: '불사조의 불꽃 화살을 폭풍처럼 난사하는 신궁.' },
  chronos_staff: { id: 'chronos_staff', name: '크로노스의 시간 지팡이', icon: '🪄⏳', type: 'staff', dmgType: 'LIGHTNING', baseMatk: 370, cdr: 0.35, maxMp: 300, rarity: 'MYTHIC', desc: '시간을 왜곡하여 마법을 쉴 새 없이 폭격하는 시공간 지팡이.' },
  titan_warhammer: { id: 'titan_warhammer', name: '티탄의 전쟁망치', icon: '🪓⚡', type: 'axe', dmgType: 'LIGHTNING', baseAtk: 390, critDmgBonus: 1.2, rarity: 'LEGENDARY', desc: '대지를 산산조각 내는 거신족의 전설 망치.' }
};

// 7. 방어구 목록 (방어력과 체력 보너스 대폭 상향으로 확실한 탱킹 체감)
const ARMORS = {
  // 투구
  iron_helm: { id: 'iron_helm', slot: 'helm', name: '철투구', icon: '🪖', rarity: 'COMMON', def: 12, maxHp: 30 },
  knight_helm: { id: 'knight_helm', slot: 'helm', name: '기사투구', icon: '🪖', rarity: 'UNCOMMON', def: 24, maxHp: 60 },
  mage_hat: { id: 'mage_hat', slot: 'helm', name: '마법사의 모자', icon: '🧙‍♂️', rarity: 'RARE', mdef: 35, matk: 30, maxMp: 80 },
  assassin_hood: { id: 'assassin_hood', slot: 'helm', name: '암살자의 후드', icon: '🥷', rarity: 'RARE', def: 18, critRate: 0.12, dodge: 0.12 },
  paladin_helm: { id: 'paladin_helm', slot: 'helm', name: '성기사 투구', icon: '👑', rarity: 'EPIC', def: 45, mdef: 40, maxHp: 120 },
  dragon_helm: { id: 'dragon_helm', slot: 'helm', name: '용의 투구', icon: '🐉🪖', rarity: 'LEGENDARY', def: 75, mdef: 60, maxHp: 220 },
  valkyrie_helm: { id: 'valkyrie_helm', slot: 'helm', name: '발키리의 날개 투구', icon: '🪖🪽', rarity: 'LEGENDARY', def: 85, mdef: 75, atk: 45, critRate: 0.18, desc: '승리의 여신 발키리의 깃털이 달린 성스러운 투구.' },

  // 갑옷
  leather_armor: { id: 'leather_armor', slot: 'chest', name: '가죽갑옷', icon: '🥋', rarity: 'COMMON', def: 15, moveSpd: 0.3, maxHp: 40 },
  iron_armor: { id: 'iron_armor', slot: 'chest', name: '철갑옷', icon: '🛡️', rarity: 'UNCOMMON', def: 35, maxHp: 80 },
  knight_armor: { id: 'knight_armor', slot: 'chest', name: '기사갑옷', icon: '🛡️', rarity: 'RARE', def: 60, maxHp: 140 },
  mage_robe: { id: 'mage_robe', slot: 'chest', name: '마법갑옷', icon: '🥻', rarity: 'RARE', def: 25, mdef: 60, matk: 40, maxMp: 100 },
  shadow_ninja_garb: { id: 'shadow_ninja_garb', slot: 'chest', name: '그림자 닌자 도복', icon: '🥷🥋', rarity: 'EPIC', def: 50, dodge: 0.25, moveSpd: 1.5 },
  paladin_armor: { id: 'paladin_armor', slot: 'chest', name: '성기사 갑옷', icon: '✨🛡️', rarity: 'EPIC', def: 90, mdef: 75, maxHp: 220 },
  dragon_scale_armor: { id: 'dragon_scale_armor', slot: 'chest', name: '용비늘 중갑옷', icon: '🐉🛡️', rarity: 'LEGENDARY', def: 120, mdef: 100, maxHp: 350 },
  celestial_robe: { id: 'celestial_robe', slot: 'chest', name: '천상의 성의', icon: '✨🥻', rarity: 'LEGENDARY', def: 60, mdef: 130, matk: 75, cdr: 0.20, maxMp: 200 },
  dragon_armor: { id: 'dragon_armor', slot: 'chest', name: '용갑옷', icon: '🐉🛡️', rarity: 'MYTHIC', def: 140, mdef: 110, maxHp: 400 },
  titan_plate: { id: 'titan_plate', slot: 'chest', name: '티탄의 불멸 판금갑', icon: '🗿🛡️', rarity: 'MYTHIC', def: 180, mdef: 140, maxHp: 550 },
  void_walker_robe: { id: 'void_walker_robe', slot: 'chest', name: '공허 방랑자의 로브', icon: '👘🌌', rarity: 'MYTHIC', def: 80, mdef: 160, matk: 110, cdr: 0.25, maxMp: 350, desc: '공허의 에너지를 둘러 마법 피해를 극도로 흡수하는 로브.' },
  abyssal_armor: { id: 'abyssal_armor', slot: 'chest', name: '심연의 불멸 갑옷', icon: '🥋🖤', rarity: 'MYTHIC', def: 210, mdef: 150, maxHp: 700, desc: '끝없는 심연의 암흑으로 모든 치명적 충격을 차단하는 궁극의 갑옷.' },

  // 장갑
  leather_gloves: { id: 'leather_gloves', slot: 'gloves', name: '가죽장갑', icon: '🧤', rarity: 'COMMON', atkSpd: 0.08, def: 8, atk: 10 },
  iron_gloves: { id: 'iron_gloves', slot: 'gloves', name: '철장갑', icon: '🧤', rarity: 'UNCOMMON', atk: 18, def: 16 },
  assassin_gloves: { id: 'assassin_gloves', slot: 'gloves', name: '암살자 장갑', icon: '🧤', rarity: 'RARE', critRate: 0.15, atkSpd: 0.2, atk: 25 },
  mage_gloves: { id: 'mage_gloves', slot: 'gloves', name: '마법장갑', icon: '🧤✨', rarity: 'EPIC', matk: 45, cdr: 0.12 },
  dragon_gloves: { id: 'dragon_gloves', slot: 'gloves', name: '용의 장갑', icon: '🐉🧤', rarity: 'LEGENDARY', atk: 55, matk: 55, critRate: 0.18 },

  // 신발
  leather_boots: { id: 'leather_boots', slot: 'boots', name: '가죽신발', icon: '👞', rarity: 'COMMON', moveSpd: 0.6, dodge: 0.05 },
  combat_boots: { id: 'combat_boots', slot: 'boots', name: '전투화', icon: '👢', rarity: 'UNCOMMON', moveSpd: 0.9, def: 14, maxHp: 50 },
  assassin_boots: { id: 'assassin_boots', slot: 'boots', name: '암살자의 신발', icon: '👟', rarity: 'RARE', moveSpd: 1.4, dodge: 0.14 },
  mage_boots: { id: 'mage_boots', slot: 'boots', name: '마법신발', icon: '👢✨', rarity: 'EPIC', moveSpd: 1.2, cdr: 0.15 },
  wind_boots: { id: 'wind_boots', slot: 'boots', name: '바람의 신발', icon: '🪽👢', rarity: 'LEGENDARY', moveSpd: 2.2, dodge: 0.22 },
  hermes_sandals: { id: 'hermes_sandals', slot: 'boots', name: '헤르메스의 비행 장화', icon: '🪽👞', rarity: 'MYTHIC', moveSpd: 2.8, dodge: 0.28, cdr: 0.18, desc: '천공을 달리는 신들의 날개 달린 장화.' }
};

// 8. 장신구 (악세사리 스탯 대폭 상향 - 이름과 테마에 걸맞은 강력한 고유 옵션 보장)
const ACCESSORIES = {
  // 반지
  ring_power: { id: 'ring_power', slot: 'ring', name: '힘의 반지', icon: '💍', rarity: 'UNCOMMON', atk: 30, maxHp: 60, desc: '착용자의 완력을 끌어올려 공격력을 강화합니다.' },
  ring_crit: { id: 'ring_crit', slot: 'ring', name: '치명타의 반지', icon: '💍🎯', rarity: 'RARE', critRate: 0.18, critDmg: 0.45, desc: '적의 급소를 노리는 날카로운 치명타 확률과 배율을 부여합니다.' },
  ring_vampire: { id: 'ring_vampire', slot: 'ring', name: '흡혈의 반지', icon: '💍🩸', rarity: 'RARE', lifesteal: 0.16, atk: 25, maxHp: 50, desc: '적에게 입힌 피해의 16%를 생명력으로 즉각 흡수합니다.' },
  ring_luck: { id: 'ring_luck', slot: 'ring', name: '행운의 반지', icon: '💍🍀', rarity: 'RARE', magicFind: 0.4, goldGain: 0.5, desc: '황금과 희귀 전리품을 발견할 기운을 증폭시킵니다.' },
  ring_fire: { id: 'ring_fire', slot: 'ring', name: '화염의 반지', icon: '💍🔥', rarity: 'EPIC', matk: 55, atk: 35, dmgType: 'FIRE', desc: '붉은 불길이 깃들어 마법력과 화염 화력을 높입니다.' },
  ring_frost: { id: 'ring_frost', slot: 'ring', name: '얼음의 반지', icon: '💍❄️', rarity: 'EPIC', matk: 55, def: 30, mdef: 30, dmgType: 'COLD', desc: '냉기의 기운으로 방어력과 마법력을 동시에 보호합니다.' },
  ring_thunder: { id: 'ring_thunder', slot: 'ring', name: '번개의 반지', icon: '💍⚡', rarity: 'EPIC', matk: 55, atkSpd: 0.22, dmgType: 'LIGHTNING', desc: '전격의 파동으로 공격 속도와 마법 피해를 증폭합니다.' },
  ring_poison: { id: 'ring_poison', slot: 'ring', name: '맹독의 반지', icon: '💍☠️', rarity: 'EPIC', atk: 50, lifesteal: 0.10, dmgType: 'POISON', desc: '치명적인 독기를 품고 생명력을 빨아들입니다.' },
  ring_berserker: { id: 'ring_berserker', slot: 'ring', name: '광전사의 분노 반지', icon: '💍🩸', rarity: 'LEGENDARY', atk: 70, critRate: 0.25, critDmg: 0.70, desc: '체력이 감소할 때마다 폭발적인 전투력을 분출합니다.' },
  ring_chrono: { id: 'ring_chrono', slot: 'ring', name: '시간의 모래 반지', icon: '💍⏳', rarity: 'LEGENDARY', cdr: 0.25, moveSpd: 0.8, maxMp: 120, desc: '시간을 왜곡하여 모든 스킬 쿨타임을 25% 단축합니다.' },
  ring_infinity: { id: 'ring_infinity', slot: 'ring', name: '무한의 룬 반지', icon: '💍♾️', rarity: 'MYTHIC', atk: 85, matk: 85, critRate: 0.25, critDmg: 0.85, desc: '무한한 마력이 용솟음쳐 모든 공격 화력을 극대화합니다.' },
  ring_god_speed: { id: 'ring_god_speed', slot: 'ring', name: '신속의 번개 반지', icon: '💍⚡', rarity: 'LEGENDARY', atkSpd: 0.40, moveSpd: 1.2, cdr: 0.22, desc: '번개처럼 빠른 반사신경과 폭풍 같은 공격 속도를 제공합니다.' },

  // 목걸이
  amulet_life: { id: 'amulet_life', slot: 'amulet', name: '생명의 목걸이', icon: '📿💖', rarity: 'UNCOMMON', maxHp: 160, def: 15, desc: '최대 체력을 대폭 높여주는 생명의 부적.' },
  amulet_mana: { id: 'amulet_mana', slot: 'amulet', name: '마나의 목걸이', icon: '📿💧', rarity: 'UNCOMMON', maxMp: 160, cdr: 0.15, desc: '마나 용량을 늘리고 스킬 쿨타임을 단축시킵니다.' },
  amulet_berserk: { id: 'amulet_berserk', slot: 'amulet', name: '광전사의 목걸이', icon: '📿🩸', rarity: 'RARE', atk: 55, atkSpd: 0.25, lifesteal: 0.08, desc: '광기를 일깨워 높은 공격력, 속도, 흡혈을 부여합니다.' },
  amulet_mage: { id: 'amulet_mage', slot: 'amulet', name: '현자의 목걸이', icon: '📿🔮', rarity: 'RARE', matk: 65, cdr: 0.2, maxMp: 100, desc: '지혜의 마력으로 마법력과 쿨다운을 극대화합니다.' },
  amulet_assassin: { id: 'amulet_assassin', slot: 'amulet', name: '암살자의 목걸이', icon: '📿🗡️', rarity: 'EPIC', critRate: 0.22, critDmg: 0.65, dodge: 0.15, desc: '치명적인 일격과 신출귀몰한 회피율을 부여합니다.' },
  amulet_guardian: { id: 'amulet_guardian', slot: 'amulet', name: '수호자의 목걸이', icon: '📿🛡️', rarity: 'EPIC', def: 55, mdef: 55, maxHp: 220, desc: '철통같은 방어력과 마법저항으로 수호합니다.' },
  amulet_death: { id: 'amulet_death', slot: 'amulet', name: '사신의 목걸이', icon: '📿💀', rarity: 'LEGENDARY', atk: 95, matk: 95, lifesteal: 0.2, maxHp: 150, desc: '사신의 가호로 압도적인 공격력과 20% 생명력 흡수를 획득합니다.' },
  amulet_phoenix: { id: 'amulet_phoenix', slot: 'amulet', name: '불사조의 깃털 목걸이', icon: '📿🔥', rarity: 'MYTHIC', maxHp: 300, def: 50, mdef: 50, lifesteal: 0.15, desc: '불사조의 숨결로 강력한 생명력과 흡혈을 제공합니다.' },
  amulet_elements: { id: 'amulet_elements', slot: 'amulet', name: '원소 대마법의 목걸이', icon: '📿✨', rarity: 'MYTHIC', matk: 120, maxMp: 250, cdr: 0.25, desc: '불, 냉기, 번개, 신성 모든 원소 마법의 위력을 극대화합니다.' },
  amulet_draconic: { id: 'amulet_draconic', slot: 'amulet', name: '고룡의 심장 목걸이', icon: '📿🐉', rarity: 'MYTHIC', maxHp: 500, atk: 90, def: 75, lifesteal: 0.20, desc: '태고의 용의 심장이 고동치며 막대한 생명력과 흡혈을 부여합니다.' }
};

// 9. 핵심 유물
const RELICS = {
  blood_pact: { id: 'blood_pact', name: '피의 계약', icon: '🩸📜', rarity: 'LEGENDARY', desc: '최대 HP -15%, 공격력 +80% 강화 (중복 시 배수 증폭).' },
  flame_heart: { id: 'flame_heart', name: '화염의 심장', icon: '❤️🔥', rarity: 'EPIC', desc: '모든 공격에 화상 효과를 부여합니다 (중복 시 화상 피해 증폭).' },
  frozen_heart: { id: 'frozen_heart', name: '얼어붙은 심장', icon: '💙❄️', rarity: 'EPIC', desc: '적을 빙결시키며 방어/저항 +35 증가 (중복 시 방어력 누적).' },
  lightning_heart: { id: 'lightning_heart', name: '번개의 심장', icon: '💛⚡', rarity: 'EPIC', desc: '공격 시 주변 적들에게 연쇄 번개 발동 (중복 시 번개 위력 증폭).' },
  reaper_scythe_relic: { id: 'reaper_scythe_relic', name: '사신의 낫', icon: '💀⚰️', rarity: 'LEGENDARY', desc: '적 처치 시마다 공격력 영구 누적 (중복 시 킬당 획득 공격력 배수).' },
  golden_coin: { id: 'golden_coin', name: '황금 동전', icon: '🪙', rarity: 'RARE', desc: '골드 획득량 +100% (중복 시 골드 획득 배율 누적).' },
  specter_mask: { id: 'specter_mask', name: '망령의 가면', icon: '🎭👻', rarity: 'EPIC', desc: 'HP 35% 이하일 때 모든 공격력 +120% 폭증 (중복 시 위력 배수).' },
  vampire_fang: { id: 'vampire_fang', name: '흡혈귀의 송곳니', icon: '🧛🦷', rarity: 'RARE', desc: '가한 피해량의 15%를 체력으로 즉시 흡수 (중복 시 흡혈률 누적).' },
  dragon_scale: { id: 'dragon_scale', name: '용의 비늘', icon: '🐉🛡️', rarity: 'EPIC', desc: '방어력 +50, 마법저항 +30 증가 (중복 시 방어력 누적).' },
  kings_crown: { id: 'kings_crown', name: '왕의 왕관', icon: '👑', rarity: 'MYTHIC', desc: '모든 기본 능력치가 20% 상승 (중복 시 모든 스탯 누적 증폭).' },
  resurrection_ankh: { id: 'resurrection_ankh', name: '부활의 십자가', icon: '✝️', rarity: 'MYTHIC', desc: '사망 시 HP 60%로 즉시 부활 (보유 개수만큼 추가 부활 가능).' },
  clockwork_gear: { id: 'clockwork_gear', name: '태엽 장치', icon: '⚙️', rarity: 'RARE', desc: '스킬 재사용 대기시간 -20% 단축 (중복 시 쿨감 추가).' },
  heart_of_colossus: { id: 'heart_of_colossus', name: '거신의 심장', icon: '🗿💖', rarity: 'MYTHIC', desc: '최대 HP +500, 방어력 +50, 받는 피해 20% 경감 (중복 시 누적).' },
  blade_of_infinity: { id: 'blade_of_infinity', name: '무한의 검날', icon: '⚔️♾️', rarity: 'MYTHIC', desc: '치명타 피해량 +80% 및 치명타 확률 +20% 증가 (중복 시 폭발적 누적).' },
  philosophers_stone: { id: 'philosophers_stone', name: '현자의 돌', icon: '💎✨', rarity: 'MYTHIC', desc: '골드 획득량 2배 및 몬스터 처치 시 영혼석 추가 수확 (중복 가능).' },
  crown_of_king: { id: 'crown_of_king', name: '패왕의 관', icon: '👑🔥', rarity: 'MYTHIC', desc: '모든 공격력, 마법력, 방어력, 체력이 30% 일제히 증폭 (중복 시 배수).' },
  eye_of_providence: { id: 'eye_of_providence', name: '섭리의 눈', icon: '👁️✨', rarity: 'MYTHIC', desc: '치명타 적중 시 100% 관통 폭발 트루 데미지 방출 (중복 시 데미지 배수).' },
  aegis_of_immortality: { id: 'aegis_of_immortality', name: '이지스의 방패', icon: '🛡️🌟', rarity: 'MYTHIC', desc: '받는 모든 피해 25% 영구 경감 및 방어/저항 +60 (중복 시 누적).' },
  ouroboros_ring: { id: 'ouroboros_ring', name: '우로보로스의 고리', icon: '🐍♾️', rarity: 'MYTHIC', desc: '스킬 쿨다운 25% 단축 및 스킬 마나 소모 대폭 절감 (중복 가능).' },
  pandoras_box: { id: 'pandoras_box', name: '판도라의 상자', icon: '📦🔥', rarity: 'LEGENDARY', desc: '공격력/마법력 +60%, 치명타율 +15% 증가 (중복 시 공격력 누적).' }
};

// 10. 소비 아이템
const CONSUMABLES = {
  hp_pot_small: { id: 'hp_pot_small', name: '체력 포션', icon: '🧪❤️', desc: 'HP를 40% 즉시 회복합니다.', healHp: 0.4 },
  mp_pot_small: { id: 'mp_pot_small', name: '마나 포션', icon: '🧪💙', desc: 'MP를 50% 즉시 회복합니다.', healMp: 0.5 },
  hp_pot_large: { id: 'hp_pot_large', name: '대형 체력 포션', icon: '🧪💜', desc: 'HP를 80% 즉시 회복합니다.', healHp: 0.8 },
  atk_potion: { id: 'atk_potion', name: '공격력 포션', icon: '🧪🟡', desc: '30초 동안 공격력 +60% 증가.', buff: 'atkBuff', dur: 30 },
  def_potion: { id: 'def_potion', name: '방어력 포션', icon: '🧪🔵', desc: '30초 동안 방어력 +60% 증가.', buff: 'defBuff', dur: 30 },
  spd_potion: { id: 'spd_potion', name: '속도 포션', icon: '🧪⚡', desc: '30초 동안 이동속도 +35% 증가.', buff: 'spdBuff', dur: 30 },
  fire_bomb: { id: 'fire_bomb', name: '화염 폭탄', icon: '💣🔥', desc: '던져서 넓은 범위에 대형 화염 피해와 화상 부여.', bomb: 'FIRE', dmg: 220 },
  frost_bomb: { id: 'frost_bomb', name: '빙결 폭탄', icon: '💣❄️', desc: '던져서 넓은 범위의 적들을 3초간 빙결.', bomb: 'COLD', dmg: 140 }
};

// 11. 던전 5개 지역 테마 (Image 2 레퍼런스 기준: 고블린 던전, 심연 성소, 흑기사 요새, 화룡의 둥지, 공허의 옥좌)
const DUNGEON_AREAS = [
  {
    id: 1,
    themeKey: 'catacombs',
    name: '고블린 지하 묘지',
    stars: '★',
    floorColor: '#1c212c',
    gridColor: '#2b3446',
    wallColor: '#0e1117',
    obstacleType: 'pillar',
    hazardType: 'iron_spikes',
    barrelType: 'wood_barrel',
    boss: 'goblin_king'
  },
  {
    id: 2,
    themeKey: 'abyss',
    name: '심연의 마녀 성소',
    stars: '★★',
    floorColor: '#18142b',
    gridColor: '#282147',
    wallColor: '#0d0a17',
    obstacleType: 'crystal',
    hazardType: 'void_rift',
    barrelType: 'ancient_urn',
    boss: 'abyss_witch'
  },
  {
    id: 3,
    themeKey: 'fortress',
    name: '저주받은 흑기사 요새',
    stars: '★★★',
    floorColor: '#22262e',
    gridColor: '#343a46',
    wallColor: '#111317',
    obstacleType: 'ruin_pillar',
    hazardType: 'blood_spikes',
    barrelType: 'demon_box',
    boss: 'cursed_knight'
  },
  {
    id: 4,
    themeKey: 'dragon_nest',
    name: '고대 화룡의 둥지',
    stars: '★★★★',
    floorColor: '#2d1414',
    gridColor: '#482020',
    wallColor: '#160909',
    obstacleType: 'magma_rock',
    hazardType: 'lava_pool',
    barrelType: 'tnt_barrel',
    boss: 'ancient_dragon'
  },
  {
    id: 5,
    themeKey: 'void_throne',
    name: '공허의 옥좌',
    stars: '★★★★★',
    floorColor: '#141126',
    gridColor: '#241d45',
    wallColor: '#090812',
    obstacleType: 'throne_statue',
    hazardType: 'void_rift',
    barrelType: 'chaos_orb',
    boss: 'void_lord'
  }
];

// 12. 방 종류
const ROOM_TYPES = {
  START: { name: '시작 지점', icon: '🚪' },
  BATTLE: { name: '전투방', icon: '⚔️' },
  ELITE: { name: '엘리트방', icon: '👹' },
  TREASURE: { name: '보물방', icon: '💰' },
  SHOP: { name: '상점', icon: '🛒' },
  REST: { name: '휴식방', icon: '❤️' },
  EVENT: { name: '이벤트방', icon: '❓' },
  CHALLENGE: { name: '도전방', icon: '🔥' },
  BOSS: { name: '보스방', icon: '👑' }
};

// 13. 몬스터 (45종, 밸런스 정상화: 몬스터 체력과 공격력을 박진감 넘치게 상향 및 다양한 변종 추가)
const MONSTERS = {
  // [고대 숲]
  slime: { name: '슬라임', hp: 120, atk: 15, def: 4, spd: 2.2, exp: 25, gold: 18, color: '#2ecc71', type: 'forest' },
  wolf: { name: '늑대', hp: 170, atk: 22, def: 5, spd: 3.4, exp: 35, gold: 25, color: '#95a5a6', type: 'forest' },
  goblin: { name: '고블린', hp: 150, atk: 19, def: 6, spd: 2.7, exp: 32, gold: 28, color: '#27ae60', type: 'forest' },
  goblin_warrior: { name: '고블린 전사', hp: 260, atk: 26, def: 12, spd: 2.5, exp: 50, gold: 38, color: '#1e824c', type: 'forest' },
  orc: { name: '오크', hp: 440, atk: 36, def: 18, spd: 2.2, exp: 75, gold: 52, color: '#2ecc71', type: 'forest' },
  mushroom: { name: '독버섯', hp: 140, atk: 18, def: 4, spd: 2.0, exp: 30, gold: 22, dmgType: 'POISON', color: '#9b59b6', type: 'forest' },
  boar: { name: '멧돼지', hp: 280, atk: 28, def: 12, spd: 3.5, exp: 55, gold: 35, color: '#795548', type: 'forest' },
  goblin_archer: { name: '고블린 궁수', hp: 110, atk: 20, def: 3, spd: 2.4, exp: 36, gold: 30, isRanged: true, color: '#1abc9c', type: 'forest' },
  forest_ent: { name: '고대 엔트', hp: 380, atk: 32, def: 18, spd: 1.6, exp: 65, gold: 45, color: '#1b5e20', type: 'forest' },
  poison_viper: { name: '맹독 살모사', hp: 140, atk: 24, def: 4, spd: 3.6, dmgType: 'POISON', exp: 40, gold: 30, color: '#00b894', type: 'forest' },
  shadow_stalker: { name: '그림자 표범', hp: 220, atk: 30, def: 8, spd: 3.8, exp: 55, gold: 40, color: '#2d3436', type: 'forest' },
  ancient_guardian: { name: '고대 수호병', hp: 450, atk: 36, def: 24, spd: 1.8, exp: 80, gold: 55, color: '#27ae60', type: 'forest' },

  // [수정 동굴]
  bat: { name: '박쥐', hp: 100, atk: 18, def: 2, spd: 3.7, exp: 32, gold: 22, color: '#34495e', type: 'cave' },
  spider: { name: '거미', hp: 190, atk: 25, def: 6, spd: 2.8, exp: 45, gold: 30, dmgType: 'POISON', color: '#16a085', type: 'cave' },
  skeleton: { name: '해골', hp: 230, atk: 27, def: 10, spd: 2.5, exp: 50, gold: 35, color: '#ecf0f1', type: 'cave' },
  zombie_miner: { name: '광부 좀비', hp: 320, atk: 30, def: 15, spd: 2.0, exp: 62, gold: 44, color: '#bdc3c7', type: 'cave' },
  rock_golem: { name: '바위 골렘', hp: 480, atk: 38, def: 25, spd: 1.6, exp: 85, gold: 58, color: '#7f8c8d', type: 'cave' },
  cave_mage: { name: '동굴 마법사', hp: 180, atk: 32, def: 6, spd: 2.2, exp: 70, gold: 48, isRanged: true, dmgType: 'COLD', color: '#2980b9', type: 'cave' },
  crystal_beetle: { name: '수정 갑충', hp: 340, atk: 28, def: 22, spd: 2.2, exp: 68, gold: 46, color: '#00cec9', type: 'cave' },
  chasm_shrieker: { name: '심연의 비명자', hp: 180, atk: 35, def: 6, spd: 2.7, isRanged: true, dmgType: 'DARK', exp: 75, gold: 52, color: '#6c5ce7', type: 'cave' },
  lava_slug: { name: '마그마 슬러그', hp: 280, atk: 30, def: 14, spd: 1.8, dmgType: 'FIRE', exp: 65, gold: 45, color: '#e17055', type: 'cave' },
  frost_elemental: { name: '서리 정령', hp: 380, atk: 42, def: 18, spd: 2.4, dmgType: 'COLD', exp: 90, gold: 65, isRanged: true, color: '#74b9ff', type: 'cave' },
  crystal_golem: { name: '수정 거인', hp: 750, atk: 48, def: 35, spd: 1.5, exp: 120, gold: 80, color: '#0984e3', type: 'cave' },

  // [저주받은 폐허]
  ghost: { name: '유령', hp: 210, atk: 30, def: 2, spd: 3.0, exp: 65, gold: 42, color: '#81ecec', type: 'ruins' },
  skeleton_knight: { name: '해골기사', hp: 380, atk: 40, def: 22, spd: 2.7, exp: 95, gold: 68, color: '#bdc3c7', type: 'ruins' },
  wraith: { name: '망령', hp: 280, atk: 36, def: 10, spd: 3.1, exp: 80, gold: 58, dmgType: 'DARK', color: '#6c5ce7', type: 'ruins' },
  cursed_knight: { name: '저주받은 기사', hp: 520, atk: 46, def: 28, spd: 2.4, exp: 115, gold: 80, color: '#2c3e50', type: 'ruins' },
  dark_mage: { name: '암흑 마법사', hp: 260, atk: 44, def: 10, spd: 2.5, exp: 100, gold: 72, isRanged: true, dmgType: 'DARK', color: '#8e44ad', type: 'ruins' },
  gargoyle: { name: '가고일', hp: 550, atk: 44, def: 30, spd: 2.8, exp: 125, gold: 88, color: '#7f8c8d', type: 'ruins' },
  crypt_ghoul: { name: '묘지 구울', hp: 320, atk: 42, def: 12, spd: 3.3, dmgType: 'POISON', exp: 95, gold: 68, color: '#55efc4', type: 'ruins' },
  bone_colossus: { name: '해골 거신', hp: 650, atk: 52, def: 32, spd: 1.8, exp: 150, gold: 110, color: '#dfe6e9', type: 'ruins' },
  lich_apprentice: { name: '리치 사령술사', hp: 300, atk: 48, def: 12, spd: 2.5, isRanged: true, dmgType: 'DARK', exp: 120, gold: 85, color: '#a29bfe', type: 'ruins' },
  abyss_watcher: { name: '심연의 감시자', hp: 420, atk: 52, def: 18, spd: 2.8, dmgType: 'DARK', exp: 110, gold: 75, isRanged: true, color: '#575fcf', type: 'ruins' },

  // [불타는 지옥 (화산)]
  imp: { name: '임프', hp: 280, atk: 38, def: 10, spd: 3.4, exp: 100, gold: 75, dmgType: 'FIRE', color: '#e74c3c', type: 'hell' },
  hellhound: { name: '지옥견', hp: 380, atk: 48, def: 15, spd: 3.7, exp: 125, gold: 90, dmgType: 'FIRE', color: '#c0392b', type: 'hell' },
  fire_elemental: { name: '불꽃 정령', hp: 350, atk: 52, def: 14, spd: 2.6, exp: 130, gold: 95, isRanged: true, dmgType: 'FIRE', color: '#d35400', type: 'hell' },
  fire_golem: { name: '화염 골렘', hp: 700, atk: 58, def: 34, spd: 1.8, exp: 175, gold: 130, dmgType: 'FIRE', color: '#e67e22', type: 'hell' },
  demon: { name: '악마', hp: 560, atk: 54, def: 26, spd: 3.0, exp: 180, gold: 135, color: '#922b21', type: 'hell' },
  hell_archer: { name: '지옥 궁수', hp: 320, atk: 48, def: 14, spd: 2.8, exp: 145, gold: 105, isRanged: true, dmgType: 'FIRE', color: '#ff7675', type: 'hell' },
  fire_drake: { name: '화염 드레이크', hp: 620, atk: 60, def: 26, spd: 3.2, isRanged: true, dmgType: 'FIRE', exp: 210, gold: 155, color: '#d63031', type: 'hell' },
  magma_fiend: { name: '마그마 악령', hp: 480, atk: 56, def: 22, spd: 3.0, dmgType: 'FIRE', exp: 180, gold: 130, color: '#e84393', type: 'hell' },
  succubus: { name: '서큐버스', hp: 420, atk: 58, def: 18, spd: 3.2, isRanged: true, dmgType: 'DARK', exp: 195, gold: 145, color: '#fd79a8', type: 'hell' },
  magma_hydra: { name: '마그마 히드라', hp: 850, atk: 68, def: 32, spd: 2.0, dmgType: 'FIRE', exp: 240, gold: 180, isRanged: true, color: '#e74c3c', type: 'hell' },
  hell_cerberus: { name: '지옥의 켈베로스', hp: 720, atk: 65, def: 24, spd: 3.5, dmgType: 'FIRE', exp: 220, gold: 170, color: '#c0392b', type: 'hell' },

  // [악마의 성 & 마왕의 왕좌]
  dark_knight: { name: '암흑기사', hp: 750, atk: 64, def: 36, spd: 2.8, exp: 230, gold: 175, color: '#2d3436', type: 'castle' },
  demon_general: { name: '악마 장군', hp: 980, atk: 75, def: 42, spd: 2.6, exp: 310, gold: 230, color: '#641e16', type: 'castle' },
  overlord_sorcerer: { name: '마왕의 마법사', hp: 540, atk: 70, def: 22, spd: 2.8, exp: 260, gold: 200, isRanged: true, dmgType: 'DARK', color: '#4a235a', type: 'castle' },
  corrupt_paladin: { name: '타락한 성기사', hp: 850, atk: 68, def: 45, spd: 2.6, exp: 275, gold: 215, color: '#2c3e50', type: 'castle' },
  demon_archer: { name: '악마 궁수', hp: 480, atk: 62, def: 20, spd: 3.0, exp: 245, gold: 190, isRanged: true, color: '#d63031', type: 'castle' },
  infernal_knight: { name: '지옥의 기사', hp: 1100, atk: 82, def: 48, spd: 2.9, exp: 400, gold: 310, dmgType: 'FIRE', color: '#e17055', type: 'castle' },
  blood_vampire: { name: '혈족 흡혈귀', hp: 700, atk: 72, def: 28, spd: 3.4, dmgType: 'DARK', exp: 320, gold: 240, color: '#b71540', type: 'castle' },
  chaos_behemoth: { name: '혼돈의 베히모스', hp: 1300, atk: 90, def: 52, spd: 2.3, exp: 460, gold: 350, color: '#2c2c54', type: 'castle' },
  death_priest: { name: '파멸의 사제', hp: 600, atk: 78, def: 24, spd: 2.7, isRanged: true, dmgType: 'DARK', exp: 360, gold: 270, color: '#40407a', type: 'castle' },
  void_beast: { name: '공허의 야수', hp: 1200, atk: 88, def: 45, spd: 3.0, dmgType: 'DARK', exp: 380, gold: 290, color: '#4834d4', type: 'castle' },
  chaos_lich: { name: '혼돈의 대사령관', hp: 800, atk: 85, def: 28, spd: 2.6, dmgType: 'DARK', exp: 420, gold: 320, isRanged: true, color: '#be2edd', type: 'castle' }
};

// 14. 엘리트 수식어
const ELITE_MODIFIERS = [
  { prefix: '불타는', aura: 'FIRE', hpMul: 2.8, atkMul: 1.6, color: '#e74c3c' },
  { prefix: '얼어붙은', aura: 'COLD', hpMul: 2.8, atkMul: 1.6, color: '#3498db' },
  { prefix: '번개의', aura: 'LIGHTNING', hpMul: 2.8, atkMul: 1.6, color: '#f1c40f' },
  { prefix: '독의', aura: 'POISON', hpMul: 2.8, atkMul: 1.6, color: '#2ecc71' },
  { prefix: '저주받은', aura: 'DARK', hpMul: 2.8, atkMul: 1.6, color: '#8e44ad' },
  { prefix: '피의', aura: 'BLEED', hpMul: 2.8, atkMul: 1.6, color: '#c0392b' }
];

// 15. 보스 목록 (Image 2 레퍼런스 5대 군주: 거대 고블린 왕, 심연의 마녀, 저주받은 기사, 고대 드래곤, 공허의 군주)
const BOSSES = {
  goblin_king: { id: 'goblin_king', name: '👑 거대 고블린 왕', area: 1, hp: 3200, maxHp: 3200, atk: 46, def: 25, spd: 1.8, color: '#f59e0b', exp: 800, gold: 600, soulStones: 10 },
  abyss_witch: { id: 'abyss_witch', name: '🔮 심연의 마녀', area: 2, hp: 5400, maxHp: 5400, atk: 60, def: 32, spd: 2.2, color: '#a855f7', exp: 1400, gold: 1000, soulStones: 15 },
  cursed_knight: { id: 'cursed_knight', name: '⚔️ 저주받은 기사', area: 3, hp: 8500, maxHp: 8500, atk: 78, def: 48, spd: 2.5, color: '#3b82f6', exp: 2200, gold: 1600, soulStones: 22 },
  ancient_dragon: { id: 'ancient_dragon', name: '🐉 고대 드래곤', area: 4, hp: 13000, maxHp: 13000, atk: 98, def: 55, spd: 2.4, color: '#ef4444', exp: 3800, gold: 2800, soulStones: 32 },
  void_lord: { id: 'void_lord', name: '🌌 공허의 군주 (최종 보스)', area: 5, hp: 32000, maxHp: 32000, atk: 150, def: 75, spd: 3.0, color: '#6366f1', exp: 20000, gold: 15000, soulStones: 100 },
  // 호환성 별칭 (이전 세이브 데이터 및 레거시 방어용)
  forest_boss: { id: 'forest_boss', name: '👑 거대 고블린 왕', area: 1, hp: 3200, maxHp: 3200, atk: 46, def: 25, spd: 1.8, color: '#f59e0b', exp: 800, gold: 600, soulStones: 10 },
  cave_boss: { id: 'cave_boss', name: '🔮 심연의 마녀', area: 2, hp: 5400, maxHp: 5400, atk: 60, def: 32, spd: 2.2, color: '#a855f7', exp: 1400, gold: 1000, soulStones: 15 },
  ruins_boss: { id: 'ruins_boss', name: '⚔️ 저주받은 기사', area: 3, hp: 8500, maxHp: 8500, atk: 78, def: 48, spd: 2.5, color: '#3b82f6', exp: 2200, gold: 1600, soulStones: 22 },
  hell_boss: { id: 'hell_boss', name: '🐉 고대 드래곤', area: 4, hp: 13000, maxHp: 13000, atk: 98, def: 55, spd: 2.4, color: '#ef4444', exp: 3800, gold: 2800, soulStones: 32 },
  demon_boss: { id: 'demon_boss', name: '🌌 공허의 군주', area: 5, hp: 18000, maxHp: 18000, atk: 120, def: 65, spd: 2.8, color: '#8b5cf6', exp: 8000, gold: 6000, soulStones: 50 },
  demon_king: { id: 'demon_king', name: '🌌 공허의 군주 (최종 보스)', area: 5, hp: 32000, maxHp: 32000, atk: 150, def: 75, spd: 3.0, color: '#6366f1', exp: 20000, gold: 15000, soulStones: 100 }
};

// 16. 특성 목록 (중복 획득 및 무한 성장 지원)
const PERKS = [
  { id: 'p_str', name: '힘의 각성', cat: '공격', icon: '💪', desc: '공격력 +20% 증가 (중복 선택 시 효과 배수 누적).' },
  { id: 'p_crit', name: '치명타 단련', cat: '공격', icon: '🎯', desc: '치명타 확률 +10%, 치명타 피해 +35% 증가.' },
  { id: 'p_spd', name: '속공', cat: '공격', icon: '⚡', desc: '공격속도 +25% 증가.' },
  { id: 'p_pierce', name: '관통의 칼날', cat: '공격', icon: '🗡️', desc: '모든 공격이 적의 방어력 30% 무시 관통.' },
  { id: 'p_lifesteal', name: '흡혈귀의 피', cat: '공격', icon: '🧛', desc: '생명력 흡수 +8% 획득.' },
  { id: 'p_iron', name: '철벽', cat: '방어', icon: '🛡️', desc: '방어력 +25, 마법 저항 +25 증가.' },
  { id: 'p_regen', name: '재생', cat: '방어', icon: '🌱', desc: '초당 최대 체력의 2.5% 지속 회복 (중복 시 누적).' },
  { id: 'p_dodge', name: '회피의 달인', cat: '방어', icon: '💨', desc: '회피율 +12% 증가.' },
  { id: 'p_hp_up', name: '거인의 심장', cat: '방어', icon: '💖', desc: '최대 체력 +35% 증가 (중복 시 배수).' },
  { id: 'p_spell_amp', name: '주문 강화', cat: '마법', icon: '🔮', desc: '마법력 +25% 증가 (중복 시 배수).' },
  { id: 'p_cdr', name: '시간 왜곡', cat: '마법', icon: '⏳', desc: '스킬 쿨타임 감소 +18% 획득.' },
  { id: 'p_greed', name: '탐욕', cat: '경제', icon: '🪙', desc: '골드 획득량 +50% 증가.' },
  { id: 'p_luck', name: '행운의 손길', cat: '경제', icon: '🍀', desc: '희귀 이상 아이템 발견 확률 +35% 증가.' },
  { id: 'p_exp', name: '현자의 배움', cat: '경제', icon: '📜', desc: '경험치 획득량 +35% 증가.' },
  { id: 'p_combo_master', name: '콤보의 달인', cat: '공격', icon: '🥊', desc: '공격속도 +18% 증가 및 연속 공격 피해량 상승.' },
  { id: 'p_executioner', name: '처형자', cat: '공격', icon: '🪓', desc: '체력 40% 이하의 적에게 주는 피해 +50% 폭증.' },
  { id: 'p_giant_slayer', name: '거인 학살자', cat: '공격', icon: '🗿⚔️', desc: '보스 및 정예 몬스터에게 주는 피해 +40% 증가.' },
  { id: 'p_berserk', name: '광전사의 혼', cat: '공격', icon: '🩸🔥', desc: '잃은 체력에 비례하여 공격력과 공격속도 최대 +80% 증가.' },
  { id: 'p_elemental_master', name: '원소의 지배자', cat: '마법', icon: '🔮✨', desc: '모든 속성 마법 피해량이 +35% 대폭 증폭됩니다.' },
  { id: 'p_mana_spring', name: '마력 폭풍', cat: '마법', icon: '🌊⚡', desc: '마나 재생 속도 2배 및 스킬 쿨타임 -15% 추가 단축.' },
  { id: 'p_shield_master', name: '수호의 성벽', cat: '방어', icon: '🛡️🏰', desc: '방어력 +30, 마법 저항 +30 및 피격 시 보호막 생성.' },
  { id: 'p_shadow_veil', name: '그림자 장막', cat: '방어', icon: '🌫️🥷', desc: '회피율 +14% 증가 및 회피 시 1초간 완전 무적.' },
  { id: 'p_overpower', name: '제압의 일격', cat: '공격', icon: '🔨💥', desc: '공격 적중 시 적 이동속도를 40% 둔화시키고 받는 피해를 25% 증폭.' },
  { id: 'p_soul_reaper', name: '영혼 수확자', cat: '마법', icon: '💀💎', desc: '적 처치 시마다 공격력과 마법력이 영구적으로 누적 상승.' },
  { id: 'p_bounty_hunter', name: '현상금 사냥꾼', cat: '경제', icon: '💰🎯', desc: '보스 및 정예 처치 시 골드 2배 및 영혼석 획득량 대폭 증가.' },
  { id: 'p_potion_master', name: '연금술 비전', cat: '방어', icon: '🧪👑', desc: '포션 회복량 2배 증가 및 사용 시 10초간 공격/방어 +50% 버프.' }
];

// 17. 랜덤 이벤트 (고대 제단의 성스러운 축복 및 미지의 사건)
const RANDOM_EVENTS = [
  {
    id: 'ancient_altar_blessing',
    title: '고대 제단의 축복',
    text: '고대의 룬 문자가 찬란한 황금빛으로 공명하는 거룩한 제단입니다. 어떤 고대의 은총을 선택하시겠습니까?',
    options: [
      { text: '⚔️ 전쟁신의 은총: 공격력 & 마법력 +35% 대폭 증가', effect: 'altar_war_god' },
      { text: '🛡️ 불멸의 가호: 최대 체력 +30% & 받는 피해 25% 영구 감소', effect: 'altar_immortal' },
      { text: '⚡ 신속의 축복: 이동속도 +30% & 스킬 쿨다운 -25% 단축', effect: 'altar_swift' },
      { text: '💎 영혼석 제물: 영혼석 +25 💎 & 골드 +350 G 즉시 수령', effect: 'altar_souls' }
    ]
  },
  {
    id: 'cursed_altar',
    title: '저주받은 핏빛 제단',
    text: '핏빛으로 물든 제단이 놓여 있습니다. 체력을 바치면 강력한 보상을 주겠다고 속삭입니다.',
    options: [
      { text: '🩸 HP 20%를 바치고 무작위 전설 장비를 얻는다', effect: 'hp_for_item' },
      { text: '✨ 제단을 정화하고 생명력을 완전 회복한다', effect: 'clean_altar' },
      { text: '조용히 지나친다', effect: 'leave' }
    ]
  },
  {
    id: 'mystic_spring',
    title: '신비한 생명의 샘',
    text: '에메랄드 빛 청아한 온천수가 솟아오르고 있습니다.',
    options: [
      { text: '💧 샘물을 마신다 (HP / MP 100% 회복)', effect: 'drink_spring' },
      { text: '조용히 떠난다', effect: 'leave' }
    ]
  },
  {
    id: 'demon_deal',
    title: '악마와의 밀약',
    text: '검은 화염 속에서 대악마가 나타나 파괴적인 제안을 건넵니다.',
    options: [
      { text: '🔥 최대 HP 15%를 희생하고 공격력 +60% 폭증 획득', effect: 'demon_atk' },
      { text: '악마의 유혹을 단호히 거절한다', effect: 'leave' }
    ]
  }
];

// 18. 영구 성장 특성판 (무기 마스터리, 스킬 각성, 궁극기 강화, 생존/탐험 4대 분야)
const TALENT_CATEGORIES = {
  weapon: { name: '무기 마스터리', icon: '⚔️', desc: '기본 공격력, 공격속도, 치명타 및 시작 무기 강화' },
  skill: { name: '스킬 각성', icon: '⚡', desc: '일반 스킬(Q, E, R) 쿨다운, 마력 보존, 피해량 및 특수 효과 강화' },
  ultimate: { name: '궁극기 강화', icon: '👑', desc: '궁극기(F)의 파괴력 증폭, 쿨다운 단축, 무적 및 광역 기절' },
  survival: { name: '생존 & 탐험', icon: '🛡️', desc: '체력 증폭, 방어력, 대쉬 가속, 시작 골드 및 영혼석 획득 증대' }
};

const TALENT_TREE = [
  // ===== 1. 무기 마스터리 =====
  {
    id: 't_wep_starter',
    cat: 'weapon',
    name: '명품 무기 개시',
    icon: '🗡️✨',
    maxLv: 4,
    baseCost: 15,
    costMul: 15,
    desc: '던전 입장 시 클래스 기본 무기 대신 최고 등급 무기를 즉시 장착하고 출발합니다.',
    getEffectText: (lv) => lv === 0 ? '효과 없음 (기본 무기)' : lv === 1 ? '희귀(RARE) 등급 무기 지급' : lv === 2 ? '영웅(EPIC) 등급 무기 지급' : lv === 3 ? '전설(LEGENDARY) 등급 무기 지급' : '신화(MYTHIC) 종결 무기 지급'
  },
  {
    id: 't_wep_slash',
    cat: 'weapon',
    name: '검기의 극의',
    icon: '⚔️🌀',
    maxLv: 25,
    baseCost: 8,
    costMul: 4,
    desc: '기본 공격 시 사거리와 공격 범위가 대폭 확장되며 전방으로 참격 충격파를 방출합니다.',
    getEffectText: (lv) => `공격 범위 +${lv * 8}%, 검기 충격파 위력 +${lv * 12}% (최대 +300%)`
  },
  {
    id: 't_wep_speed',
    cat: 'weapon',
    name: '질풍의 연타',
    icon: '⚡🗡️',
    maxLv: 25,
    baseCost: 7,
    costMul: 4,
    desc: '모든 무기의 기본 공격 속도가 영구적으로 대폭 상승합니다.',
    getEffectText: (lv) => `공격 속도 +${lv * 6}% (최대 +150%)`
  },
  {
    id: 't_wep_crit',
    cat: 'weapon',
    name: '치명적 급소',
    icon: '🎯🩸',
    maxLv: 25,
    baseCost: 9,
    costMul: 4,
    desc: '치명타 확률과 치명타 적중 시의 피해 배율이 비약적으로 증가합니다.',
    getEffectText: (lv) => `치명타 확률 +${(lv * 1.8).toFixed(1)}%, 치명타 피해 +${lv * 12}%`
  },
  {
    id: 't_wep_vamp',
    cat: 'weapon',
    name: '흡혈귀의 본능',
    icon: '🧛🩸',
    maxLv: 25,
    baseCost: 10,
    costMul: 5,
    desc: '모든 기본 공격으로 적에게 입힌 피해의 일부를 생명력으로 즉시 흡수합니다.',
    getEffectText: (lv) => `기본 생명력 흡수 +${(lv * 1.5).toFixed(1)}% (최대 +37.5%)`
  },
  {
    id: 't_wep_penetrate',
    cat: 'weapon',
    name: '방어구 분쇄',
    icon: '🛡️💥',
    maxLv: 25,
    baseCost: 9,
    costMul: 5,
    desc: '무기 공격 시 적의 물리 방어력과 마법 저항력을 일정 비율 무시합니다.',
    getEffectText: (lv) => `적 방어/저항력 -${(lv * 3.0).toFixed(1)}% 무시 관통 (최대 -75%)`
  },
  {
    id: 't_wep_double_hit',
    cat: 'weapon',
    name: '질풍의 이연격',
    icon: '⚔️⚡',
    maxLv: 15,
    baseCost: 12,
    costMul: 6,
    desc: '기본 공격 시 일정 확률로 전방에 2회 연속 참격을 가합니다.',
    getEffectText: (lv) => `2회 연속 타격 발동 확률 +${lv * 5}% (최대 75%)`
  },
  {
    id: 't_wep_elemental',
    cat: 'weapon',
    name: '원소 인챈트',
    icon: '🔥❄️',
    maxLv: 25,
    baseCost: 10,
    costMul: 5,
    desc: '모든 무기 공격에 추가 원소 속성 마법 피해를 가합니다.',
    getEffectText: (lv) => `무기 공격 시 +${lv * 10}% 추가 원소 피해`
  },

  // ===== 2. 스킬 각성 =====
  {
    id: 't_skl_cdr',
    cat: 'skill',
    name: '시간 가속',
    icon: '⏳⚡',
    maxLv: 25,
    baseCost: 8,
    costMul: 4,
    desc: '모든 일반 스킬(Q, E, R)의 재사용 대기시간이 영구적으로 단축됩니다.',
    getEffectText: (lv) => `스킬 쿨다운 -${(lv * 2.5).toFixed(1)}% 단축 (최대 -62.5%)`
  },
  {
    id: 't_skl_mp',
    cat: 'skill',
    name: '마나의 샘',
    icon: '💧🔮',
    maxLv: 25,
    baseCost: 7,
    costMul: 3,
    desc: '모든 스킬의 마나 소모량이 대폭 감소하여 끊임없는 연속 시전이 가능해집니다.',
    getEffectText: (lv) => `스킬 MP 소모량 -${lv * 3}% 감소 (최대 -75%)`
  },
  {
    id: 't_skl_power',
    cat: 'skill',
    name: '비전 과부하',
    icon: '🔥✨',
    maxLv: 25,
    baseCost: 9,
    costMul: 4,
    desc: '모든 일반 스킬의 피해량이 폭발적으로 증폭됩니다.',
    getEffectText: (lv) => `스킬 위력 +${lv * 10}% 증폭 (최대 +250%)`
  },
  {
    id: 't_skl_reset',
    cat: 'skill',
    name: '연쇄 주문',
    icon: '🔄⚡',
    maxLv: 15,
    baseCost: 12,
    costMul: 6,
    desc: '스킬 사용 시 일정 확률로 해당 스킬의 쿨타임이 즉시 초기화되어 재사용 가능합니다.',
    getEffectText: (lv) => `스킬 즉시 초기화 확률 ${lv * 5}% (최대 75%)`
  },
  {
    id: 't_skl_barrier',
    cat: 'skill',
    name: '시전자의 수호',
    icon: '🛡️🔮',
    maxLv: 15,
    baseCost: 10,
    costMul: 5,
    desc: '스킬을 시전할 때마다 최대 체력에 비례한 신성 보호막을 획득합니다.',
    getEffectText: (lv) => `스킬 시전 시 최대 HP의 ${lv * 4}% 보호막 생성`
  },
  {
    id: 't_skl_crit',
    cat: 'skill',
    name: '주문 치명타',
    icon: '✨🎯',
    maxLv: 25,
    baseCost: 10,
    costMul: 5,
    desc: '모든 스킬 공격 시에도 치명타 판정이 적용되어 폭발적인 주문 피해를 입힙니다.',
    getEffectText: (lv) => `스킬 치명타 확률 +${(lv * 2.0).toFixed(1)}%, 치명타 피해 +${lv * 10}%`
  },
  {
    id: 't_skl_echo',
    cat: 'skill',
    name: '주문 반향',
    icon: '🌀💫',
    maxLv: 15,
    baseCost: 14,
    costMul: 7,
    desc: '스킬 시전 시 일정 확률로 동일한 스킬이 한 번 더 자동 발동됩니다.',
    getEffectText: (lv) => `주문 2회 연속 반향 확률 ${lv * 4.5}% (최대 67.5%)`
  },

  // ===== 3. 궁극기 강화 =====
  {
    id: 't_ult_power',
    cat: 'ultimate',
    name: '파멸의 심판',
    icon: '🌋💥',
    maxLv: 25,
    baseCost: 10,
    costMul: 5,
    desc: '궁극기(F)의 피해량이 압도적으로 증폭되어 화면의 적들을 섬멸합니다.',
    getEffectText: (lv) => `궁극기 피해량 +${lv * 20}% 증폭 (최대 +500%)`
  },
  {
    id: 't_ult_cd',
    cat: 'ultimate',
    name: '초월의 순환',
    icon: '⌛👑',
    maxLv: 25,
    baseCost: 9,
    costMul: 4,
    desc: '궁극기(F)의 재사용 대기시간이 크게 단축되어 전투마다 빠르게 사용합니다.',
    getEffectText: (lv) => `궁극기 쿨다운 -${(lv * 1.2).toFixed(1)}초 단축 (최대 -30초)`
  },
  {
    id: 't_ult_invincible',
    cat: 'ultimate',
    name: '불멸의 권능',
    icon: '☀️🛡️',
    maxLv: 10,
    baseCost: 14,
    costMul: 8,
    desc: '궁극기를 시전하는 순간 모든 공격을 무시하는 완전 무적 상태에 돌입합니다.',
    getEffectText: (lv) => `궁극기 시전 시 ${(lv * 0.8).toFixed(1)}초간 완전 무적 (최대 8초)`
  },
  {
    id: 't_ult_stun',
    cat: 'ultimate',
    name: '대재앙의 충격',
    icon: '💫🌋',
    maxLv: 10,
    baseCost: 12,
    costMul: 7,
    desc: '궁극기 발동 시 주변 모든 적을 일제히 기절(Stun) 상태로 무력화합니다.',
    getEffectText: (lv) => `궁극기 적중 시 모든 적 ${(lv * 0.5).toFixed(1)}초간 기절 (최대 5초)`
  },
  {
    id: 't_ult_drain',
    cat: 'ultimate',
    name: '영혼 수확의 장',
    icon: '💀💎',
    maxLv: 15,
    baseCost: 14,
    costMul: 7,
    desc: '궁극기 시전 즉시 대량의 체력을 회복하며 생존을 보장합니다.',
    getEffectText: (lv) => `궁극기 시전 시 HP ${lv * 8}% 즉시 회복`
  },
  {
    id: 't_ult_charge_on_kill',
    cat: 'ultimate',
    name: '학살의 카타르시스',
    icon: '👑🩸',
    maxLv: 15,
    baseCost: 12,
    costMul: 6,
    desc: '적을 처치할 때마다 궁극기의 재사용 대기시간이 즉시 단축됩니다.',
    getEffectText: (lv) => `적 처치 시 궁극기 쿨다운 -${(lv * 0.3).toFixed(1)}초 즉시 단축`
  },
  {
    id: 't_ult_meteor_rain',
    cat: 'ultimate',
    name: '천벌의 부름',
    icon: '☄️🌋',
    maxLv: 15,
    baseCost: 15,
    costMul: 8,
    desc: '궁극기를 발동할 때 화면 전체에 추가로 멸망의 운석 폭격이 쏟아집니다.',
    getEffectText: (lv) => `궁극기 발동 시 추가 운석 폭격 ${lv * 2}발 소환`
  },

  // ===== 4. 생존 & 탐험 =====
  {
    id: 't_srv_hp',
    cat: 'survival',
    name: '거인의 심장',
    icon: '💖🛡️',
    maxLv: 25,
    baseCost: 6,
    costMul: 3,
    desc: '기본 최대 체력이 영구적으로 대폭 상승합니다.',
    getEffectText: (lv) => `최대 HP +${lv * 50} (최대 +1,250)`
  },
  {
    id: 't_srv_iron',
    cat: 'survival',
    name: '강철의 육체',
    icon: '🛡️🧱',
    maxLv: 25,
    baseCost: 7,
    costMul: 4,
    desc: '기본 물리 방어력과 마법 저항력이 영구적으로 상승합니다.',
    getEffectText: (lv) => `방어력 +${lv * 8}, 마법 저항 +${lv * 8} (최대 +200)`
  },
  {
    id: 't_srv_dash',
    cat: 'survival',
    name: '바람의 도약',
    icon: '💨🪽',
    maxLv: 15,
    baseCost: 8,
    costMul: 4,
    desc: '대쉬(Space)의 재사용 대기시간이 단축되며 이동속도가 증가합니다.',
    getEffectText: (lv) => `대쉬 쿨다운 -${lv * 6}%, 이동속도 +${(lv * 0.2).toFixed(1)}`
  },
  {
    id: 't_srv_gold',
    cat: 'survival',
    name: '미다스의 축복',
    icon: '💰🪙',
    maxLv: 25,
    baseCost: 6,
    costMul: 3,
    desc: '던전 시작 시 기본 소지 골드가 증가하고 몬스터 처치 시 골드 획득량이 증폭됩니다.',
    getEffectText: (lv) => `시작 골드 +${lv * 100} G, 골드 획득량 +${lv * 10}%`
  },
  {
    id: 't_srv_souls',
    cat: 'survival',
    name: '영혼석 자석',
    icon: '💎✨',
    maxLv: 15,
    baseCost: 12,
    costMul: 7,
    desc: '몬스터와 엘리트 처치 시 영혼석이 드랍될 확률이 대폭 증가합니다.',
    getEffectText: (lv) => `영혼석 드랍 확률 +${lv * 20}%`
  },
  {
    id: 't_srv_revive',
    cat: 'survival',
    name: '불사조의 깃털',
    icon: '🪶🔥',
    maxLv: 10,
    baseCost: 16,
    costMul: 10,
    desc: '던전에서 사망 시 즉시 불사조의 화염을 일으키며 부활합니다.',
    getEffectText: (lv) => `사망 시 HP ${Math.min(100, 30 + lv * 10)}%로 즉시 부활 (최대 100%)`
  },
  {
    id: 't_srv_potion_boost',
    cat: 'survival',
    name: '연금술 비전',
    icon: '🧪✨',
    maxLv: 20,
    baseCost: 10,
    costMul: 5,
    desc: '물약 회복량과 버프 지속 시간이 증가하며 슬롯 소지량이 늘어납니다.',
    getEffectText: (lv) => `물약 효과 +${lv * 10}%, 지속시간 +${lv * 12}%`
  }
];

// 레거시 호환용
const SOUL_UPGRADES = TALENT_TREE;

// 19. 다채로운 단계별 누적 업적 (처치 수, 보스 토벌, 상점 구매, 골드 수집 등)
const ACHIEVEMENTS = [
  // 몬스터 처치 업적
  { id: 'kill_10', name: '초보 사냥꾼', icon: '🗡️', desc: '던전 몬스터 10마리를 처치하십시오.', statKey: 'monstersKilled', target: 10, reward: 5 },
  { id: 'kill_50', name: '숙련된 토벌자', icon: '⚔️', desc: '던전 몬스터 50마리를 처치하십시오.', statKey: 'monstersKilled', target: 50, reward: 15 },
  { id: 'kill_150', name: '몬스터 학살자', icon: '💀', desc: '던전 몬스터 150마리를 처치하십시오.', statKey: 'monstersKilled', target: 150, reward: 35 },
  { id: 'kill_500', name: '전장의 지배자', icon: '🩸', desc: '던전 몬스터 500마리를 학살하십시오.', statKey: 'monstersKilled', target: 500, reward: 70 },
  { id: 'kill_1500', name: '만인지적 (일기당천)', icon: '⚡💀', desc: '던전 몬스터 1,500마리를 토벌하십시오.', statKey: 'monstersKilled', target: 1500, reward: 150 },
  { id: 'kill_5000', name: '전설의 학살신', icon: '👑🩸', desc: '던전 몬스터 5,000마리를 궤멸시키십시오.', statKey: 'monstersKilled', target: 5000, reward: 350 },

  // 보스 격파 업적
  { id: 'boss_1', name: '군주 사냥의 시작', icon: '🌳', desc: '지역 군주(보스)를 1회 격파하십시오.', statKey: 'bossesKilled', target: 1, reward: 10 },
  { id: 'boss_3', name: '던전의 공포', icon: '🗿', desc: '지역 군주(보스)를 누적 3회 격파하십시오.', statKey: 'bossesKilled', target: 3, reward: 25 },
  { id: 'boss_10', name: '보스 슬레이어', icon: '👑', desc: '지역 군주(보스)를 누적 10회 격파하십시오.', statKey: 'bossesKilled', target: 10, reward: 60 },
  { id: 'boss_25', name: '군주들의 재앙', icon: '💀👑', desc: '지역 군주(보스)를 누적 25회 토벌하십시오.', statKey: 'bossesKilled', target: 25, reward: 120 },
  { id: 'boss_50', name: '불멸의 토벌신', icon: '🏆👑', desc: '지역 군주(보스)를 누적 50회 토벌하십시오.', statKey: 'bossesKilled', target: 50, reward: 250 },
  { id: 'demon_king_slayer', name: '던전 제패 (마왕 토벌)', icon: '🏆', desc: '최종 보스 마왕을 처치하고 던전을 완전 제패하십시오.', statKey: 'demonKingKilled', target: 1, reward: 100 },

  // 상점 이용 업적
  { id: 'shop_3', name: '상점 방문객', icon: '🛒', desc: '방랑 상인에게서 아이템 3회를 구매하십시오.', statKey: 'shopPurchases', target: 3, reward: 8 },
  { id: 'shop_10', name: '단골 손님', icon: '🛍️', desc: '방랑 상인에게서 아이템 10회를 구매하십시오.', statKey: 'shopPurchases', target: 10, reward: 20 },
  { id: 'shop_25', name: '상인의 VIP', icon: '💎🛒', desc: '방랑 상인에게서 아이템 25회를 구매하십시오.', statKey: 'shopPurchases', target: 25, reward: 50 },
  { id: 'shop_50', name: '상점의 대주주', icon: '🪙🛍️', desc: '방랑 상인에게서 아이템 50회를 구매하십시오.', statKey: 'shopPurchases', target: 50, reward: 100 },
  { id: 'shop_100', name: '황금 상단의 큰손', icon: '👑🛒', desc: '방랑 상인에게서 아이템 100회를 구매하십시오.', statKey: 'shopPurchases', target: 100, reward: 200 },

  // 골드 누적 획득
  { id: 'gold_1000', name: '은화 한 주머니', icon: '🪙', desc: '누적 1,000 골드를 획득하십시오.', statKey: 'goldCollected', target: 1000, reward: 8 },
  { id: 'gold_5000', name: '황금빛 자산가', icon: '💰', desc: '누적 5,000 골드를 획득하십시오.', statKey: 'goldCollected', target: 5000, reward: 25 },
  { id: 'gold_20000', name: '미다스의 손', icon: '👑💰', desc: '누적 20,000 골드를 획득하십시오.', statKey: 'goldCollected', target: 20000, reward: 60 },
  { id: 'gold_50000', name: '백만장자의 자질', icon: '💎💰', desc: '누적 50,000 골드를 획득하십시오.', statKey: 'goldCollected', target: 50000, reward: 120 },
  { id: 'gold_200000', name: '제국의 국고', icon: '🏛️💰', desc: '누적 200,000 골드를 획득하십시오.', statKey: 'goldCollected', target: 200000, reward: 300 },

  // 전투 액션 업적
  { id: 'skill_50', name: '마도사의 자질', icon: '⚡', desc: '스킬을 누적 50회 시전하십시오.', statKey: 'skillsUsed', target: 50, reward: 10 },
  { id: 'skill_200', name: '연속기의 달인', icon: '🌀', desc: '스킬을 누적 200회 시전하십시오.', statKey: 'skillsUsed', target: 200, reward: 30 },
  { id: 'skill_500', name: '대마도사의 경지', icon: '🔮⚡', desc: '스킬을 누적 500회 시전하십시오.', statKey: 'skillsUsed', target: 500, reward: 70 },
  { id: 'skill_1500', name: '영겁의 주문술사', icon: '🌟💫', desc: '스킬을 누적 1,500회 시전하십시오.', statKey: 'skillsUsed', target: 1500, reward: 150 },
  { id: 'dash_30', name: '질풍의 발걸음', icon: '💨', desc: '대쉬를 누적 30회 사용하십시오.', statKey: 'dashesUsed', target: 30, reward: 10 },
  { id: 'dash_100', name: '바람과 하나가 된 자', icon: '🪽', desc: '대쉬를 누적 100회 사용하십시오.', statKey: 'dashesUsed', target: 100, reward: 25 },
  { id: 'dash_300', name: '시공간의 잔상', icon: '🌪️', desc: '대쉬를 누적 300회 사용하십시오.', statKey: 'dashesUsed', target: 300, reward: 60 },
  { id: 'dash_1000', name: '광속의 도약자', icon: '⚡🪽', desc: '대쉬를 누적 1,000회 사용하십시오.', statKey: 'dashesUsed', target: 1000, reward: 150 },

  // 장비 수집 업적
  { id: 'legendary_1', name: '전설과의 조우', icon: '🟠', desc: '전설 또는 신화 등급의 장비를 1회 획득하십시오.', statKey: 'legendaryFound', target: 1, reward: 15 },
  { id: 'legendary_5', name: '전설의 수집가', icon: '✨👑', desc: '전설 또는 신화 등급의 장비를 5개 획득하십시오.', statKey: 'legendaryFound', target: 5, reward: 40 },
  { id: 'legendary_15', name: '신화의 보물고', icon: '💎👑', desc: '전설 또는 신화 등급의 장비를 15개 획득하십시오.', statKey: 'legendaryFound', target: 15, reward: 90 },
  { id: 'legendary_30', name: '만물의 수집신', icon: '🌟🏛️', desc: '전설 또는 신화 등급의 장비를 30개 수집하십시오.', statKey: 'legendaryFound', target: 30, reward: 200 }
];

window.DEFAULT_PLAYER_STATS = DEFAULT_PLAYER_STATS;
window.RARITY = RARITY;
window.PLAYER_CLASSES = PLAYER_CLASSES;
window.WEAPONS = WEAPONS;
window.ARMORS = ARMORS;
window.ACCESSORIES = ACCESSORIES;
window.RELICS = RELICS;
window.CONSUMABLES = CONSUMABLES;
window.PERKS = PERKS;
window.RANDOM_EVENTS = RANDOM_EVENTS;
window.DUNGEON_AREAS = DUNGEON_AREAS;
window.ROOM_TYPES = ROOM_TYPES;
window.MONSTERS = MONSTERS;
window.BOSSES = BOSSES;
window.TALENT_CATEGORIES = TALENT_CATEGORIES;
window.TALENT_TREE = TALENT_TREE;
window.SOUL_UPGRADES = SOUL_UPGRADES;
window.ACHIEVEMENTS = ACHIEVEMENTS;
window.DAMAGE_TYPES = DAMAGE_TYPES;
window.WEAPON_SKILLS = WEAPON_SKILLS;
window.STATUS_EFFECTS = STATUS_EFFECTS;
window.ELITE_MODIFIERS = ELITE_MODIFIERS;
