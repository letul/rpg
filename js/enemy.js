// ===== 2D 도트 몬스터, 엘리트, 보스 AI 및 전투 동작 시스템 =====

class Enemy {
  constructor(monsterDef, isElite = false, isBoss = false, area = 1, spawnX = 400, spawnY = 300) {
    this.isEnemy = true;
    this.def = typeof monsterDef === 'string' ? (BOSSES[monsterDef] || MONSTERS[monsterDef] || { hp: 100, atk: 20, def: 5, spd: 2.5, name: monsterDef }) : monsterDef;
    this.isElite = isElite;
    this.isBoss = isBoss;
    this.area = area;

    // 2D 위치 및 크기
    this.x = spawnX;
    this.y = spawnY;
    this.radius = this.isBoss ? 45 : (this.isElite ? 22 : 14);
    this.animOffset = Math.random() * 1000;
    this.hurtTimer = 0;

    // 난이도 스케일링 배율
    const diffMod = (window.Game && typeof window.Game.getDifficultyMod === 'function') 
      ? window.Game.getDifficultyMod() 
      : { hpMul: 1.0, atkMul: 1.0, defMul: 1.0, spdMul: 1.0, expMul: 1.0, goldMul: 1.0 };

    // 스탯 스케일링
    const scale = 1.0 + (area - 1) * 0.4;
    this.stats = {
      hp: Math.round(this.def.hp * scale * diffMod.hpMul),
      maxHp: Math.round(this.def.hp * scale * diffMod.hpMul),
      atk: Math.round(this.def.atk * scale * diffMod.atkMul),
      matk: Math.round((this.def.matk || this.def.atk) * scale * diffMod.atkMul),
      def: Math.round(this.def.def * (1 + (area - 1) * 0.15) * diffMod.defMul),
      mdef: Math.round((this.def.mdef || this.def.def) * (1 + (area - 1) * 0.15) * diffMod.defMul),
      spd: (this.def.spd || 2.5) * diffMod.spdMul,
      dodge: 0.03,
      critRate: 0.05,
      critDmg: 1.5
    };

    this.exp = Math.round(this.def.exp * scale * diffMod.expMul);
    this.gold = Math.round(this.def.gold * scale * diffMod.goldMul);
    this.soulStones = this.def.soulStones || 0;

    // 엘리트 오라 수식어
    this.modifier = null;
    if (this.isElite) {
      this.modifier = ELITE_MODIFIERS[Math.floor(Math.random() * ELITE_MODIFIERS.length)];
      this.stats.hp = Math.round(this.stats.hp * this.modifier.hpMul);
      this.stats.maxHp = this.stats.hp;
      this.stats.atk = Math.round(this.stats.atk * this.modifier.atkMul);
      this.exp *= 3;
      this.gold *= 3;
    }

    // 보스 페이즈
    if (this.isBoss) {
      this.bossPhase = 1;
      this.skillTimer = 0;
      this.nextSkillInterval = 3.5;
    }

    this.attackCooldown = 0;
    this.contactCooldown = 0;
    this.lungeTimer = 0;
    this.statusEffects = {};

    // 부드러운 물리 이동 및 보행 애니메이션 속성
    this.vx = 0;
    this.vy = 0;
    this.lungeVx = 0;
    this.lungeVy = 0;
    this.facingLeft = false;
    this.walkAnimTimer = 0;
  }

  hasStatus(key) {
    return !!(this.statusEffects && this.statusEffects[key]);
  }

