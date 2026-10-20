// ===== 다크 판타지 고품질 그래픽 에셋 로더 (Image 2 레퍼런스 100% 실시간 연동) =====

class AssetLoaderManager {
  constructor() {
    this.images = {};
    this.canvases = {};
    this.itemIcons = [];
    this.isLoaded = false;
    this.loadCallbacks = [];

    this.manifest = {
      // 플레이어 캐릭터 (아르덴) 레거시 및 기본 프레임
      player_idle: 'assets/characters/arden/idle_0.png',
      player_walk: 'assets/characters/arden/walk_1.png',
      player_attack: 'assets/characters/arden/attack_1.png',
      player_skill1: 'assets/characters/arden/skill_1.png',
      player_skill2: 'assets/characters/arden/skill_2.png',
      player_hit: 'assets/characters/arden/hit_0.png',
      player_death: 'assets/characters/arden/death_3.png',

      // 아르덴 개별 프레임 (4 Idle, 4 Walk, 4 Attack, 4 Skill, 2 Hit, 4 Death, Portrait)
      arden_idle_0: 'assets/characters/arden/idle_0.png',
      arden_idle_1: 'assets/characters/arden/idle_1.png',
      arden_idle_2: 'assets/characters/arden/idle_2.png',
      arden_idle_3: 'assets/characters/arden/idle_3.png',
      arden_walk_0: 'assets/characters/arden/walk_0.png',
      arden_walk_1: 'assets/characters/arden/walk_1.png',
      arden_walk_2: 'assets/characters/arden/walk_2.png',
      arden_walk_3: 'assets/characters/arden/walk_3.png',
      arden_attack_0: 'assets/characters/arden/attack_0.png',
      arden_attack_1: 'assets/characters/arden/attack_1.png',
      arden_attack_2: 'assets/characters/arden/attack_2.png',
      arden_attack_3: 'assets/characters/arden/attack_3.png',
      arden_skill_0: 'assets/characters/arden/skill_0.png',
      arden_skill_1: 'assets/characters/arden/skill_1.png',
      arden_skill_2: 'assets/characters/arden/skill_2.png',
      arden_skill_3: 'assets/characters/arden/skill_3.png',
      arden_hit_0: 'assets/characters/arden/hit_0.png',
      arden_hit_1: 'assets/characters/arden/hit_1.png',
      arden_dodge_0: 'assets/characters/arden/dodge_0.png',
      arden_dodge_1: 'assets/characters/arden/dodge_1.png',
      arden_death_0: 'assets/characters/arden/death_0.png',
      arden_death_1: 'assets/characters/arden/death_1.png',
      arden_death_2: 'assets/characters/arden/death_2.png',
      arden_death_3: 'assets/characters/arden/death_3.png',
      arden_portrait: 'assets/characters/arden/portrait.png',

      // 몬스터 기본
      enemy_goblin: 'assets/enemies/goblin/idle_0.png',
      enemy_goblin_warrior: 'assets/enemies/goblin_warrior/idle_0.png',
      enemy_skeleton_warrior: 'assets/enemies/skeleton_warrior/idle_0.png',
      enemy_skeleton_archer: 'assets/enemies/skeleton_archer/idle_0.png',
      enemy_slime: 'assets/enemies/slime/idle_0.png',
      enemy_bat: 'assets/enemies/bat/idle_0.png',
      enemy_mage: 'assets/enemies/dark_mage/idle_0.png',
      enemy_orc: 'assets/enemies/orc/idle_0.png',

      // 보스
      boss_goblin_king: 'assets/bosses/goblin_king.png',
      boss_cursed_knight: 'assets/bosses/cursed_knight.png',
      boss_abyss_witch: 'assets/bosses/abyss_witch.png',
      boss_ancient_dragon: 'assets/bosses/ancient_dragon.png',
      boss_void_lord: 'assets/bosses/void_lord.png',

      // 스킬 이펙트
      eff_red_slash: 'assets/effects/skill_red_slash.png',
      eff_blue_wave: 'assets/effects/skill_blue_wave.png',
      eff_pierce: 'assets/effects/skill_pierce.png',
      eff_arcane: 'assets/effects/skill_arcane.png',
      eff_fire_nova: 'assets/effects/skill_fire_nova.png',
      eff_lightning: 'assets/effects/skill_lightning.png',
      eff_void_orb: 'assets/effects/skill_void_orb.png',
      eff_holy_burst: 'assets/effects/skill_holy_burst.png',

      // 던전 타일 & 지형지물
      tile_floor: 'assets/tiles/floor_stone.png',
      tile_wall: 'assets/tiles/wall_stone.png',
      tile_torch: 'assets/tiles/torch_sconce.png',
      prop_chest: 'assets/tiles/chest_box.png',
      prop_barrel: 'assets/tiles/barrel.png',
      prop_pillar: 'assets/tiles/pillar.png',
      prop_merchant_stall: 'assets/props/merchant_stall.png',
      door_normal: 'assets/props/door_normal.png',
      door_normal_open: 'assets/props/door_normal_open.png',
      door_boss: 'assets/props/door_boss.png',
      door_boss_open: 'assets/props/door_boss_open.png',
      door_locked: 'assets/props/door_locked.png',
      door_locked_open: 'assets/props/door_locked_open.png',

      // UI
      ui_portrait: 'assets/characters/arden/portrait.png',
      ui_skill_q: 'assets/ui/skill_q.png',
      ui_skill_w: 'assets/ui/skill_w.png',
      ui_skill_e: 'assets/ui/skill_e.png',
      ui_skill_r: 'assets/ui/skill_r.png',
      ui_pot_red: 'assets/ui/potion_red.png',
      ui_pot_blue: 'assets/ui/potion_blue.png',
      ui_pot_bomb: 'assets/ui/potion_bomb.png',

      // 아이템 시트
      item_sheet: 'assets/items/item_icons_sheet.png'
    };

    // 8개 몬스터의 애니메이션 프레임 자동 등록
    const mTypes = ['goblin', 'goblin_warrior', 'skeleton_warrior', 'skeleton_archer', 'slime', 'bat', 'dark_mage', 'orc'];
    const mActions = [
      { anim: 'idle', count: 2 },
      { anim: 'walk', count: 4 },
      { anim: 'attack', count: 3 },
      { anim: 'hit', count: 2 },
      { anim: 'death', count: 3 }
    ];
    mTypes.forEach(m => {
      mActions.forEach(act => {
        for (let f = 0; f < act.count; f++) {
          this.manifest[`${m}_${act.anim}_${f}`] = `assets/enemies/${m}/${act.anim}_${f}.png`;
        }
      });
    });

    this.init();
  }

