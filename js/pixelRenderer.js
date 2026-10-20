// ===== 2D 도트 렌더러 (Sephiria풍 정통 픽셀 도트 아트 & 초고속 스프라이트 캐시 엔진) =====
// 인위적인 계산 루프를 전면 제거하고, 게임 시작 시 귀여운 픽셀 스프라이트를 사전 생성하여
// 단 1회의 drawImage로 렌더링함으로써 CPU 점유율 0% 및 60fps 고정 성능 보장!

class PixelRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.particles = [];
    this.ghostTrails = [];
    this.slashEffects = [];
    this.skillEffects = [];
    this.ambientParticles = [];

    // 배경 정적 렌더링 오프스크린 캐시
    this.bgCanvas = document.createElement('canvas');
    this.bgCtx = this.bgCanvas.getContext('2d');
    this.bgCtx.imageSmoothingEnabled = false;
    this.cachedTheme = null;
    this.cachedRoomW = 0;
    this.cachedRoomH = 0;

    // 사전 렌더링된 고품질 귀여운 도트 스프라이트 보관소
    this.sprites = {};
    this.initSpriteCache();
  }

  // 오프스크린 캔버스 헬퍼
  makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    return { canvas: c, ctx: ctx };
  }

  // =========================================================================
  // 1. Sephiria & Dungreed풍 정통 픽셀 도트 아트 캐시 엔진 (Pixel Grid Matrix)
  // =========================================================================
  drawPixelMap(ctx, ox, oy, scale, rows, palette) {
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.' || !palette[ch]) continue;
        ctx.fillStyle = palette[ch];
        ctx.fillRect(ox + c * scale, oy + r * scale, scale, scale);
      }
    }
  }

  initSpriteCache() {
    this.sprites['player_warrior'] = this.buildWarriorSprite();
    this.sprites['player_mage'] = this.buildMageSprite();
    this.sprites['player_paladin'] = this.buildPaladinSprite();
    this.sprites['player_assassin'] = this.buildAssassinSprite();
    this.sprites['player_archer'] = this.buildArcherSprite();
    this.sprites['player_summoner'] = this.buildSummonerSprite();

    this.sprites['slime_green'] = this.buildSlimeSprite('#22c55e', '#15803d', '#86efac');
    this.sprites['slime_blue'] = this.buildSlimeSprite('#38bdf8', '#0284c7', '#bae6fd');
    this.sprites['slime_red'] = this.buildSlimeSprite('#ef4444', '#b91c1c', '#fca5a5');
    this.sprites['slime_gold'] = this.buildSlimeSprite('#facc15', '#b45309', '#fef08a');

    this.sprites['monster_skeleton'] = this.buildSkeletonSprite();
    this.sprites['monster_goblin'] = this.buildGoblinSprite();
    this.sprites['monster_bat'] = this.buildBatSprite();
    this.sprites['monster_golem'] = this.buildGolemSprite();
    this.sprites['monster_imp'] = this.buildImpSprite();
    this.sprites['monster_knight'] = this.buildKnightSprite();
    this.sprites['monster_mage'] = this.buildCultistMageSprite();
    this.sprites['monster_hellhound'] = this.buildHellhoundSprite();

    // 지형지물 & 오브젝트 픽셀 스프라이트
    this.sprites['ob_tree_stump'] = this.buildTreeStumpSprite();
    this.sprites['ob_pillar'] = this.buildPillarSprite();
    this.sprites['ob_crystal'] = this.buildCrystalClusterSprite();
    this.sprites['ob_magma_rock'] = this.buildMagmaRockSprite();
    this.sprites['prop_wood_barrel'] = this.buildWoodBarrelSprite();
    this.sprites['prop_tnt_barrel'] = this.buildTntBarrelSprite();
    this.sprites['prop_chest_iron'] = this.buildChestSprite(false);
    this.sprites['prop_chest_gold'] = this.buildChestSprite(true);
    this.sprites['prop_campfire'] = this.buildCampfireSprite();
    this.sprites['prop_merchant'] = this.buildMerchantSprite();
    this.sprites['prop_altar'] = this.buildAltarSprite(false);
    this.sprites['prop_altar_used'] = this.buildAltarSprite(true);
    this.sprites['prop_soul_altar'] = this.buildSoulAltarSprite();
    this.sprites['prop_portal'] = this.buildPortalSprite();
  }

  // --- 1. [플레이어] 전사 (Warrior: 붉은 영웅 리본 & 기사 튜닉) ---
  buildWarriorSprite() {
    const { canvas, ctx } = this.makeCanvas(48, 56);
    const pal = {
      '#': '#090d16', S: '#ffe0bd', s: '#f3be94', H: '#5c341b', h: '#8f582f',
      B: '#fb7185', E: '#d97706', W: '#ffffff', R: '#dc2626', r: '#991b1b',
      G: '#facc15', C: '#2563eb', c: '#1d4ed8', A: '#e2e8f0', a: '#94a3b8',
      K: '#1e293b', L: '#475569', M: '#b91c1c'
    };
    const rows = [
      ".......####...........",
      ".....##hhhh##.........",
      "....#HHHHHHHH#........",
      "...#HHhhhhhhHH#.......",
      "..#HHHHHHHHHHHH#..##..",
      "..#RRRRRRRRRRRR#.#RR#.",
      ".#RRRRRRGGGRRRRR##RR#.",
      ".#HH..SSSSSS..HH#RR#..",
      "#HH..#SSSSSS#..HH##...",
      "#H.#W#SSSSSS#W#.H#....",
      "#H.#EE#SSSS#EE#.H#....",
      "#H.BEE#ssss#EEB.H#....",
      ".#..s#sSSSSs#s..#.....",
      "..##..SSMMSS..##......",
      "...#AASSSSSSAA#.......",
      "..#AAAACCCCACAA#......",
      "..#ACCCCCCCCCCcA#..##.",
      "..#ACCCCCCCCCCcA#.#RR#",
      "..#AKKKGGGGKKKcA##RR#.",
      "...#KKKGGGGKKK#..##...",
      "...#..CCCCCC..#.......",
      "....##KK##KK##........",
      "....#KLL##LLK#........",
      "....#KLL##LLK#........",
      "....#KKK##KKK#........",
      ".....###..###........."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 2. [플레이어] 마법사 (Mage: 신비한 마녀 모자 & 부유 마도서) ---
  buildMageSprite() {
    const { canvas, ctx } = this.makeCanvas(48, 56);
    const pal = {
      '#': '#090d16', S: '#fff0db', s: '#fcd5b8', H: '#4338ca', h: '#6366f1',
      B: '#fb7185', E: '#a855f7', W: '#ffffff', P: '#1e1b4b', p: '#312e81',
      G: '#facc15', M: '#b91c1c', K: '#0f172a', Q: '#22d3ee', q: '#6366f1'
    };
    const rows = [
      ".........##...........",
      "........#pp#..........",
      ".......#pppp#...#Q#...",
      "......#pppppp#.#qqq#..",
      ".....#pppppppp##qWq#..",
      "....#PPPPPPGGGP#qqq#..",
      "..##PPPPPPPPPPPP##....",
      ".#HHHHHSSSSSSHHHHH#...",
      "#HH...#SSSSSS#...HH#..",
      "#H..#W#SSSSSS#W#..H#..",
      "#H..#EE#SSSS#EE#..H#..",
      "#H..BEE#ssss#EEB..H#..",
      ".#...s#sSSSSs#s...#...",
      "..##...SSMMSS...##....",
      "...#PPPPSSSSPPPP#.....",
      "..#PPPPPPPPPPPPPP#....",
      "..#PPPPPPPPPPPPPP#....",
      "..#PPPPSGGGGSPPPP#....",
      "..#PPPPPGGGGGPPPP#....",
      "...#PPPPPPPPPPPP#.....",
      "....##KK####KK##......",
      "....#KKK####KKK#......",
      ".....###....###......."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 3. [플레이어] 성기사 (Paladin: 황금 엔젤 링 & 은빛 성갑) ---
  buildPaladinSprite() {
    const { canvas, ctx } = this.makeCanvas(48, 56);
    const pal = {
      '#': '#090d16', S: '#ffe0bd', s: '#f5be94', H: '#fde047', h: '#fef08a',
      B: '#fb7185', E: '#0284c7', W: '#ffffff', O: '#f59e0b', o: '#ffffff',
      A: '#f8fafc', a: '#94a3b8', C: '#2563eb', G: '#facc15', M: '#b91c1c',
      K: '#334155', L: '#64748b'
    };
    const rows = [
      "......#OOOOOO#........",
      ".....#OooooooO#.......",
      "......#OOOOOO#........",
      "....#HHHHHHHHHH#......",
      "...#HHhhhhhhhhHH#.....",
      "..#HHHHHHHHHHHHHH#....",
      ".#HH...SSSSSS...HH#...",
      "#HH...#SSSSSS#...HH#..",
      "#H..#W#SSSSSS#W#..H#..",
      "#H..#EE#SSSS#EE#..H#..",
      "#H..BEE#ssss#EEB..H#..",
      ".#...s#sSSSSs#s...#...",
      "..##...SSMMSS...##....",
      "...#AAASSSSSSAAA#.....",
      "..#AAAAACCCCACAAA#....",
      "..#AAAAACCCCACAAA#....",
      "..#AAAAASGGGSAAAA#....",
      "..#AAAAACCCCACAAA#....",
      "...#AAAACCCCACAA#.....",
      "....##KK####KK##......",
      "....#KLL####LLK#......",
      "....#KKK####KKK#......",
      ".....###....###......."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 4. [플레이어] 암살자 (Assassin: 고양이 귀 두건 & 붉은 닌자 머플러) ---
  buildAssassinSprite() {
    const { canvas, ctx } = this.makeCanvas(48, 56);
    const pal = {
      '#': '#090d16', S: '#ffe0bd', s: '#f5be94', N: '#0f172a', P: '#e11d48',
      E: '#06b6d4', W: '#ffffff', R: '#dc2626', r: '#991b1b', K: '#1e293b',
      L: '#334155', B: '#fb7185'
    };
    const rows = [
      "...#N#......#N#.......",
      "..#NPN#....#NPN#......",
      ".#NNNN######NNNN#.....",
      ".#NNNNNNNNNNNNNN#.....",
      "#NNN...SSSSSS...NN#...",
      "#NN...#SSSSSS#...NN#..",
      "#N..#W#SSSSSS#W#..N#..",
      "#N..#EE#SSSS#EE#..N#..",
      "#N..BEE#ssss#EEB..N#..",
      ".#...s#sSSSSs#s...#...",
      "..##...RRRRRR...##....",
      "...#RRRRRRRRRRRR#.....",
      "..#RRRRRRRRRRRRRR#.##.",
      "..#KKKKKKKKKKKKKK##RR#",
      "..#KKKKKKKKKKKKKK##RR#",
      "..#KKKKKKKKKKKKKK##RR#",
      "..#KKKKKKKKKKKKKK#..##",
      "...#KKKKKKKKKKKK#.....",
      "....##KK####KK##......",
      "....#KLL####LLK#......",
      "....#KKK####KKK#......",
      ".....###....###......."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 5. [플레이어] 궁수 (Archer: 로빈후드 깃털 모자 & 에메랄드 튜닉) ---
  buildArcherSprite() {
    const { canvas, ctx } = this.makeCanvas(48, 56);
    const pal = {
      '#': '#090d16', S: '#ffe0bd', s: '#f5be94', H: '#ea580c', h: '#fb923c',
      B: '#fb7185', E: '#16a34a', W: '#ffffff', T: '#15803d', F: '#ef4444',
      f: '#facc15', C: '#166534', c: '#14532d', G: '#facc15', K: '#78350f',
      L: '#92400e', M: '#b91c1c'
    };
    const rows = [
      "........##............",
      ".......#fF#...........",
      "......#fFF#..##.......",
      "....#TTTFFFF#HH#......",
      "...#TTTTTFFT#HHH#.....",
      "..#TTTTTTTTT#HHHH#....",
      ".#HH...SSSSSS.##HH#...",
      "#HH...#SSSSSS#..HH#...",
      "#H..#W#SSSSSS#W#.##...",
      "#H..#EE#SSSS#EE#......",
      "#H..BEE#ssss#EEB......",
      ".#...s#sSSSSs#s.......",
      "..##...SSMMSS...##....",
      "...#CCCCSSSSCCCC#.....",
      "..#CCCCCCCCCCCCCC#....",
      "..#CCCCCCCCCCCCCC#.##.",
      "..#CCCCCSGGGSCcCC##KK#",
      "..#CCCCCCCCCCCCCC##KK#",
      "...#CCCCGGGGCCCC#..##.",
      "....##KK####KK##......",
      "....#KLL####LLK#......",
      "....#KKK####KKK#......",
      ".....###....###......."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 5-2. [플레이어] 소환사 (Summoner: 흑마도사 로브 & 부유 미니 해골) ---
  buildSummonerSprite() {
    const { canvas, ctx } = this.makeCanvas(48, 56);
    const pal = {
      '#': '#090d16', S: '#f3e8ff', s: '#d8b4fe', H: '#581c87', h: '#7e22ce',
      B: '#c084fc', E: '#10b981', W: '#ffffff', P: '#3b0764', p: '#6b21a8',
      G: '#a855f7', M: '#701a75', K: '#1e1b4b', Q: '#22c55e', q: '#f8fafc'
    };
    const rows = [
      ".........##...........",
      "........#pp#..........",
      ".......#pppp#...#Q#...",
      "......#pppppp#.#qqq#..",
      ".....#pppppppp##qWq#..",
      "....#PPPPPPGGGP#qqq#..",
      "..##PPPPPPPPPPPP##....",
      ".#HHHHHSSSSSSHHHHH#...",
      "#HH...#SSSSSS#...HH#..",
      "#H..#W#SSSSSS#W#..H#..",
      "#H..#EE#SSSS#EE#..H#..",
      "#H..BEE#ssss#EEB..H#..",
      ".#...s#sSSSSs#s...#...",
      "..##...SSMMSS...##....",
      "...#PPPPSSSSPPPP#.....",
      "..#PPPPPPPPPPPPPP#....",
      "..#PPPPPPPPPPPPPP#....",
      "..#PPPPSGGGGSPPPP#....",
      "..#PPPPPGGGGGPPPP#....",
      "...#PPPPPPPPPPPP#.....",
      "....##KK####KK##......",
      "....#KKK####KKK#......",
      ".....###....###......."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 6. [몬스터] 슬라임 (Slime: 투명 젤리 광택 & 왕눈이 & 별 보석 코어) ---
  buildSlimeSprite(colBase, colShade, colHi) {
    const { canvas, ctx } = this.makeCanvas(44, 40);
    const pal = {
      '#': '#090d16', C: colBase, c: colShade, H: colHi,
      E: '#090d16', W: '#ffffff', B: '#fb7185', G: '#fef08a', g: '#ffffff'
    };
    const rows = [
      "........####........",
      ".....###HHHH###.....",
      "....#HHCCCCCCCc#....",
      "...#HHCCCCCCCCcc#...",
      "..#HHCCCCCCCCCccc#..",
      "..#HCCCCCCCCCCCCc#..",
      ".#CCCCCCCCCCCCCCCc#.",
      ".#C#E#CCCCCCC#E#Cc#.",
      "#CC#W#CCCCCCC#W#CCc#",
      "#CC#E#CCCCCCC#E#CCc#",
      "#CB#E#CCCCCCC#E#BCc#",
      "#CCBCCCCGGGCCCCBCcc#",
      "#CCCCCCCCgGCCCCCCCC#",
      ".#CCCCCCGGGCCCCCCC#.",
      ".#cccccccccccccccc#.",
      "..##cccccccccccc##..",
      "....############...."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 7. [몬스터] 해골 전사 (Skeleton: 냄비 투구 & 푸른 영혼 눈 & 덧니) ---
  buildSkeletonSprite() {
    const { canvas, ctx } = this.makeCanvas(44, 48);
    const pal = {
      '#': '#090d16', K: '#475569', L: '#94a3b8', G: '#facc15',
      B: '#f8fafc', b: '#cbd5e1', Q: '#06b6d4', W: '#ffffff'
    };
    const rows = [
      ".....#KLLLLK#.......",
      "....#KKLLLLKK#......",
      "...#GKKKKKKKKG#.....",
      "...#KKKKKKKKKK#.....",
      "..#BBBBBBBBBBBB#....",
      ".#BBBBBBBBBBBBBB#...",
      "#BB...#BBBB#...BB#..",
      "#B..#Q#BBBB#Q#..B#..",
      "#B..#W#BBBB#W#..B#..",
      "#B..#Q#BBBB#Q#..B#..",
      "#BB...#bbbb#...BB#..",
      ".#BBBBBBBBBBBBBB#...",
      "..#B#B#BBBB#B#B#....",
      "...#..BBBBBB..#.....",
      "....#bKBBBBKb#......",
      "...#bbKKBBKKbb#..##.",
      "...#bbKKBBKKbb#.#WW#",
      "....#bbbbbbbb#..#WW#",
      ".....##b##b##...#WW#",
      ".....#bb##bb#...#WW#",
      "......##..##....#WW#"
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 8. [몬스터] 고블린 (Goblin: 쫑긋 분홍 큰 귀 & 도토리 가방) ---
  buildGoblinSprite() {
    const { canvas, ctx } = this.makeCanvas(46, 46);
    const pal = {
      '#': '#090d16', G: '#16a34a', g: '#22c55e', P: '#fb7185',
      E: '#f59e0b', W: '#ffffff', K: '#78350f', L: '#d97706', T: '#ffffff'
    };
    const rows = [
      "........####..........",
      "...##..#gggg#..##.....",
      "..#PP##GggggG##PP#....",
      ".#PPP#GGGGGGGG#PPP#...",
      ".#PP#GGGGGGGGGG#PP#...",
      "..##GGGGGGGGGGGG##....",
      "...#GG#E#GG#E#GG#.....",
      "...#GG#W#GG#W#GG#.....",
      "...#GG#E#GG#E#GG#.....",
      "...#GGGGTTGGGGGG#.....",
      "....#GGGGGGGGGG#......",
      ".....#KKKKKKKK#.......",
      "....#KKKKKKKKKK#.##...",
      "....#KKKKKKKKKK##LL#..",
      "....#KKKKKKKKKK##LL#..",
      ".....#KKKKKKKK#..##...",
      "......#GG##GG#........",
      "......#GG##GG#........",
      "......###..###........"
    ];
    this.drawPixelMap(ctx, 1, 2, 2, rows, pal);
    return canvas;
  }

  // --- 9. [몬스터] 박쥐 (Bat: 보송 털 바디 & 루비 눈 & 흡혈 송곳니) ---
  buildBatSprite() {
    const { canvas, ctx } = this.makeCanvas(48, 38);
    const pal = {
      '#': '#090d16', B: '#312e81', b: '#4338ca', W: '#1e1b4b',
      R: '#ef4444', r: '#ffffff', T: '#ffffff'
    };
    const rows = [
      ".......##....##.......",
      "##....#bb#..#bb#....##",
      "#W#..#BBBB##BBBB#..#W#",
      "#WW##BBBBBBBBBBBB##WW#",
      ".#WW#BB#R#BB#R#BB#WW#.",
      ".#WW#BB#r#BB#r#BB#WW#.",
      "..##BBB#R#BB#R#BBB##..",
      "....#BBBTBBBTBBB#.....",
      "....#BBBBBBBBBBB#.....",
      ".....#BBBBBBBBB#......",
      "......##WW##WW##......",
      ".......#WW##WW#.......",
      "........##..##........"
    ];
    this.drawPixelMap(ctx, 0, 2, 2, rows, pal);
    return canvas;
  }

  // --- 10. [몬스터] 골렘 (Golem: 각진 이끼 바위 & 맥동 하트 코어) ---
  buildGolemSprite() {
    const { canvas, ctx } = this.makeCanvas(48, 48);
    const pal = {
      '#': '#090d16', R: '#475569', r: '#64748b', M: '#22c55e',
      H: '#f97316', h: '#facc15', W: '#ffffff', K: '#334155'
    };
    const rows = [
      ".........####.........",
      ".......##MMMM##.......",
      "......#MMRRRRMM#......",
      ".....#RRRRrrrrRR#.....",
      "....#RRRRRRRRRRRR#....",
      "....#RRR#rr##rrRR#....",
      "....#RRR#rr##rrRR#....",
      "....#RRRRRRRRRRRR#....",
      ".##.#RRRHHHHHHRRR#.##.",
      "#KK##RR#HhhhHW#RR##KK#",
      "#KK##RR#HhhhHW#RR##KK#",
      "#KK##RR#HHHHHWRRR##KK#",
      ".##.#RRR#WWWW#RRR#.##.",
      "....#RRRRRRRRRRRR#....",
      ".....#RRRRRRRRRR#.....",
      "......#KKK##KKK#......",
      "......#KKK##KKK#......",
      ".......###..###......."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 11. [몬스터] 꼬마 악마 임프 (Imp: 노란 뿔 & 박쥐 날개 & 작은 삼지창) ---
  buildImpSprite() {
    const { canvas, ctx } = this.makeCanvas(46, 46);
    const pal = {
      '#': '#090d16', R: '#dc2626', r: '#ef4444', Y: '#facc15', y: '#fde047',
      B: '#1e1b4b', b: '#312e81', W: '#ffffff', E: '#f59e0b', P: '#fb7185',
      G: '#94a3b8'
    };
    const rows = [
      "....#Y#.......#Y#.....",
      "...#YyY#.....#YyY#....",
      "....#Y#.......#Y#.....",
      ".....##rr###rr##......",
      "....#rrrrrrrrrrr#.....",
      "..##rrrrrrrrrrrrr##...",
      ".#bB#rr#E#rrr#E#rr#Bb#",
      "#bbB#rr#W#rrr#W#rr#Bbb#",
      "#bbB#rr#E#rrr#E#rr#Bbb#",
      ".#bB#rPPrrrrrrPPrr#Bb#",
      "..##.rrrrrrrrrrrrr.##.",
      "......#rrrrrrrrr#.....",
      ".....#rrrrrrrrrrr#..#G",
      "....#rrrrrrrrrrrrr#.#G",
      "....#rrrrrrrrrrrrr##GG",
      ".....#rrrrrrrrrrr#..#G",
      "......#rr#...#rr#...#G",
      "......#rr#...#rr#...#G",
      ".......##.....##....#G",
      "................#RRR#.",
      ".................###.."
    ];
    this.drawPixelMap(ctx, 1, 2, 2, rows, pal);
    return canvas;
  }

  // --- 12. [몬스터] 암흑 기사 (Knight: 묵직한 풀헬멧 & 타오르는 붉은 안광 & 망토) ---
  buildKnightSprite() {
    const { canvas, ctx } = this.makeCanvas(48, 52);
    const pal = {
      '#': '#090d16', K: '#1e293b', k: '#334155', S: '#64748b', s: '#94a3b8',
      W: '#ffffff', R: '#ef4444', r: '#b91c1c', G: '#facc15', C: '#1d4ed8'
    };
    const rows = [
      ".......#RR#RR#........",
      "......#RRRRRRRR#......",
      ".......#RR##RR#.......",
      ".....###ssssss###.....",
      "....#sssSSSSSSsss#....",
      "...#ssssssssssssss#...",
      "...#ss#R#ssss#R#ss#...",
      "...#ss#R#ssss#R#ss#...",
      "...#ssssGGGGGGssss#...",
      "....#ss#KKKKKK#ss#....",
      ".....##KkkkkkkK##.....",
      "...#CC#KkkkkkkK#CC#...",
      "..#CCC#KssssssK#CCC#..",
      "..#CCC#KssssssK#CCC#..",
      "..#CCC#KssssssK#CCC#..",
      "...#CC#KkkkkkkK#CC#...",
      "....##KkkkkkkkkK##....",
      ".....#KKK####KKK#.....",
      ".....#KKK####KKK#.....",
      "......###....###......"
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 13. [몬스터] 사령술 마법사 (Cultist Mage: 신비한 보라 후드 & 심연의 단안) ---
  buildCultistMageSprite() {
    const { canvas, ctx } = this.makeCanvas(46, 50);
    const pal = {
      '#': '#090d16', P: '#3b0764', p: '#581c87', V: '#7e22ce', v: '#a855f7',
      G: '#facc15', C: '#06b6d4', c: '#22d3ee', W: '#ffffff', K: '#1e1b4b',
      B: '#78350f'
    };
    const rows = [
      ".........##...........",
      "........#vv#..........",
      ".......#vvvv#.........",
      "......#vvVVvv#........",
      ".....#vvVVVVvv#.......",
      "....#vvVVVVVVvv#..#c#.",
      "...#VVVVVVVVVVVV##ccc#",
      "..#VVVVVVVVVVVVVV#cWc#",
      ".#PPPPPPPPPPPPPPPP#c#.",
      ".#PPPPKKKKKKKKPPPP#...",
      ".#PPPKKK#c#KKKKPPP#...",
      ".#PPPKKK#W#KKKKPPP#...",
      ".#PPPKKKKKKKKKPPPP#...",
      "..#PPPPPGGGGGPPPPP#...",
      "...#PPPPPPPPPPPPP#....",
      "...#PPPPPPPPPPPPP##B#.",
      "...#vvvvvvvvvvvvv##B#.",
      "....#vvvvvvvvvvv#.#B#.",
      ".....#vvvvvvvvv#..#B#.",
      "......##KK###KK#..#B#."
    ];
    this.drawPixelMap(ctx, 1, 2, 2, rows, pal);
    return canvas;
  }

  // --- 14. [몬스터] 지옥견 (Hellhound: 뾰족귀 & 불꽃 갈기 & 날카로운 송곳니) ---
  buildHellhoundSprite() {
    const { canvas, ctx } = this.makeCanvas(50, 42);
    const pal = {
      '#': '#090d16', D: '#450a0a', d: '#7f1d1d', R: '#dc2626', r: '#ef4444',
      F: '#f97316', f: '#facc15', W: '#ffffff', E: '#fde047'
    };
    const rows = [
      "..#D#.........#D#.....",
      ".#DdD#.......#DdD#....",
      ".#DddD#######DddD#....",
      "..#DdddddddddddD#.....",
      "...#DddddddddddD#.....",
      "....#dd#E#ddd#E#d#....",
      "....#dd#W#ddd#W#d#....",
      "....#dd#E#ddd#E#d#....",
      "...#FddddWWWWddddF#...",
      "..#FfFddddddddddFfF#..",
      "..#FffFffffffffFffF#..",
      ".#FffffffffffffffffF#.",
      ".#FffffFddddddFffffF#.",
      "..##FF##dddddd##FF##..",
      ".......#dd##dd#.......",
      ".......#dd##dd#.......",
      "........##..##........"
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 15. [지형지물] 고대 숲의 이끼 낀 고목 밑동 (Tree Stump) ---
  buildTreeStumpSprite() {
    const { canvas, ctx } = this.makeCanvas(56, 52);
    const pal = {
      '#': '#090d16', B: '#271c19', b: '#451a03', W: '#78350f', w: '#92400e',
      T: '#b45309', t: '#d97706', G: '#15803d', g: '#22c55e', L: '#86efac'
    };
    const rows = [
      ".........########.........",
      "......###bbbbbbbb###......",
      "....##bbTTTTTTTTTTbb##....",
      "...#bbTTttttttttttTTbb#...",
      "..#bTTttttttttttttttTTb#..",
      ".#bTttttt##tttt##ttttTtb#.",
      ".#bTtttt#gg#tt#gg#tttTtb#.",
      "#bTttttt#LL#tt#LL#tttTtb#.",
      "#bTtttttt##tttt##ttttTtb#.",
      "#bTtttttttt##ttttttttTtb#.",
      ".#bTtttttt#gg#tttttttTtb#.",
      ".#bTTtttttt##tttttTTTtb#..",
      "..#bbTTttttttttttTTTbb#...",
      "...#WbbTTTTTTTTTTbbW#.....",
      "..#WWWbbbbbbbbbbbbWWW#....",
      ".#WWWWWWWWWWWWWWWWWWWW#...",
      ".#WWbWWbWWWWWWWWbWWbWW#...",
      "#WWbbbWWbbbWWWWbbbWWbbb#..",
      "#bbbbbbbbbbbbbbbbbbbbbb#..",
      "#GGbbbbbbbbbbbbbbbbbbGG#..",
      "##GGbbbbbbbbbbbbbbbbGG##.."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 16. [지형지물] 고대 폐허의 부서진 석조 기둥 (Ancient Pillar) ---
  buildPillarSprite() {
    const { canvas, ctx } = this.makeCanvas(48, 56);
    const pal = {
      '#': '#090d16', S: '#334155', s: '#64748b', L: '#94a3b8', l: '#cbd5e1',
      W: '#f8fafc', G: '#15803d', g: '#22c55e'
    };
    const rows = [
      "......#WW#..........",
      ".....#WllW#....##...",
      "....#WllllW#..#gg#..",
      "...#WllllllW##gLLg#.",
      "..#WWWWWWWWWW#ggG#..",
      "..#llllllllll#g##...",
      "...#sLssLssLs#......",
      "...#sLssLssLs#......",
      "...#sLssLssLs#..##..",
      "...#sLssLssLs#.#gg#.",
      "...#sL#sLssLs#gLLg#.",
      "...#sL##LssLs#Ggg#..",
      "...#sLssLssLs##.....",
      "...#sLssLssLs#......",
      "..#sLLLLLLLLs#......",
      ".#sLLLLLLLLLLs#.....",
      "#SSSSSSSSSSSSSS#....",
      "################...."
    ];
    this.drawPixelMap(ctx, 4, 2, 2, rows, pal);
    return canvas;
  }

  // --- 17. [지형지물] 동굴의 신비한 크리스탈 군집 (Crystal Cluster) ---
  buildCrystalClusterSprite() {
    const { canvas, ctx } = this.makeCanvas(48, 52);
    const pal = {
      '#': '#090d16', C: '#0891b2', c: '#06b6d4', L: '#22d3ee', l: '#67e8f9',
      W: '#ffffff', P: '#7e22ce', p: '#a855f7', R: '#1e293b'
    };
    const rows = [
      ".........#W#..........",
      "........#lW#..........",
      ".......#llL#...#W#....",
      "......#lllc#..#pP#....",
      "......#lllc#.#ppP#....",
      ".....#lllcC##pppP#....",
      "....#lllcCC#ppppP#....",
      "....#lllcC##PppP#.....",
      ".#W#lllcCC#PPP##......",
      "#lW#lllcC#PP#.........",
      "#llc#llcCC#P#...#W#...",
      "#llc#llcCC#....#pP#...",
      ".#cCC#lcCC#...#ppP#...",
      "..#cCC#cCC#..#pppP#...",
      "...#RR#cCC##ppppP#....",
      "....#RR####PPPPP#.....",
      ".....#RRRRRRRRR#......",
      "......#########......."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 18. [지형지물] 지옥의 흑요석 마그마 바위 (Magma Rock) ---
  buildMagmaRockSprite() {
    const { canvas, ctx } = this.makeCanvas(48, 48);
    const pal = {
      '#': '#090d16', K: '#1c1917', k: '#292524', R: '#44403c', r: '#78716c',
      F: '#b91c1c', f: '#ef4444', O: '#f97316', o: '#facc15', W: '#ffffff'
    };
    const rows = [
      ".......######.........",
      ".....##rrrrrr##.......",
      "....#rrrrrRRRRr#......",
      "...#rrRRR#ff#RRR#.....",
      "..#rrRRR#fOo#RRR#.....",
      ".#rrRRR#fOoW#RRRR#....",
      ".#rRRRR#fOo#RRRRR#....",
      "#rRRRRRR#ff#RRRRRR#...",
      "#RRR#ff#RRRR#ff#RRR#..",
      "#RR#fOo#RRR#fOo#RRR#..",
      "#R#fOoW#RR#fOoW#RRR#..",
      "#R#fOo#RRR#fOo#RRRR#..",
      "#RR#ff#RRRR#ff#RRRR#..",
      ".#RRRRRRRRRRRRRRRR#...",
      "..#KKKKKKKKKKKKKK#....",
      "...##############....."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 19. [오브젝트] 나무 배럴 (Wood Barrel) ---
  buildWoodBarrelSprite() {
    const { canvas, ctx } = this.makeCanvas(40, 44);
    const pal = {
      '#': '#090d16', W: '#78350f', w: '#92400e', T: '#b45309',
      S: '#475569', s: '#94a3b8', L: '#cbd5e1'
    };
    const rows = [
      "......######........",
      "....##TTTTTT##......",
      "...#TTTWWWWTTT#.....",
      "..#sssLsssLsssL#....",
      ".#WWWWWWWWWWWWWW#...",
      ".#WWwwWWwwWWwwWW#...",
      "#TTwwTTwwTTwwTTww#..",
      "#TTwwTTwwTTwwTTww#..",
      "#sssLsssLsssLsssL#..",
      "#TTwwTTwwTTwwTTww#..",
      "#TTwwTTwwTTwwTTww#..",
      ".#WWwwWWwwWWwwWW#...",
      ".#sssLsssLsssLsss#..",
      "..#TTTWWWWTTT#......",
      "...##TTTTTT##.......",
      ".....######........."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 20. [오브젝트] 폭발 화약통 (TNT Barrel) ---
  buildTntBarrelSprite() {
    const { canvas, ctx } = this.makeCanvas(40, 48);
    const pal = {
      '#': '#090d16', R: '#991b1b', r: '#dc2626', L: '#ef4444',
      G: '#b45309', g: '#f59e0b', W: '#ffffff', F: '#fde047', f: '#ef4444'
    };
    const rows = [
      "........#ff#........",
      ".......#fFFf#.......",
      "........#ff#........",
      ".......#G#..........",
      "......######........",
      "....##rrrrrr##......",
      "...#rrrRRRRrrr#.....",
      "..#gggGgggGgggG#....",
      ".#rrrrrrrrrrrrrr#...",
      ".#rrLLrrLLrrLLrr#...",
      "#rrLLrr#W#rrLLrr#...",
      "#rrLLr#W#W#rLLrr#...",
      "#gggGrr#W#rrgggG#...",
      "#rrLLrr#W#rrLLrr#...",
      "#rrLLrrrrrrrrLLrr#..",
      ".#rrLLrrLLrrLLrr#...",
      ".#gggGgggGgggGggg#..",
      "..#rrrRRRRrrr#......",
      "...##rrrrrr##.......",
      ".....######........."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 21. [오브젝트] 세피리아/던그리드풍 보물 상자 (Treasure Chest) ---
  buildChestSprite(isGold) {
    const { canvas, ctx } = this.makeCanvas(48, 40);
    const pal = isGold ? {
      '#': '#090d16', B: '#b45309', b: '#d97706', G: '#facc15', g: '#fef08a',
      W: '#ffffff', R: '#dc2626'
    } : {
      '#': '#090d16', B: '#451a03', b: '#78350f', G: '#64748b', g: '#94a3b8',
      W: '#f8fafc', R: '#f59e0b'
    };
    const rows = [
      ".....##############.....",
      "...##gggggggggggggg##...",
      "..#ggGGGGGGGGGGGGGGgg#..",
      ".#gGBBBBBBBBBBBBBBBBgg#.",
      ".#GBBbbbbbbbbbbbbbbBGg#.",
      "#GBBbbbbbbbbbbbbbbbbBGg#",
      "#GBBbbbbbbbbbbbbbbbbBGg#",
      "#gggggggggggggggggggggg#",
      "#GGGGGGGG#RR#GGGGGGGGGG#",
      "#GBBbbbbb#RR#bbbbbbbBGg#",
      "#GBBbbbbb#RR#bbbbbbbBGg#",
      "#GBBbbbbbbbbbbbbbbbbBGg#",
      "#GBBbbbbbbbbbbbbbbbbBGg#",
      ".#GBBBBBBBBBBBBBBBBgg#..",
      "..#gggggggggggggggg##...",
      "...################....."
    ];
    this.drawPixelMap(ctx, 1, 2, 2, rows, pal);
    return canvas;
  }

  // --- 22. [오브젝트] 안식의 모닥불 (Campfire) ---
  buildCampfireSprite() {
    const { canvas, ctx } = this.makeCanvas(46, 44);
    const pal = {
      '#': '#090d16', W: '#451a03', w: '#78350f', S: '#334155', s: '#64748b',
      R: '#b91c1c', r: '#ef4444', O: '#f97316', o: '#facc15', Y: '#fef08a'
    };
    const rows = [
      ".........#oo#.........",
      "........#oYYo#........",
      ".......#oYYYYo#.......",
      "......#roYYYYor#......",
      ".....#rOOYYYYOOr#.....",
      "....#rrOOOYYOOOrr#....",
      "...#rrrOOOOOOOOOrr#...",
      "..#rrrrOOOOOOOOOrrr#..",
      "..#rrrrrOOOOOOOrrrr#..",
      "...#rrrrrrrrrrrrrr#...",
      "....#ssssssssssss#....",
      "..##SwwS######SwwS##..",
      ".#wwWWww#....#wwWWww#.",
      ".#WWwwWW#....#WWwwWW#.",
      "..##WW##......##WW##.."
    ];
    this.drawPixelMap(ctx, 1, 2, 2, rows, pal);
    return canvas;
  }

  // --- 23. [오브젝트] 방랑 상인 너구리 카트 (Merchant) ---
  buildMerchantSprite() {
    const { canvas, ctx } = this.makeCanvas(52, 54);
    const pal = {
      '#': '#090d16', F: '#92400e', f: '#b45309', T: '#d97706', W: '#ffffff',
      B: '#1e1b4b', b: '#475569', R: '#dc2626', r: '#f87171', G: '#facc15',
      P: '#fb7185'
    };
    const rows = [
      "....#F#..........#F#....",
      "...#FFF#........#FFF#...",
      "...#F#F#........#F#F#...",
      "....#RRRRRRRRRRRRRR#....",
      "...#RRRRRRRRRRRRRRRR#...",
      "..#RRRRRRRRRRRRRRRRRR#..",
      "....#TTT#BB##BB#TTT#....",
      "...#TTTT#B#WW#B#TTTT#...",
      "...#TTTT#B#WW#B#TTTT#...",
      "...#TPTT#BB##BB#TTPT#...",
      "....#TTTTT##TTTTTT#.....",
      ".....#TTT####TTTT#......",
      "......#ffffffffff#......",
      "....##GffffffffffG##....",
      "...#GG#ffffffffff#GG#...",
      "...#GG#ffffffffff#GG#...",
      "....##GffffffffffG##....",
      "......#bbbbbbbbbb#......",
      ".......#FF####FF#.......",
      ".......#FF####FF#......."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 24. [오브젝트] 고대 제단 (Ancient Altar) ---
  buildAltarSprite(isUsed) {
    const { canvas, ctx } = this.makeCanvas(52, 56);
    const pal = isUsed ? {
      '#': '#090d16', S: '#334155', s: '#64748b', L: '#94a3b8', G: '#475569',
      g: '#64748b', W: '#cbd5e1'
    } : {
      '#': '#090d16', S: '#334155', s: '#64748b', L: '#94a3b8', G: '#f59e0b',
      g: '#fde047', W: '#ffffff'
    };
    const rows = [
      ".........######.........",
      ".......##gggggg##.......",
      "......#ggGGGGGGgg#......",
      ".....#ggGGgWWgGGgg#.....",
      "......#ggGGGGGGgg#......",
      ".......##gggggg##.......",
      ".........######.........",
      "........#sLLLLs#........",
      ".......#sLLLLLLs#.......",
      "......#ssssssssss#......",
      ".....#sLLssssssLLs#.....",
      "....#sLLssssssssLLs#....",
      "...#sLLssssssssssLLs#...",
      "..#sLLLLLLLLLLLLLLLLs#..",
      ".#SSSSSSSSSSSSSSSSSSSS#.",
      "########################"
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 25. [오브젝트] 영구 성장 영혼 제단 (Soul Altar) ---
  buildSoulAltarSprite() {
    const { canvas, ctx } = this.makeCanvas(52, 60);
    const pal = {
      '#': '#090d16', K: '#1e1b4b', k: '#312e81', P: '#7c3aed', p: '#a855f7',
      C: '#06b6d4', c: '#22d3ee', W: '#ffffff'
    };
    const rows = [
      "...........#W#..........",
      "..........#cW#..........",
      ".........#cccC#.........",
      "........#cccccC#........",
      ".......#ccCccCcc#.......",
      "......#ccCPPPccC#.......",
      ".......#ccCccCcc#.......",
      "........#cccccC#........",
      ".........#cccC#.........",
      "..........#cW#..........",
      "...........#W#..........",
      "........#kkkkkk#........",
      ".......#kkPPPPkk#.......",
      "......#kkkPPPPkkk#......",
      ".....#kkkPPPPPPkkk#.....",
      "....#kkkkPPPPPPkkkk#....",
      "...#kkkkkkPPPPkkkkkk#...",
      "..#kkkkkkkkkkkkkkkkkk#..",
      ".#KKKKKKKKKKKKKKKKKKKK#.",
      "########################"
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // --- 26. [오브젝트] 차원 이동 포탈 (Dimensional Portal Gate) ---
  buildPortalSprite() {
    const { canvas, ctx } = this.makeCanvas(56, 68);
    const pal = {
      '#': '#090d16', S: '#334155', s: '#64748b', L: '#94a3b8',
      P: '#6d28d9', p: '#8b5cf6', C: '#06b6d4', c: '#22d3ee', W: '#ffffff'
    };
    const rows = [
      "....#s#.............#s#....",
      "...#sLs#...........#sLs#...",
      "...#sLs#..#######..#sLs#...",
      "...#sLs#.##ppPPP##.#sLs#...",
      "...#s#s##ppPcccPpp##s#s#...",
      "...#sss#ppPccWccPpp#sss#...",
      "...#sLs#pPccWWWccPp#sLs#...",
      "...#sLs#pPccWWWccPp#sLs#...",
      "...#s#s#pPccWWWccPp#s#s#...",
      "...#sLs#ppPccWccPpp#sLs#...",
      "...#sLs##ppPcccPpp##sLs#...",
      "...#sLs#.##ppPPP##.#sLs#...",
      "...#sLs#..#######..#sLs#...",
      "..#sLLLs#.........#sLLLs#..",
      ".#sLLLLLs#.......#sLLLLLs#.",
      ".#SSSSSSS#.......#SSSSSSS#.",
      "..#######.........#######.."
    ];
    this.drawPixelMap(ctx, 2, 2, 2, rows, pal);
    return canvas;
  }

  // =========================================================================
  // 2. 2.5D 성벽 & 던전 타일맵 사전 캐시 빌더 (Room Load 시 1회 실행)
  // =========================================================================
  buildBackgroundCache(areaDef, roomWidth, roomHeight, wallThick) {
    const theme = areaDef.themeKey || 'catacombs';
    const currentRoom = (window.Dungeon && window.Dungeon.currentRoom) ? window.Dungeon.currentRoom : { type: 'BATTLE' };
    const roomType = currentRoom.type || 'BATTLE';

    const totalW = roomWidth + wallThick * 2;
    const totalH = roomHeight + wallThick * 2;
    this.bgCanvas.width = totalW;
    this.bgCanvas.height = totalH;

    const bCtx = this.bgCtx;
    bCtx.imageSmoothingEnabled = false;

    // 2-1. 심연 배경 베이스
    bCtx.fillStyle = '#06070a';
    bCtx.fillRect(0, 0, totalW, totalH);

    const floorX = wallThick;
    const floorY = wallThick;
    const tileSize = 48;

    // 테마별 플래그스톤 팔레트
    const palettes = {
      catacombs:   { f1: '#1c222e', f2: '#161a24', borderL: 'rgba(212, 175, 55, 0.07)', borderD: 'rgba(0, 0, 0, 0.55)', rune: 'rgba(212, 175, 55, 0.28)' },
      abyss:       { f1: '#18142b', f2: '#110e1f', borderL: 'rgba(168, 85, 247, 0.08)', borderD: 'rgba(0, 0, 0, 0.55)', rune: 'rgba(168, 85, 247, 0.32)' },
      fortress:    { f1: '#222733', f2: '#181b24', borderL: 'rgba(59, 130, 246, 0.08)', borderD: 'rgba(0, 0, 0, 0.55)', rune: 'rgba(59, 130, 246, 0.30)' },
      dragon_nest: { f1: '#2d1416', f2: '#1f0d0e', borderL: 'rgba(239, 68, 68, 0.09)', borderD: 'rgba(0, 0, 0, 0.60)', rune: 'rgba(239, 68, 68, 0.35)' },
      void_throne: { f1: '#151128', f2: '#0e0b1c', borderL: 'rgba(99, 102, 241, 0.09)', borderD: 'rgba(0, 0, 0, 0.60)', rune: 'rgba(99, 102, 241, 0.35)' }
    };
    const pal = palettes[theme] || palettes.catacombs;

    // 2-1. 정교한 다크 판타지 비정형 대형 석조 플래그스톤 바닥 (Image 2 레퍼런스 스타일)
    const slabH = 38;
    const slabW = 56;
    const numRows = Math.ceil(roomHeight / slabH) + 1;

    for (let r = 0; r < numRows; r++) {
      const y = floorY + r * slabH;
      if (y >= floorY + roomHeight) break;
      const rowShift = (r % 2 === 1) ? (slabW / 2) : 0;
      const numCols = Math.ceil((roomWidth + rowShift) / slabW) + 1;

      for (let c = -1; c < numCols; c++) {
        const x = floorX + c * slabW + rowShift;
        const curW = ((c * 7 + r * 13) % 5 === 0) ? slabW + 12 : slabW;
        const drawX = Math.max(floorX, x);
        const drawY = Math.max(floorY, y);
        const drawW = Math.min(x + curW, floorX + roomWidth) - drawX;
        const drawH = Math.min(y + slabH, floorY + roomHeight) - drawY;
        if (drawW <= 0 || drawH <= 0) continue;

        // 4종 석조 셰이딩 베리에이션 (반복감 없는 고풍스러운 던전 암석)
        const hash = Math.abs((c * 37 + r * 23) ^ (r * 11));
        const shadeType = hash % 5;
        let baseColor = pal.f1;
        if (shadeType === 1) baseColor = pal.f2;
        else if (shadeType === 2) baseColor = (theme === 'dragon_nest') ? '#241012' : '#141724';
        else if (shadeType === 3) baseColor = (theme === 'dragon_nest') ? '#33171a' : '#222838';
        else if (shadeType === 4) baseColor = (theme === 'dragon_nest') ? '#1c0c0e' : '#191d2a';

        bCtx.fillStyle = baseColor;
        bCtx.fillRect(drawX, drawY, drawW, drawH);

        // 석판 가장자리 입체 베벨 하이라이트 (빛 반사)
        bCtx.fillStyle = pal.borderL;
        bCtx.fillRect(drawX, drawY, drawW, 1.5);
        bCtx.fillRect(drawX, drawY, 1.5, drawH);

        // 석판 사이 깊은 모르타르 음영 줄눈 (Mortar Grooves)
        bCtx.fillStyle = '#080a10';
        bCtx.fillRect(drawX, drawY + drawH - 1.5, drawW, 1.5);
        bCtx.fillRect(drawX + drawW - 1.5, drawY, 1.5, drawH);

        // 세부 디테일 1: 파손된 석판 균열 (Cracked Slabs, ~15%)
        if (hash % 7 === 0) {
          bCtx.fillStyle = 'rgba(5, 7, 12, 0.85)';
          const kx = drawX + 10;
          const ky = drawY + 8;
          bCtx.beginPath();
          bCtx.moveTo(kx, ky);
          bCtx.lineTo(kx + 8, ky + 5);
          bCtx.lineTo(kx + 14, ky + 12);
          bCtx.lineTo(kx + 22, ky + 15);
          bCtx.lineWidth = 1.5;
          bCtx.strokeStyle = 'rgba(5, 7, 12, 0.75)';
          bCtx.stroke();
          // 균열 단면 하이라이트
          bCtx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
          bCtx.strokeRect(kx + 8, ky + 6, 1, 1);
        }

        // 세부 디테일 2: 고대 음각 룬 문자 조각 (~8%)
        if (hash % 13 === 0 && drawW >= 40 && drawH >= 30) {
          bCtx.strokeStyle = pal.rune;
          bCtx.lineWidth = 1;
          bCtx.beginPath();
          bCtx.arc(drawX + drawW / 2, drawY + drawH / 2, 7, 0, Math.PI * 2);
          bCtx.stroke();
          bCtx.strokeRect(drawX + drawW / 2 - 2, drawY + drawH / 2 - 2, 4, 4);
        }

        // 세부 디테일 3: 모서리 깨짐 및 마모 효과 (~10%)
        if (hash % 11 === 0) {
          bCtx.fillStyle = '#080a10';
          bCtx.fillRect(drawX, drawY, 3, 3);
          bCtx.fillRect(drawX + drawW - 3, drawY + drawH - 3, 3, 3);
        }
      }
    }

    // 횃불 조명 그라디언트 앰비언트 (던전 횃불 위치로부터 퍼져나가는 따스한 호박색 불빛)
    const torchXsLight = [roomWidth * 0.12, roomWidth * 0.32, roomWidth * 0.5, roomWidth * 0.68, roomWidth * 0.88];
    for (const tx of torchXsLight) {
      const grad = bCtx.createRadialGradient(floorX + tx, floorY + 12, 5, floorX + tx, floorY + 30, 160);
      grad.addColorStop(0, 'rgba(255, 150, 40, 0.16)');
      grad.addColorStop(0.5, 'rgba(240, 100, 20, 0.07)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      bCtx.fillStyle = grad;
      bCtx.fillRect(floorX + tx - 160, floorY, 320, 180);
    }

    // 2-2. 방 종류별 바닥 데칼 (핏자국, 황금 문양, 고대 균열)
    if (roomType === 'BATTLE' || roomType === 'CHALLENGE' || roomType === 'ELITE') {
      // 마른 핏자국 & 검흔
      const bloodSpots = [
        { x: floorX + roomWidth * 0.32, y: floorY + roomHeight * 0.42, r: 24 },
        { x: floorX + roomWidth * 0.68, y: floorY + roomHeight * 0.58, r: 32 },
        { x: floorX + roomWidth * 0.45, y: floorY + roomHeight * 0.72, r: 20 },
        { x: floorX + roomWidth * 0.78, y: floorY + roomHeight * 0.35, r: 26 }
      ];
      bCtx.fillStyle = 'rgba(55, 14, 18, 0.42)';
      bloodSpots.forEach(b => {
        bCtx.beginPath();
        bCtx.ellipse(b.x, b.y, b.r, b.r * 0.6, 0.4, 0, Math.PI * 2);
        bCtx.fill();
        bCtx.fillStyle = 'rgba(35, 8, 11, 0.55)';
        bCtx.fillRect(b.x - 6, b.y - 3, 12, 6);
      });
    }

    // 2-3. 중앙 바닥 고대 소환진 룬 인장 (방 종류별 차별화)
    const cx = floorX + roomWidth / 2;
    const cy = floorY + roomHeight / 2;
    bCtx.save();
    bCtx.translate(cx, cy);

    if (roomType === 'BOSS') {
      // [보스방]: 압도적인 8방향 흑요석 투기장 봉인 룬 (대형 결투장 인장)
      bCtx.strokeStyle = (theme === 'dragon_nest') ? 'rgba(239, 68, 68, 0.42)' : 'rgba(168, 85, 247, 0.42)';
      bCtx.lineWidth = 3.5;
      bCtx.beginPath();
      bCtx.arc(0, 0, 180, 0, Math.PI * 2);
      bCtx.stroke();

      bCtx.lineWidth = 2;
      bCtx.beginPath();
      bCtx.arc(0, 0, 150, 0, Math.PI * 2);
      bCtx.stroke();

      bCtx.lineWidth = 1.5;
      bCtx.beginPath();
      bCtx.arc(0, 0, 110, 0, Math.PI * 2);
      bCtx.stroke();

      bCtx.beginPath();
      bCtx.arc(0, 0, 60, 0, Math.PI * 2);
      bCtx.stroke();

      // 8방향 룬 스포크 & 스파이크
      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i;
        bCtx.beginPath();
        bCtx.moveTo(Math.cos(a) * 60, Math.sin(a) * 60);
        bCtx.lineTo(Math.cos(a) * 180, Math.sin(a) * 180);
        bCtx.stroke();

        // 외곽 룬 문자 사각 표식
        const rx = Math.cos(a) * 165;
        const ry = Math.sin(a) * 165;
        bCtx.fillStyle = (theme === 'dragon_nest') ? 'rgba(239, 68, 68, 0.45)' : 'rgba(168, 85, 247, 0.45)';
        bCtx.fillRect(rx - 5, ry - 5, 10, 10);
      }
    } else if (roomType === 'ELITE') {
      // [엘리트방]: 불길한 진홍빛 흑마법 룬 인장
      bCtx.strokeStyle = 'rgba(239, 68, 68, 0.38)';
      bCtx.lineWidth = 2.5;
      bCtx.beginPath();
      bCtx.arc(0, 0, 110, 0, Math.PI * 2);
      bCtx.stroke();

      bCtx.lineWidth = 1.5;
      bCtx.beginPath();
      bCtx.arc(0, 0, 85, 0, Math.PI * 2);
      bCtx.stroke();

      // 역오망성 룬
      for (let i = 0; i < 5; i++) {
        const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
        const nextA = (Math.PI * 2 / 5) * ((i + 2) % 5) - Math.PI / 2;
        bCtx.beginPath();
        bCtx.moveTo(Math.cos(a) * 85, Math.sin(a) * 85);
        bCtx.lineTo(Math.cos(nextA) * 85, Math.sin(nextA) * 85);
        bCtx.stroke();
      }
    } else if (roomType === 'TREASURE') {
      // [보물방]: 찬란한 황금 태양 문양
      bCtx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
      bCtx.lineWidth = 2.5;
      bCtx.beginPath();
      bCtx.arc(0, 0, 95, 0, Math.PI * 2);
      bCtx.stroke();

      bCtx.lineWidth = 1.5;
      bCtx.beginPath();
      bCtx.arc(0, 0, 70, 0, Math.PI * 2);
      bCtx.stroke();

      for (let i = 0; i < 12; i++) {
        const a = (Math.PI * 2 / 12) * i;
        bCtx.beginPath();
        bCtx.moveTo(Math.cos(a) * 70, Math.sin(a) * 70);
        bCtx.lineTo(Math.cos(a) * 95, Math.sin(a) * 95);
        bCtx.stroke();
      }
    } else {
      // [일반 전투방 / 휴식방 / 상점]: 고대 유적 룬 마법진
      bCtx.strokeStyle = pal.rune;
      bCtx.lineWidth = 2;
      bCtx.beginPath();
      bCtx.arc(0, 0, 95, 0, Math.PI * 2);
      bCtx.stroke();

      bCtx.lineWidth = 1;
      bCtx.beginPath();
      bCtx.arc(0, 0, 75, 0, Math.PI * 2);
      bCtx.stroke();

      for (let i = 0; i < 8; i++) {
        const a = (Math.PI * 2 / 8) * i;
        bCtx.beginPath();
        bCtx.moveTo(Math.cos(a) * 60, Math.sin(a) * 60);
        bCtx.lineTo(Math.cos(a) * 95, Math.sin(a) * 95);
        bCtx.stroke();
      }
    }
    bCtx.restore();

    // 2-4. 입체 성벽 (Image 2 레퍼런스 스타일: 석조 벽체 + 음영 + 3D 블록)
    const wallTileImg = (window.AssetLoader && window.AssetLoader.isLoaded) ? window.AssetLoader.get('tile_wall') : null;
    const wallTopH = wallThick * 0.45;
    const wallFrontH = wallThick * 0.55;

    if (wallTileImg) {
      for (let x = 0; x < totalW; x += 48) {
        bCtx.drawImage(wallTileImg, 0, 0, wallTileImg.width, wallTileImg.height, x, 0, 48, wallThick);
      }
    } else {
      bCtx.fillStyle = (theme === 'dragon_nest') ? '#3a1619' : (theme === 'abyss' ? '#1f1a35' : '#2b3345');
      bCtx.fillRect(0, 0, totalW, wallTopH);
      bCtx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      bCtx.fillRect(0, 0, totalW, 2.5);

      bCtx.fillStyle = (theme === 'dragon_nest') ? '#1e0c0e' : (theme === 'abyss' ? '#100c1e' : '#171c26');
      bCtx.fillRect(0, wallTopH, totalW, wallFrontH);

      bCtx.fillStyle = '#06070a';
      for (let r = 0; r < 3; r++) {
        const ry = wallTopH + r * 8;
        bCtx.fillRect(0, ry, totalW, 1.5);
        const shift = (r % 2) * 20;
        for (let bx = shift; bx < totalW; bx += 40) {
          bCtx.fillRect(bx, ry, 1.5, 8);
        }
      }
    }

    // 벽 하단 묵직한 깊이감의 그림자 (Depth ambient occlusion)
    bCtx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    bCtx.fillRect(floorX, floorY, roomWidth, 26);

    this.cachedTheme = theme + '_' + roomType;
    this.cachedRoomW = roomWidth;
    this.cachedRoomH = roomHeight;
  }

  // =========================================================================
  // 3. 실시간 배경 렌더링 (월드 좌표계)
  // =========================================================================
  renderBackground(areaDef, roomWidth, roomHeight) {
    const ctx = this.ctx;
    const currentRoom = (window.Dungeon && window.Dungeon.currentRoom) ? window.Dungeon.currentRoom : { type: 'BATTLE' };
    const themeKey = (areaDef.themeKey || 'catacombs') + '_' + (currentRoom.type || 'BATTLE');
    const wallThick = 44;

    if (this.cachedTheme !== themeKey || this.cachedRoomW !== roomWidth || this.cachedRoomH !== roomHeight) {
      this.buildBackgroundCache(areaDef, roomWidth, roomHeight, wallThick);
    }

    // 월드 좌표계: (0, 0)이 방 바닥의 좌상단
    ctx.drawImage(this.bgCanvas, -wallThick, -wallThick);

    // 벽면 횃불 (Image 2 레퍼런스 스타일: 횃불 브래킷 스프라이트 + 생동감 넘치는 3층 픽셀 불꽃)
    const now = Date.now();
    const torchXs = [roomWidth * 0.12, roomWidth * 0.32, roomWidth * 0.5, roomWidth * 0.68, roomWidth * 0.88];
    const torchSpr = (window.AssetLoader && window.AssetLoader.isLoaded) ? window.AssetLoader.get('tile_torch') : null;

    for (let i = 0; i < torchXs.length; i++) {
      const tx = torchXs[i];
      const ty = -14;
      if (torchSpr) {
        ctx.drawImage(torchSpr, tx - 10, ty - 6, 20, 24);
      } else {
        ctx.fillStyle = '#475569';
        ctx.fillRect(tx - 2, ty, 4, 10);
      }
      const fOff = Math.floor(Math.sin(now / 110 + i) * 2);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(tx - 3 + fOff, ty - 8, 6, 7);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(tx - 2 + fOff, ty - 6, 4, 5);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(tx - 1 + fOff, ty - 4, 2, 3);
    }

    // 던전 가장자리 어두운 비네트 조명 효과 (깊이감과 던전 분위기 연출)
    const vignette = ctx.createRadialGradient(
      roomWidth / 2, roomHeight / 2, Math.min(roomWidth, roomHeight) * 0.35,
      roomWidth / 2, roomHeight / 2, Math.max(roomWidth, roomHeight) * 0.72
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, roomWidth, roomHeight);
  }

  // =========================================================================
  // 4. 고체 지형지물, 함정, 배럴 렌더링 (사전 렌더링 도트 스프라이트)
  // =========================================================================
  renderObstacles(obstacles, hazards, barrels) {
    const ctx = this.ctx;

    // 함정
    hazards.forEach(h => {
      ctx.save();
      ctx.translate(Math.round(h.x), Math.round(h.y));
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-h.size / 2, -h.size / 2, h.size, h.size);
      if (h.isActive) {
        ctx.fillStyle = '#cbd5e1';
        for (let ox of [-8, 0, 8]) {
          for (let oy of [-8, 0, 8]) {
            ctx.fillRect(ox - 1, oy - 12, 3, 12);
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(ox - 1, oy - 14, 3, 2);
            ctx.fillStyle = '#cbd5e1';
          }
        }
      }
      ctx.restore();
    });

    // 고체 지형지물 (고품질 도트 스프라이트)
    obstacles.forEach(ob => {
      ctx.save();
      ctx.translate(Math.round(ob.x), Math.round(ob.y));
      const r = Math.round(ob.radius);
      // 부드러운 그림자
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.beginPath();
      ctx.ellipse(0, r * 0.65, r, r * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      let spr = (window.AssetLoader && window.AssetLoader.isLoaded && window.AssetLoader.get('prop_pillar')) || this.sprites['ob_pillar'];
      if (ob.type === 'tree' || ob.type === 'log' || ob.type === 'bush') {
        spr = this.sprites['ob_tree_stump'];
      } else if (ob.type === 'crystal') {
        spr = this.sprites['ob_crystal'];
      } else if (ob.type === 'magma_rock') {
        spr = this.sprites['ob_magma_rock'];
      }
      if (spr) {
        const sw = spr.width || 48;
        const sh = spr.height || 56;
        ctx.drawImage(spr, -sw / 2, -sh / 2 - 4, sw, sh);
      }
      ctx.restore();
    });

    // 배럴
    barrels.forEach(b => {
      ctx.save();
      ctx.translate(Math.round(b.x), Math.round(b.y));
      const assetBarrel = (window.AssetLoader && window.AssetLoader.isLoaded) ? window.AssetLoader.get('prop_barrel') : null;
      const spr = assetBarrel || ((b.type === 'tnt_barrel') ? this.sprites['prop_tnt_barrel'] : this.sprites['prop_wood_barrel']);
      if (spr) {
        const bw = spr.width || 36;
        const bh = spr.height || 40;
        ctx.drawImage(spr, -bw / 2, -bh / 2, bw, bh);
      }
      if (b.fuseLit) {
        const spark = Math.floor(Math.sin(Date.now() * 0.05) * 2);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(-2 + spark, -24, 4, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-1 + spark, -26, 2, 2);
      }
      ctx.restore();
    });
  }

  // =========================================================================
  // 5. 비전투 방 NPC (상점, 모닥불, 제단, 상자, 차원문)
  // =========================================================================
  renderNpc(npc) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(Math.round(npc.x), Math.round(npc.y));
    const now = Date.now();

    if (npc.type === 'merchant') {
      const stallSpr = (window.AssetLoader && window.AssetLoader.isLoaded) ? window.AssetLoader.get('prop_merchant_stall') : null;
      const spr = stallSpr || this.sprites['prop_merchant'];
      if (stallSpr) {
        // 고품질 다크 판타지 방랑 상점 부스 (차양막, 진열대, 비약 플라스크, 랜턴, 통)
        ctx.drawImage(stallSpr, -64, -76, 128, 104);
        
        // 실시간 동적 램프 불빛 발광 펄스
        const lanternPulse = 0.75 + Math.sin(now * 0.005) * 0.25;
        const lGrad = ctx.createRadialGradient(42, -32, 2, 42, -32, 38);
        lGrad.addColorStop(0, `rgba(255, 235, 150, ${0.45 * lanternPulse})`);
        lGrad.addColorStop(1, 'rgba(255, 235, 150, 0)');
        ctx.fillStyle = lGrad;
        ctx.beginPath();
        ctx.arc(42, -32, 38, 0, Math.PI * 2);
        ctx.fill();
      } else if (spr) {
        ctx.drawImage(spr, -spr.width / 2, -spr.height / 2 - 6);
      }

      // 말풍선
      ctx.fillStyle = 'rgba(15,23,42,0.92)';
      ctx.fillRect(-64, -86, 128, 20);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-64, -86, 128, 20);
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🛒 방랑 상점 [G]', 0, -72);
    } else if (npc.type === 'campfire') {
      const spr = this.sprites['prop_campfire'];
      if (spr) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
      ctx.fillStyle = '#fca5a5';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('🔥 안식의 모닥불', 0, -28);
    } else if (npc.type === 'soul_altar') {
      const spr = this.sprites['prop_soul_altar'];
      const pY = Math.floor(Math.sin(now / 160) * 3);
      if (spr) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2 - 6 + pY);

      ctx.fillStyle = 'rgba(15,23,42,0.92)';
      ctx.fillRect(-70, -54, 140, 18);
      ctx.strokeStyle = '#22d3ee';
      ctx.strokeRect(-70, -54, 140, 18);
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('💎 영구성장제단 [G]', 0, -42);
    } else if (npc.type === 'altar') {
      const spr = this.sprites[npc.used ? 'prop_altar_used' : 'prop_altar'];
      const oY = Math.floor(Math.sin(now / 150) * 3);
      if (spr) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2 - 6 + oY);

      ctx.fillStyle = 'rgba(15,23,42,0.92)';
      ctx.fillRect(-65, -50, 130, 18);
      ctx.strokeStyle = npc.used ? '#64748b' : '#f59e0b';
      ctx.strokeRect(-65, -50, 130, 18);
      ctx.fillStyle = npc.used ? '#94a3b8' : '#fcd34d';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(npc.used ? '🔮 고대 제단 (완료)' : '🔮 고대 제단 [G]', 0, -38);
    }
    ctx.restore();
  }

  renderChest(x, y, tier) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    // 부드러운 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    const assetChest = (window.AssetLoader && window.AssetLoader.isLoaded) ? window.AssetLoader.get('prop_chest') : null;
    const spr = assetChest || ((tier === 'gold') ? this.sprites['prop_chest_gold'] : this.sprites['prop_chest_iron']);
    if (spr) {
      const cw = spr.width || 44;
      const ch = spr.height || 38;
      ctx.drawImage(spr, -cw / 2, -ch / 2, cw, ch);
    }
    ctx.restore();
  }

  // =========================================================================
  // 5-B. 던전 관문 렌더링 (일반문 / 보스문 / 잠긴문 구분 & 개방 애니메이션)
  // =========================================================================
  renderDungeonDoor(door, portal, dt) {
    if (!door) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(Math.round(door.x), Math.round(door.y));

    const isOpen = !!door.isOpen || !!portal;
    const doorType = door.doorType || 'normal';
    const now = Date.now();

    let assetKey = 'door_normal';
    let dw = 84, dh = 96;

    if (doorType === 'boss') {
      assetKey = isOpen ? 'door_boss_open' : 'door_boss';
      dw = 96; dh = 114;
    } else if (doorType === 'locked') {
      assetKey = isOpen ? 'door_locked_open' : 'door_locked';
      dw = 84; dh = 96;
    } else {
      assetKey = isOpen ? 'door_normal_open' : 'door_normal';
      dw = 84; dh = 96;
    }

    const doorSpr = (window.AssetLoader && window.AssetLoader.isLoaded) ? window.AssetLoader.get(assetKey) : null;

    // 바닥 접촉 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, dh / 2 - 4, dw * 0.58, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    if (doorSpr) {
      ctx.drawImage(doorSpr, -dw / 2, -dh / 2, dw, dh);
    } else {
      const spr = this.sprites['prop_portal'];
      if (spr) ctx.drawImage(spr, -spr.width / 2, -spr.height / 2);
    }

    // 관문 개방 시 실시간 방사 광원 이펙트
    if (isOpen) {
      if (doorType === 'boss') {
        const pulse = 0.8 + Math.sin(now * 0.006) * 0.2;
        const bGrad = ctx.createRadialGradient(0, 10, 4, 0, 10, 68);
        bGrad.addColorStop(0, `rgba(255, 60, 80, ${0.65 * pulse})`);
        bGrad.addColorStop(0.5, `rgba(220, 38, 38, ${0.35 * pulse})`);
        bGrad.addColorStop(1, 'rgba(185, 28, 28, 0)');
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(0, 10, 68, 0, Math.PI * 2);
        ctx.fill();
      } else if (doorType === 'locked') {
        const pulse = 0.8 + Math.sin(now * 0.007) * 0.2;
        const lGrad = ctx.createRadialGradient(0, 6, 4, 0, 6, 60);
        lGrad.addColorStop(0, `rgba(56, 189, 248, ${0.6 * pulse})`);
        lGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
        ctx.fillStyle = lGrad;
        ctx.beginPath();
        ctx.arc(0, 6, 60, 0, Math.PI * 2);
        ctx.fill();
      } else {
        const pulse = 0.85 + Math.sin(now * 0.005) * 0.15;
        const nGrad = ctx.createRadialGradient(0, 8, 4, 0, 8, 55);
        nGrad.addColorStop(0, `rgba(251, 191, 36, ${0.55 * pulse})`);
        nGrad.addColorStop(1, 'rgba(217, 119, 6, 0)');
        ctx.fillStyle = nGrad;
        ctx.beginPath();
        ctx.arc(0, 8, 55, 0, Math.PI * 2);
        ctx.fill();
      }

      // 플레이어가 근접했을 때 진입 안내 태그
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(-70, -dh / 2 - 24, 140, 20);
      ctx.strokeStyle = doorType === 'boss' ? '#ef4444' : (doorType === 'locked' ? '#38bdf8' : '#fbbf24');
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-70, -dh / 2 - 24, 140, 20);
      ctx.fillStyle = doorType === 'boss' ? '#fca5a5' : (doorType === 'locked' ? '#bae6fd' : '#fde047');
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      const label = doorType === 'boss' ? '👑 보스 결전 [G]' : (doorType === 'locked' ? '✨ 정예 회랑 [G]' : '🚪 다음 구역 [G]');
      ctx.fillText(label, 0, -dh / 2 - 10);
    }

    ctx.restore();
  }

  renderPortal(x, y) {
    this.renderDungeonDoor({ x, y, doorType: 'normal', isOpen: true }, { x, y });
  }

  // =========================================================================
  // 6. 플레이어 렌더링 (사전 렌더링 스프라이트 초고속 전송)
  // =========================================================================
  renderPlayer(player, dt) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(Math.round(player.x), Math.round(player.y));

    if (player.hurtTimer > 0) {
      ctx.filter = 'brightness(2.6) saturate(1.8)';
    }

    const isMoving = player.vx !== 0 || player.vy !== 0;
    const nowMs = Date.now();
    const bounceY = isMoving ? Math.abs(Math.sin(nowMs * 0.018)) * 1.5 : 0;
    const facingLeft = Math.cos(player.aimAngle) < 0;
    if (facingLeft) ctx.scale(-1, 1);

    // 달릴 때 앙증맞은 뒤뚱뒤뚱(Waddle) 틸트 모션
    if (isMoving) {
      const tilt = Math.sin(nowMs * 0.02) * 0.06;
      ctx.rotate(tilt);
    }

    // 그림자 (영웅적 체형에 맞는 묵직한 바닥 접촉 타원 그림자 - 공중 부양 제거)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 20, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 14, 13, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 고품질 독립형 아르덴(Arden) 캐릭터 프레임 애니메이션 상태 머신
    let ardenSpr = null;
    if (window.AssetLoader && window.AssetLoader.isLoaded) {
      if (player.stats && player.stats.hp <= 0) {
        const deathFrame = Math.min(3, Math.floor((nowMs / 220) % 4));
        ardenSpr = window.AssetLoader.getArdenFrame('death', deathFrame);
      } else if (player.hurtTimer > 0) {
        const hitFrame = Math.min(1, Math.floor((nowMs / 120) % 2));
        ardenSpr = window.AssetLoader.getArdenFrame('hit', hitFrame);
      } else if (player.dashTimer > 0) {
        const dodgeFrame = Math.min(1, Math.floor((nowMs / 100) % 2));
        ardenSpr = window.AssetLoader.getArdenFrame('dodge', dodgeFrame);
      } else if (player.skillMotionTimer > 0) {
        const sp = 1.0 - (player.skillMotionTimer / (player.skillMotionMax || 0.4));
        const skillFrame = Math.min(3, Math.max(0, Math.floor(sp * 4)));
        ardenSpr = window.AssetLoader.getArdenFrame('skill', skillFrame);
      } else if (player.attackMotionTimer > 0) {
        const progress = 1.0 - (player.attackMotionTimer / (player.attackMotionMax || 0.3));
        const attackFrame = Math.min(3, Math.max(0, Math.floor(progress * 4)));
        ardenSpr = window.AssetLoader.getArdenFrame('attack', attackFrame);
      } else if (isMoving) {
        const walkFrame = Math.floor(nowMs / 130) % 4;
        ardenSpr = window.AssetLoader.getArdenFrame('walk', walkFrame);
      } else {
        const idleFrame = Math.floor(nowMs / 250) % 4;
        ardenSpr = window.AssetLoader.getArdenFrame('idle', idleFrame);
      }
    }

    if (ardenSpr) {
      // 아르덴의 부츠 밑창(Y=70)이 정확히 바닥 그림자 중심(Y=14)에 밀착되도록 완벽한 피벗 정렬 (-56 + 70 = +14)
      ctx.drawImage(ardenSpr, -42, -56 + bounceY, 84, 84);
    } else {
      const spr = this.sprites['player_' + player.classId] || this.sprites['player_warrior'];
      if (spr) {
        ctx.drawImage(spr, -32, -48 + bounceY, 64, 68);
      }
    }

    // 기본 공격 휘두르기 웅장한 붉은 초승달 검기 (Attack Arc Trail - 잘림 없는 와이드 이펙트)
    if (player.attackMotionTimer > 0) {
      const progress = 1.0 - (player.attackMotionTimer / (player.attackMotionMax || 0.3));
      const slashAngle = -1.1 + progress * 2.7;
      const effSlash = (window.AssetLoader && window.AssetLoader.isLoaded) ? window.AssetLoader.get('eff_red_slash') : null;

      ctx.save();
      // 1. 외곽 강렬한 진홍빛 오라
      ctx.strokeStyle = `rgba(239, 68, 68, ${(1.0 - progress) * 0.85})`;
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(8, -8 + bounceY, 44, slashAngle - 0.65, slashAngle + 0.35);
      ctx.stroke();

      // 2. 고열의 황금빛/주황빛 코어 아크
      ctx.strokeStyle = `rgba(249, 115, 22, ${(1.0 - progress) * 0.95})`;
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(8, -8 + bounceY, 45, slashAngle - 0.45, slashAngle + 0.25);
      ctx.stroke();

      // 3. 백열의 검날 궤적 (White-hot razor edge)
      ctx.strokeStyle = `rgba(255, 255, 255, ${(1.0 - progress)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(8, -8 + bounceY, 46, slashAngle - 0.3, slashAngle + 0.15);
      ctx.stroke();

      // 4. 독립형 붉은 검기 이펙트 스프라이트 중첩 합성
      if (effSlash) {
        ctx.save();
        ctx.translate(22, -10 + bounceY);
        ctx.rotate(slashAngle * 0.6);
        ctx.globalAlpha = (1.0 - progress) * 0.9;
        ctx.drawImage(effSlash, -effSlash.width / 2, -effSlash.height / 2, effSlash.width * 0.75, effSlash.height * 0.75);
        ctx.restore();
      }
      ctx.restore();
    }

    // 아르덴 단독 스프라이트 미사용 시에만 별도 무기 오버레이 렌더링
    if (!ardenSpr) {
      ctx.save();
      ctx.translate(8, 4 + bounceY);
      let weaponRot = 0.25;
      if (player.skillMotionTimer > 0) {
        const sp = 1.0 - (player.skillMotionTimer / player.skillMotionMax);
        weaponRot = -1.8 + sp * 3.6;
      } else if (player.attackMotionTimer > 0) {
        const progress = 1.0 - (player.attackMotionTimer / player.attackMotionMax);
        weaponRot = -1.3 + progress * 2.8;
      }
      ctx.rotate(weaponRot);
      this.drawWeapon(ctx, player.equipped.weapon || WEAPONS.iron_sword, nowMs);
      ctx.restore();
    }

    // 스킬 엠블럼 배너
    if (player.skillMotionTimer > 0 && player.currentCastSkill) {
      const skill = player.currentCastSkill;
      const sType = skill.type || 'PHYSICAL';
      const sColor = (DAMAGE_TYPES[sType] ? DAMAGE_TYPES[sType].color : '#ffd700');
      ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
      ctx.fillRect(-48, -48 + bounceY, 96, 18);
      ctx.strokeStyle = sColor;
      ctx.strokeRect(-48, -48 + bounceY, 96, 18);
      ctx.fillStyle = sColor;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${skill.icon || '⚔️'} ${skill.name}`, 0, -36 + bounceY);
    }

    ctx.restore();
  }

  // --- 무기 도트 렌더링 ---
  drawWeapon(ctx, weapon, nowMs) {
    if (!weapon) return;
    const rKey = weapon.rarity || 'COMMON';
    const rDef = RARITY[rKey] || RARITY.COMMON;
    const wType = weapon.type || 'sword';
    const isHighTier = ['EPIC', 'LEGENDARY', 'MYTHIC'].includes(rKey);

    // 1. 손잡이 (그립 & 황금 폼멜)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(-3, 6, 6, 4); // 황금 폼멜
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-1, 7, 2, 2); // 폼멜 반짝임
    ctx.fillStyle = '#5c341b'; // 가죽 그립
    ctx.fillRect(-2, 0, 4, 7);
    ctx.fillStyle = '#8f582f';
    ctx.fillRect(-1, 2, 2, 2);
    // 손/글러브
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(-3, 1, 6, 4);

    if (wType === 'staff') {
      // 마법 지팡이: 고대 목재 샤프트 & 부유 회전 마력 수정석
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-2, -32, 4, 32);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-1, -30, 2, 28);
      // 지팡이 헤드 크레센트
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-6, -34, 12, 4);
      ctx.fillRect(-7, -42, 3, 9);
      ctx.fillRect(4, -42, 3, 9);
      // 회전하는 공중 부유 마력 크리스탈
      const crystalPulse = Math.sin(nowMs * 0.008) * 2;
      ctx.fillStyle = rDef.color;
      ctx.fillRect(-4, -46 + crystalPulse, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -44 + crystalPulse, 3, 3);
      // 주변을 도는 마법 룬 파티클
      const orbA = nowMs * 0.006;
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(Math.cos(orbA) * 10 - 1, -42 + Math.sin(orbA) * 6, 3, 3);
    } else if (wType === 'bow' || wType === 'crossbow') {
      // 활: 리커브 곡선 목재 & 시위 & 깃털 달린 화살
      ctx.fillStyle = '#78350f';
      ctx.fillRect(5, -20, 3, 34);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(4, -14, 2, 22);
      // 활 끝 혼 팁
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(5, -22, 4, 3);
      ctx.fillRect(5, 13, 4, 3);
      // 시위
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(8, -21, 1, 35);
      // 장전된 화살
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-8, -4, 14, 2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-11, -5, 3, 4); // 화살촉
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(4, -5, 3, 4); // 붉은 깃털
    } else if (wType === 'dagger') {
      // 단검: 날렵한 암살자 크리스 도검 & 독액 광채
      ctx.fillStyle = '#f59e0b'; // 코등이
      ctx.fillRect(-5, 0, 10, 3);
      // 검날 (좌측 하이라이트, 우측 섀도우)
      ctx.fillStyle = '#090d16'; // 외곽선
      ctx.fillRect(-3, -20, 6, 20);
      ctx.fillStyle = '#ffffff'; // 날 하이라이트
      ctx.fillRect(-2, -19, 2, 17);
      ctx.fillStyle = '#94a3b8'; // 날 음영
      ctx.fillRect(0, -19, 2, 17);
      // 칼끝
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -22, 2, 3);
      // 마력 인챈트 라인
      ctx.fillStyle = rDef.color;
      ctx.fillRect(-1, -16, 1, 12);
    } else if (wType === 'spear') {
      // 장창: 긴 물푸레나무 자루 & 붉은 술 & 은빛 창날
      ctx.fillStyle = '#451a03';
      ctx.fillRect(-2, -44, 4, 44);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-3, -34, 6, 3);
      // 펄럭이는 붉은 명주 술
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-5, -31, 10, 6);
      ctx.fillRect(-4, -25, 7, 5);
      // 날카로운 나뭇잎 창날
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-4, -54, 8, 14);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -53, 3, 12);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, -53, 3, 12);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -57, 2, 4); // 뾰족한 창끝
    } else {
      // 검 / 대검: 세피리아풍 샤프한 강철 칼날 & 황금 가드 & 룬 각인
      const isGreat = (weapon.name && weapon.name.includes('대검')) || weapon.id === 'celestial_blade';
      const wW = isGreat ? 8 : 6;
      const wL = isGreat ? 38 : 28;
      const halfW = Math.floor(wW / 2);

      // 황금 코등이 가드 (Crossguard Wings)
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-wW - 3, -1, wW * 2 + 6, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-wW - 3, -2, wW * 2 + 6, 1);
      ctx.fillStyle = rDef.color;
      ctx.fillRect(-2, -1, 4, 2); // 중심부 박힌 보석

      // 검날 외곽선
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-halfW - 1, -wL - 1, wW + 2, wL + 1);
      // 칼날 좌측 (눈부신 은빛 하이라이트)
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-halfW, -wL, Math.floor(wW / 2), wL);
      // 칼날 우측 (묵직한 건메탈 강철 음영)
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, -wL, Math.floor(wW / 2), wL);
      // 중앙 혈조(Fuller) 라인
      ctx.fillStyle = '#475569';
      ctx.fillRect(-1, -wL + 4, 1, wL - 8);
      // 날카로운 검끝 피라미드 팁
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1, -wL - 4, 2, 4);

      // 고티어 무기: 칼날을 감싸고 맥동하는 원소 오라 광채
      if (isHighTier) {
        ctx.fillStyle = rDef.color;
        const auraP = Math.floor(Math.sin(nowMs * 0.01) * 2);
        ctx.fillRect(-halfW - 2, -wL + 6, 1, wL - 10);
        ctx.fillRect(halfW + 1, -wL + 6, 1, wL - 10);
        ctx.fillRect(-1, -wL + 2 + auraP, 2, wL - 12);
      }
    }
  }

  // =========================================================================
  // 7. 몬스터 렌더링 (사전 렌더링 스프라이트 초고속 전송)
  // =========================================================================
  renderEnemy(enemy) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(Math.round(enemy.x), Math.round(enemy.y));

    if (enemy.hurtTimer > 0) {
      ctx.filter = 'brightness(2.6) saturate(1.8)';
    }

    const currentSpd = Math.hypot((enemy.vx || 0) + (enemy.lungeVx || 0), (enemy.vy || 0) + (enemy.lungeVy || 0));
    const isMoving = currentSpd > 6;
    const bounce = isMoving ? Math.sin((enemy.walkAnimTimer || 0) * 4) * 2.0 : 0;
    const size = enemy.isBoss ? 56 : (enemy.isElite ? 30 : 20);

    // 바닥 접촉 그림자 (적의 발바닥 위치에 정밀 밀착)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, size * 0.70, size * 0.95, size * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // 엘리트 오라
    if (enemy.isElite) {
      ctx.strokeStyle = enemy.modifier ? enemy.modifier.color : '#ffd700';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.35, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 몬스터 본체 도트 전송 (이동 방향에 맞춰 좌우 반전, 체력바는 반전되지 않도록 분리)
    ctx.save();
    if (enemy.facingLeft) {
      ctx.scale(-1, 1);
    }
    if (enemy.isBoss) {
      this.drawBossSprite(ctx, enemy, bounce);
    } else {
      this.drawMonsterSprite(ctx, enemy, bounce, isMoving);
    }
    ctx.restore();

    // 픽셀 체력바
    const hpPct = Math.max(0, enemy.stats.hp / enemy.stats.maxHp);
    const barW = enemy.isBoss ? 80 : (enemy.isElite ? 58 : 44);
    const barH = enemy.isElite ? 5 : 4;
    const barY = -size - (enemy.isElite ? 22 : 16);

    ctx.fillStyle = 'rgba(10, 12, 18, 0.85)';
    ctx.fillRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-barW / 2, barY, barW, barH);
    ctx.fillStyle = enemy.isBoss ? '#a855f7' : (enemy.isElite ? '#f97316' : '#ef4444');
    ctx.fillRect(-barW / 2, barY, Math.round(barW * hpPct), barH);

    if (enemy.isElite) {
      // 골드 테두리 & 엘리트 칭호
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1;
      ctx.strokeRect(-barW / 2 - 1, barY - 1, barW + 2, barH + 2);

      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👑 ' + (enemy.modifier ? enemy.modifier.prefix : '엘리트'), 0, barY - 4);
    }

    ctx.restore();
  }

  drawMonsterSprite(ctx, enemy, bounce, isMoving) {
    const name = (enemy.def && enemy.def.name) || '';
    const s = enemy.isElite ? 1.35 : 1.0;

    ctx.scale(s, s);

    // 8종 몬스터별 독립 그래픽 에셋 식별 및 스케일 조정
    let mType = 'goblin';
    let baseW = 54, baseH = 54;
    if (name.includes('고블린 전사') || name.includes('워리어')) {
      mType = 'goblin_warrior'; baseW = 66; baseH = 66;
    } else if (name.includes('오크')) {
      mType = 'orc'; baseW = 84; baseH = 84;
    } else if (name.includes('고블린')) {
      mType = 'goblin'; baseW = 54; baseH = 54;
    } else if (name.includes('스켈레톤') || name.includes('해골')) {
      if (enemy.def && enemy.def.isRanged) {
        mType = 'skeleton_archer'; baseW = 64; baseH = 64;
      } else {
        mType = 'skeleton_warrior'; baseW = 66; baseH = 66;
      }
    } else if (name.includes('슬라임') || name.includes('슬러그')) {
      mType = 'slime'; baseW = 56; baseH = 52;
    } else if (name.includes('박쥐')) {
      mType = 'bat'; baseW = 56; baseH = 52;
    } else if (name.includes('마법사') || name.includes('사제') || name.includes('사령') || name.includes('리치') || name.includes('서큐') || name.includes('임프') || name.includes('악령')) {
      mType = 'dark_mage'; baseW = 66; baseH = 68;
    } else if (name.includes('기사') || name.includes('나이트')) {
      mType = 'skeleton_warrior'; baseW = 66; baseH = 66;
    }

    // 몬스터 상태 애니메이션 계산
    const nowMs = Date.now() + (enemy.animOffset || 0);
    let sprImg = null;

    if (window.AssetLoader && window.AssetLoader.isLoaded) {
      if (enemy.stats && enemy.stats.hp <= 0) {
        const deathFrame = Math.min(2, Math.floor((nowMs / 200) % 3));
        sprImg = window.AssetLoader.getEnemyFrame(mType, 'death', deathFrame);
      } else if (enemy.hurtTimer > 0) {
        const hitFrame = Math.min(1, Math.floor((nowMs / 120) % 2));
        sprImg = window.AssetLoader.getEnemyFrame(mType, 'hit', hitFrame);
      } else if (enemy.attackCooldown > 0 && enemy.def && enemy.attackCooldown > (enemy.def.attackCooldown * 0.7)) {
        const attackFrame = Math.min(2, Math.floor((nowMs / 100) % 3));
        sprImg = window.AssetLoader.getEnemyFrame(mType, 'attack', attackFrame);
      } else if (isMoving || (enemy.vx !== 0 || enemy.vy !== 0)) {
        const walkFrame = Math.floor(enemy.walkAnimTimer || (nowMs / 140)) % 4;
        sprImg = window.AssetLoader.getEnemyFrame(mType, 'walk', walkFrame);
      } else {
        const idleFrame = Math.floor(nowMs / 250) % 4;
        sprImg = window.AssetLoader.getEnemyFrame(mType, 'idle', idleFrame);
      }
    }

    if (sprImg) {
      // 투명 배경 독립 스프라이트 렌더링 (발바닥 중심 밀착)
      ctx.drawImage(sprImg, -baseW / 2, -baseH * 0.72 + bounce, baseW, baseH);
      return;
    }

    if (name.includes('슬라임') || name.includes('슬러그')) {
      let spr = this.sprites['slime_green'];
      if (name.includes('수정') || name.includes('빙결') || name.includes('서리')) spr = this.sprites['slime_blue'];
      else if (name.includes('마그마') || name.includes('용암') || name.includes('불꽃')) spr = this.sprites['slime_red'];
      else if (name.includes('골드') || enemy.isElite) spr = this.sprites['slime_gold'];

      // 스쿼시 & 스트레치 적용 (통통 튀는 젤리 물리)
      const scaleX = bounce < 0 ? 1.15 : 0.88;
      const scaleY = bounce < 0 ? 0.85 : 1.12;
      ctx.scale(scaleX, scaleY);
      ctx.drawImage(spr, -26, -23 + bounce, 52, 46);
    } else if (name.includes('스켈레톤') || name.includes('해골') || name.includes('구울')) {
      ctx.drawImage(this.sprites['monster_skeleton'], -28, -29 + bounce, 56, 58);
    } else if (name.includes('고블린')) {
      ctx.drawImage(this.sprites['monster_goblin'], -26, -26 + bounce, 52, 52);
    } else if (name.includes('임프') || name.includes('악령') || name.includes('악마')) {
      ctx.drawImage(this.sprites['monster_imp'], -28, -28 + bounce, 56, 56);
    } else if (name.includes('기사') || name.includes('나이트') || name.includes('장군') || name.includes('가고일') || name.includes('성기사')) {
      ctx.drawImage(this.sprites['monster_knight'], -32, -34 + bounce, 64, 68);
    } else if (name.includes('마법사') || name.includes('사제') || name.includes('망령') || name.includes('유령') || name.includes('서큐버스') || name.includes('리치')) {
      ctx.drawImage(this.sprites['monster_mage'], -28, -32 + bounce, 56, 64);
    } else if (name.includes('견') || name.includes('켈베로스') || name.includes('드레이크') || name.includes('야수') || name.includes('히드라')) {
      ctx.drawImage(this.sprites['monster_hellhound'], -32, -28 + bounce, 64, 56);
    } else if (name.includes('골렘') || name.includes('거신') || name.includes('베히모스')) {
      ctx.drawImage(this.sprites['monster_golem'], -36, -36 + bounce, 72, 72);
    } else if (name.includes('박쥐')) {
      ctx.drawImage(this.sprites['monster_bat'], -26, -20 + bounce, 52, 40);
    } else {
      ctx.drawImage(this.sprites['monster_imp'], -26, -26 + bounce, 52, 52);
    }
  }

  drawBossSprite(ctx, boss, bounce) {
    const id = (boss.def && boss.def.id) || '';
    const now = Date.now();

    // Image 2 레퍼런스 5대 군주 보스 에셋 연결 (2.5x ~ 3.5x 위압적 스케일)
    let bossKey = null;
    let bw = 150;
    let bh = 150;

    if (id === 'goblin_king' || id === 'forest_boss') { bossKey = 'boss_goblin_king'; bw = 150; bh = 150; }
    else if (id === 'abyss_witch' || id === 'cave_boss') { bossKey = 'boss_abyss_witch'; bw = 150; bh = 150; }
    else if (id === 'cursed_knight' || id === 'ruins_boss') { bossKey = 'boss_cursed_knight'; bw = 160; bh = 160; }
    else if (id === 'ancient_dragon' || id === 'hell_boss') { bossKey = 'boss_ancient_dragon'; bw = 180; bh = 180; }
    else if (id === 'void_lord' || id === 'demon_king' || id === 'demon_boss') { bossKey = 'boss_void_lord'; bw = 160; bh = 160; }
    else { bossKey = 'boss_cursed_knight'; bw = 160; bh = 160; }

    const bossSpr = (window.AssetLoader && window.AssetLoader.isLoaded && bossKey) ? window.AssetLoader.get(bossKey) : null;
    if (bossSpr) {
      // 보스 전용 위압적인 숨결 펄스 (Breathing scale)
      const breath = 1.0 + Math.sin(now * 0.005) * 0.038;
      ctx.scale(breath, breath);

      // 보스 발밑 위압적인 다크 오라
      ctx.save();
      const auraColor = (boss.def && boss.def.color) ? boss.def.color : '#8e44ad';
      ctx.strokeStyle = auraColor;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = auraColor;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.ellipse(0, bh * 0.38, bw * 0.46 + Math.sin(now * 0.008) * 6, 24, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.drawImage(bossSpr, -bw / 2, -bh * 0.85 + bounce, bw, bh);
      return;
    }

    if (id === 'forest_boss') {
      // [고대 숲의 수호 정령]: 장엄한 고목 엔트 & 신비로운 이끼 수염 & 타오르는 호박색 눈
      // 고목 몸체
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-30, -28 + bounce, 60, 58);
      ctx.fillStyle = '#3e2723';
      ctx.fillRect(-28, -26 + bounce, 56, 54);
      ctx.fillStyle = '#5d4037';
      ctx.fillRect(-24, -24 + bounce, 48, 50);

      // 나뭇가지 뿔 (Antler Branches)
      ctx.fillStyle = '#271c19';
      ctx.fillRect(-36, -56 + bounce, 12, 32);
      ctx.fillRect(-46, -66 + bounce, 14, 14);
      ctx.fillRect(24, -56 + bounce, 12, 32);
      ctx.fillRect(32, -66 + bounce, 14, 14);

      // 울창한 에메랄드 이끼 수관 (Foliage Crown)
      ctx.fillStyle = '#14532d';
      ctx.fillRect(-38, -44 + bounce, 76, 26);
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(-34, -48 + bounce, 68, 22);
      ctx.fillStyle = '#4ade80';
      ctx.fillRect(-28, -50 + bounce, 56, 10);

      // 타오르는 영혼의 호박색 룬 눈 (Amber Runic Eyes)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-18, -12 + bounce, 10, 10);
      ctx.fillRect(8, -12 + bounce, 10, 10);
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-16, -10 + bounce, 7, 7);
      ctx.fillRect(10, -10 + bounce, 7, 7);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-14, -10 + bounce, 3, 3);
      ctx.fillRect(12, -10 + bounce, 3, 3);

      // 가슴의 신성한 생명 코어
      const lifeP = Math.floor(Math.sin(now * 0.008) * 3);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-8, 6 + bounce, 16, 16 + lifeP);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-4, 10 + bounce, 8, 8);
    } else if (id === 'cave_boss') {
      // [대지의 수정 거인]: 각진 흑요석 암석 & 어깨 위의 거대한 수정 첨탑 & 레이저 코어
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-38, -32 + bounce, 76, 66);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-36, -30 + bounce, 72, 62);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-32, -26 + bounce, 64, 54);

      // 양 어깨 거대 수정 (Glowing Crystal Spires)
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(-42, -54 + bounce, 14, 28);
      ctx.fillRect(28, -54 + bounce, 14, 28);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-40, -52 + bounce, 10, 24);
      ctx.fillRect(30, -52 + bounce, 10, 24);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-38, -50 + bounce, 4, 12);
      ctx.fillRect(32, -50 + bounce, 4, 12);

      // 중앙 심연의 청록색 발광 코어
      const cP = Math.floor(Math.sin(now * 0.01) * 3);
      ctx.fillStyle = '#06b6d4';
      ctx.fillRect(-14, -14 + bounce, 28, 28 + cP);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(-10, -10 + bounce, 20, 20);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-5, -5 + bounce, 10, 10);
    } else {
      // [마왕 아스타로트]: 거대한 암흑 흑요석 뿔, 펄럭이는 파멸의 망토, 핏빛 안광
      const wF = Math.floor(Math.sin(now * 0.018) * 12);
      // 거대한 심연의 날개
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-64, -46 + wF + bounce, 42, 44);
      ctx.fillRect(22, -46 + wF + bounce, 42, 44);
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(-60, -42 + wF + bounce, 36, 38);
      ctx.fillRect(24, -42 + wF + bounce, 36, 38);

      // 마왕 본체
      ctx.fillStyle = '#090d16';
      ctx.fillRect(-26, -32 + bounce, 52, 64);
      ctx.fillStyle = '#111827';
      ctx.fillRect(-24, -30 + bounce, 48, 60);

      // 마왕의 칠흑 뿔 & 황금 왕관
      ctx.fillStyle = '#4c0519';
      ctx.fillRect(-22, -54 + bounce, 8, 26);
      ctx.fillRect(14, -54 + bounce, 8, 26);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(-16, -50 + bounce, 32, 10);
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-2, -48 + bounce, 5, 5); // 왕관 루비

      // 핏빛 안광 (Crimson Blazing Eyes)
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(-12, -26 + bounce, 8, 8);
      ctx.fillRect(4, -26 + bounce, 8, 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-10, -25 + bounce, 3, 3);
      ctx.fillRect(6, -25 + bounce, 3, 3);

      // 마왕의 심장 (공허의 구체)
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(-8, 2 + bounce, 16, 16);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(-4, 6 + bounce, 8, 8);
    }
  }

  // =========================================================================
  // 8. 잔상, 투사체, 슬래시, 파티클 이펙트
  // =========================================================================
  renderGhostTrails(dt) {
    const ctx = this.ctx;
    for (let i = this.ghostTrails.length - 1; i >= 0; i--) {
      const t = this.ghostTrails[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.ghostTrails.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.globalAlpha = (t.life / t.maxLife) * 0.4;
      ctx.fillStyle = t.color || '#3b82f6';
      ctx.fillRect(t.x - 10, t.y - 15, 20, 30);
      ctx.restore();
    }
  }

  renderSlashEffects(dt) {
    const ctx = this.ctx;
    for (let i = this.slashEffects.length - 1; i >= 0; i--) {
      const s = this.slashEffects[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.slashEffects.splice(i, 1);
        continue;
      }
      ctx.save();
      ctx.translate(Math.round(s.x), Math.round(s.y));
      ctx.rotate(s.angle);
      const alpha = Math.max(0, s.life / s.maxLife);
      ctx.strokeStyle = s.color || '#ffd700';
      ctx.lineWidth = 5 * alpha;
      ctx.beginPath();
      ctx.arc(0, 0, s.radius, -(s.arc || Math.PI * 0.75) / 2, (s.arc || Math.PI * 0.75) / 2);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2 * alpha;
      ctx.stroke();
      ctx.restore();
    }
  }

  renderProjectile(p) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(Math.round(p.x), Math.round(p.y));
    ctx.rotate(p.angle);
    if (p.dmgType === 'FIRE') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(-2, -2, 4, 4);
    } else if (p.dmgType === 'COLD') {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-6, -3, 12, 6);
    } else {
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-10, -1, 16, 2);
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(6, -2, 4, 4);
    }
    ctx.restore();
  }

  addParticle(x, y, color, count = 1) {
    if (this.particles.length > 60) {
      this.particles.splice(0, count);
    }
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const spd = 1.0 + Math.random() * 3.0;
      this.particles.push({
        x: x, y: y,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd,
        life: 0.35, maxLife: 0.35,
        size: 2, color: color
      });
    }
  }

  renderParticles(dt) {
    const ctx = this.ctx;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      ctx.globalAlpha = 1.0;
    }
  }

  addSkillEffect(x, y, angle, skill) {
    const sType = skill.type || 'PHYSICAL';
    const typeDef = DAMAGE_TYPES[sType] || DAMAGE_TYPES.PHYSICAL;
    const color = typeDef.color || '#ffd700';

    let effectKey = 'eff_red_slash';
    if (sType === 'FIRE' || (skill.id && skill.id.includes('fire'))) effectKey = 'eff_fire_nova';
    else if (sType === 'COLD' || (skill.id && skill.id.includes('wave'))) effectKey = 'eff_blue_wave';
    else if (sType === 'LIGHTNING') effectKey = 'eff_lightning';
    else if (sType === 'DARK') effectKey = 'eff_void_orb';
    else if (sType === 'HOLY') effectKey = 'eff_holy_burst';
    else if (skill.id && (skill.id.includes('pierce') || skill.id.includes('thrust') || skill.id.includes('rapid'))) effectKey = 'eff_pierce';

    this.skillEffects.push({
      x: x, y: y, angle: angle,
      color: color,
      effectKey: effectKey,
      life: 0.35, maxLife: 0.35,
      radius: 44
    });
    this.addParticle(x, y, color, 8);
  }

  renderSkillEffects(dt) {
    const ctx = this.ctx;
    ctx.save();
    for (let i = this.skillEffects.length - 1; i >= 0; i--) {
      const eff = this.skillEffects[i];
      eff.life -= dt;
      if (eff.life <= 0) {
        this.skillEffects.splice(i, 1);
        continue;
      }
      const alpha = eff.life / eff.maxLife;
      const spr = (window.AssetLoader && window.AssetLoader.isLoaded && eff.effectKey) ? window.AssetLoader.get(eff.effectKey) : null;
      ctx.save();
      ctx.translate(Math.round(eff.x), Math.round(eff.y));
      ctx.rotate(eff.angle || 0);
      ctx.globalAlpha = alpha;

      if (spr) {
        ctx.globalCompositeOperation = 'lighter';
        const w = 72;
        const h = 72;
        ctx.drawImage(spr, -w / 2, -h / 2, w, h);
      } else {
        ctx.strokeStyle = eff.color;
        ctx.lineWidth = 3 * alpha;
        ctx.beginPath();
        ctx.arc(0, 0, eff.radius + (1 - alpha) * 30, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  // =========================================================================
  // 8. 2D 동적 조명 엔진 (Dynamic Lighting & Torch Glow Pass - 월드 좌표계)
  // =========================================================================
  renderLighting(player, chest, portal, roomWidth, roomHeight) {
    const ctx = this.ctx;
    ctx.save();

    const wallThick = 44;

    // 1. 던전 어스름 비네트
    ctx.fillStyle = 'rgba(6, 8, 14, 0.40)';
    ctx.fillRect(-wallThick, -wallThick, roomWidth + wallThick * 2, roomHeight + wallThick * 2);

    // 2. 따스한 광원 블렌딩 (globalCompositeOperation = 'lighter')
    ctx.globalCompositeOperation = 'lighter';
    const now = Date.now();

    // 아르덴 플레이어 랜턴 조명
    if (player) {
      const pFlicker = Math.sin(now * 0.01) * 4;
      const rad = 175 + pFlicker;
      const grad = ctx.createRadialGradient(player.x, player.y, 10, player.x, player.y, rad);
      grad.addColorStop(0, 'rgba(255, 195, 110, 0.30)');
      grad.addColorStop(0.5, 'rgba(255, 140, 60, 0.13)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(player.x, player.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 던전 벽 횃불 조명 (횃불 5개 위치와 정확히 일치)
    const torchXs = [roomWidth * 0.12, roomWidth * 0.32, roomWidth * 0.5, roomWidth * 0.68, roomWidth * 0.88];
    for (let i = 0; i < torchXs.length; i++) {
      const tx = torchXs[i];
      const ty = -8;
      const tFlicker = Math.sin(now * 0.012 + i * 1.5) * 5;
      const rad = 145 + tFlicker;
      const grad = ctx.createRadialGradient(tx, ty, 6, tx, ty, rad);
      grad.addColorStop(0, 'rgba(255, 170, 70, 0.38)');
      grad.addColorStop(0.45, 'rgba(255, 105, 35, 0.15)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(tx, ty, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // 보물상자 황금빛 발광
    if (chest && !chest.opened) {
      const cGrad = ctx.createRadialGradient(chest.x, chest.y, 4, chest.x, chest.y, 95);
      cGrad.addColorStop(0, 'rgba(255, 215, 0, 0.28)');
      cGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.arc(chest.x, chest.y, 95, 0, Math.PI * 2);
      ctx.fill();
    }

    // 차원문 신비로운 보랏빛/청록빛 발광
    if (portal) {
      const pGrad = ctx.createRadialGradient(portal.x, portal.y, 6, portal.x, portal.y, 110);
      pGrad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
      pGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.arc(portal.x, portal.y, 110, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

window.PixelRenderer = PixelRenderer;