  // 매 프레임 업데이트 (부드러운 연속 이동 보간, 돌진 임펄스 감쇠, 몬스터 간 군집 분리, 장애물 회피)
  update(dt, player, mapBounds, obstacles, hazards, enemies = null) {
    if (this.stats.hp <= 0) return;

    Combat.updateStatuses(this, dt);
    if (this.hurtTimer > 0) this.hurtTimer -= dt;
    if (this.attackCooldown > 0) this.attackCooldown -= dt;
    if (this.contactCooldown > 0) this.contactCooldown -= dt;
    if (this.lungeTimer > 0) this.lungeTimer -= dt;
    if (this.hazardCooldown > 0) this.hazardCooldown -= dt;

    // 돌진 물리 임펄스 부드러운 감쇠
    const lungeDecay = Math.exp(-6.5 * dt);
    this.lungeVx *= lungeDecay;
    this.lungeVy *= lungeDecay;

    if (this.hasStatus('freeze') || this.hasStatus('stun')) {
      this.vx = 0;
      this.vy = 0;
      return;
    }

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.max(0.001, Math.hypot(dx, dy));

    const isHard = window.Game && window.Game.difficulty === 'hard';
    const speedMult = isHard ? 80 : 42;
    let speed = this.stats.spd * speedMult;
    if (this.hasStatus('slow')) speed *= 0.5;

    // 공포 상태이상
    if (this.hasStatus('fear')) {
      const fearVx = -(dx / dist) * speed;
      const fearVy = -(dy / dist) * speed;
      this.vx += (fearVx - this.vx) * Math.min(1.0, dt * 8);
      this.vy += (fearVy - this.vy) * Math.min(1.0, dt * 8);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (Math.abs(this.vx) > 3) this.facingLeft = this.vx < 0;
      return;
    }

    // 1. Sephiria/Dungreed식 몬스터 접촉 피해 (몸통 박치기)
    const touchDist = this.radius + player.radius + 6;
    const dmgType = this.def.dmgType || (this.modifier ? this.modifier.aura : 'PHYSICAL');
    if (dist < touchDist && this.contactCooldown <= 0) {
      this.contactCooldown = isHard ? 0.35 : 0.65;
      Combat.calculateDamage(this, player, isHard ? 1.4 : 0.8, dmgType);
    }

    // 2. 근접 몬스터 기습 도약 돌진 (순간이동 없이 연속 물리 속도 임펄스 적용)
    if (!this.def.isRanged && dist < 140 && dist > 45 && this.attackCooldown <= 0 && this.lungeTimer <= 0) {
      this.lungeTimer = isHard ? 0.9 : 2.0;
      this.attackCooldown = isHard ? 0.45 : 1.0;
      const lungeSpd = speed * 2.2;
      this.lungeVx = (dx / dist) * lungeSpd;
      this.lungeVy = (dy / dist) * lungeSpd;
      if (window.Game && window.Game.renderer) {
        window.Game.renderer.ghostTrails.push({
          x: this.x, y: this.y, life: 0.25, maxLife: 0.25,
          color: this.modifier ? this.modifier.color : '#e74c3c'
        });
      }
    }

    const attackRange = this.def.isRanged ? 250 : 64;
    let targetVx = 0;
    let targetVy = 0;

    if (dist > attackRange) {
      // 플레이어 추적 연속 속도
      targetVx = (dx / dist) * speed;
      targetVy = (dy / dist) * speed;
    } else {
      // 공격 실행
      if (this.attackCooldown <= 0) {
        this.performAttack(player, dist, dx, dy);
      }
      targetVx = (dx / dist) * (speed * 0.15);
      targetVy = (dy / dist) * (speed * 0.15);
    }

    // 몬스터 간 부드러운 군집 분리 (Soft Boids Separation: 겹침 방지 및 부드러운 우회)
    if (enemies && Array.isArray(enemies)) {
      for (let i = 0; i < enemies.length; i++) {
        const other = enemies[i];
        if (other === this || !other || (other.stats && other.stats.hp <= 0)) continue;
        const edx = this.x - other.x;
        const edy = this.y - other.y;
        const edist = Math.hypot(edx, edy);
        const minDist = this.radius + other.radius + 6;
        if (edist < minDist && edist > 0.001) {
          const push = ((minDist - edist) / minDist) * (speed * 0.75);
          targetVx += (edx / edist) * push;
          targetVy += (edy / edist) * push;
        }
      }
    }

    // 연속 속도 보간 (Lerp) 및 좌표 적분 (dt 기반 부드러운 프레임 독립 이동)
    const lerpFactor = Math.min(1.0, dt * 10);
    this.vx += (targetVx - this.vx) * lerpFactor;
    this.vy += (targetVy - this.vy) * lerpFactor;

    this.x += (this.vx + this.lungeVx) * dt;
    this.y += (this.vy + this.lungeVy) * dt;

    // 이동 방향에 맞춘 좌우 반전 및 보행 애니메이션 누적
    const totalSpd = Math.hypot(this.vx + this.lungeVx, this.vy + this.lungeVy);
    if (Math.abs(this.vx + this.lungeVx) > 4) {
      this.facingLeft = (this.vx + this.lungeVx) < 0;
    } else if (Math.abs(dx) > 6) {
      this.facingLeft = dx < 0;
    }
    if (totalSpd > 6) {
      this.walkAnimTimer += dt * (totalSpd / 16);
    }

    // 장애물(돌기둥, 배럴) 충돌 처리
    if (obstacles) {
      obstacles.forEach(ob => {
        const d = Math.max(0.001, Math.hypot(this.x - ob.x, this.y - ob.y));
        const minDist = this.radius + ob.radius;
        if (d < minDist) {
          const overlap = minDist - d;
          this.x += ((this.x - ob.x) / d) * overlap;
          this.y += ((this.y - ob.y) / d) * overlap;
        }
      });
    }

    // 함정 밟았을 때 몬스터도 피해
    if (hazards && (!this.hazardCooldown || this.hazardCooldown <= 0)) {
      hazards.forEach(h => {
        if (h.isActive && Math.hypot(this.x - h.x, this.y - h.y) < this.radius + h.size / 2) {
          this.hazardCooldown = 1.0;
          this.stats.hp -= 30;
          Combat.showFloatingText(this, '⚠️ 30', 'dmg', '#ff4757');
          this.hurtTimer = 0.16;
        }
      });
    }

    // 맵 경계 제한
    if (mapBounds) {
      this.x = Math.max(mapBounds.x + 24, Math.min(mapBounds.x + mapBounds.width - 24, this.x));
      this.y = Math.max(mapBounds.y + 24, Math.min(mapBounds.y + mapBounds.height - 24, this.y));
    }

    // 보스 스킬 패턴
    if (this.isBoss) {
      this.updateBossSkills(dt, player, dist);
    }
  }