  init() {
    if (typeof Image === 'undefined') {
      this.isLoaded = true;
      return;
    }
    let pending = Object.keys(this.manifest).length;
    if (pending === 0) {
      this.isLoaded = true;
      return;
    }

    for (const [key, src] of Object.entries(this.manifest)) {
      const img = new Image();
      if (typeof window !== 'undefined' && window.location && window.location.protocol !== 'file:') {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        this.images[key] = img;
        this.canvases[key] = img;

        if (key === 'item_sheet') {
          this.sliceItemIcons(img);
        }

        pending--;
        if (pending <= 0) {
          this.isLoaded = true;
          this.loadCallbacks.forEach(cb => cb());
          this.loadCallbacks = [];
          if (window.Game && window.Game.renderer) {
            window.Game.renderer.cachedTheme = null;
          }
        }
      };
      img.onerror = () => {
        pending--;
        if (pending <= 0) {
          this.isLoaded = true;
          this.loadCallbacks.forEach(cb => cb());
        }
      };
      img.src = src;
    }
  }

  onReady(cb) {
    if (this.isLoaded) cb();
    else this.loadCallbacks.push(cb);
  }

  // 아르덴 애니메이션 프레임 반환 헬퍼
  getArdenFrame(action, frameIndex = 0) {
    const key = `arden_${action}_${frameIndex}`;
    return this.get(key) || this.get(`player_${action}`) || this.get('player_idle');
  }

  // 몬스터 애니메이션 프레임 반환 헬퍼
  getEnemyFrame(enemyType, action, frameIndex = 0) {
    const key = `${enemyType}_${action}_${frameIndex}`;
    return this.get(key) || this.get(`${enemyType}_idle_0`) || this.get(`enemy_${enemyType}`);
  }

  // 테두리 암흑 배경을 투명하게 정밀 크로마키/플러드필 처리
  makeTransparentSprite(img) {
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0);

