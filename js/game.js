// ===== 2D 도트 액션 RPG 메인 루프 (고정 맵, 지형지물, 가시함정, 폭발배럴, 모션, 밸런스) =====

class GameManager {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.renderer = null;

    this.player = null;
    this.enemies = [];
    this.projectiles = [];
    this.portal = null;
    this.chest = null;

    // 지형지물 & 방해요소
    this.obstacles = []; // 돌기둥 / 수정 바위 / 석재 기둥 / 용암석
    this.hazards = [];   // 가시 함정 / 독버섯 / 용암 분출구
    this.barrels = [];   // 폭발성 화약통 / 크리스탈 노드

    this.npc = null;     // 상인, 모닥불, 제단 등 비전투 룸 NPC/오브젝트

    // 대형 던전 룸 크기 (플레이어가 넓은 던전을 탐험하며 카메라가 부드럽게 추적)
    this.roomWidth = 1440;
    this.roomHeight = 960;
    this.mapBounds = { x: 0, y: 0, width: this.roomWidth, height: this.roomHeight };

    // 카메라 시스템 (플레이어를 화면 중앙에 크게 보여주며 부드럽게 Lerp 추적)
    this.camera = { x: 0, y: 0, zoom: 1.15 };
    this.mouseScreenPos = { x: 0, y: 0 };
    this.mousePos = { x: 0, y: 0 };
    this.isMouseDown = false;
    this.keys = {};
    this.npcs = [];

