// ===== UI 제어 시스템 (영구성장 특성판, 수집 도감, 누적 업적, 키 커스텀 바인딩, 인벤토리) =====

class UIManager {
  constructor() {
    this.hoveredItem = null;
    this.activeTalentCat = 'weapon';
    this.activeCodexTab = 'all';
    this.rebindingAction = null;
  }

  init() {
    try { this.bindEvents(); } catch (e) { console.error('bindEvents error', e); }
    try { this.updatePlayerHUD(); } catch (e) { console.error('updatePlayerHUD error', e); }
    try { this.updateHUDKeyLabels(); } catch (e) { console.error('updateHUDKeyLabels error', e); }
    try { this.renderMinimap(); } catch (e) { console.error('renderMinimap error', e); }
    try { this.syncSettingsUI(); } catch (e) { console.error('syncSettingsUI error', e); }
  }

  bindEvents() {
    if (this._eventsBound) return;
    this._eventsBound = true;
    window.addEventListener('keydown', (e) => {
      // 키 리바인딩 대기 중인 경우
      if (this.rebindingAction) {
        e.preventDefault();
        e.stopPropagation();
        const action = this.rebindingAction;
        this.rebindingAction = null;

        let pressedKey = e.key.toLowerCase();
        if (e.code === 'Space') pressedKey = ' ';
        Save.setKeybind(action, pressedKey);
        this.renderSettings();
        this.renderSkillsModal();
        this.updateHUDKeyLabels();

        const readableKey = pressedKey === ' ' ? 'SPACE' : pressedKey.toUpperCase();
        this.showToast(`⌨️ 조작 키 설정: [${readableKey}] (으)로 변경되었습니다.`);
        if (window.Sound) Sound.playClick();
        return;
      }

      // 모달 단축키
      const k = e.key.toLowerCase();
      const keyInv = Save.getKeybind('inventory');
      const keySkills = Save.getKeybind('skills');
      const keyCodex = Save.getKeybind('codex');

      if (k === keyInv || e.key === 'c' || e.key === 'C') {
        this.toggleModal('inventory-modal');
      }
      if (k === keySkills || k === 'k' || k === 'K') {
        this.toggleModal('skills-modal');
      }
      if (k === keyCodex) {
        this.toggleModal('codex-modal');
      }
      if (e.key === 'Escape') this.toggleModal('settings-modal');
    });
  }

  toggleModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    const isShowing = modal.style.display === 'flex';
    modal.style.display = isShowing ? 'none' : 'flex';

    if (!isShowing) {
      if (modalId === 'skills-modal') this.renderSkillsModal();
      if (modalId === 'inventory-modal') this.renderInventory();
      if (modalId === 'codex-modal') this.renderCodex();
      if (modalId === 'upgrade-modal') this.renderUpgrades();
      if (modalId === 'achievements-modal') this.renderAchievements();
      if (modalId === 'settings-modal') this.renderSettings();
      if (window.Sound) Sound.playClick();
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
  }

