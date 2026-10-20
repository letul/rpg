// ===== 전투 계산식, 8가지 속성, 10가지 상태이상 처리 시스템 =====

const Combat = {
  calculateDamage(attacker, defender, baseMultiplier = 1.0, damageType = 'PHYSICAL', isSkill = false) {
    // 0. 무적 판정
    if (defender.isPlayer && defender.invincibleTimer > 0) {
      this.showFloatingText(defender, '☀️ 무적', 'barrier', '#ffd700');
      return { damage: 0, isCrit: false, isDodge: true };
    }

    // 1. 회피율 판정 (최대 50% 상한선)
    const dodgeChance = Math.min(0.50, defender.stats.dodge || 0);
    if (Math.random() < dodgeChance) {
      this.showFloatingText(defender, 'MISS', 'miss');
      return { damage: 0, isCrit: false, isDodge: true };
    }

    // 2. 공격력/마법력 산정
    const isMagic = ['FIRE', 'COLD', 'LIGHTNING', 'DARK', 'HOLY'].includes(damageType);
    let rawPower = isMagic ? (attacker.stats.matk || 20) : (attacker.stats.atk || 20);
    rawPower *= baseMultiplier;

    if (attacker.buffs && attacker.buffs.atkBuff) rawPower *= 1.5;
    if (attacker.hasStatus && attacker.hasStatus('weaken')) rawPower *= 0.7;

    if (attacker.isPlayer) {
      if (attacker.getRelicCount) {
        const bp = attacker.getRelicCount('blood_pact');
        if (bp > 0) rawPower *= (1.0 + 0.8 * bp);

        const sm = attacker.getRelicCount('specter_mask');
        if (sm > 0 && (attacker.stats.hp / attacker.stats.maxHp <= 0.35)) {
          rawPower *= (1.0 + 1.2 * sm);
        }
      }

      // 특성 효과 (처형자, 거인 학살자, 광전사의 혼)
      if (attacker.perks) {
        const execCount = attacker.perks.filter(p => p.id === 'p_executioner').length;
        if (execCount > 0 && defender.stats && (defender.stats.hp / defender.stats.maxHp <= 0.4)) {
          rawPower *= (1.0 + 0.5 * execCount);
        }

        const gsCount = attacker.perks.filter(p => p.id === 'p_giant_slayer').length;
        if (gsCount > 0 && (defender.isBoss || defender.isElite)) {
          rawPower *= (1.0 + 0.4 * gsCount);
        }

        const bzCount = attacker.perks.filter(p => p.id === 'p_berserk').length;
        if (bzCount > 0) {
          const lostHpRatio = 1.0 - (attacker.stats.hp / attacker.stats.maxHp);
          rawPower *= (1.0 + lostHpRatio * 0.8 * bzCount);
        }
      }
    }

    // 3. 치명타 판정
    const critRate = attacker.stats.critRate || 0.05;
    const isCrit = Math.random() < critRate;
    if (isCrit) {
      rawPower *= (attacker.stats.critDmg || 1.5);
    }

    // 4. 방어력/마법저항 공식 (악몽 지옥 몬스터는 플레이어 방어력 50% 관통!)
    let targetDef = defender.stats.def || 0;
    let targetMdef = defender.stats.mdef || 0;
    if (defender.hasStatus && defender.hasStatus('armorBreak')) {
      targetDef *= 0.6;
      targetMdef *= 0.6;
    }
    if (attacker.stats && attacker.stats.penetration) {
      const pen = Math.min(0.85, attacker.stats.penetration);
      targetDef *= (1 - pen);
      targetMdef *= (1 - pen);
    }
    if (attacker.isEnemy && window.Game && window.Game.difficulty === 'hard') {
      targetDef *= 0.5;
      targetMdef *= 0.5;
    }

    let finalDamage = 0;
    if (damageType === 'DARK') {
      finalDamage = rawPower;
    } else if (isMagic) {
      finalDamage = rawPower * 100 / (100 + targetMdef);
    } else {
      finalDamage = rawPower * 100 / (100 + targetDef);
    }

    if (damageType === 'HOLY' && defender.isUndead) finalDamage *= 2.0;

    // 수호 유물 피해 감소 배율 (이지스의 방패, 거신의 심장)
    if (defender.isPlayer && defender.getRelicCount) {
      const aegisCount = defender.getRelicCount('aegis_of_immortality');
      if (aegisCount > 0) finalDamage *= Math.pow(0.75, aegisCount);

      const colCount = defender.getRelicCount('heart_of_colossus');
      if (colCount > 0) finalDamage *= Math.pow(0.80, colCount);
    }

    // 악몽 지옥 난이도: 플레이어가 몬스터에게 피격 시 대미지 2.2배 추가 증폭!
    if (defender.isPlayer && window.Game && window.Game.difficulty === 'hard') {
      finalDamage = Math.round(finalDamage * 2.2);
    }

    finalDamage = Math.max(1, Math.round(finalDamage));

    // 섭리의 눈 (치명타 시 100% 관통 폭발 트루 데미지)
    if (attacker.isPlayer && isCrit && attacker.getRelicCount) {
      const eyeCount = attacker.getRelicCount('eye_of_providence');
      if (eyeCount > 0) {
        const trueDmg = Math.round(rawPower * 0.8 * eyeCount);
        finalDamage += trueDmg;
        this.showFloatingText(defender, `👁️+${trueDmg}`, 'crit', '#00d2d3');
      }
    }

    // 제압의 일격 특성 (p_overpower)
    if (attacker.isPlayer && attacker.perks) {
      const opCount = attacker.perks.filter(p => p.id === 'p_overpower').length;
      if (opCount > 0) {
        this.applyStatus(defender, 'slow', 3.0);
        this.applyStatus(defender, 'weaken', 3.0);
      }
    }

    // 5. 보호막 감산
    if (defender.barrier && defender.barrier > 0) {
      if (defender.barrier >= finalDamage) {
        defender.barrier -= finalDamage;
        this.showFloatingText(defender, `🛡️ ${finalDamage}`, 'barrier');
        return { damage: finalDamage, isCrit, isDodge: false };
      } else {
        finalDamage -= defender.barrier;
        defender.barrier = 0;
      }
    }

    defender.stats.hp -= finalDamage;
    if (defender.stats.hp <= 0) {
      defender.stats.hp = 0;
      if (defender.isPlayer && window.Game && window.Game.isRunning) {
        window.Game.onPlayerDeath();
        return { damage: finalDamage, isCrit, isDodge: false };
      }
    }

    // 피격 모션 타이머 부여
    defender.hurtTimer = 0.16;

    // 처치 시 사신의 낫 / 영혼 수확자 누적 스택
    if (defender.stats.hp <= 0 && attacker.isPlayer) {
      if (attacker.getRelicCount) {
        const scytheCount = attacker.getRelicCount('reaper_scythe_relic');
        if (scytheCount > 0) {
          attacker.baseStats.atk += 2 * scytheCount;
          attacker.recalculateStats();
        }
      }
      if (attacker.perks) {
        const srCount = attacker.perks.filter(p => p.id === 'p_soul_reaper').length;
        if (srCount > 0) {
          attacker.baseStats.atk += 1 * srCount;
          attacker.baseStats.matk += 1 * srCount;
          attacker.recalculateStats();
        }
      }
    }

    // 6. 흡혈 처리 (사망 상태 불가, 악몽 지옥 난이도 70% 감소 패널티 & 단일 타격당 최대 체력 8% 캡)
    const lifesteal = attacker.stats.lifesteal || 0;
    if (lifesteal > 0 && finalDamage > 0 && attacker.stats.hp > 0) {
      const isHard = window.Game && window.Game.difficulty === 'hard';
      const stealMul = isHard ? 0.3 : 1.0;
      let healAmt = Math.round(finalDamage * lifesteal * stealMul);
      if (attacker.isPlayer) {
        healAmt = Math.min(healAmt, Math.round(attacker.stats.maxHp * 0.08));
      }
      this.heal(attacker, healAmt);
    }

    // 7. 플로팅 텍스트 출력
    const dmgColor = DAMAGE_TYPES[damageType] ? DAMAGE_TYPES[damageType].color : '#fff';
    this.showFloatingText(defender, finalDamage, isCrit ? 'crit' : 'dmg', dmgColor);

    if (window.Sound) Sound.playHit(isCrit);

    // 8. 속성 효과 적용
    this.applyElementalEffects(attacker, defender, damageType);

    // 타격 파티클 생성
    if (window.Game && window.Game.renderer) {
      window.Game.renderer.addParticle(defender.x, defender.y, dmgColor, isCrit ? 8 : 4);
    }

    // 피격 화면 흔들림
    if (defender.isPlayer && Save.data.settings.screenShake && document.body) {
      document.body.classList.add('screen-shake');
      setTimeout(() => { if (document.body) document.body.classList.remove('screen-shake'); }, 200);
    }

    return { damage: finalDamage, isCrit, isDodge: false };
  },

  applyElementalEffects(attacker, defender, damageType) {
    if (!defender || defender.stats.hp <= 0) return;

    if (damageType === 'FIRE' || (attacker.isPlayer && attacker.hasRelic && attacker.hasRelic('flame_heart'))) {
      const fc = attacker.getRelicCount ? Math.max(1, attacker.getRelicCount('flame_heart')) : 1;
      this.applyStatus(defender, 'burn', 4.0, (attacker.stats.matk || 20) * 0.25 * fc);
    } else if (damageType === 'COLD') {
      this.applyStatus(defender, 'slow', 3.0);
      if (Math.random() < 0.25 || (attacker.hasRelic && attacker.hasRelic('frozen_heart'))) {
        this.applyStatus(defender, 'freeze', 2.0);
      }
    } else if (damageType === 'POISON') {
      this.applyStatus(defender, 'poison', 5.0, (attacker.stats.atk || 20) * 0.2);
    } else if (damageType === 'LIGHTNING' || (attacker.isPlayer && attacker.hasRelic && attacker.hasRelic('lightning_heart'))) {
      if (window.Game && window.Game.enemies) {
        let chained = 0;
        const lc = attacker.getRelicCount ? Math.max(1, attacker.getRelicCount('lightning_heart')) : 1;
        const maxChain = 3 + lc * 2;
        window.Game.enemies.forEach(enemy => {
          if (enemy !== defender && enemy.stats.hp > 0 && chained < maxChain) {
            const d = Math.hypot(enemy.x - defender.x, enemy.y - defender.y);
            if (d < 160) {
              const chainDmg = Math.round((attacker.stats.matk || 20) * 0.6 * lc);
              enemy.stats.hp -= chainDmg;
              this.showFloatingText(enemy, `⚡${chainDmg}`, 'dmg', '#f1c40f');
              chained++;
            }
          }
        });
      }
    }
  },

  applyStatus(target, statusKey, duration = 3.0, dotDamage = 0) {
    if (!target.statusEffects) target.statusEffects = {};
    const effectDef = STATUS_EFFECTS[statusKey];
    if (!effectDef) return;

    target.statusEffects[statusKey] = {
      duration: duration,
      maxDuration: duration,
      dotDamage: dotDamage,
      timer: 0
    };

    if (window.UI && target.isPlayer) {
      window.UI.updateStatusBadges(target);
    }
  },

  updateStatuses(target, dt) {
    if (!target.statusEffects) return;

    for (const [key, effect] of Object.entries(target.statusEffects)) {
      effect.duration -= dt;
      effect.timer += dt;

      const interval = STATUS_EFFECTS[key].interval || 1.0;
      if (effect.dotDamage > 0 && effect.timer >= interval) {
        effect.timer = 0;
        const tickDmg = Math.max(1, Math.round(effect.dotDamage));
        target.stats.hp -= tickDmg;
        this.showFloatingText(target, `${STATUS_EFFECTS[key].icon} ${tickDmg}`, 'dmg', STATUS_EFFECTS[key].color);
        if (target.stats.hp <= 0) target.stats.hp = 0;
      }

      if (effect.duration <= 0) {
        delete target.statusEffects[key];
        if (window.UI && target.isPlayer) {
          window.UI.updateStatusBadges(target);
        }
      }
    }
  },

  heal(target, amount) {
    if (target.stats.hp <= 0) return;
    if (target.isPlayer && window.Game && window.Game.difficulty === 'hard') {
      // 악몽 지옥 난이도: 회복량 50% 반감 페널티
      amount = Math.max(1, Math.round(amount * 0.5));
    }
    target.stats.hp = Math.min(target.stats.maxHp, target.stats.hp + amount);
    this.showFloatingText(target, `+${amount}`, 'heal');
    if (window.Sound) Sound.playPotion();
  },

  showFloatingText(target, text, type = 'dmg', color = '#fff') {
    if (!Save.data.settings.showDmgText) return;
    const container = document.getElementById('game-container');
    if (!container) return;

    // 최대 12개 제한으로 DOM 폭주 및 브라우저 렉 완전 방지
    const current = container.getElementsByClassName('floating-dmg');
    if (current.length > 12) {
      current[0].remove();
    }

    const el = document.createElement('div');
    el.className = `floating-dmg ${type}`;
    el.innerText = text;
    if (color && type !== 'crit' && type !== 'heal') {
      el.style.color = color;
    }

    // 월드 좌표 -> 카메라 줌 & 오프셋 화면 좌표 변환
    let screenX = target.x || 500;
    let screenY = (target.y || 350) - 24;
    if (window.Game && window.Game.camera) {
      const z = window.Game.camera.zoom || 1.15;
      const camX = window.Game.camera.x || 0;
      const camY = window.Game.camera.y || 0;
      screenX = (screenX - camX) * z;
      screenY = (screenY - camY) * z;
    }
    el.style.left = `${Math.round(screenX)}px`;
    el.style.top = `${Math.round(screenY)}px`;

    container.appendChild(el);
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 700);
  }
};

window.Combat = Combat;