    this.lastTime = 0;
    this.hazardTimer = 0;
    this.isRunning = false;
    this.selectedClass = 'warrior';
    this.difficulty = 'easy';
    try {
      const savedDiff = localStorage.getItem('rpg_difficulty');
      if (savedDiff && ['easy', 'normal', 'hard'].includes(savedDiff)) {
        this.difficulty = savedDiff;
      }
    } catch (e) {}
  }

  static DIFFICULTY_MODS = {
    easy:   { hpMul: 1.0, atkMul: 1.0, defMul: 1.0, countMul: 1.0, spdMul: 1.0, atkSpdMul: 1.0, eliteChance: 0.05, bossSkillCd: 3.5, expMul: 1.0, goldMul: 1.0, label: '쉬움', color: '#2ecc71', badge: '🌱' },
    normal: { hpMul: 2.5, atkMul: 1.8, defMul: 1.5, countMul: 1.3, spdMul: 1.15, atkSpdMul: 1.2, eliteChance: 0.25, bossSkillCd: 2.5, expMul: 1.6, goldMul: 1.6, label: '보통', color: '#f1c40f', badge: '⚔️' },
    hard:   { hpMul: 45.0, atkMul: 22.0, defMul: 8.0, countMul: 2.5, spdMul: 1.85, atkSpdMul: 2.5, eliteChance: 0.90, bossSkillCd: 0.9, expMul: 5.0, goldMul: 5.0, label: '악몽 지옥 (극악 난이도)', color: '#e74c3c', badge: '💀🔥' }
  };

  getDifficultyMod() {
    return GameManager.DIFFICULTY_MODS[this.difficulty || 'easy'] || GameManager.DIFFICULTY_MODS.easy;
  }

  setDifficulty(diff) {
    if (!['easy', 'normal', 'hard'].includes(diff)) diff = 'easy';
    this.difficulty = diff;
    try { localStorage.setItem('rpg_difficulty', diff); } catch (e) {}
    ['easy', 'normal', 'hard'].forEach(d => {
      const el = document.getElementById(`diff-card-${d}`);
      if (el) el.classList.toggle('selected', d === diff);
    });
    if (window.Sound) Sound.playClick();
  }

  init() {
    // 저장된 난이도 UI 반영
    if (this.difficulty) {
      ['easy', 'normal', 'hard'].forEach(d => {
        const el = document.getElementById(`diff-card-${d}`);
        if (el) el.classList.toggle('selected', d === this.difficulty);
      });
    }

    if (!this.canvas) {
      this.canvas = document.getElementById('game-canvas');
    }
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      if (!this.renderer) {
        this.renderer = new PixelRenderer(this.canvas);
      }
    }

    this.resizeCanvas();
    if (!this._resizeBound) {
      this._resizeBound = true;
      window.addEventListener('resize', () => this.resizeCanvas());
    }

    this.bindInputs();

    if (!this._animateStarted) {
      this._animateStarted = true;
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);
    }
  }

  resizeCanvas() {
    if (!this.canvas) {
      this.canvas = document.getElementById('game-canvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
    }
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    this.mapBounds.x = 0;
    this.mapBounds.y = 0;
    this.mapBounds.width = this.roomWidth;
    this.mapBounds.height = this.roomHeight;
  }

  // 키보드 & 마우스 입력 바인딩 (설정창 키 커스텀 바인딩 및 W 이동 충돌 방지)
  bindInputs() {
    if (this._inputsBound) return;
    this._inputsBound = true;
    window.addEventListener('keydown', (e) => {
      // 설정 창에서 키 재설정 중일 때는 게임 입력 차단
      if (window.UI && window.UI.rebindingAction) return;

      const k = e.key.toLowerCase();
      this.keys[k] = true;

      // 이동 키 (WASD, 방향키)는 기본 처리
      const keyDash = Save.getKeybind('dash');
      if (k === keyDash || (keyDash === ' ' && e.code === 'Space')) {
        e.preventDefault();
        if (this.player) this.player.performDash();
        return;
      }

      // 스킬 핫키: 설정된 키에 맞게 동적 매핑
      if (k === Save.getKeybind('skillQ')) {
        if (this.player) this.player.castSkill('q');
      } else if (k === Save.getKeybind('skillE')) {
        if (this.player) this.player.castSkill('e');
      } else if (k === Save.getKeybind('skillR')) {
        if (this.player) this.player.castSkill('r');
      } else if (k === Save.getKeybind('skillUlt')) {
        if (this.player) this.player.castSkill('ult');
      } else if (k === Save.getKeybind('interact')) {
        this.interactWithNearbyObject();
      } else if (k === Save.getKeybind('pot1')) {
        if (this.player) this.player.useConsumable(0);
      } else if (k === Save.getKeybind('pot2')) {
        if (this.player) this.player.useConsumable(1);
      } else if (k === Save.getKeybind('pot3')) {
        if (this.player) this.player.useConsumable(2);
      } else if (k === Save.getKeybind('pot4')) {
        if (this.player) this.player.useConsumable(3);
      } else if (k === Save.getKeybind('inventory')) {
        if (window.UI) UI.toggleModal('inventory-modal');
      } else if (k === Save.getKeybind('skills') || k === 'k') {
        if (window.UI) UI.toggleModal('skills-modal');
      } else if (k === Save.getKeybind('codex')) {
        if (window.UI) UI.toggleModal('codex-modal');
      } else if (e.key === 'Escape') {
        if (window.UI) UI.toggleModal('settings-modal');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('mousedown', (e) => {
      // 상인, 모닥불, 고대 제단, 영구 성장 제단 직접 클릭 시 상호작용
      if (this.player) {
        const checkNpcs = this.npcs && this.npcs.length > 0 ? this.npcs : (this.npc ? [this.npc] : []);
        for (const n of checkNpcs) {
          if (!n) continue;
          const clickDist = Math.hypot(this.mousePos.x - n.x, this.mousePos.y - n.y);
          const pDist = Math.hypot(this.player.x - n.x, this.player.y - n.y);
          if (clickDist < 55 && pDist < 160) {
            if (n.type === 'merchant') {
              UI.showShopModal();
              if (window.Sound) Sound.playClick();
              return;
            } else if (n.type === 'campfire') {
              Combat.heal(this.player, Math.round(this.player.stats.maxHp * 0.5));
              this.player.stats.mp = this.player.stats.maxMp;
              if (window.Sound) Sound.playMagicSpell('fire');
              UI.showToast('🔥 따뜻한 모닥불에서 휴식했습니다.');
              return;
            } else if (n.type === 'altar') {
              if (n.used) {
                if (window.UI) UI.showToast('✨ 이미 신성한 축복을 받아 제단의 빛이 바랬습니다.');
                return;
              }
              const ev = RANDOM_EVENTS[0];
              if (window.UI) UI.showEventModal(ev, n);
              if (window.Sound) Sound.playClick();
              return;
            } else if (n.type === 'soul_altar') {
              UI.toggleModal('upgrade-modal');
              if (window.Sound) Sound.playClick();
              return;
            }
          }
        }
      }

      this.isMouseDown = true;
      if (this.player) this.player.performBasicAttack();
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      this.mouseScreenPos.x = screenX;
      this.mouseScreenPos.y = screenY;

      const z = (this.camera && this.camera.zoom) ? this.camera.zoom : 1.0;
      const camX = (this.camera && this.camera.x) ? this.camera.x : 0;
      const camY = (this.camera && this.camera.y) ? this.camera.y : 0;

      this.mousePos.x = camX + screenX / z;
      this.mousePos.y = camY + screenY / z;

      if (this.player) {
        this.player.aimAngle = Math.atan2(this.mousePos.y - this.player.y, this.mousePos.x - this.player.x);
      }
    });
  }

  // 게임 시작
  startGame(classId = 'warrior') {
    try {
      this.selectedClass = classId || 'warrior';
      if (!this.canvas) this.init();
      this.resizeCanvas();
      Save.recordStat('runsStarted', 1);

      const startX = this.roomWidth / 2;
      const startY = this.roomHeight / 2 + 180;
      this.player = new Player(this.selectedClass, startX, startY);

      Dungeon.generateArea(0);
      this.loadRoomScene(Dungeon.rooms[0]);

      this.isRunning = true;
      const menuEl = document.getElementById('main-menu-overlay');
      if (menuEl) menuEl.style.display = 'none';
      const goEl = document.getElementById('game-over-modal');
      if (goEl) goEl.style.display = 'none';
      const vicEl = document.getElementById('victory-modal');
      if (vicEl) vicEl.style.display = 'none';

      const hudTop = document.getElementById('hud-top');
      if (hudTop) hudTop.style.display = 'flex';
      const hudBottom = document.getElementById('hud-bottom');
      if (hudBottom) hudBottom.style.display = 'flex';

      if (window.Sound) Sound.startBGM(false);
      if (window.UI) {
        UI.init();
        const diffMod = this.getDifficultyMod();
        UI.showToast(`[${this.player.classDef.name}] 던전 입장! 난이도: ${diffMod.badge} [${diffMod.label}]`);
      }
    } catch (err) {
      console.error('startGame error:', err);
    }
  }

  // 방 씬 로드 (Image 2 레퍼런스: 넓은 전장, 방마다 목적과 분위기가 뚜렷한 유기적 배치)
  loadRoomScene(room) {
    this.enemies = [];
    this.projectiles = [];
    this.obstacles = [];
    this.hazards = [];
    this.barrels = [];
    this.npcs = [];
    this.npc = null;
    this.portal = null;
    this.chest = null;

    const areaDef = DUNGEON_AREAS[Dungeon.currentAreaIndex] || DUNGEON_AREAS[0];

    // 방 종류별 룸 크기 차별화 (보스방은 거대 원형 투기장, 일반방은 넓은 전투 전장)
    if (room.type === 'BOSS') {
      this.roomWidth = 1600;
      this.roomHeight = 1100;
    } else if (room.type === 'SHOP' || room.type === 'REST' || room.type === 'TREASURE') {
      this.roomWidth = 1280;
      this.roomHeight = 860;
    } else {
      this.roomWidth = 1440;
      this.roomHeight = 960;
    }

    this.mapBounds.x = 0;
    this.mapBounds.y = 0;
    this.mapBounds.width = this.roomWidth;
    this.mapBounds.height = this.roomHeight;

    const cx = this.roomWidth / 2;
    const cy = this.roomHeight / 2;
    const theme = areaDef.themeKey || 'catacombs';

    // 던전 북쪽 벽면 관문(Door) 설정 (일반문, 보스문, 잠긴문)
    const nextRoom = (window.Dungeon && window.Dungeon.rooms && window.Dungeon.rooms[window.Dungeon.currentRoomIndex + 1]) || null;
    let doorType = 'normal';
    if ((nextRoom && nextRoom.type === 'BOSS') || room.type === 'BOSS') {
      doorType = 'boss';
    } else if (nextRoom && (nextRoom.type === 'CHALLENGE' || nextRoom.type === 'ELITE' || nextRoom.type === 'TREASURE')) {
      doorType = 'locked';
    }

    this.dungeonDoor = {
      x: cx,
      y: 95,
      doorType: doorType,
      isOpen: !!room.cleared
    };

    // 플레이어 시작 위치 (룸 중앙 하단)
    this.player.x = cx;
    this.player.y = cy + 220;

    // 카메라 즉시 플레이어 중앙 정렬
    const z = (this.camera && this.camera.zoom) ? this.camera.zoom : 1.15;
    if (this.canvas) {
      this.camera.x = this.player.x - (this.canvas.width / z) / 2;
      this.camera.y = this.player.y - (this.canvas.height / z) / 2;
    }

    // 1. 방 종류별 독창적 환경 & 오브젝트 배치
    if (room.type === 'BOSS') {
      // [보스방]: 8개의 웅장한 흑요석 기둥이 결투장을 둘러싸고 중앙에 보스 군주 대치
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i;
        this.obstacles.push({
          x: cx + Math.cos(a) * 440,
          y: cy + Math.sin(a) * 310,
          radius: 36,
          type: 'ruin_pillar'
        });
      }
      this.spawnBossForArea(areaDef);
      Sound.startBGM(true);
      UI.showToast(`👑 지역 군주 [${BOSSES[areaDef.boss] ? BOSSES[areaDef.boss].name : '보스'}] 결전!`);
    } else if (room.type === 'TREASURE') {
      room.cleared = true;
      // [보물방]: 4개의 황동 장식 기둥과 중앙의 찬란한 황금 상자
      this.obstacles.push(
        { x: cx - 280, y: cy - 140, radius: 30, type: 'ruin_pillar' },
        { x: cx + 280, y: cy - 140, radius: 30, type: 'ruin_pillar' },
        { x: cx - 280, y: cy + 140, radius: 30, type: 'ruin_pillar' },
        { x: cx + 280, y: cy + 140, radius: 30, type: 'ruin_pillar' }
      );
      this.barrels.push(
        { x: cx - 220, y: cy + 120, radius: 20, type: 'wood_barrel', hp: 1 },
        { x: cx + 220, y: cy + 120, radius: 20, type: 'wood_barrel', hp: 1 }
      );
      this.spawnChest('gold');
      this.spawnPortal();
      UI.showToast('💰 숨겨진 황금 보물방을 발견했습니다!');
    } else if (room.type === 'SHOP') {
      room.cleared = true;
      const merchantNpc = { x: cx, y: cy - 60, type: 'merchant', name: '방랑 상인' };
      this.npcs.push(merchantNpc);
      this.npc = merchantNpc;
      this.barrels.push(
        { x: cx - 140, y: cy - 60, radius: 20, type: 'wood_barrel', hp: 1 },
        { x: cx - 180, y: cy - 40, radius: 20, type: 'wood_barrel', hp: 1 },
        { x: cx + 140, y: cy - 60, radius: 20, type: 'wood_barrel', hp: 1 }
      );
      this.spawnPortal();
      UI.showToast('🛒 방랑 상인의 안전한 성소입니다. 상인에게 다가가 [G]키나 클릭으로 거래하십시오.');
    } else if (room.type === 'REST') {
      room.cleared = true;
      const campfireNpc = { x: cx - 130, y: cy - 30, type: 'campfire', name: '안식의 모닥불' };
      const soulAltarNpc = { x: cx + 130, y: cy - 30, type: 'soul_altar', name: '영구 성장 제단' };
      this.npcs.push(campfireNpc, soulAltarNpc);
      this.npc = campfireNpc;
      Combat.heal(this.player, Math.round(this.player.stats.maxHp * 0.7));
      this.player.stats.mp = this.player.stats.maxMp;
      this.spawnPortal();
      UI.showToast('🔥 안식의 모닥불 구역입니다. 체력이 대폭 회복되었습니다!');
    } else if (room.type === 'EVENT') {
      room.cleared = true;
      const ancientAltarNpc = { x: cx, y: cy - 40, type: 'altar', name: '고대 제단', used: false };
      this.npcs.push(ancientAltarNpc);
      this.npc = ancientAltarNpc;
      this.obstacles.push(
        { x: cx - 240, y: cy - 100, radius: 32, type: 'ruin_pillar' },
        { x: cx + 240, y: cy - 100, radius: 32, type: 'ruin_pillar' }
      );
      this.spawnPortal();
      UI.showToast('✨ 미지의 고대 제단에 다가가 [G]키 또는 클릭으로 축복을 받으십시오.');
    } else {
      // [전투방 / 엘리트방 / 도전방]: 웅장한 전술 전장
      this.obstacles.push(
        { x: cx - 340, y: cy - 180, radius: 32, type: 'ruin_pillar' },
        { x: cx + 340, y: cy - 180, radius: 32, type: 'ruin_pillar' },
        { x: cx - 340, y: cy + 180, radius: 32, type: 'ruin_pillar' },
        { x: cx + 340, y: cy + 180, radius: 32, type: 'ruin_pillar' }
      );
      this.barrels.push(
        { x: cx - 260, y: cy - 80, radius: 20, type: 'wood_barrel', hp: 1 },
        { x: cx + 260, y: cy - 80, radius: 20, type: (theme === 'hell') ? 'tnt_barrel' : 'wood_barrel', hp: 1 },
        { x: cx - 200, y: cy + 120, radius: 20, type: 'tnt_barrel', hp: 1 },
        { x: cx + 200, y: cy + 120, radius: 20, type: 'wood_barrel', hp: 1 }
      );
      this.hazards.push(
        { x: cx - 120, y: cy - 40, size: 40, type: 'iron_spikes', isActive: false },
        { x: cx + 120, y: cy - 40, size: 40, type: 'iron_spikes', isActive: false }
      );

      if (room.type === 'ELITE') {
        const diffMod = this.getDifficultyMod();
        this.spawnEliteForArea(areaDef);
        this.spawnMonstersForArea(areaDef, Math.round(9 * diffMod.countMul));
      } else if (room.type === 'CHALLENGE') {
        const diffMod = this.getDifficultyMod();
        this.spawnMonstersForArea(areaDef, Math.round((14 + Dungeon.currentAreaIndex * 2) * diffMod.countMul));
        UI.showToast(`⚠️ 대군단 도전방 (${diffMod.badge} ${diffMod.label}): 적들이 쏟아져 나옵니다!`);
      } else {
        const diffMod = this.getDifficultyMod();
        const count = Math.round((9 + Dungeon.currentAreaIndex * 2) * diffMod.countMul);
        this.spawnMonstersForArea(areaDef, count);
      }
    }

    // 만약 전투 방인데 몬스터가 0마리라면 안전장치로 즉시 강제 스폰 (빈 방 방지)
    if (['BATTLE', 'CHALLENGE', 'ELITE', 'BOSS'].includes(room.type) && this.enemies.length === 0) {
      const diffMod = this.getDifficultyMod();
      this.spawnMonstersForArea(areaDef, Math.round(8 * diffMod.countMul));
    }

    if (window.UI) window.UI.renderMinimap();
  }

  // 몬스터 군집 스폰 (풀이 비어있을 위험 완전 차단)
  spawnMonstersForArea(areaDef, count) {
    const areaTypes = ['forest', 'cave', 'ruins', 'hell', 'castle', 'castle'];
    const targetType = areaTypes[Dungeon.currentAreaIndex] || 'forest';
    let pool = Object.entries(MONSTERS).filter(([k, m]) => m.type === targetType);
    if (!pool || pool.length === 0) pool = Object.entries(MONSTERS);

    const diffMod = this.getDifficultyMod();
    const eliteChance = diffMod.eliteChance || 0.05;

    for (let i = 0; i < count; i++) {
      const [mKey, monDef] = pool[Math.floor(Math.random() * pool.length)] || pool[0];
      const spawnX = this.mapBounds.x + 90 + Math.random() * (this.roomWidth - 180);
      const spawnY = this.mapBounds.y + 80 + Math.random() * (this.roomHeight - 280);

      const isElite = Math.random() < eliteChance;
      const enemy = new Enemy(monDef, isElite, false, Dungeon.currentAreaIndex + 1, spawnX, spawnY);
      this.enemies.push(enemy);
      Save.recordCodex('monsters', mKey);
    }
  }

  spawnEliteForArea(areaDef) {
    const areaTypes = ['forest', 'cave', 'ruins', 'hell', 'castle', 'castle'];
    const targetType = areaTypes[Dungeon.currentAreaIndex] || 'forest';
    let pool = Object.entries(MONSTERS).filter(([k, m]) => m.type === targetType);
    if (!pool || pool.length === 0) pool = Object.entries(MONSTERS);
    const [mKey, monDef] = pool[Math.floor(Math.random() * pool.length)] || pool[0];

    const spawnX = this.mapBounds.x + this.roomWidth / 2;
    const spawnY = this.mapBounds.y + 150;
    const elite = new Enemy(monDef, true, false, Dungeon.currentAreaIndex + 1, spawnX, spawnY);
    this.enemies.push(elite);
    Save.recordCodex('monsters', mKey);

    const prefix = elite.modifier ? elite.modifier.prefix : '정예';
    UI.showToast(`👹 정예 [${prefix} ${monDef.name}] 등장!`);
  }

  spawnBossForArea(areaDef) {
    const spawnX = this.mapBounds.x + this.roomWidth / 2;
    const spawnY = this.mapBounds.y + 170;
    const boss = new Enemy(areaDef.boss, false, true, Dungeon.currentAreaIndex + 1, spawnX, spawnY);
    this.enemies.push(boss);

    // 악몽 지옥 난이도: 보스 호위 엘리트 친위대 4마리 동시 급습
    if (this.difficulty === 'hard') {
      this.spawnMonstersForArea(areaDef, 4);
    }

    Save.recordCodex('bosses', areaDef.boss);
    UI.showToast(`👑 지역 군주 [${boss.def.name}] 가 모습을 드러냈습니다!`);
  }

  spawnPortal() {
    if (!this.dungeonDoor) {
      this.dungeonDoor = {
        x: this.mapBounds.x + this.roomWidth / 2,
        y: 95,
        doorType: (window.Dungeon && window.Dungeon.currentRoom && window.Dungeon.currentRoom.type === 'BOSS') ? 'boss' : 'normal',
        isOpen: true
      };
    }
    this.dungeonDoor.isOpen = true;
    this.portal = {
      x: this.dungeonDoor.x,
      y: this.dungeonDoor.y,
      radius: 36,
      doorType: this.dungeonDoor.doorType
    };
    const doorName = this.dungeonDoor.doorType === 'boss' ? '👑 보스 군주의 심연 관문' : (this.dungeonDoor.doorType === 'locked' ? '✨ 봉인 해제된 정예 회랑 문' : '🚪 던전 출구 석조 문');
    UI.showToast(`${doorName}이 개방되었습니다! (문 앞으로 이동 후 G 키)`);
  }

  spawnChest(tier = 'iron') {
    this.chest = {
      x: this.mapBounds.x + this.roomWidth / 2,
      y: this.mapBounds.y + 240,
      tier: tier,
      opened: false
    };
  }

  interactWithNearbyObject() {
    if (!this.player) return;

    // 1. 상인 / 모닥불 / 고대 제단 / 영구 성장 제단 상호작용
    const checkNpcs = this.npcs && this.npcs.length > 0 ? this.npcs : (this.npc ? [this.npc] : []);
    for (const n of checkNpcs) {
      const dNpc = Math.hypot(this.player.x - n.x, this.player.y - n.y);
      if (dNpc < 140) {
        if (n.type === 'merchant') {
          if (window.UI) UI.showShopModal();
          if (window.Sound) Sound.playClick();
          return;
        } else if (n.type === 'campfire') {
          Combat.heal(this.player, Math.round(this.player.stats.maxHp * 0.5));
          this.player.stats.mp = this.player.stats.maxMp;
          if (window.Sound) Sound.playMagicSpell('fire');
          UI.showToast('🔥 따뜻한 모닥불에서 휴식했습니다.');
          return;
        } else if (n.type === 'altar') {
          if (n.used) {
            if (window.UI) UI.showToast('✨ 이미 신성한 축복을 받아 제단의 빛이 바랬습니다.');
            return;
          }
          const ev = RANDOM_EVENTS[0];
          if (window.UI) UI.showEventModal(ev, n);
          if (window.Sound) Sound.playClick();
          return;
        } else if (n.type === 'soul_altar') {
          if (window.UI) UI.toggleModal('upgrade-modal');
          if (window.Sound) Sound.playClick();
          return;
        }
      }
    }

    // 2. 차원 이동 포탈
    if (this.portal) {
      const d = Math.hypot(this.player.x - this.portal.x, this.player.y - this.portal.y);
      if (d < 50) {
        if (window.Sound) Sound.playMagicSpell('ice');
        Dungeon.advanceToNextRoom();
        return;
      }
    }

    // 3. 보물 상자
    if (this.chest && !this.chest.opened) {
      const d = Math.hypot(this.player.x - this.chest.x, this.player.y - this.chest.y);
      if (d < 45) {
        this.chest.opened = true;
        if (window.Sound) Sound.playChestOpen();
        const loot = Dungeon.generateLoot('UNCOMMON', this.player.stats.magicFind);
        this.player.bag.push(loot);
        UI.showToast(`📦 상자에서 [${loot.name}] 을 획득했습니다!`);
        this.chest = null;
      }
    }
  }

  // 투사체 발사 (최대 40개 제한으로 렉 완전 방지)
  spawnProjectile(startX, startY, angle, dmgType, owner, dmgMul = 1.0, speed = 9.5, piercing = false) {
    if (this.projectiles.length > 40) {
      this.projectiles.shift();
    }
    this.projectiles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * (speed * 40),
      vy: Math.sin(angle) * (speed * 40),
      angle: angle,
      dmgType: dmgType,
      dmgMul: dmgMul,
      owner: owner,
      piercing: piercing,
      radius: 8,
      life: 2.5
    });
  }

  // 근접 범위 판정 (배럴 타격 포함)
  checkMeleeHit(attacker, range, arc, dmgType, dmgMul = 1.0, isStun = false) {
    const targets = attacker.isPlayer ? this.enemies : [this.player];
    targets.forEach(target => {
      if (target.stats.hp <= 0) return;
      const dx = target.x - attacker.x;
      const dy = target.y - attacker.y;
      const dist = Math.hypot(dx, dy);

      if (dist <= range + target.radius) {
        const angleToTarget = Math.atan2(dy, dx);
        let diff = Math.abs(angleToTarget - attacker.aimAngle);
        while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

        if (diff <= arc / 2 || arc >= Math.PI * 1.8) {
          Combat.calculateDamage(attacker, target, dmgMul, dmgType);
          if (isStun) Combat.applyStatus(target, 'stun', 1.5);
        }
      }
    });

    // 폭발 배럴 타격 판정
    this.barrels.forEach(b => {
      if (!b.fuseLit && Math.hypot(b.x - attacker.x, b.y - attacker.y) <= range + b.radius) {
        b.fuseLit = true;
        if (window.Sound) Sound.playTone(350, 'sawtooth', 0.15, 0.3);
      }
    });
  }

  // 광역 폭발
  triggerAoeExplosion(x, y, radius, dmgMul, dmgType, owner) {
    this.renderer.addParticle(x, y, '#ff4757', 18);
    const targets = owner.isPlayer ? this.enemies : [this.player];
    targets.forEach(target => {
      if (target.stats.hp <= 0) return;
      const d = Math.hypot(target.x - x, target.y - y);
      if (d <= radius + target.radius) {
        Combat.calculateDamage(owner, target, dmgMul, dmgType);
      }
    });

    // 폭발로 인한 다른 배럴 연쇄 폭발
    this.barrels.forEach(b => {
      if (!b.fuseLit && Math.hypot(b.x - x, b.y - y) <= radius + b.radius) {
        b.fuseLit = true;
        b.explodeTimer = 0.1; // 즉시 연쇄 폭발
      }
    });
  }

  triggerChainLightning(attacker, dmgMul = 1.0) {
    let hitCount = 0;
    this.enemies.forEach(e => {
      if (e.stats.hp > 0 && hitCount < 5) {
        Combat.calculateDamage(attacker, e, dmgMul, 'LIGHTNING');
        hitCount++;
      }
    });
  }

  spawnMinionsNear(x, y, type, count) {
    for (let i = 0; i < count; i++) {
      const monDef = MONSTERS.demon || MONSTERS.skeleton;
      const enemy = new Enemy(monDef, false, false, Dungeon.currentAreaIndex + 1, x + (Math.random() - 0.5) * 80, y + (Math.random() - 0.5) * 80);
      this.enemies.push(enemy);
    }
  }

  onPlayerDeath() {
    this.isRunning = false;
    Sound.stopBGM();
    Save.data.totalDeaths++;
    Save.save();

    const gainedSouls = Math.round(this.player.level * 3 + Dungeon.currentAreaIndex * 4);
    document.getElementById('death-summary-text').innerText = `
      도달 지역: ${DUNGEON_AREAS[Dungeon.currentAreaIndex].name}
      달성 레벨: Lv.${this.player.level}
      획득 골드: ${this.player.gold} G
      획득 영혼석: +${gainedSouls} 💎
    `;
    Save.addSoulStones(gainedSouls);
    document.getElementById('game-over-modal').style.display = 'flex';
  }

  onGameVictory() {
    this.isRunning = false;
    Sound.stopBGM();
    Save.unlockAchievement('demon_king_slayer');
    Save.addSoulStones(50);

    document.getElementById('victory-summary-text').innerText = `
      축하합니다! 마왕을 무찌르고 세계를 구원했습니다!
      최종 레벨: Lv.${this.player.level}
      총 획득 영혼석: +50 💎
    `;
    document.getElementById('victory-modal').style.display = 'flex';
  }

  // 매 프레임 애니메이션 루프
  animate(timestamp) {
    requestAnimationFrame(this.animate);

    // 게임 미실행 상태(메인 메뉴)일 때는 모든 렌더링 및 연산 완전 스킵 (CPU 100% 렉 및 프리징 방지)
    if (!this.isRunning || !this.player) {
      this.lastTime = timestamp;
      return;
    }

    // 플레이어 체력 0 이하 시 즉시 사망 처리 (불사신 버그 완전 방지)
    if (this.player.stats.hp <= 0) {
      this.onPlayerDeath();
      return;
    }

    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    if (this.isRunning && this.player) {
      // 1. WASD 이동
      let moveX = 0;
      let moveY = 0;
      if (this.keys['w'] || this.keys['arrowup']) moveY -= 1;
      if (this.keys['s'] || this.keys['arrowdown']) moveY += 1;
      if (this.keys['a'] || this.keys['arrowleft']) moveX -= 1;
      if (this.keys['d'] || this.keys['arrowright']) moveX += 1;

      if (moveX !== 0 && moveY !== 0) {
        moveX *= 0.7071;
        moveY *= 0.7071;
      }
      this.player.vx = moveX;
      this.player.vy = moveY;

      if (this.isMouseDown) {
        this.player.performBasicAttack();
      }

      // 2. 가시 함정 주기적 팝업 (1.8초 주기)
      this.hazardTimer += dt;
      if (this.hazardTimer >= 1.8) {
        this.hazardTimer = 0;
        this.hazards.forEach(h => {
          h.isActive = !h.isActive;
          if (h.isActive && window.Sound) Sound.playTone(300, 'triangle', 0.08, 0.15);
        });
      }

      // 3. 폭발 배럴 타이머 및 폭발 처리
      for (let i = this.barrels.length - 1; i >= 0; i--) {
        const b = this.barrels[i];
        if (b.fuseLit) {
          b.explodeTimer -= dt;
          if (b.explodeTimer <= 0) {
            if (window.Sound) Sound.playExplosion();
            this.triggerAoeExplosion(b.x, b.y, 130, 2.5, 'EXPLOSION', this.player);
            this.barrels.splice(i, 1);
          }
        }
      }

      // 4. 플레이어 & 몬스터 업데이트 (지형지물 및 함정 전달)
      // 장애물 목록에는 돌기둥과 아직 안 터진 배럴 포함
      const allObstacles = [...this.obstacles, ...this.barrels];
      this.player.update(dt, this.mapBounds, allObstacles, this.hazards);

      let allDead = true;
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const enemy = this.enemies[i];
        if (enemy.stats.hp <= 0) {
          this.player.gainExp(enemy.exp);
          this.player.gainGold(enemy.gold);
          if (enemy.soulStones) Save.addSoulStones(enemy.soulStones);

          // 영혼석 자석 특성 (t_srv_souls) 반영
          const soulMagnetLv = Save.getTalentLevel('t_srv_souls');
          if (Math.random() < 0.25 * (soulMagnetLv + 1)) {
            Save.addSoulStones(1);
          }

          // 통계 기록 및 도감 등록
          Save.recordStat('monstersKilled', 1);
          Save.recordCodex('monsters', enemy.type || enemy.def.id);
          if (enemy.isBoss) {
            Save.recordStat('bossesKilled', 1);
            Save.recordCodex('bosses', enemy.bossId || enemy.def.id);
            if (enemy.def.id === 'demon_king') {
              Save.recordStat('demonKingKilled', 1);
            }
          }

          const dropChance = enemy.isBoss ? 1.0 : (enemy.isElite ? 0.8 : 0.25);
          if (Math.random() < dropChance) {
            const minR = enemy.isBoss ? 'LEGENDARY' : (enemy.isElite ? 'EPIC' : 'UNCOMMON');
            const drop = Dungeon.generateLoot(minR, this.player.stats.magicFind);
            this.player.addItemToBag(drop);
            UI.showToast(`✨ 적이 [${drop.name}] 을 드랍했습니다!`);
          }

          Save.unlockAchievement('first_blood');
          this.enemies.splice(i, 1);
          continue;
        }

        allDead = false;
        enemy.update(dt, this.player, this.mapBounds, allObstacles, this.hazards, this.enemies);
      }

      if (allDead && !Dungeon.currentRoom.cleared) {
        Dungeon.currentRoom.cleared = true;
        this.spawnPortal();
        this.spawnChest('iron');
        UI.showToast('🎉 구역 내 모든 적을 섬멸했습니다!');
      }

      // 5. 투사체 이동 및 충돌 (장애물 엄폐 판정 & 배럴 충돌)
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const p = this.projectiles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;

        let hit = false;

        // 돌기둥 엄폐물에 부딪히면 투사체 소멸
        for (let ob of this.obstacles) {
          if (Math.hypot(p.x - ob.x, p.y - ob.y) < ob.radius + p.radius) {
            hit = true;
            this.renderer.addParticle(p.x, p.y, '#747d8c', 3);
            break;
          }
        }

        // 폭발 배럴에 부딪히면 배럴 점화
        for (let b of this.barrels) {
          if (!b.fuseLit && Math.hypot(p.x - b.x, p.y - b.y) < b.radius + p.radius) {
            b.fuseLit = true;
            hit = true;
            break;
          }
        }

        if (!hit) {
          if (p.owner.isPlayer) {
            for (let e of this.enemies) {
              if (e.stats.hp > 0 && Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
                Combat.calculateDamage(p.owner, e, p.dmgMul, p.dmgType);
                if (p.dmgType === 'EXPLOSION') {
                  this.triggerAoeExplosion(p.x, p.y, 85, p.dmgMul, 'EXPLOSION', p.owner);
                }
                if (!p.piercing) { hit = true; break; }
              }
            }
          } else {
            if (Math.hypot(this.player.x - p.x, this.player.y - p.y) < this.player.radius + p.radius) {
              Combat.calculateDamage(p.owner, this.player, p.dmgMul, p.dmgType);
              hit = true;
            }
          }
        }

        if (hit || p.life <= 0) {
          this.projectiles.splice(i, 1);
        }
      }

      // 6. 상호작용 안내 프롬프트
      const promptEl = document.getElementById('interact-prompt');
      let nearObj = false;

      const checkNpcs = this.npcs && this.npcs.length > 0 ? this.npcs : (this.npc ? [this.npc] : []);
      for (const n of checkNpcs) {
        const dNpc = Math.hypot(this.player.x - n.x, this.player.y - n.y);
        if (dNpc < 140) {
          const actKey = Save.getKeybind('interact').toUpperCase();
          promptEl.style.display = 'block';
          if (n.type === 'merchant') promptEl.innerText = `[ 클릭 또는 ${actKey} ] 상점 이용 (구매 / 판매)`;
          else if (n.type === 'campfire') promptEl.innerText = `[ 클릭 또는 ${actKey} ] 모닥불에서 휴식 (체력 회복)`;
          else if (n.type === 'altar') promptEl.innerText = n.used ? `✨ 고대 제단 (축복 완료)` : `[ 클릭 또는 ${actKey} ] 고대 제단 조사 (고대의 축복)`;
          else if (n.type === 'soul_altar') promptEl.innerText = `[ 클릭 또는 ${actKey} ] 영구 성장 제단 (특성판 개방)`;
          nearObj = true;
          break;
        }
      }

      const actKey = Save.getKeybind('interact').toUpperCase();
      if (!nearObj && this.portal && Math.hypot(this.player.x - this.portal.x, this.player.y - this.portal.y) < 50) {
        promptEl.style.display = 'block';
        promptEl.innerText = `[ ${actKey} ] 다음 구역으로 차원 이동`;
        nearObj = true;
      } else if (!nearObj && this.chest && !this.chest.opened && Math.hypot(this.player.x - this.chest.x, this.player.y - this.chest.y) < 45) {
        promptEl.style.display = 'block';
        promptEl.innerText = `[ ${actKey} ] 보물 상자 열기`;
        nearObj = true;
      }
      if (!nearObj) promptEl.style.display = 'none';

      // 7. 동적 카메라 추적 (Lerp 부드러운 카메라)
      if (this.camera && this.player && this.canvas) {
        const z = this.camera.zoom || 1.15;
        const viewW = this.canvas.width / z;
        const viewH = this.canvas.height / z;
        const targetCamX = this.player.x - viewW / 2;
        const targetCamY = this.player.y - viewH / 2;

        this.camera.x += (targetCamX - this.camera.x) * 0.12;
        this.camera.y += (targetCamY - this.camera.y) * 0.12;

        if (this.roomWidth > viewW) {
          this.camera.x = Math.max(0, Math.min(this.camera.x, this.roomWidth - viewW));
        } else {
          this.camera.x = (this.roomWidth - viewW) / 2;
        }
        if (this.roomHeight > viewH) {
          this.camera.y = Math.max(0, Math.min(this.camera.y, this.roomHeight - viewH));
        } else {
          this.camera.y = (this.roomHeight - viewH) / 2;
        }
      }

      // HUD 및 미니맵 DOM 갱신 주기 제어 (매 프레임 60회 DOM 연산 렉 완전 제거)
      this.hudTimer = (this.hudTimer || 0) + dt;
      if (this.hudTimer >= 0.08) {
        this.hudTimer = 0;
        UI.updatePlayerHUD();
        if (window.UI) window.UI.renderMinimap();
      }
    }

    // ===== 2D 도트 렌더링 (카메라 뷰포트 스케일 & 변환) =====
    const ctx = this.ctx;
    if (!ctx || !this.canvas) return;

    ctx.fillStyle = '#06070a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const z = (this.camera && this.camera.zoom) ? this.camera.zoom : 1.15;
    const camX = (this.camera && this.camera.x) ? Math.round(this.camera.x) : 0;
    const camY = (this.camera && this.camera.y) ? Math.round(this.camera.y) : 0;

    ctx.save();
    ctx.scale(z, z);
    ctx.translate(-camX, -camY);

    const areaDef = DUNGEON_AREAS[Dungeon.currentAreaIndex] || DUNGEON_AREAS[0];
    this.renderer.renderBackground(areaDef, this.roomWidth, this.roomHeight);

    // 지형지물 (가시함정, 기둥, 화약통) 렌더링
    this.renderer.renderObstacles(this.obstacles, this.hazards, this.barrels);

    // NPC (상인, 모닥불, 고대 제단, 영구 성장 제단) 렌더링
    const allNpcs = this.npcs && this.npcs.length > 0 ? this.npcs : (this.npc ? [this.npc] : []);
    allNpcs.forEach(n => this.renderer.renderNpc(n));

    // 대쉬 잔상 렌더링
    this.renderer.renderGhostTrails(dt);

    // 던전 관문(일반문/보스문/잠긴문) 및 상자
    if (this.dungeonDoor) {
      this.renderer.renderDungeonDoor(this.dungeonDoor, this.portal, dt);
    } else if (this.portal) {
      this.renderer.renderPortal(this.portal.x, this.portal.y);
    }
    if (this.chest && !this.chest.opened) this.renderer.renderChest(this.chest.x, this.chest.y, this.chest.tier);

    // 몬스터 렌더링
    this.enemies.forEach(e => this.renderer.renderEnemy(e));

    // 플레이어 렌더링
    if (this.player) this.renderer.renderPlayer(this.player, dt);

    // 검기 슬래시 / 스킬 이펙트 / 투사체 / 파티클 렌더링
    this.renderer.renderSlashEffects(dt);
    this.renderer.renderSkillEffects(dt);
    this.projectiles.forEach(p => this.renderer.renderProjectile(p));
    this.renderer.renderParticles(dt);

    // Image 2 레퍼런스 스타일 2D 동적 조명 엔진 (횃불 & 플레이어 랜턴 발광 합성)
    if (this.renderer.renderLighting) {
      this.renderer.renderLighting(this.player, this.chest, this.portal, this.roomWidth, this.roomHeight);
    }

    ctx.restore();
  }
}

const Game = new GameManager();
window.Game = Game;