    try {
      const imgData = ctx.getImageData(0, 0, c.width, c.height);
      const data = imgData.data;
      const w = c.width;
      const h = c.height;

      // 이미 투명 픽셀이 있는 고품질 PNG의 경우 즉시 반환 (디테일 100% 보존)
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) return c;
      }

      const visited = new Uint8Array(w * h);
      const queue = [];

      function checkPixel(x, y) {
        if (x < 0 || x >= w || y < 0 || y >= h) return;
        const idx = y * w + x;
        if (visited[idx]) return;
        const p = idx * 4;
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];

        // 이미지 배경 색상: 어두운 슬레이트/군청 계열 (R < 38, G < 48, B < 62)
        if (r <= 38 && g <= 48 && b <= 62) {
          visited[idx] = 1;
          data[p + 3] = 0; // 완전 투명
          queue.push(idx);
        }
      }

      // 4면 경계 시드 주입
      for (let x = 0; x < w; x++) { checkPixel(x, 0); checkPixel(x, h - 1); }
      for (let y = 0; y < h; y++) { checkPixel(0, y); checkPixel(w - 1, y); }

      let head = 0;
      while (head < queue.length) {
        const idx = queue[head++];
        const x = idx % w;
        const y = Math.floor(idx / w);
        checkPixel(x + 1, y);
        checkPixel(x - 1, y);
        checkPixel(x, y + 1);
        checkPixel(x, y - 1);
      }

      ctx.putImageData(imgData, 0, 0);
      return c;
    } catch (e) {
      // 로컬 파일 보안 이슈 또는 CORS 발생 시 원본 이미지 반환
      return img;
    }
  }

  // 아이템 아이콘 시트 (248x122, 8열 x 4행 = 32개 아이콘) 슬라이스
  sliceItemIcons(sheetImg) {
    this.itemIcons = [];
    const cols = 8;
    const rows = 4;
    const cellW = sheetImg.width / cols;
    const cellH = sheetImg.height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const iconCanvas = document.createElement('canvas');
        iconCanvas.width = 32;
        iconCanvas.height = 32;
        const iCtx = iconCanvas.getContext('2d');
        iCtx.imageSmoothingEnabled = false;

        const sx = c * cellW + 1;
        const sy = r * cellH + 1;
        const sw = cellW - 2;
        const sh = cellH - 2;

        iCtx.drawImage(sheetImg, sx, sy, sw, sh, 0, 0, 32, 32);
        this.itemIcons.push(iconCanvas);
      }
    }
  }

  get(key) {
    return this.canvases[key] || this.images[key] || null;
  }

  // 아이템 ID 또는 카테고리에 맞는 전용 아이콘 캔버스/DataURL 반환
  getItemIconCanvas(item) {
    if (!this.itemIcons || this.itemIcons.length === 0) return null;
    if (!item) return this.itemIcons[0];

    const id = item.id || '';
    const type = item.type || '';
    const slot = item.slot || '';

    // 검 / 무기
    if (type === 'greatsword' || id.includes('great') || id.includes('대검')) return this.itemIcons[6]; // 대검
    if (type === 'axe' || id.includes('axe') || id.includes('도끼')) return this.itemIcons[4]; // 배틀액스
    if (type === 'bow' || type === 'crossbow' || id.includes('bow') || id.includes('활')) return this.itemIcons[5]; // 석궁/활
    if (type === 'dagger' || id.includes('dagger') || id.includes('단검')) return this.itemIcons[0]; // 단검
    if (slot === 'weapon' || type === 'sword') return this.itemIcons[1]; // 기본 검

    // 방어구
    if (slot === 'helmet' || id.includes('helm') || id.includes('투구')) return this.itemIcons[8]; // 풀헬름
    if (slot === 'armor' || id.includes('armor') || id.includes('갑옷')) return this.itemIcons[9]; // 플레이트 아머
    if (slot === 'gloves' || id.includes('glove') || id.includes('장갑')) return this.itemIcons[10]; // 건틀릿
    if (slot === 'boots' || id.includes('boot') || id.includes('신발')) return this.itemIcons[11]; // 부츠
    if (slot === 'shield' || id.includes('shield') || id.includes('방패')) return this.itemIcons[13]; // 방패
    if (slot === 'ring' || id.includes('ring') || id.includes('반지')) return this.itemIcons[14]; // 반지
    if (slot === 'amulet' || id.includes('amulet') || id.includes('목걸이')) return this.itemIcons[14];

    // 소비품 / 포션
    if (item.healHp) return this.itemIcons[16]; // 빨간 포션
    if (item.healMp) return this.itemIcons[18]; // 파란 포션
    if (item.bomb) return this.get('ui_pot_bomb') || this.itemIcons[26];
    if (item.buff) return this.itemIcons[24]; // 황금 물약

    // 재화 / 스크롤
    if (id.includes('gold') || id.includes('coin')) return this.itemIcons[30]; // 금화
    if (id.includes('scroll') || id.includes('book')) return this.itemIcons[19]; // 주문서

    return this.itemIcons[Math.abs(this.hashCode(id)) % this.itemIcons.length];
  }

  getItemIconUrl(item) {
    const c = this.getItemIconCanvas(item);
    if (c) {
      try { return c.toDataURL(); } catch (e) {}
    }
    return null;
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  }
}

const AssetLoader = new AssetLoaderManager();
if (typeof window !== 'undefined') {
  window.AssetLoader = AssetLoader;
}
if (typeof module !== 'undefined') {
  module.exports = AssetLoader;
}