  // 공격 수행 (지옥 난이도 5갈래 고속 산탄 & 8방향 링 탄막 난사)
  performAttack(player, dist, dx, dy) {
    const diffMod = (window.Game && typeof window.Game.getDifficultyMod === 'function') 
      ? window.Game.getDifficultyMod() 
      : { atkSpdMul: 1.0 };
    const atkSpdMul = diffMod.atkSpdMul || 1.0;
    const isHard = window.Game && window.Game.difficulty === 'hard';
    this.attackCooldown = (this.def.isRanged ? 1.4 : 0.75) / atkSpdMul;
    const dmgType = this.def.dmgType || (this.modifier ? this.modifier.aura : 'PHYSICAL');

    if (this.def.isRanged) {
      const angle = Math.atan2(dy, dx);
      if (atkSpdMul >= 1.8) {
        if (this.isElite) {
          // 엘리트 몬스터: 8방향 전방위 탄막 난사!
          for (let i = 0; i < 8; i++) {
            const a = (Math.PI * 2 / 8) * i;
            Game.spawnProjectile(this.x, this.y, a, dmgType, this, 1.4, 12.0);
          }
        } else {
          // 악몽 지옥 난이도 일반 원거리: 5갈래 부채꼴 고속 산탄 탄막!
          for (let off of [-0.42, -0.21, 0, 0.21, 0.42]) {
            Game.spawnProjectile(this.x, this.y, angle + off, dmgType, this, 1.3, 12.0);
          }
        }
      } else {
        Game.spawnProjectile(this.x, this.y, angle, dmgType, this, 1.0, 7.5);
      }
    } else {
      if (dist < 72) {
        Combat.calculateDamage(this, player, isHard ? 1.5 : 1.0, dmgType);
      }
    }
  }

