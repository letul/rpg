// ===== Three.js 기반 3D 절차적 모델 및 시각 효과 생성기 =====

const Models = {
  // 재질 캐시
  materials: {},

  getMat(color, roughness = 0.5, metalness = 0.2, emissive = 0x000000) {
    const key = `${color}_${roughness}_${metalness}_${emissive}`;
    if (!this.materials[key]) {
      this.materials[key] = new THREE.MeshStandardMaterial({
        color: color,
        roughness: roughness,
        metalness: metalness,
        emissive: emissive,
        emissiveIntensity: emissive !== 0x000000 ? 0.6 : 0
      });
    }
    return this.materials[key];
  },

  // 1. 플레이어 3D 모델 (클래스별 외형 차별화)
  createPlayerMesh(classId) {
    const group = new THREE.Group();

    // 몸체 (원통/박스)
    const bodyMat = this.getMat(
      classId === 'warrior' ? 0x95a5a6 :
      classId === 'assassin' ? 0x2c3e50 :
      classId === 'mage' ? 0x2980b9 :
      classId === 'archer' ? 0x27ae60 :
      classId === 'paladin' ? 0xf1c40f : 0x8e44ad,
      0.4, 0.4
    );
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.45, 1.0, 8);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.85;
    body.castShadow = true;
    group.add(body);

    // 머리
    const headMat = this.getMat(0xffdbac, 0.6, 0.1);
    const headGeo = new THREE.SphereGeometry(0.32, 12, 12);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.55;
    head.castShadow = true;
    group.add(head);

    // 투구 / 모자 장식
    if (classId === 'mage') {
      const coneGeo = new THREE.ConeGeometry(0.45, 0.7, 8);
      const hat = new THREE.Mesh(coneGeo, this.getMat(0x1a5276));
      hat.position.y = 1.95;
      group.add(hat);
    } else if (classId === 'warrior' || classId === 'paladin') {
      const helmGeo = new THREE.BoxGeometry(0.5, 0.3, 0.5);
      const helm = new THREE.Mesh(helmGeo, this.getMat(0x7f8c8d, 0.3, 0.8));
      helm.position.y = 1.6;
      group.add(helm);
    }

    // 무기 파츠 (오른손)
    const weaponGroup = new THREE.Group();
    weaponGroup.position.set(0.55, 0.85, 0.2);
    if (classId === 'warrior' || classId === 'paladin') {
      // 검
      const bladeGeo = new THREE.BoxGeometry(0.08, 0.9, 0.2);
      const blade = new THREE.Mesh(bladeGeo, this.getMat(0xbdc3c7, 0.2, 0.9));
      blade.position.y = 0.45;
      weaponGroup.add(blade);
    } else if (classId === 'mage' || classId === 'summoner') {
      // 지팡이
      const staffGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6);
      const staff = new THREE.Mesh(staffGeo, this.getMat(0x795548));
      staff.position.y = 0.5;
      const orbGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const orb = new THREE.Mesh(orbGeo, this.getMat(classId === 'mage' ? 0x00d2d3 : 0x9b59b6, 0.1, 0.1, classId === 'mage' ? 0x00d2d3 : 0x9b59b6));
      orb.position.y = 1.25;
      staff.add(orb);
      weaponGroup.add(staff);
    } else if (classId === 'archer') {
      // 활
      const bowGeo = new THREE.TorusGeometry(0.4, 0.03, 6, 12, Math.PI);
      const bow = new THREE.Mesh(bowGeo, this.getMat(0x8d6e63));
      bow.rotation.y = Math.PI / 2;
      bow.position.y = 0.4;
      weaponGroup.add(bow);
    } else {
      // 암살자 단검
      const daggerGeo = new THREE.BoxGeometry(0.06, 0.5, 0.12);
      const dagger = new THREE.Mesh(daggerGeo, this.getMat(0x34495e, 0.2, 0.9));
      dagger.position.y = 0.25;
      weaponGroup.add(dagger);
    }
    group.add(weaponGroup);
    group.weaponMesh = weaponGroup;

    // 성기사 방패
    if (classId === 'paladin') {
      const shieldGeo = new THREE.BoxGeometry(0.1, 0.6, 0.4);
      const shield = new THREE.Mesh(shieldGeo, this.getMat(0xd4af37, 0.3, 0.7));
      shield.position.set(-0.5, 0.85, 0.2);
      group.add(shield);
    }

    return group;
  },

  // 2. 몬스터 3D 모델
  createMonsterMesh(monsterDef, isElite = false) {
    const group = new THREE.Group();
    const color = monsterDef.color || 0xe74c3c;
    const baseMat = this.getMat(color, 0.6, 0.1);

    if (monsterDef.name.includes('슬라임')) {
      const geo = new THREE.SphereGeometry(0.55, 12, 10);
      geo.scale(1, 0.75, 1);
      const mesh = new THREE.Mesh(geo, baseMat);
      mesh.position.y = 0.4;
      mesh.castShadow = true;
      group.add(mesh);
    } else if (monsterDef.name.includes('골렘')) {
      const torsoGeo = new THREE.BoxGeometry(1.0, 1.2, 0.7);
      const torso = new THREE.Mesh(torsoGeo, baseMat);
      torso.position.y = 1.0;
      torso.castShadow = true;
      group.add(torso);
      const headGeo = new THREE.BoxGeometry(0.5, 0.45, 0.5);
      const head = new THREE.Mesh(headGeo, this.getMat(0x566573));
      head.position.y = 1.8;
      group.add(head);
    } else if (monsterDef.name.includes('늑대') || monsterDef.name.includes('견') || monsterDef.name.includes('멧돼지')) {
      const bodyGeo = new THREE.BoxGeometry(0.6, 0.6, 1.2);
      const body = new THREE.Mesh(bodyGeo, baseMat);
      body.position.y = 0.5;
      body.castShadow = true;
      group.add(body);
      const headGeo = new THREE.ConeGeometry(0.3, 0.5, 6);
      const head = new THREE.Mesh(headGeo, baseMat);
      head.rotation.x = Math.PI / 2;
      head.position.set(0, 0.7, 0.7);
      group.add(head);
    } else {
      // 일반형 (해골, 악마, 기사, 고블린 등)
      const bodyGeo = new THREE.CylinderGeometry(0.3, 0.4, 0.9, 6);
      const body = new THREE.Mesh(bodyGeo, baseMat);
      body.position.y = 0.75;
      body.castShadow = true;
      group.add(body);
      const headGeo = new THREE.SphereGeometry(0.28, 8, 8);
      const head = new THREE.Mesh(headGeo, this.getMat(0xecf0f1));
      head.position.y = 1.35;
      group.add(head);
    }

    // 엘리트 몬스터 시각 효과 (크기 1.3배 + 오라 링)
    if (isElite) {
      group.scale.set(1.35, 1.35, 1.35);
      const ringGeo = new THREE.RingGeometry(0.8, 0.95, 16);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      group.add(ring);
    }

    return group;
  },

  // 3. 보스 3D 모델
  createBossMesh(bossId) {
    const group = new THREE.Group();
    const def = BOSSES[bossId] || BOSSES.forest_boss;
    const baseMat = this.getMat(def.color, 0.5, 0.3);

    if (bossId === 'forest_boss') {
      // 거대수 (거대한 나무 줄기 + 잎사귀)
      const trunkGeo = new THREE.CylinderGeometry(1.2, 1.6, 3.5, 8);
      const trunk = new THREE.Mesh(trunkGeo, this.getMat(0x5d4037));
      trunk.position.y = 1.75;
      trunk.castShadow = true;
      group.add(trunk);

      const leafGeo = new THREE.DodecahedronGeometry(2.2, 1);
      const leaf = new THREE.Mesh(leafGeo, this.getMat(0x1e8449));
      leaf.position.y = 4.2;
      leaf.castShadow = true;
      group.add(leaf);
    } else if (bossId === 'cave_boss') {
      // 거대 바위 골렘
      const torsoGeo = new THREE.DodecahedronGeometry(2.0);
      const torso = new THREE.Mesh(torsoGeo, this.getMat(0x566573, 0.8, 0.1));
      torso.position.y = 2.2;
      torso.castShadow = true;
      group.add(torso);

      const headGeo = new THREE.BoxGeometry(1.0, 1.0, 1.0);
      const head = new THREE.Mesh(headGeo, this.getMat(0x2c3e50));
      head.position.y = 3.6;
      group.add(head);
    } else if (bossId === 'ruins_boss') {
      // 죽음의 기사
      const bodyGeo = new THREE.CylinderGeometry(0.8, 1.1, 2.5, 8);
      const body = new THREE.Mesh(bodyGeo, this.getMat(0x1c2833, 0.2, 0.8));
      body.position.y = 1.6;
      body.castShadow = true;
      group.add(body);

      const swordGeo = new THREE.BoxGeometry(0.2, 2.8, 0.4);
      const sword = new THREE.Mesh(swordGeo, this.getMat(0x99a3a4, 0.1, 0.9, 0x5dade2));
      sword.position.set(1.4, 2.0, 0.5);
      group.add(sword);
    } else if (bossId === 'hell_boss') {
      // 화염 군주
      const bodyGeo = new THREE.ConeGeometry(1.6, 3.8, 8);
      const body = new THREE.Mesh(bodyGeo, this.getMat(0xc0392b, 0.4, 0.2, 0xe74c3c));
      body.position.y = 2.0;
      body.castShadow = true;
      group.add(body);

      const headGeo = new THREE.SphereGeometry(0.8, 10, 10);
      const head = new THREE.Mesh(headGeo, this.getMat(0xf39c12, 0.3, 0.1, 0xf39c12));
      head.position.y = 3.8;
      group.add(head);
    } else {
      // 마왕 (Demon King)
      const mantleGeo = new THREE.ConeGeometry(1.8, 4.2, 8);
      const mantle = new THREE.Mesh(mantleGeo, this.getMat(0x17202a, 0.2, 0.6, 0x8e44ad));
      mantle.position.y = 2.2;
      mantle.castShadow = true;
      group.add(mantle);

      // 마왕의 뿔
      const hornGeo = new THREE.ConeGeometry(0.2, 1.2, 6);
      const horn1 = new THREE.Mesh(hornGeo, this.getMat(0x900c3f));
      horn1.position.set(0.6, 4.3, 0);
      horn1.rotation.z = -0.4;
      const horn2 = horn1.clone();
      horn2.position.set(-0.6, 4.3, 0);
      horn2.rotation.z = 0.4;
      group.add(horn1);
      group.add(horn2);

      const crownGeo = new THREE.TorusGeometry(0.7, 0.12, 6, 12);
      const crown = new THREE.Mesh(crownGeo, this.getMat(0xd4af37, 0.2, 0.9, 0xffd700));
      crown.rotation.x = Math.PI / 2;
      crown.position.y = 4.2;
      group.add(crown);
    }

    return group;
  },

  // 4. 소환수 3D 모델
  createMinionMesh(type) {
    const group = new THREE.Group();
    if (type === 'skeleton') {
      const geo = new THREE.CylinderGeometry(0.2, 0.25, 0.7, 6);
      const mesh = new THREE.Mesh(geo, this.getMat(0xecf0f1));
      mesh.position.y = 0.5;
      group.add(mesh);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), this.getMat(0xbdc3c7));
      head.position.y = 0.95;
      group.add(head);
    } else if (type === 'beetle') {
      const geo = new THREE.SphereGeometry(0.3, 8, 6);
      geo.scale(1, 0.5, 1.2);
      const mesh = new THREE.Mesh(geo, this.getMat(0x27ae60, 0.4, 0.2));
      mesh.position.y = 0.2;
      group.add(mesh);
    } else {
      // 골렘
      const geo = new THREE.BoxGeometry(0.7, 0.9, 0.6);
      const mesh = new THREE.Mesh(geo, this.getMat(0x7f8c8d));
      mesh.position.y = 0.65;
      group.add(mesh);
    }
    return group;
  },

  // 5. 투사체 3D 모델
  createProjectileMesh(type) {
    if (type === 'FIRE') {
      const geo = new THREE.SphereGeometry(0.3, 8, 8);
      return new THREE.Mesh(geo, this.getMat(0xff4500, 0.2, 0.1, 0xff4500));
    } else if (type === 'COLD') {
      const geo = new THREE.ConeGeometry(0.2, 0.8, 6);
      const m = new THREE.Mesh(geo, this.getMat(0x00d2d3, 0.2, 0.2, 0x00d2d3));
      m.rotation.x = Math.PI / 2;
      return m;
    } else if (type === 'LIGHTNING') {
      const geo = new THREE.CylinderGeometry(0.08, 0.08, 0.8, 4);
      const m = new THREE.Mesh(geo, this.getMat(0xffd700, 0.1, 0.1, 0xffd700));
      m.rotation.x = Math.PI / 2;
      return m;
    } else if (type === 'POISON') {
      const geo = new THREE.SphereGeometry(0.25, 6, 6);
      return new THREE.Mesh(geo, this.getMat(0x2ecc71, 0.3, 0.1, 0x2ecc71));
    } else if (type === 'DARK') {
      const geo = new THREE.DodecahedronGeometry(0.35);
      return new THREE.Mesh(geo, this.getMat(0x8e44ad, 0.2, 0.5, 0x8e44ad));
    } else {
      // 일반 화살/물리 투사체
      const group = new THREE.Group();
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 4), this.getMat(0xecf0f1));
      shaft.rotation.x = Math.PI / 2;
      group.add(shaft);
      return group;
    }
  },

  // 6. 던전 방 바닥, 벽, 문, 오브젝트 생성
  createRoomFloor(areaDef, width = 36, height = 36) {
    const geo = new THREE.PlaneGeometry(width, height, 8, 8);
    const mat = new THREE.MeshStandardMaterial({
      color: areaDef.floorColor,
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(geo, mat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    return floor;
  },

  // 상자 3D 모델
  createChestMesh(tier = 'wood') {
    const group = new THREE.Group();
    const color = tier === 'legend' ? 0xe67e22 : tier === 'gold' ? 0xf1c40f : tier === 'iron' ? 0x95a5a6 : 0x8d6e63;
    const bodyGeo = new THREE.BoxGeometry(1.0, 0.6, 0.7);
    const body = new THREE.Mesh(bodyGeo, this.getMat(color, 0.5, 0.4));
    body.position.y = 0.3;
    body.castShadow = true;
    group.add(body);

    const lidGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.0, 8, 1, false, 0, Math.PI);
    const lid = new THREE.Mesh(lidGeo, this.getMat(color, 0.4, 0.5));
    lid.rotation.z = Math.PI / 2;
    lid.position.y = 0.6;
    group.add(lid);
    return group;
  },

  // 포탈 (다음 방 / 다음 층)
  createPortalMesh() {
    const group = new THREE.Group();
    const torusGeo = new THREE.TorusGeometry(1.2, 0.15, 12, 24);
    const torus = new THREE.Mesh(torusGeo, this.getMat(0x00ffff, 0.1, 0.1, 0x00ffff));
    torus.position.y = 1.3;
    group.add(torus);
    group.torus = torus;
    return group;
  }
};