  showToast(msg) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = msg;
    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2800);
  }

  getItemIconHtml(item, fallback = '📦', size = 26) {
    if (window.AssetLoader) {
      const url = window.AssetLoader.getItemIconUrl(item);
      if (url) {
        return `<img src="${url}" style="width:${size}px; height:${size}px; object-fit:contain; image-rendering:pixelated; vertical-align:middle; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.8));">`;
      }
    }
    return `<span style="font-size:${size - 6}px;">${(item && item.icon) ? item.icon : fallback}</span>`;
  }

  // 스킬 고유 이미지 매핑 (포션 대체 및 다크 판타지 고품질 스킬 그래픽 연결)
  getSkillIconUrl(skillId, slotKey) {
    if (!skillId) {
      if (slotKey === 'q') return 'assets/ui/skill_q.png';
      if (slotKey === 'e') return 'assets/ui/skill_e.png';
      if (slotKey === 'r') return 'assets/ui/skill_r.png';
      if (slotKey === 'ult') return 'assets/ui/skill_ult.png';
      if (slotKey === 'dash') return 'assets/ui/skill_dash.png';
      return 'assets/ui/skill_atk.png';
    }
    const id = String(skillId).toLowerCase();
    if (id.includes('fire') || id.includes('meteor') || id.includes('flame') || id.includes('dragon')) return 'assets/ui/skill_fire.png';
    if (id.includes('ice') || id.includes('frost') || id.includes('cold')) return 'assets/ui/skill_ice.png';
    if (id.includes('lightning') || id.includes('thunder') || id.includes('charge')) return 'assets/ui/skill_lightning.png';
    if (id.includes('bow') || id.includes('arrow') || id.includes('rapid') || id.includes('pierce')) return 'assets/ui/skill_bow.png';
    if (id.includes('dagger') || id.includes('poison') || id.includes('shadow') || id.includes('thrust')) return 'assets/ui/skill_dagger.png';
    if (id.includes('spin') || id.includes('cyclone') || id.includes('sweep') || id.includes('fan')) return 'assets/ui/skill_e.png';
    if (id.includes('shield') || id.includes('barrier') || id.includes('wave') || id.includes('holy_light') || id.includes('roar')) return 'assets/ui/skill_r.png';
    if (id.includes('cleave') || id.includes('death') || id.includes('strike') || id.includes('storm') || id.includes('explosion') || id.includes('army') || id.includes('guillotine') || id.includes('ult')) return 'assets/ui/skill_ult.png';
    if (id.includes('smash') || id.includes('slam') || id.includes('bash') || id.includes('slash')) return 'assets/ui/skill_q.png';

    if (slotKey === 'q') return 'assets/ui/skill_q.png';
    if (slotKey === 'e') return 'assets/ui/skill_e.png';
    if (slotKey === 'r') return 'assets/ui/skill_r.png';
    if (slotKey === 'ult') return 'assets/ui/skill_ult.png';
    if (slotKey === 'dash') return 'assets/ui/skill_dash.png';
    return 'assets/ui/skill_atk.png';
  }

  // 상단 및 하단 HUD 갱신 (스킬 핫키: Q, E, R, Space-대쉬, F-궁극기)
  updatePlayerHUD() {
    if (!Game || !Game.player) return;
    const p = Game.player;

    const hpPct = Math.max(0, Math.min(100, (p.stats.hp / p.stats.maxHp) * 100));
    const mpPct = Math.max(0, Math.min(100, (p.stats.mp / p.stats.maxMp) * 100));
    const expPct = Math.max(0, Math.min(100, (p.exp / p.nextExp) * 100));

    const elHpBar = document.getElementById('hud-hp-bar');
    if (elHpBar) elHpBar.style.width = `${hpPct}%`;
    const elHpText = document.getElementById('hud-hp-text');
    if (elHpText) elHpText.innerText = `${Math.ceil(p.stats.hp)} / ${p.stats.maxHp}`;

    const elMpBar = document.getElementById('hud-mp-bar');
    if (elMpBar) elMpBar.style.width = `${mpPct}%`;
    const elMpText = document.getElementById('hud-mp-text');
    if (elMpText) elMpText.innerText = `${Math.ceil(p.stats.mp)} / ${p.stats.maxMp}`;

    const elExpBar = document.getElementById('hud-exp-bar');
    if (elExpBar) elExpBar.style.width = `${expPct}%`;

    const elLv = document.getElementById('hud-level-text');
    if (elLv) elLv.innerText = `Lv.${p.level}`;

    const elName = document.getElementById('hud-name-class');
    if (elName) elName.innerText = `아르덴 (${p.classDef.name})`;

    // 아르덴 핵심 스탯 정보 스트립 동기화
    const elAtk = document.getElementById('hud-stat-atk');
    if (elAtk) elAtk.innerText = Math.round(p.stats.atk);
    const elDef = document.getElementById('hud-stat-def');
    if (elDef) elDef.innerText = Math.round(p.stats.def);
    const elCrit = document.getElementById('hud-stat-crit');
    if (elCrit) elCrit.innerText = `${Math.round(p.stats.critRate * 100)}%`;
    const elSpd = document.getElementById('hud-stat-spd');
    if (elSpd) elSpd.innerText = p.stats.moveSpd.toFixed(1);

    const elGold = document.getElementById('hud-gold-text');
    if (elGold) elGold.innerText = p.gold.toLocaleString();

    const elSouls = document.getElementById('hud-souls-text');
    if (elSouls && window.Save && Save.data) elSouls.innerText = Save.data.soulStones.toLocaleString();

    // 기본 공격 & 대쉬 아이콘 동기화
    const atkIconEl = document.getElementById('skill-icon-atk');
    if (atkIconEl) {
      const srcStr = String(atkIconEl.src || '');
      if (!srcStr.endsWith('skill_atk.png')) {
        atkIconEl.src = 'assets/ui/skill_atk.png';
      }
    }
    const dashIconEl = document.getElementById('skill-icon-dash');
    if (dashIconEl) {
      const srcStr = String(dashIconEl.src || '');
      if (!srcStr.endsWith('skill_dash.png')) {
        dashIconEl.src = 'assets/ui/skill_dash.png';
      }
    }

    // 스킬 쿨다운 오버레이 & 툴팁 업데이트 (장착 무기 스킬 반영: Q, E, R, F, Dash)
    const skills = ['q', 'e', 'r', 'ult'];
    const currentWeaponSkills = p.currentSkills || p.classDef.skills;

    skills.forEach(k => {
      const cdEl = document.getElementById(`cd-${k}`);
      if (cdEl) {
        if (p.cooldowns[k] > 0) {
          cdEl.classList.add('active');
          cdEl.innerText = p.cooldowns[k].toFixed(1);
        } else {
          cdEl.classList.remove('active');
        }
      }

      const sDef = currentWeaponSkills ? currentWeaponSkills[k] : null;
      if (sDef) {
        const iconEl = document.getElementById(`skill-icon-${k}`);
        const btnEl = document.getElementById(`btn-skill-${k}`);
        if (iconEl) {
          const iconUrl = this.getSkillIconUrl(sDef.id, k);
          const curSrc = String(iconEl.src || '');
          if (curSrc !== iconUrl && !curSrc.endsWith(iconUrl)) {
            iconEl.src = iconUrl;
          }
        }
        if (btnEl) btnEl.title = `[${sDef.key}] ${sDef.name} (소모 MP: ${sDef.mp || 0})\n${sDef.desc}`;
      }
    });

    // 대쉬 쿨다운
    const dashCdEl = document.getElementById('cd-dash');
    if (dashCdEl) {
      if (p.cooldowns.dash > 0) {
        dashCdEl.classList.add('active');
        dashCdEl.innerText = p.cooldowns.dash.toFixed(1);
      } else {
        dashCdEl.classList.remove('active');
      }
    }

    // 소비품 슬롯 (1~4)
    for (let i = 0; i < 4; i++) {
      const slot = p.consumables[i];
      const iconEl = document.getElementById(`pot-icon-${i + 1}`);
      const countEl = document.getElementById(`pot-count-${i + 1}`);
      if (slot && slot.item && slot.count > 0) {
        if (window.AssetLoader) {
          const itemUrl = window.AssetLoader.getItemIconUrl(slot.item);
          if (itemUrl && iconEl) {
            iconEl.src = itemUrl;
            iconEl.style.display = 'block';
          }
        }
        if (countEl) countEl.innerText = slot.count;
      } else {
        if (iconEl) iconEl.style.display = 'none';
        if (countEl) countEl.innerText = '';
      }
    }

    // 보스 체력바
    const bossHud = document.getElementById('boss-hud');
    const boss = Game.enemies.find(e => e.isBoss && e.stats.hp > 0);
    if (boss) {
      bossHud.style.display = 'flex';
      const bossHpPct = Math.max(0, (boss.stats.hp / boss.stats.maxHp) * 100);
      document.getElementById('boss-hp-bar').style.width = `${bossHpPct}%`;
      document.getElementById('boss-name-text').innerText = boss.def.name;
      document.getElementById('boss-hp-text').innerText = `${Math.ceil(boss.stats.hp)} / ${boss.stats.maxHp}`;
    } else {
      bossHud.style.display = 'none';
    }
  }

  updateStatusBadges(target) {
    const row = document.getElementById('status-effects-row');
    if (!row) return;
    row.innerHTML = '';
    if (!target.statusEffects) return;

    for (const [key, eff] of Object.entries(target.statusEffects)) {
      const def = STATUS_EFFECTS[key];
      if (def) {
        const badge = document.createElement('div');
        badge.className = 'status-badge';
        badge.style.borderColor = def.color;
        badge.innerHTML = `<span>${def.icon}</span> <span>${def.name} (${eff.duration.toFixed(1)}s)</span>`;
        row.appendChild(badge);
      }
    }
  }

  renderMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rooms = Dungeon.rooms;
    if (!rooms || rooms.length === 0) return;

    // 1. 상단: 던전 8개 방 경로 트래커 (y: 3 ~ 24)
    const paddingX = 14;
    const trackerY = 13;
    const stepX = (canvas.width - paddingX * 2) / (rooms.length - 1);

    // 전체 경로 연결선
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(paddingX, trackerY);
    ctx.lineTo(paddingX + stepX * (rooms.length - 1), trackerY);
    ctx.stroke();

    // 완료된 경로 초록색 연결선
    if (Dungeon.currentRoomIndex > 0) {
      ctx.strokeStyle = '#2ecc71';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(paddingX, trackerY);
      ctx.lineTo(paddingX + stepX * Dungeon.currentRoomIndex, trackerY);
      ctx.stroke();
    }

    rooms.forEach((r, idx) => {
      const x = paddingX + stepX * idx;
      const y = trackerY;
      const isCurrent = Dungeon.currentRoomIndex === idx;
      const isPast = Dungeon.currentRoomIndex > idx;

      ctx.beginPath();
      ctx.arc(x, y, isCurrent ? 9 : (isPast ? 7 : 5), 0, Math.PI * 2);
      ctx.fillStyle = isCurrent ? '#ffd700' : (isPast ? '#2ecc71' : '#374151');
      ctx.fill();
      ctx.strokeStyle = isCurrent ? '#ffffff' : '#111827';
      ctx.lineWidth = isCurrent ? 2 : 1;
      ctx.stroke();

      if (isCurrent) {
        // 현재 방 황금빛 펄스 링
        ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 아이콘 도트
      const roomDef = ROOM_TYPES[r.type] || ROOM_TYPES.BATTLE;
      ctx.font = isCurrent ? '10px sans-serif' : '8px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (isPast) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText('✔', x, y);
      } else {
        ctx.fillText(roomDef.icon || '●', x, y);
      }
    });

    // 2. 하단: 실시간 방 탐색 레이더 (y: 28 ~ 148, w: 170, h: 120)
    const radarX = 5;
    const radarY = 27;
    const radarW = canvas.width - 10;
    const radarH = canvas.height - 31;

    // 레이더 바닥
    ctx.fillStyle = 'rgba(10, 14, 23, 0.92)';
    ctx.fillRect(radarX, radarY, radarW, radarH);
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(radarX, radarY, radarW, radarH);

    // 미니 그리드 라인
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let gx = radarX + 42; gx < radarX + radarW; gx += 42) {
      ctx.beginPath();
      ctx.moveTo(gx, radarY);
      ctx.lineTo(gx, radarY + radarH);
      ctx.stroke();
    }
    for (let gy = radarY + 30; gy < radarY + radarH; gy += 30) {
      ctx.beginPath();
      ctx.moveTo(radarX, gy);
      ctx.lineTo(radarX + radarW, gy);
      ctx.stroke();
    }

    // 좌표 변환 비율 (실제 방 크기 980x620)
    const toRadarX = (wx) => radarX + ((wx - Game.mapBounds.x) / Game.roomWidth) * radarW;
    const toRadarY = (wy) => radarY + ((wy - Game.mapBounds.y) / Game.roomHeight) * radarH;

    // (1) 지형지물 (회색 사각 블록)
    if (Game.obstacles) {
      ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
      Game.obstacles.forEach(ob => {
        const rx = toRadarX(ob.x);
        const ry = toRadarY(ob.y);
        ctx.fillRect(rx - 4, ry - 4, 8, 8);
      });
    }

    // (2) 차원문 포탈 (빛나는 청록색 회오리)
    if (Game.portal) {
      const px = toRadarX(Game.portal.x);
      const py = toRadarY(Game.portal.y);
      ctx.fillStyle = '#00d2d3';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🌀', px, py);
    }

    // (3) 보물상자 / NPC (상인, 모닥불)
    if (Game.chest && !Game.chest.opened) {
      const cx = toRadarX(Game.chest.x);
      const cy = toRadarY(Game.chest.y);
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('📦', cx, cy);
    }
    const radarNpcs = Game.npcs && Game.npcs.length > 0 ? Game.npcs : (Game.npc ? [Game.npc] : []);
    radarNpcs.forEach(n => {
      const nx = toRadarX(n.x);
      const ny = toRadarY(n.y);
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const icon = n.type === 'merchant' ? '🛒' : (n.type === 'campfire' ? '🔥' : (n.type === 'soul_altar' ? '💎' : '🔮'));
      ctx.fillText(icon, nx, ny);
    });

    // (4) 적들 (일반 적: 선명한 빨간 점, 엘리트/보스: 큰 황금테두리 보라 점)
    if (Game.enemies) {
      Game.enemies.forEach(e => {
        if (e.stats.hp <= 0) return;
        const ex = toRadarX(e.x);
        const ey = toRadarY(e.y);
        ctx.beginPath();
        if (e.isBoss) {
          ctx.fillStyle = '#e74c3c';
          ctx.arc(ex, ey, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (e.isElite) {
          ctx.fillStyle = '#9b59b6';
          ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#f1c40f';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          ctx.fillStyle = '#ff4757';
          ctx.arc(ex, ey, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }

    // (5) 카메라 뷰포트 사각 영역 (미니맵 카메라 추적 뷰)
    if (Game.camera && Game.canvas) {
      const z = Game.camera.zoom || 1.15;
      const vW = (Game.canvas.width / z) / Game.roomWidth * radarW;
      const vH = (Game.canvas.height / z) / Game.roomHeight * radarH;
      const vX = toRadarX(Game.camera.x);
      const vY = toRadarY(Game.camera.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.strokeRect(vX, vY, vW, vH);
    }

    // (6) 플레이어 (빛나는 에메랄드 원 + 조준 방향 화살표)
    if (Game.player) {
      const plx = toRadarX(Game.player.x);
      const ply = toRadarY(Game.player.y);

      // 플레이어 위치 점
      ctx.fillStyle = '#2ecc71';
      ctx.beginPath();
      ctx.arc(plx, ply, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 플레이어 조준 방향 지시선 (선명한 화살촉)
      const aim = Game.player.aimAngle || 0;
      const headX = plx + Math.cos(aim) * 9;
      const headY = ply + Math.sin(aim) * 9;
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(plx, ply);
      ctx.lineTo(headX, headY);
      ctx.stroke();
    }

    // 텍스트 정보 동기화
    const areaDef = DUNGEON_AREAS[Dungeon.currentAreaIndex] || DUNGEON_AREAS[0];
    const curRoom = Dungeon.currentRoom || rooms[Dungeon.currentRoomIndex];
    const roomDef = ROOM_TYPES[curRoom.type] || ROOM_TYPES.BATTLE;
    const nameEl = document.getElementById('minimap-area-name');
    const stepEl = document.getElementById('minimap-room-step');
    const diffMod = (window.Game && typeof window.Game.getDifficultyMod === 'function') ? window.Game.getDifficultyMod() : null;
    const diffText = diffMod ? ` [${diffMod.badge}${diffMod.label}]` : '';
    if (nameEl) {
      nameEl.innerText = `${areaDef.name} ${areaDef.stars}${diffText}`;
    }
    if (stepEl) stepEl.innerText = `${Dungeon.currentRoomIndex + 1}/${rooms.length} [${roomDef.icon}${curRoom.name}]`;
  }

  // 인벤토리 렌더링 (악세사리 슬롯 명확 배치 & 가방 스크롤)
  renderInventory() {
    const p = Game.player;
    if (!p) return;

    // 세부 스탯
    const statsContainer = document.getElementById('char-stats-list');
    statsContainer.innerHTML = `
      <div class="stat-row"><span class="stat-label">공격력 (ATK)</span><span class="stat-val">${Math.round(p.stats.atk)}</span></div>
      <div class="stat-row"><span class="stat-label">마법력 (MATK)</span><span class="stat-val">${Math.round(p.stats.matk)}</span></div>
      <div class="stat-row"><span class="stat-label">물리 방어력</span><span class="stat-val">${Math.round(p.stats.def)}</span></div>
      <div class="stat-row"><span class="stat-label">마법 저항력</span><span class="stat-val">${Math.round(p.stats.mdef)}</span></div>
      <div class="stat-row"><span class="stat-label">공격 속도</span><span class="stat-val">${p.stats.atkSpd.toFixed(2)} /s</span></div>
      <div class="stat-row"><span class="stat-label">이동 속도</span><span class="stat-val">${p.stats.moveSpd.toFixed(1)}</span></div>
      <div class="stat-row"><span class="stat-label">치명타 확률</span><span class="stat-val">${Math.round(p.stats.critRate * 100)}%</span></div>
      <div class="stat-row"><span class="stat-label">치명타 피해</span><span class="stat-val">${Math.round(p.stats.critDmg * 100)}%</span></div>
      <div class="stat-row"><span class="stat-label">회피율</span><span class="stat-val">${Math.round(p.stats.dodge * 100)}%</span></div>
      <div class="stat-row"><span class="stat-label">생명력 흡수</span><span class="stat-val">${Math.round(p.stats.lifesteal * 100)}%</span></div>
      <div class="stat-row"><span class="stat-label">쿨타임 감소</span><span class="stat-val">${Math.round(p.stats.cdr * 100)}%</span></div>
      <div class="stat-row"><span class="stat-label">아이템 발견률</span><span class="stat-val">${Math.round(p.stats.magicFind * 100)}%</span></div>
    `;

    // 8개 장비 슬롯 렌더링 (악세사리 포함)
    const slotConfigs = [
      { key: 'helm', name: '투구', icon: '🪖' },
      { key: 'amulet', name: '목걸이', icon: '📿' }, // 악세사리 목걸이
      { key: 'chest', name: '갑옷', icon: '🛡️' },
      { key: 'weapon', name: '무기', icon: '🗡️' },
      { key: 'gloves', name: '장갑', icon: '🧤' },
      { key: 'ring1', name: '반지 1', icon: '💍' }, // 악세사리 반지 1
      { key: 'boots', name: '신발', icon: '👢' },
      { key: 'ring2', name: '반지 2', icon: '💍' }  // 악세사리 반지 2
    ];

    slotConfigs.forEach(cfg => {
      const el = document.getElementById(`slot-${cfg.key}`);
      if (!el) return;
      const item = p.equipped[cfg.key];
      const rarityKey = item ? item.rarity.toLowerCase() : '';
      el.className = `item-slot ${rarityKey}`;

      if (item) {
        el.innerHTML = `
          <div>${this.getItemIconHtml(item, '⚔️', 26)}</div>
          <div class="slot-title-label" style="color:#fff; font-weight:bold;">${item.name}</div>
        `;
      } else {
        el.innerHTML = `
          <div style="font-size:20px; opacity:0.35;">${cfg.icon}</div>
          <div class="slot-title-label">${cfg.name}</div>
        `;
      }

      el.onclick = () => {
        if (item) {
          p.unequipItem(cfg.key);
          this.renderInventory();
        }
      };

      el.onmouseenter = (e) => {
        if (item) this.showCompareTooltip(e, item, null);
      };
      el.onmouseleave = () => this.hideCompareTooltip();
    });

    // 가방 인벤토리 그리드 렌더링 (아이템 많아도 스크롤)
    const bagGrid = document.getElementById('bag-grid');
    bagGrid.innerHTML = '';
    document.getElementById('bag-count-label').innerText = `(${p.bag.length}개 보유)`;

    p.bag.forEach((item) => {
      const slotEl = document.createElement('div');
      slotEl.className = `item-slot ${item.rarity.toLowerCase()}`;
      slotEl.innerHTML = `
        <div>${this.getItemIconHtml(item, '📦', 24)}</div>
        <div style="font-size:9px; text-align:center; color:#fff; overflow:hidden; text-overflow:ellipsis; width:100%; white-space:nowrap; padding:0 2px;">${item.name}</div>
      `;

      // 장착 대상 슬롯 결정 (반지는 1, 2 중 빈 슬롯 우선)
      let targetSlot = item.type ? 'weapon' : (item.slot || 'chest');
      if (targetSlot === 'ring') {
        targetSlot = p.equipped.ring1 === null ? 'ring1' : (p.equipped.ring2 === null ? 'ring2' : 'ring1');
      }
      const curEquipped = p.equipped[targetSlot];

      slotEl.onclick = () => {
        p.equipItem(item, targetSlot);
        this.renderInventory();
      };

      slotEl.onmouseenter = (e) => {
        this.showCompareTooltip(e, item, curEquipped);
      };
      slotEl.onmouseleave = () => this.hideCompareTooltip();

      bagGrid.appendChild(slotEl);
    });

    // 핵심 유물 슬롯 (무제한 & 중복 보유 시 배수 뱃지 표시)
    const relicsRow = document.getElementById('relics-list-row');
    if (relicsRow) {
      relicsRow.innerHTML = '';
      const relicGroups = {};
      p.relics.forEach(r => {
        if (!relicGroups[r.id]) relicGroups[r.id] = { relic: r, count: 0 };
        relicGroups[r.id].count++;
      });

      Object.values(relicGroups).forEach(({ relic, count }) => {
        const rEl = document.createElement('div');
        rEl.className = 'item-slot ' + relic.rarity.toLowerCase();
        rEl.style.position = 'relative';
        rEl.innerHTML = `
          <div style="font-size:22px;">${relic.icon}</div>
          <div style="font-size:9px; text-align:center; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; width:100%;">${relic.name}</div>
          ${count > 1 ? `<div style="position:absolute; right:1px; top:1px; background:#e74c3c; color:#fff; font-size:10px; font-weight:bold; padding:1px 4px; border-radius:6px; box-shadow:0 0 4px #000;">x${count}</div>` : ''}
        `;
        rEl.title = `${relic.name} (보유: ${count}개) - ${relic.desc} [중복 효과 ${count}배 증폭]`;
        relicsRow.appendChild(rEl);
      });
    }
  }

  // 아이템 비교 툴팁
  showCompareTooltip(e, newItem, oldItem) {
    const panel = document.getElementById('item-compare-panel');
    if (!panel) return;
    panel.style.display = 'flex';
    panel.style.left = `${Math.min(window.innerWidth - 480, e.clientX + 15)}px`;
    panel.style.top = `${Math.min(window.innerHeight - 280, e.clientY + 10)}px`;

    const renderCard = (item, isNew = false) => {
      if (!item) return `<div class="compare-card"><div class="compare-title">장착 없음</div></div>`;
      const rarity = RARITY[item.rarity] || RARITY.COMMON;

      // 상세 장비 옵션 가시화 (흡혈, 치명타, 공격속도, 쿨다운 등 모든 고유 스탯 포함)
      let statsHtml = '';
      if (item.baseAtk || item.atk) statsHtml += `<div>⚔️ 공격력: +${item.baseAtk || item.atk}</div>`;
      if (item.baseMatk || item.matk) statsHtml += `<div>🔮 마법력: +${item.baseMatk || item.matk}</div>`;
      if (item.def) statsHtml += `<div>🛡️ 물리 방어력: +${item.def}</div>`;
      if (item.mdef) statsHtml += `<div>✨ 마법 저항력: +${item.mdef}</div>`;
      if (item.maxHp) statsHtml += `<div>💖 최대 HP: +${item.maxHp}</div>`;
      if (item.maxMp) statsHtml += `<div>💧 최대 MP: +${item.maxMp}</div>`;
      if (item.lifesteal || item.lifestealBonus) statsHtml += `<div style="color:#ff7675; font-weight:bold;">🩸 생명력 흡수: +${Math.round((item.lifesteal || item.lifestealBonus) * 100)}%</div>`;
      if (item.critRate || item.critRateBonus) statsHtml += `<div style="color:#feca57;">🎯 치명타 확률: +${Math.round((item.critRate || item.critRateBonus) * 100)}%</div>`;
      if (item.critDmg || item.critDmgBonus) statsHtml += `<div style="color:#ff9f43;">💥 치명타 피해: +${Math.round((item.critDmg || item.critDmgBonus) * 100)}%</div>`;
      if (item.atkSpd || item.atkSpdMod) statsHtml += `<div>⚡ 공격 속도: +${Math.round((item.atkSpd || item.atkSpdMod) * 100)}%</div>`;
      if (item.moveSpd) statsHtml += `<div>👟 이동 속도: +${item.moveSpd}</div>`;
      if (item.dodge) statsHtml += `<div>💨 회피율: +${Math.round(item.dodge * 100)}%</div>`;
      if (item.cdr) statsHtml += `<div>⏳ 쿨타임 감소: +${Math.round(item.cdr * 100)}%</div>`;
      if (item.magicFind) statsHtml += `<div>🍀 아이템 발견률: +${Math.round(item.magicFind * 100)}%</div>`;
      if (item.goldGain) statsHtml += `<div>🪙 골드 획득량: +${Math.round(item.goldGain * 100)}%</div>`;

      let optsHtml = '';
      if (item.randomOptions && item.randomOptions.length > 0) {
        optsHtml = `<div style="margin-top:4px; padding-top:4px; border-top:1px dashed rgba(255,255,255,0.2);">` +
          item.randomOptions.map(o => `<div style="color:#00d2d3; font-size:11px;">• ${o.name}: +${o.isPct ? Math.round(o.val * 100) + '%' : o.val}</div>`).join('') +
          `</div>`;
      }

      return `
        <div class="compare-card">
          <div class="compare-title" style="color:${rarity.color}">
            ${item.icon || ''} ${isNew ? '[새 아이템] ' : '[현재 장착] '}${item.name}
          </div>
          <div style="color:${rarity.color}; font-size:11px; margin-bottom:4px; font-weight:bold;">등급: ${rarity.name}</div>
          ${statsHtml}
          ${optsHtml}
          ${item.desc ? `<div style="font-size:11px; color:#aaa; margin-top:4px; font-style:italic;">"${item.desc}"</div>` : ''}
        </div>
      `;
    };

    panel.innerHTML = renderCard(newItem, true) + (oldItem ? renderCard(oldItem, false) : '');
  }

  hideCompareTooltip() {
    const panel = document.getElementById('item-compare-panel');
    if (panel) panel.style.display = 'none';
  }

  // 레벨업 3택 특성 선택창 (중복 선택 및 단계별 무한 강화 지원)
  showPerkSelection() {
    const modal = document.getElementById('perk-modal');
    const container = document.getElementById('perk-cards-box');
    container.innerHTML = '';

    const p = Game.player;
    if (!p) return;

    // 전체 특성 목록 중 무작위 3개 선출 (중복 획득 가능!)
    const pool = [...PERKS];
    const choices = [];
    while (choices.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      choices.push(pool.splice(idx, 1)[0]);
    }

    choices.forEach(perk => {
      const curLv = p.perks.filter(learned => learned.id === perk.id).length;
      const nextLv = curLv + 1;
      const isUpgrade = curLv > 0;

      const card = document.createElement('div');
      card.className = 'perk-card';
      card.style.position = 'relative';
      card.innerHTML = `
        <div class="perk-icon">${perk.icon}</div>
        <div class="perk-name" style="color:${isUpgrade ? '#2ecc71' : 'var(--gold-primary)'};">
          ${perk.name} <span style="font-size:12px; font-weight:bold; color:#00ffff;">Lv.${nextLv}</span>
        </div>
        <div style="font-size:11px; color:#f1c40f;">
          ${isUpgrade ? `[중복 강화: Lv.${curLv} ➔ Lv.${nextLv}]` : `[신규 습득: ${perk.cat} 계열]`}
        </div>
        <div class="perk-desc" style="margin-top:6px;">${perk.desc}</div>
        ${isUpgrade ? `<div style="font-size:10px; color:#2ecc71; margin-top:4px; font-weight:bold;">★ 효과가 추가 중첩 누적됩니다!</div>` : ''}
      `;
      card.onclick = () => {
        p.perks.push(perk);
        p.recalculateStats();
        modal.style.display = 'none';
        if (isUpgrade) {
          this.showToast(`✨ 특성 강화: [${perk.name}] Lv.${nextLv} 달성!`);
        } else {
          this.showToast(`✨ 신규 특성 습득: [${perk.name}]!`);
        }
        if (window.Sound) Sound.playClick();
      };
      container.appendChild(card);
    });

    modal.style.display = 'flex';
  }

  // 랜덤 이벤트 및 고대 제단 모달
  showEventModal(eventDef, targetNpc = null) {
    const modal = document.getElementById('event-modal');
    document.getElementById('event-title').innerText = `🔮 ${eventDef.title}`;
    document.getElementById('event-desc').innerText = eventDef.text;

    const optContainer = document.getElementById('event-options-box');
    optContainer.innerHTML = '';

    eventDef.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'menu-btn';
      btn.style.textAlign = 'left';
      btn.style.padding = '10px 14px';
      btn.style.fontSize = '13px';
      btn.innerText = opt.text;
      btn.onclick = () => {
        // 즉시 창을 닫고 중복 수령 불가능하게 제단 사용 완료 처리
        modal.style.display = 'none';
        if (targetNpc) targetNpc.used = true;
        if (Game.npc && Game.npc.type === 'altar') Game.npc.used = true;
        if (Game.npcs) {
          Game.npcs.forEach(n => { if (n.type === 'altar') n.used = true; });
        }
        this.resolveEventOption(opt.effect);
      };
      optContainer.appendChild(btn);
    });

    modal.style.display = 'flex';
  }

  resolveEventOption(effect) {
    const p = Game.player;
    if (effect === 'altar_war_god') {
      p.baseStats.atk = Math.round(p.baseStats.atk * 1.35);
      p.baseStats.matk = Math.round(p.baseStats.matk * 1.35);
      p.recalculateStats();
      if (window.Sound) Sound.playLevelUp();
      this.showToast('⚔️ 고대 전쟁신의 은총으로 공격력과 마법력이 35% 대폭 증가했습니다!');
    } else if (effect === 'altar_immortal') {
      p.baseStats.maxHp = Math.round(p.baseStats.maxHp * 1.30);
      p.baseStats.def = Math.round(p.baseStats.def * 1.25);
      p.recalculateStats();
      p.stats.hp = p.stats.maxHp;
      if (window.Sound) Sound.playPotion();
      this.showToast('🛡️ 불멸의 가호로 최대 체력과 방어력이 영구 상승했습니다!');
    } else if (effect === 'altar_swift') {
      p.baseStats.moveSpd = Number((p.baseStats.moveSpd * 1.3).toFixed(1));
      p.baseStats.cdr = Math.min(0.6, (p.baseStats.cdr || 0) + 0.25);
      p.recalculateStats();
      if (window.Sound) Sound.playLevelUp();
      this.showToast('⚡ 신속의 축복으로 이동속도와 쿨다운 감소가 대폭 강화되었습니다!');
    } else if (effect === 'altar_souls') {
      Save.addSoulStones(25);
      p.gold += 350;
      this.updatePlayerHUD();
      if (window.Sound) Sound.playCoin();
      this.showToast('💎 고대 제단에서 영혼석 25개와 350 G를 획득했습니다!');
    } else if (effect === 'hp_for_item') {
      p.stats.hp = Math.max(1, Math.round(p.stats.hp * 0.75));
      const loot = Dungeon.generateLoot('LEGENDARY', 0.2);
      p.bag.push(loot);
      this.showToast(`🩸 체력을 바치고 전설 장비 [${loot.name}] 을(를) 획득했습니다!`);
    } else if (effect === 'clean_altar') {
      Combat.heal(p, Math.round(p.stats.maxHp * 0.5));
      p.stats.mp = p.stats.maxMp;
      this.showToast('✨ 제단을 정화하여 모든 체력과 마나를 회복했습니다.');
    } else if (effect === 'drink_spring') {
      Combat.heal(p, p.stats.maxHp);
      p.stats.mp = p.stats.maxMp;
      this.showToast('💧 신비한 샘물로 온몸의 상처와 마나를 완전 회복했습니다!');
    } else if (effect === 'demon_atk') {
      p.baseStats.maxHp = Math.round(p.baseStats.maxHp * 0.85);
      p.baseStats.atk = Math.round(p.baseStats.atk * 1.6);
      p.recalculateStats();
      this.showToast('🔥 악마와의 계약으로 공격력이 60% 폭증했습니다!');
    } else {
      this.showToast('조용히 발걸음을 옮겼습니다.');
    }
  }

  // 상점 탭 전환 (구매 / 판매)
  switchShopTab(tab) {
    const buyBtn = document.getElementById('tab-shop-buy');
    const sellBtn = document.getElementById('tab-shop-sell');
    const buyBox = document.getElementById('shop-buy-container');
    const sellBox = document.getElementById('shop-sell-container');

    if (tab === 'buy') {
      if (buyBtn) buyBtn.classList.add('active');
      if (sellBtn) sellBtn.classList.remove('active');
      if (buyBox) buyBox.style.display = 'block';
      if (sellBox) sellBox.style.display = 'none';
    } else {
      if (buyBtn) buyBtn.classList.remove('active');
      if (sellBtn) sellBtn.classList.add('active');
      if (buyBox) buyBox.style.display = 'none';
      if (sellBox) sellBox.style.display = 'block';
      this.renderShopSellGrid();
    }
  }

  // 상점 단일 카드 렌더링 (옵션 가시화 및 유물 연속 구매 지원)
  renderShopItemCard(container, item, isRelicSlot = false) {
    const goldDisplay = document.getElementById('shop-gold-display');
    const rarityKey = item.rarity || 'RARE';
    const rarityDef = RARITY[rarityKey] || RARITY.RARE;
    const price = rarityKey === 'MYTHIC' ? 450 : rarityKey === 'LEGENDARY' ? 320 : rarityKey === 'EPIC' ? 210 : 130;

    // 상세 스탯 옵션 텍스트 생성
    let statsSummary = '';
    if (item.baseAtk || item.atk) statsSummary += `<div>⚔️ 공격력 +${item.baseAtk || item.atk}</div>`;
    if (item.baseMatk || item.matk) statsSummary += `<div>🔮 마법력 +${item.baseMatk || item.matk}</div>`;
    if (item.def) statsSummary += `<div>🛡️ 방어력 +${item.def}</div>`;
    if (item.mdef) statsSummary += `<div>✨ 마법저항 +${item.mdef}</div>`;
    if (item.maxHp) statsSummary += `<div>💖 최대 HP +${item.maxHp}</div>`;
    if (item.lifesteal || item.lifestealBonus) statsSummary += `<div style="color:#ff7675; font-weight:bold;">🩸 흡혈 +${Math.round((item.lifesteal || item.lifestealBonus) * 100)}%</div>`;
    if (item.critRate || item.critRateBonus) statsSummary += `<div style="color:#feca57;">🎯 치명타 +${Math.round((item.critRate || item.critRateBonus) * 100)}%</div>`;
    if (item.atkSpd || item.atkSpdMod) statsSummary += `<div>⚡ 공속 +${Math.round((item.atkSpd || item.atkSpdMod) * 100)}%</div>`;
    if (item.moveSpd) statsSummary += `<div>👟 이속 +${item.moveSpd}</div>`;
    if (item.cdr) statsSummary += `<div>⏳ 쿨감 +${Math.round(item.cdr * 100)}%</div>`;

    if (item.randomOptions && item.randomOptions.length > 0) {
      statsSummary += item.randomOptions.map(o => `<div style="color:#00d2d3; font-size:11px;">• ${o.name}: +${o.isPct ? Math.round(o.val * 100) + '%' : o.val}</div>`).join('');
    }

    const card = document.createElement('div');
    card.className = 'shop-item-card';
    card.style.display = 'flex';
    card.style.flexDirection = 'column';
    card.style.justifyContent = 'space-between';
    card.innerHTML = `
      <div>
        <div style="font-weight:bold; font-size:14px; color:${rarityDef.color}; display:flex; align-items:center; gap:6px;">
          ${this.getItemIconHtml(item, '📦', 24)} <span>${item.name}</span>
        </div>
        <div style="font-size:11px; color:${rarityDef.color}; margin-bottom:4px; font-weight:bold;">
          [${rarityDef.name} 등급]
        </div>
        <div style="font-size:11px; color:#eee; background:rgba(0,0,0,0.4); padding:6px; border-radius:6px; margin:4px 0; line-height:1.4;">
          ${statsSummary || item.desc || '신비한 힘이 깃든 아이템'}
        </div>
      </div>
      <div>
        <div style="color:#ffd700; font-weight:bold; margin:6px 0; font-size:14px;">💰 ${price} G</div>
        <button class="btn-buy" style="width:100%;" ${Game.player.gold < price ? 'disabled' : ''}>구매하기</button>
      </div>
    `;

    card.querySelector('.btn-buy').onclick = () => {
      if (Game.player.gold >= price) {
        Game.player.gold -= price;
        if (goldDisplay) goldDisplay.innerText = Game.player.gold.toLocaleString();

        if (item.icon && !item.type && !item.slot && !item.healHp && !item.bomb) {
          // 유물 구매
          Game.player.addRelic(item);
          this.showToast(`✨ 유물 [${item.name}] 획득!`);

          // [핵심] 유물 구매 시 계속해서 새로운 유물 또는 중복 강화 유물이 즉시 갱신!
          const allRelicsList = Object.values(RELICS);
          const unownedRelics = allRelicsList.filter(r => !Game.player.relics.some(owned => owned.id === r.id));
          const nextPool = unownedRelics.length > 0 ? unownedRelics : allRelicsList;
          const nextRelic = nextPool[Math.floor(Math.random() * nextPool.length)];
          const newCard = this.renderShopItemCard(container, nextRelic, true);
          card.parentNode.replaceChild(newCard, card);
          this.showToast(`✨ 상점에 유물 [${nextRelic.name}] 이(가) 새로 입고되었습니다!`);
        } else if (item.healHp || item.bomb) {
          // 소비품
          const emptySlot = Game.player.consumables.find(s => s.item === null);
          if (emptySlot) { emptySlot.item = item; emptySlot.count = 2; }
          else { Game.player.addItemToBag(item); }
          card.querySelector('.btn-buy').disabled = true;
          card.querySelector('.btn-buy').innerText = '구매 완료';
          this.showToast(`[${item.name}] 구매 완료!`);
        } else {
          // 장비
          Game.player.addItemToBag(item);
          card.querySelector('.btn-buy').disabled = true;
          card.querySelector('.btn-buy').innerText = '구매 완료';
          this.showToast(`[${item.name}] 구매 완료!`);
        }

        Save.recordStat('shopPurchases', 1);
        if (window.Sound) Sound.playCoin();
        this.updatePlayerHUD();
        this.updateShopButtons();
      }
    };

    container.appendChild(card);
    return card;
  }

  updateShopButtons() {
    const buyBtns = document.querySelectorAll('#shop-items-grid .btn-buy');
    buyBtns.forEach(btn => {
      if (btn.innerText === '구매하기') {
        const card = btn.closest('.shop-item-card');
        const priceText = card.querySelector('div[style*="#ffd700"]')?.innerText || '0';
        const price = parseInt(priceText.replace(/[^0-9]/g, '')) || 0;
        btn.disabled = Game.player.gold < price;
      }
    });
  }

  // 상점 모달 (무조건 RARE 이상 고등급만 출현 & 옵션 완벽 표시 & 유물 계속 등장)
  showShopModal() {
    const modal = document.getElementById('shop-modal');
    const grid = document.getElementById('shop-items-grid');
    const goldDisplay = document.getElementById('shop-gold-display');
    if (goldDisplay) goldDisplay.innerText = Game.player.gold.toLocaleString();
    grid.innerHTML = '';

    // 미보유 유물 필터링
    const availableRelics = Object.values(RELICS).filter(r => !Game.player.relics.some(owned => owned.id === r.id));
    const chosenRelic = availableRelics.length > 0
      ? availableRelics[Math.floor(Math.random() * availableRelics.length)]
      : CONSUMABLES.hp_pot_large;

    // 상점 출현 아이템: 무조건 RARE, EPIC, LEGENDARY 고등급만 출현!
    const highTierItems = [
      Dungeon.generateLoot('LEGENDARY'),
      Dungeon.generateLoot('EPIC'),
      Dungeon.generateLoot('RARE'),
      chosenRelic,
      CONSUMABLES.hp_pot_large,
      CONSUMABLES.fire_bomb
    ];

    highTierItems.forEach(item => {
      const isRelic = (item.icon && !item.type && !item.slot && !item.healHp && !item.bomb);
      this.renderShopItemCard(grid, item, isRelic);
    });

    this.switchShopTab('buy');
    modal.style.display = 'flex';
  }

  // 상점 아이템 판매 그리드 렌더링
  renderShopSellGrid() {
    const container = document.getElementById('shop-sell-grid');
    const goldDisplay = document.getElementById('shop-gold-display');
    if (goldDisplay) goldDisplay.innerText = Game.player.gold.toLocaleString();
    if (!container) return;
    container.innerHTML = '';

    const bag = Game.player.bag;
    if (!bag || bag.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align:center; padding: 40px; color:#888;">
          <div style="font-size:32px; margin-bottom:8px;">🎒</div>
          <div>가방에 판매할 수 있는 장비나 전리품이 없습니다.</div>
        </div>
      `;
      return;
    }

    bag.forEach((item, idx) => {
      const rarityKey = item.rarity || 'COMMON';
      const rarityDef = RARITY[rarityKey] || RARITY.COMMON;
      const sellPrice = rarityKey === 'MYTHIC' ? 600
        : rarityKey === 'LEGENDARY' ? 350
        : rarityKey === 'EPIC' ? 180
        : rarityKey === 'RARE' ? 90
        : rarityKey === 'UNCOMMON' ? 45 : 20;

      const card = document.createElement('div');
      card.className = 'shop-item-card';
      card.style.flexDirection = 'column';
      card.style.justifyContent = 'space-between';
      card.innerHTML = `
        <div>
          <div style="font-weight:bold; color:${rarityDef.color}; font-size:14px; display:flex; align-items:center; gap:6px;">
            ${this.getItemIconHtml(item, '📦', 24)} <span>${item.name}</span>
          </div>
          <div style="font-size:11px; color:#aaa; margin: 3px 0;">등급: ${rarityDef.name}</div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:8px;">
          <span style="color:#ffd700; font-weight:bold;">+${sellPrice} G</span>
          <button class="btn-buy" style="background:#e67e22; border-color:#d35400; padding:4px 10px; font-size:12px;">판매</button>
        </div>
      `;

      card.querySelector('button').onclick = () => {
        Game.player.gold += sellPrice;
        Game.player.bag.splice(idx, 1);
        if (window.Sound) Sound.playTone(850, 'sine', 0.1, 0.4);
        this.updatePlayerHUD();
        this.renderShopSellGrid();
        this.showToast(`💰 [${item.name}] 을 판매하여 ${sellPrice} G를 획득했습니다!`);
      };

      container.appendChild(card);
    });
  }

  // 볼륨 및 설정 UI 동기화
  syncSettingsUI() {
    const s = Save?.data?.settings || { masterVol: 70, bgmVol: 50, sfxVol: 80, showDmgText: true, screenShake: true };
    if (window.Sound) {
      Sound.masterVolume = (s.masterVol ?? 70) / 100;
      Sound.bgmVolume = (s.bgmVol ?? 50) / 100;
      Sound.sfxVolume = (s.sfxVol ?? 80) / 100;
    }
    const mSlider = document.getElementById('slider-master-vol');
    if (mSlider) mSlider.value = s.masterVol ?? 70;
    const bSlider = document.getElementById('slider-bgm-vol');
    if (bSlider) bSlider.value = s.bgmVol ?? 50;
    const sSlider = document.getElementById('slider-sfx-vol');
    if (sSlider) sSlider.value = s.sfxVol ?? 80;

    const mLbl = document.getElementById('label-master-vol');
    if (mLbl) mLbl.innerText = `${s.masterVol ?? 70}%`;
    const bLbl = document.getElementById('label-bgm-vol');
    if (bLbl) bLbl.innerText = `${s.bgmVol ?? 50}%`;
    const sLbl = document.getElementById('label-sfx-vol');
    if (sLbl) sLbl.innerText = `${s.sfxVol ?? 80}%`;

    const chkDmg = document.getElementById('chk-dmg-text');
    if (chkDmg) chkDmg.checked = s.showDmgText !== false;
    const chkShake = document.getElementById('chk-screen-shake');
    if (chkShake) chkShake.checked = s.screenShake !== false;
  }

  onVolumeChange(type, val) {
    val = parseInt(val) || 0;
    if (!Save.data.settings) Save.data.settings = {};
    if (type === 'master') {
      Save.data.settings.masterVol = val;
      if (window.Sound) Sound.masterVolume = val / 100;
      const lbl = document.getElementById('label-master-vol');
      if (lbl) lbl.innerText = `${val}%`;
    } else if (type === 'bgm') {
      Save.data.settings.bgmVol = val;
      if (window.Sound) Sound.bgmVolume = val / 100;
      const lbl = document.getElementById('label-bgm-vol');
      if (lbl) lbl.innerText = `${val}%`;
    } else if (type === 'sfx') {
      Save.data.settings.sfxVol = val;
      if (window.Sound) Sound.sfxVolume = val / 100;
      const lbl = document.getElementById('label-sfx-vol');
      if (lbl) lbl.innerText = `${val}%`;
    }
    Save.save();
  }

  updateHUDKeyLabels() {
    const formatKey = (k) => (!k || k === ' ' || k === 'space') ? 'Space' : String(k).toUpperCase();

    const qEl = document.querySelector('#btn-skill-q .slot-key');
    if (qEl) qEl.innerText = formatKey(Save.getKeybind('skillQ'));

    const eEl = document.querySelector('#btn-skill-e .slot-key');
    if (eEl) eEl.innerText = formatKey(Save.getKeybind('skillE'));

    const rEl = document.querySelector('#btn-skill-r .slot-key');
    if (rEl) rEl.innerText = formatKey(Save.getKeybind('skillR'));

    const ultEl = document.querySelector('#btn-skill-ult .slot-key');
    if (ultEl) ultEl.innerText = formatKey(Save.getKeybind('skillUlt'));

    const dashEl = document.querySelector('#btn-skill-dash .slot-key');
    if (dashEl) dashEl.innerText = formatKey(Save.getKeybind('dash'));
  }

  // 영구 성장 특성판 렌더링 (무기 마스터리, 스킬 각성, 궁극기 강화, 생존/탐험)
  renderUpgrades() {
    const soulsEl = document.getElementById('upgrade-souls-text');
    if (soulsEl) soulsEl.innerText = (Save.data.soulStones || 0).toLocaleString();

    // 1. 카테고리 탭 렌더링
    const tabContainer = document.getElementById('talent-cat-tabs');
    if (tabContainer) {
      tabContainer.innerHTML = Object.entries(TALENT_CATEGORIES).map(([catKey, catDef]) => {
        const isActive = this.activeTalentCat === catKey;
        return `
          <button class="menu-btn ${isActive ? 'active' : ''}" style="padding:6px 16px; font-size:13px;" onclick="UI.switchTalentCategory('${catKey}')">
            ${catDef.icon} ${catDef.name}
          </button>
        `;
      }).join('');
    }

    // 2. 특성 그리드 렌더링
    const grid = document.getElementById('talent-tree-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const currentCatTalents = TALENT_TREE.filter(t => t.cat === this.activeTalentCat);
    currentCatTalents.forEach(talent => {
      const curLv = Save.getTalentLevel(talent.id);
      const isMax = curLv >= talent.maxLv;
      const cost = talent.baseCost + curLv * talent.costMul;
      const canAfford = (Save.data.soulStones || 0) >= cost;

      let levelPips = '';
      for (let i = 1; i <= talent.maxLv; i++) {
        levelPips += (i <= curLv)
          ? '<span style="color:#00ffff; font-size:14px; margin-right:2px;">●</span>'
          : '<span style="color:#555; font-size:14px; margin-right:2px;">○</span>';
      }

      const curEffect = talent.getEffectText(curLv);
      const nextEffect = isMax ? '최고 레벨 도달' : talent.getEffectText(curLv + 1);

      const card = document.createElement('div');
      card.className = 'shop-item-card';
      card.style.background = isMax ? 'rgba(0, 180, 216, 0.08)' : 'rgba(0, 0, 0, 0.55)';
      card.style.border = isMax ? '1px solid #00d2d3' : '1px solid rgba(255,255,255,0.12)';
      card.style.borderRadius = '10px';
      card.style.padding = '14px';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:26px;">${talent.icon}</span>
            <div>
              <div style="font-weight:bold; font-size:15px; color:${isMax ? '#00ffff' : '#ffd700'};">${talent.name}</div>
              <div style="font-size:11px; margin-top:2px;">${levelPips} <span style="color:#aaa;">(Lv.${curLv}/${talent.maxLv})</span></div>
            </div>
          </div>
          ${isMax ? '<span style="background:#00d2d3; color:#000; font-weight:bold; font-size:10px; padding:2px 6px; border-radius:4px;">MASTER</span>' : ''}
        </div>
        <div style="font-size:12px; color:#bbb; line-height:1.4; margin-bottom:10px; min-height:34px;">
          ${talent.desc}
        </div>
        <div style="background:rgba(0,0,0,0.4); padding:8px; border-radius:6px; font-size:11px; margin-bottom:12px;">
          <div style="color:#2ecc71; margin-bottom:3px;">현재: ${curEffect}</div>
          ${!isMax ? `<div style="color:#f39c12;">다음: ${nextEffect}</div>` : ''}
        </div>
        <div>
          ${isMax ? `
            <button class="btn-buy" disabled style="width:100%; background:#2c3e50; color:#7f8c8d; cursor:default;">
              마스터 완료
            </button>
          ` : `
            <button class="btn-buy" style="width:100%; display:flex; justify-content:space-between; align-items:center; padding:8px 12px;" ${canAfford ? '' : 'disabled'}>
              <span>특성 강화</span>
              <span style="color:#000; font-weight:bold;">${cost} 💎</span>
            </button>
          `}
        </div>
      `;

      if (!isMax) {
        card.querySelector('.btn-buy').onclick = () => {
          if (Save.buyTalent(talent.id)) {
            this.renderUpgrades();
            this.showToast(`✨ [${talent.name}] 특성 레벨업! (Lv.${curLv + 1})`);
            if (window.Sound) Sound.playLevelUp();
          } else {
            this.showToast('영혼석이 부족합니다!');
          }
        };
      }

      grid.appendChild(card);
    });
  }

  switchTalentCategory(catKey) {
    this.activeTalentCat = catKey;
    this.renderUpgrades();
    if (window.Sound) Sound.playClick();
  }

  // 모험 도감 렌더링 (전체 요약, 무기, 방어구/악세, 유물, 몬스터/보스)
  renderCodex() {
    const codex = Save.data?.codex || {};
    const totalWeapons = Object.keys(WEAPONS).length;
    const foundWeapons = Object.keys(codex.weapons || {}).length;

    const totalArmors = Object.keys(ARMORS).length;
    const foundArmors = Object.keys(codex.armors || {}).length;

    const totalAcc = Object.keys(ACCESSORIES).length;
    const foundAcc = Object.keys(codex.accessories || {}).length;

    const totalRelics = Object.keys(RELICS).length;
    const foundRelics = Object.keys(codex.relics || {}).length;

    const totalMonsters = Object.keys(MONSTERS).length + Object.keys(BOSSES).length;
    const foundMonsters = Object.keys(codex.monsters || {}).length + Object.keys(codex.bosses || {}).length;

    const totalAll = totalWeapons + totalArmors + totalAcc + totalRelics + totalMonsters;
    const foundAll = foundWeapons + foundArmors + foundAcc + foundRelics + foundMonsters;
    const pctAll = Math.round((foundAll / totalAll) * 100);

    // 1. 전체 수집률 진행도 바
    const progressBox = document.getElementById('codex-overall-progress');
    if (progressBox) {
      progressBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <span style="font-weight:bold; font-size:14px; color:#ffd700;">전체 모험 도감 수집률</span>
          <span style="font-weight:bold; font-size:14px; color:#00ffff;">${foundAll} / ${totalAll} (${pctAll}%)</span>
        </div>
        <div class="bar-container" style="height:10px;">
          <div class="bar-fill" style="width:${pctAll}%; background: linear-gradient(90deg, #d4af37, #00ffff);"></div>
        </div>
      `;
    }

    // 2. 탭 바
    const tabsBar = document.getElementById('codex-tabs-bar');
    if (tabsBar) {
      const tabs = [
        { id: 'all', name: `전체 요약 (${foundAll}/${totalAll})`, icon: '📊' },
        { id: 'weapons', name: `무기 (${foundWeapons}/${totalWeapons})`, icon: '⚔️' },
        { id: 'armors_acc', name: `방어구 & 장신구 (${foundArmors + foundAcc}/${totalArmors + totalAcc})`, icon: '🛡️' },
        { id: 'relics', name: `유물 (${foundRelics}/${totalRelics})`, icon: '✨' },
        { id: 'monsters', name: `몬스터 & 보스 (${foundMonsters}/${totalMonsters})`, icon: '👾' }
      ];

      tabsBar.innerHTML = tabs.map(t => `
        <button class="menu-btn ${this.activeCodexTab === t.id ? 'active' : ''}" style="padding:6px 14px; font-size:12px;" onclick="UI.switchCodexTab('${t.id}')">
          ${t.icon} ${t.name}
        </button>
      `).join('');
    }

    // 3. 그리드 내용 렌더링
    const grid = document.getElementById('codex-content-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const renderCard = (title, icon, rarityDef, desc, statsText, isFound) => {
      const card = document.createElement('div');
      card.className = 'shop-item-card';
      card.style.background = isFound ? 'rgba(25, 28, 38, 0.7)' : 'rgba(10, 12, 18, 0.5)';
      card.style.border = isFound ? `1px solid ${rarityDef.color}` : '1px solid rgba(255,255,255,0.06)';
      card.style.borderRadius = '8px';
      card.style.padding = '10px';
      card.style.opacity = isFound ? '1' : '0.45';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:24px;">${isFound ? icon : '❓'}</span>
            <div>
              <div style="font-weight:bold; font-size:13px; color:${isFound ? rarityDef.color : '#888'};">
                ${isFound ? title : '??? (미발견)'}
              </div>
              <div style="font-size:10px; color:#aaa;">${isFound ? `등급: ${rarityDef.name}` : '던전 탐험 필요'}</div>
            </div>
          </div>
          ${isFound ? '<span style="color:#2ecc71; font-weight:bold; font-size:11px;">수집 완료 ✔️</span>' : '<span style="color:#666; font-size:11px;">미등록</span>'}
        </div>
        ${isFound && statsText ? `<div style="font-size:11px; color:#2ecc71; margin-bottom:4px; font-weight:600;">${statsText}</div>` : ''}
        <div style="font-size:11px; color:${isFound ? '#bbb' : '#666'}; line-height:1.4;">
          ${isFound ? desc : '던전 탐험 중 몬스터 처치 또는 상자에서 획득 시 정보가 공개됩니다.'}
        </div>
      `;
      grid.appendChild(card);
    };

    if (this.activeCodexTab === 'weapons' || this.activeCodexTab === 'all') {
      Object.values(WEAPONS).forEach(w => {
        const found = !!(codex.weapons && codex.weapons[w.id]);
        const rDef = RARITY[w.rarity] || RARITY.COMMON;
        const statsStr = `기본 공격력 +${w.baseAtk || w.baseMatk} (${DAMAGE_TYPES[w.dmgType]?.name || '물리'})`;
        renderCard(w.name, w.icon, rDef, w.desc, statsStr, found);
      });
    }

    if (this.activeCodexTab === 'armors_acc' || this.activeCodexTab === 'all') {
      Object.values(ARMORS).forEach(a => {
        const found = !!(codex.armors && codex.armors[a.id]);
        const rDef = RARITY[a.rarity] || RARITY.COMMON;
        const sList = [];
        if (a.def) sList.push(`방어 +${a.def}`);
        if (a.mdef) sList.push(`마저 +${a.mdef}`);
        if (a.maxHp) sList.push(`HP +${a.maxHp}`);
        renderCard(a.name, a.icon, rDef, `${a.slot} 부위 방어구`, sList.join(', '), found);
      });
      Object.values(ACCESSORIES).forEach(ac => {
        const found = !!(codex.accessories && codex.accessories[ac.id]);
        const rDef = RARITY[ac.rarity] || RARITY.RARE;
        const sList = [];
        if (ac.lifesteal) sList.push(`흡혈 +${Math.round(ac.lifesteal * 100)}%`);
        if (ac.critRate) sList.push(`치명타 +${Math.round(ac.critRate * 100)}%`);
        if (ac.atk) sList.push(`공격 +${ac.atk}`);
        renderCard(ac.name, ac.icon, rDef, ac.desc, sList.join(', '), found);
      });
    }

    if (this.activeCodexTab === 'relics' || this.activeCodexTab === 'all') {
      Object.values(RELICS).forEach(r => {
        const found = !!(codex.relics && codex.relics[r.id]);
        const rDef = RARITY[r.rarity] || RARITY.EPIC;
        renderCard(r.name, r.icon, rDef, r.desc, '고유 패시브 유물', found);
      });
    }

    if (this.activeCodexTab === 'monsters' || this.activeCodexTab === 'all') {
      Object.entries(MONSTERS).forEach(([mId, m]) => {
        const found = !!(codex.monsters && codex.monsters[mId]);
        renderCard(m.name, '👾', { name: '일반 적', color: '#bdc3c7' }, `서식지: ${m.type} 테마`, `체력 ${m.hp}, 공격력 ${m.atk}`, found);
      });
      Object.entries(BOSSES).forEach(([bId, b]) => {
        const found = !!(codex.bosses && codex.bosses[bId]);
        renderCard(b.name, '👑', { name: '군주(보스)', color: '#e74c3c' }, `${b.area}지역 수호 군주`, `최대 HP ${b.maxHp}, 공격력 ${b.atk}`, found);
      });
    }
  }

  switchCodexTab(tabId) {
    this.activeCodexTab = tabId;
    this.renderCodex();
    if (window.Sound) Sound.playClick();
  }

  // 모험 업적 렌더링
  renderAchievements() {
    const list = document.getElementById('achievements-list-box');
    const summaryBar = document.getElementById('achievements-summary-bar');
    if (!list) return;

    const achievements = Save.data?.achievements || {};
    const stats = Save.data?.stats || {};

    let unlockedCount = 0;
    ACHIEVEMENTS.forEach(a => {
      if (achievements[a.id]) unlockedCount++;
    });

    if (summaryBar) {
      summaryBar.innerHTML = `
        <div>총 업적 달성: <span style="color:#ffd700; font-weight:bold;">${unlockedCount} / ${ACHIEVEMENTS.length}</span></div>
        <div>달성 시 자동으로 <span style="color:#00ffff; font-weight:bold;">영혼석(💎)</span> 보상이 지급됩니다.</div>
      `;
    }

    list.innerHTML = ACHIEVEMENTS.map(ach => {
      const unlocked = !!achievements[ach.id];
      const curVal = stats[ach.statKey] || 0;
      const pct = Math.min(100, Math.round((curVal / ach.target) * 100));

      return `
        <div class="shop-item-card" style="background:${unlocked ? 'rgba(212,175,55,0.08)' : 'rgba(0,0,0,0.5)'}; border:1px solid ${unlocked ? '#d4af37' : 'rgba(255,255,255,0.08)'}; border-radius:8px; padding:10px;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:8px;">
            <div style="font-size:26px;">${ach.icon}</div>
            <div style="flex:1;">
              <div style="font-weight:bold; font-size:14px; color:${unlocked ? '#ffd700' : '#fff'};">
                ${ach.name}
              </div>
              <div style="font-size:11px; color:#aaa;">${ach.desc}</div>
            </div>
            <div style="text-align:right;">
              <span style="color:#00ffff; font-weight:bold; font-size:12px;">+${ach.reward} 💎</span>
            </div>
          </div>
          <!-- 진행도 게이지 -->
          <div style="display:flex; justify-content:space-between; font-size:10px; color:#bbb; margin-bottom:3px;">
            <span>진행률: ${curVal.toLocaleString()} / ${ach.target.toLocaleString()}</span>
            <span>${pct}%</span>
          </div>
          <div class="bar-container" style="height:6px; margin-bottom:6px;">
            <div class="bar-fill" style="width:${pct}%; background:${unlocked ? '#2ecc71' : 'linear-gradient(90deg, #d4af37, #f39c12)'};"></div>
          </div>
          <div style="text-align:right; font-size:11px; font-weight:bold; color:${unlocked ? '#2ecc71' : '#888'};">
            ${unlocked ? '👑 달성 완료 (보상 지급됨)' : '진행 중'}
          </div>
        </div>
      `;
    }).join('');
  }

  // 게임 설정 렌더링 (사운드 볼륨 및 스킬/조작 키 바인딩)
  renderSettings() {
    this.syncSettingsUI();

    const list = document.getElementById('keybind-settings-list');
    if (!list) return;
    list.innerHTML = '';
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '12px';

    const p = (window.Game && Game.player) ? Game.player : null;
    const currentWeaponSkills = p ? (p.currentSkills || p.classDef.skills) : (typeof PLAYER_CLASSES !== 'undefined' ? PLAYER_CLASSES.warrior.skills : null);

    const getSkillName = (slotKey, fallbackName) => {
      if (currentWeaponSkills && currentWeaponSkills[slotKey]) {
        return currentWeaponSkills[slotKey].name;
      }
      return fallbackName;
    };

    const getSkillIcon = (slotKey) => {
      const sDef = currentWeaponSkills ? currentWeaponSkills[slotKey] : null;
      const sId = sDef ? sDef.id : null;
      const url = this.getSkillIconUrl(sId, slotKey);
      return `<img src="${url}" style="width:20px; height:20px; object-fit:contain; image-rendering:pixelated; vertical-align:middle; border-radius:3px; margin-right:6px;">`;
    };

    const sections = [
      {
        title: '⚔️ 전투 스킬 및 액션 키',
        desc: '전투 중 즉시 발동하는 무기 스킬 및 긴급 회피 동작입니다.',
        items: [
          { id: 'skillQ', name: `스킬 1 [${getSkillName('q', '강타')}]`, customIcon: getSkillIcon('q') },
          { id: 'skillE', name: `스킬 2 [${getSkillName('e', '회전베기')}]`, customIcon: getSkillIcon('e') },
          { id: 'skillR', name: `스킬 3 [${getSkillName('r', '검기방출')}]`, customIcon: getSkillIcon('r') },
          { id: 'skillUlt', name: `궁극기 [${getSkillName('ult', '대지가르기')}]`, customIcon: getSkillIcon('ult') },
          { id: 'dash', name: '대쉬 / 긴급 회피 (Space)', customIcon: `<img src="assets/ui/skill_dash.png" style="width:20px; height:20px; object-fit:contain; image-rendering:pixelated; vertical-align:middle; border-radius:3px; margin-right:6px;">` },
          { id: 'interact', name: '상호작용 / 대화 (NPC·제단)', icon: '🔍' }
        ]
      },
      {
        title: '🧪 소비 아이템 퀵슬롯 (1~4)',
        desc: '인벤토리에서 장착한 회복 포션 및 투척 폭탄을 즉시 사용합니다.',
        items: [
          { id: 'pot1', name: '소비품 슬롯 1 (HP포션 등)', icon: '🍷' },
          { id: 'pot2', name: '소비품 슬롯 2 (MP포션 등)', icon: '🧪' },
          { id: 'pot3', name: '소비품 슬롯 3 (투척 무기)', icon: '💣' },
          { id: 'pot4', name: '소비품 슬롯 4 (비약)', icon: '✨' }
        ]
      },
      {
        title: '🧭 메뉴 및 시스템 창 단축키',
        desc: '인벤토리, 스킬 세팅창, 도감 등 편의 메뉴를 엽니다.',
        items: [
          { id: 'skills', name: '전투 스킬 세팅창 (K)', icon: '⚔️' },
          { id: 'inventory', name: '인벤토리 및 캐릭터 (I)', icon: '🎒' },
          { id: 'codex', name: '모험 도감 (B)', icon: '📖' }
        ]
      }
    ];

    sections.forEach(sec => {
      const secBox = document.createElement('div');
      secBox.style.background = 'rgba(0,0,0,0.25)';
      secBox.style.padding = '8px 12px';
      secBox.style.borderRadius = '6px';
      secBox.style.border = '1px solid rgba(255,255,255,0.06)';

      const header = document.createElement('div');
      header.style.marginBottom = '6px';
      header.innerHTML = `
        <div style="font-weight:bold; color:var(--gold-primary); font-size:12px;">${sec.title}</div>
        <div style="font-size:10px; color:#888;">${sec.desc}</div>
      `;
      secBox.appendChild(header);

      const grid = document.createElement('div');
      grid.style.display = 'grid';
      grid.style.gridTemplateColumns = '1fr 1fr';
      grid.style.gap = '6px';

      sec.items.forEach(act => {
        const curKey = Save.getKeybind(act.id);
        const isRebinding = this.rebindingAction === act.id;
        const displayKey = (!curKey || curKey === ' ') ? 'SPACE' : String(curKey).toUpperCase();

        const item = document.createElement('div');
        item.style.display = 'flex';
        item.style.justifyContent = 'space-between';
        item.style.alignItems = 'center';
        item.style.background = 'rgba(0,0,0,0.35)';
        item.style.padding = '5px 8px';
        item.style.borderRadius = '5px';
        item.style.border = isRebinding ? '1px solid #f39c12' : '1px solid rgba(255,255,255,0.05)';

        const iconHtml = act.customIcon || `<span style="margin-right:6px;">${act.icon || '⚔️'}</span>`;

        item.innerHTML = `
          <div style="display:flex; align-items:center; font-size:11px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-right:6px;">
            ${iconHtml}
            <span style="overflow:hidden; text-overflow:ellipsis;">${act.name}</span>
          </div>
          <button class="btn-buy" style="padding:3px 8px; font-size:11px; min-width:64px; background:${isRebinding ? '#e67e22' : '#333'}; color:${isRebinding ? '#fff' : '#ffd700'}; flex-shrink:0;">
            ${isRebinding ? '입력 대기' : displayKey}
          </button>
        `;

        item.querySelector('button').onclick = () => {
          this.rebindingAction = act.id;
          this.renderSettings();
        };

        grid.appendChild(item);
      });

      secBox.appendChild(grid);
      list.appendChild(secBox);
    });
  }

  // 전투 스킬 세팅 및 정보 모달 렌더링
  renderSkillsModal() {
    const grid = document.getElementById('skills-list-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const p = (window.Game && Game.player) ? Game.player : null;
    const selectedCls = (window.Game && Game.selectedClass) ? Game.selectedClass : 'warrior';
    const cDef = p ? p.classDef : (typeof PLAYER_CLASSES !== 'undefined' ? (PLAYER_CLASSES[selectedCls] || PLAYER_CLASSES.warrior) : null);
    const weaponItem = p ? (p.equipment ? p.equipment.weapon : null) : null;
    const skills = p ? (p.currentSkills || (cDef ? cDef.skills : {})) : (cDef ? cDef.skills : {});

    // 헤더 텍스트 갱신
    const classNameEl = document.getElementById('skills-class-name');
    if (classNameEl && cDef) classNameEl.innerText = `${cDef.name} (${cDef.desc || ''})`;
    const weaponNameEl = document.getElementById('skills-weapon-name');
    if (weaponNameEl) {
      if (weaponItem) {
        weaponNameEl.innerText = `${weaponItem.name} (${weaponItem.weaponType || '검'})`;
      } else {
        weaponNameEl.innerText = cDef ? `${cDef.baseWeapon || '기본 무기'}` : '기본 무기';
      }
    }

    // 기본 공격 카드
    const atkCard = document.createElement('div');
    atkCard.className = 'shop-item-card';
    atkCard.style.background = 'rgba(25, 20, 15, 0.85)';
    atkCard.style.border = '1px solid var(--border-gold)';
    atkCard.style.borderRadius = '8px';
    atkCard.style.padding = '12px';
    atkCard.style.display = 'flex';
    atkCard.style.flexDirection = 'column';
    atkCard.style.gap = '8px';
    atkCard.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div style="display:flex; align-items:center; gap:10px;">
          <img src="assets/ui/skill_atk.png" style="width:38px; height:38px; object-fit:contain; image-rendering:pixelated; border-radius:6px; border:1px solid #d4af37; background:rgba(0,0,0,0.5);">
          <div>
            <div style="font-weight:bold; font-size:14px; color:var(--gold-primary);">기본 공격 (Slash / Strike)</div>
            <div style="font-size:11px; color:#aaa;">조작: 마우스 좌클릭 (L-Click)</div>
          </div>
        </div>
        <span style="font-size:11px; background:#442b10; color:#ffd700; padding:2px 8px; border-radius:4px; border:1px solid #8b6b23;">기본 타격</span>
      </div>
      <div style="font-size:12px; color:#ddd; line-height:1.4;">
        장착한 무기를 전방으로 휘둘러 적에게 물리 및 속성 피해를 입힙니다.
      </div>
      <div style="display:flex; gap:12px; font-size:11px; color:#aaa; border-top:1px solid rgba(255,255,255,0.06); padding-top:6px;">
        <span>소모 MP: <b style="color:#00ffff;">0</b></span>
        <span>쿨다운: <b style="color:#2ecc71;">없음 (공격속도 비례)</b></span>
        <span>피해: <b style="color:#ff7675;">기본 공격력 100%</b></span>
      </div>
    `;
    grid.appendChild(atkCard);

    // 스킬 슬롯 목록 (q, e, r, ult, dash)
    const skillSlots = [
      { key: 'q', actionId: 'skillQ', defaultLabel: 'Q' },
      { key: 'e', actionId: 'skillE', defaultLabel: 'E' },
      { key: 'r', actionId: 'skillR', defaultLabel: 'R' },
      { key: 'ult', actionId: 'skillUlt', defaultLabel: 'F' },
      { key: 'dash', actionId: 'dash', defaultLabel: 'Space' }
    ];

    skillSlots.forEach(slot => {
      let sDef = skills ? skills[slot.key] : null;
      let isDash = slot.key === 'dash';

      if (isDash) {
        sDef = {
          id: 'dash',
          name: '신속 대쉬 & 긴급 회피',
          key: 'Space',
          cd: 1.2,
          mp: 0,
          type: 'PHYSICAL',
          desc: '바라보는 방향으로 빠르게 돌진하며, 0.4초간 모든 공격을 완전히 무효화하는 무적 프레임이 적용됩니다.'
        };
      }

      if (!sDef) return;

      const currentKey = Save.getKeybind(slot.actionId);
      const isRebinding = this.rebindingAction === slot.actionId;
      const displayKey = (!currentKey || currentKey === ' ') ? 'SPACE' : String(currentKey).toUpperCase();
      const iconUrl = this.getSkillIconUrl(sDef.id, slot.key);

      const typeDef = (typeof DAMAGE_TYPES !== 'undefined' && sDef.type) ? DAMAGE_TYPES[sDef.type] : null;
      const typeColor = typeDef ? typeDef.color : '#e67e22';
      const typeName = typeDef ? typeDef.name : (sDef.type || '물리');

      const card = document.createElement('div');
      card.className = 'shop-item-card';
      card.style.background = isRebinding ? 'rgba(60, 40, 10, 0.9)' : 'rgba(20, 20, 25, 0.85)';
      card.style.border = isRebinding ? '1px solid #f39c12' : '1px solid rgba(255, 215, 0, 0.25)';
      card.style.borderRadius = '8px';
      card.style.padding = '12px';
      card.style.display = 'flex';
      card.style.flexDirection = 'column';
      card.style.gap = '8px';
      card.style.transition = 'border-color 0.2s, background 0.2s';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <img src="${iconUrl}" style="width:38px; height:38px; object-fit:contain; image-rendering:pixelated; border-radius:6px; border:1px solid #d4af37; background:rgba(0,0,0,0.5);">
            <div>
              <div style="font-weight:bold; font-size:14px; color:var(--gold-glow);">${sDef.name}</div>
              <div style="font-size:11px; color:#aaa;">슬롯: [${slot.defaultLabel}] 키</div>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:6px;">
            <span style="font-size:10px; background:rgba(0,0,0,0.6); color:${typeColor}; padding:2px 6px; border-radius:4px; border:1px solid ${typeColor}88;">
              ${typeName}
            </span>
            <button class="btn-buy rebind-btn" style="padding:4px 10px; font-size:11px; min-width:68px; background:${isRebinding ? '#e67e22' : '#333'}; color:${isRebinding ? '#fff' : '#ffd700'};">
              ${isRebinding ? '입력 대기' : `키: ${displayKey}`}
            </button>
          </div>
        </div>

        <div style="font-size:12px; color:#ddd; line-height:1.4;">
          ${sDef.desc || '강력한 전투 기술입니다.'}
        </div>

        <div style="display:flex; gap:12px; font-size:11px; color:#aaa; border-top:1px solid rgba(255,255,255,0.06); padding-top:6px; flex-wrap:wrap;">
          <span>소모 MP: <b style="color:#00ffff;">${sDef.mp || 0}</b></span>
          <span>쿨다운: <b style="color:#2ecc71;">${sDef.cd ? sDef.cd.toFixed(1) : 0}s</b></span>
          ${sDef.dmgMul ? `<span>피해 계수: <b style="color:#ff7675;">${Math.round(sDef.dmgMul * 100)}%</b></span>` : ''}
        </div>
      `;

      card.querySelector('.rebind-btn').onclick = () => {
        this.rebindingAction = slot.actionId;
        this.renderSkillsModal();
        this.renderSettings();
      };

      grid.appendChild(card);
    });
  }
}

const UI = new UIManager();
window.UI = UI;