  // 보스 전용 스킬 패턴
  updateBossSkills(dt, player, dist) {
    this.skillTimer += dt;
    const diffMod = (window.Game && typeof window.Game.getDifficultyMod === 'function') ? window.Game.getDifficultyMod() : null;
    const interval = (diffMod && diffMod.bossSkillCd) ? diffMod.bossSkillCd : (this.nextSkillInterval || 3.5);

    if (this.def.id === 'demon_king') {
      const hpRatio = this.stats.hp / this.stats.maxHp;
      if (hpRatio <= 0.35 && this.bossPhase < 3) {
        this.bossPhase = 3;
        this.stats.atk *= 1.5;
        this.stats.spd *= 1.4;
        Combat.showFloatingText(this, '👑 마왕 폭주 3페이즈 돌입!!', 'crit', '#e74c3c');
        if (window.UI) UI.showToast('마왕이 광기에 휩싸였습니다! 공격력과 속도가 폭증합니다!');
      } else if (hpRatio <= 0.7 && this.bossPhase < 2) {
        this.bossPhase = 2;
        Combat.showFloatingText(this, '👑 마왕 2페이즈 돌입!', 'crit', '#8e44ad');
        Game.spawnMinionsNear(this.x, this.y, 'demon', 4);
      }
    }

    if (this.skillTimer >= interval) {
      this.skillTimer = 0;
      this.triggerBossSkill(player, dist);
    }
  }

  triggerBossSkill(player, dist) {
    const isHard = window.Game && window.Game.difficulty === 'hard';
    Combat.showFloatingText(this, `⚡ 보스 파멸기 폭발!`, 'buff', '#ffd700');

    if (this.def.id === 'goblin_king' || this.def.id === 'forest_boss') {
      Game.triggerAoeExplosion(player.x, player.y, isHard ? 140 : 90, isHard ? 2.5 : 1.5, 'PHYSICAL', this);
      Combat.applyStatus(player, 'stun', isHard ? 2.0 : 1.2);
      if (isHard) {
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI * 2 / 6) * i;
          Game.spawnProjectile(this.x, this.y, a, 'POISON', this, 1.4, 9.0);
        }
      }
    } else if (this.def.id === 'abyss_witch' || this.def.id === 'cave_boss') {
      Game.triggerAoeExplosion(this.x, this.y, isHard ? 160 : 110, isHard ? 2.8 : 1.8, 'PHYSICAL', this);
      if (isHard) {
        Game.triggerAoeExplosion(player.x, player.y, 110, 2.0, 'COLD', this);
      }
    } else if (this.def.id === 'cursed_knight' || this.def.id === 'ruins_boss') {
      const angle = Math.atan2(player.y - this.y, player.x - this.x);
      const angles = isHard ? [-0.6, -0.3, 0, 0.3, 0.6] : [-0.3, 0, 0.3];
      for (let offset of angles) {
        Game.spawnProjectile(this.x, this.y, angle + offset, 'DARK', this, isHard ? 2.2 : 1.5, 10.0);
      }
    } else if (this.def.id === 'ancient_dragon' || this.def.id === 'hell_boss') {
      Game.triggerAoeExplosion(player.x, player.y, isHard ? 180 : 120, isHard ? 3.0 : 2.0, 'FIRE', this);
      if (isHard) {
        for (let i = 0; i < 8; i++) {
          const a = (Math.PI * 2 / 8) * i;
          Game.spawnProjectile(this.x, this.y, a, 'FIRE', this, 1.8, 9.0);
        }
      }
    } else if (this.def.id === 'void_lord' || this.def.id === 'demon_king' || this.def.id === 'demon_boss') {
      this.x = player.x + (Math.random() - 0.5) * 160;
      this.y = player.y + (Math.random() - 0.5) * 160;
      Game.triggerAoeExplosion(player.x, player.y, isHard ? 220 : 140, isHard ? 3.8 : 2.4, 'DARK', this);
      if (isHard) {
        for (let i = 0; i < 12; i++) {
          const a = (Math.PI * 2 / 12) * i;
          Game.spawnProjectile(this.x, this.y, a, 'DARK', this, 2.2, 10.0);
        }
      }
    }
  }
}

window.Enemy = Enemy;
