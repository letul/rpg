Add-Type -AssemblyName System.Drawing

function Create-MerchantStall {
    param([string]$outPath)
    $w = 128; $h = 104
    $bmp = [System.Drawing.Bitmap]::new($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

    # 1. Floor contact shadow
    $shadowBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(140, 0, 0, 0))
    $g.FillEllipse($shadowBrush, 6, 84, 116, 18)
    $shadowBrush.Dispose()

    # 2. Left side barrels & right sack
    $barrelBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 115, 60, 20))
    $barrelBand = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 45, 55, 72))
    $barrelHighlight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 160, 95, 40))
    $g.FillEllipse($barrelBrush, 4, 66, 22, 28)
    $g.FillRectangle($barrelBand, 4, 72, 22, 3)
    $g.FillRectangle($barrelBand, 4, 82, 22, 3)
    $g.FillRectangle($barrelHighlight, 8, 68, 4, 24)

    # Right Sack
    $sackBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 160, 120, 50))
    $sackDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 110, 80, 30))
    $g.FillEllipse($sackBrush, 104, 70, 20, 24)
    $g.FillRectangle($sackDark, 111, 68, 6, 4)
    $g.FillEllipse($sackBrush, 110, 65, 8, 5)

    # 3. Wooden booth rear wall & posts
    $woodDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 40, 22, 10))
    $woodMed = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 78, 42, 18))
    $woodLight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 120, 68, 28))
    $woodHighlight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 155, 92, 42))

    # Corner Posts
    $g.FillRectangle($woodDark, 20, 28, 6, 62)
    $g.FillRectangle($woodMed, 22, 28, 3, 62)
    $g.FillRectangle($woodDark, 102, 28, 6, 62)
    $g.FillRectangle($woodMed, 103, 28, 3, 62)

    # Rear Wall / Backing boards
    $g.FillRectangle($woodDark, 26, 32, 76, 32)
    for ($i = 34; $i -lt 64; $i += 6) {
        $g.FillRectangle($woodMed, 26, $i, 76, 5)
    }

    # 4. Hooded Merchant
    $hoodDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 24, 32, 64))
    $hoodMed = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 45, 60, 115))
    $hoodLight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 70, 95, 175))
    $skinBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 235, 185, 145))
    $beardBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 230, 235, 245))
    $beardShadow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 180, 190, 205))

    # Body
    $g.FillRectangle($hoodDark, 52, 46, 24, 20)
    $g.FillEllipse($hoodMed, 50, 44, 28, 18)
    # Hood
    $g.FillEllipse($hoodDark, 54, 30, 20, 22)
    $g.FillEllipse($hoodMed, 56, 31, 16, 18)
    $g.FillEllipse($hoodLight, 57, 31, 12, 8)
    # Face
    $g.FillEllipse($skinBrush, 58, 37, 12, 10)
    # Eyes
    $eyeBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 230, 150))
    $g.FillRectangle($eyeBrush, 60, 40, 2, 2)
    $g.FillRectangle($eyeBrush, 66, 40, 2, 2)
    # Flowing White Beard
    $beardPts = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(58, 43),
        [System.Drawing.Point]::new(70, 43),
        [System.Drawing.Point]::new(68, 56),
        [System.Drawing.Point]::new(64, 60),
        [System.Drawing.Point]::new(60, 56)
    )
    $g.FillPolygon($beardBrush, $beardPts)
    $g.FillRectangle($beardShadow, 62, 54, 4, 5)

    # 5. Front Timber Counter Table
    $g.FillRectangle($woodDark, 22, 60, 84, 28)
    $g.FillRectangle($woodMed, 24, 62, 80, 24)
    for ($y = 66; $y -lt 86; $y += 6) {
        $g.FillRectangle($woodDark, 24, $y, 80, 2)
    }
    # Countertop slab
    $g.FillRectangle($woodDark, 18, 56, 92, 7)
    $g.FillRectangle($woodLight, 19, 57, 90, 4)
    $g.FillRectangle($woodHighlight, 20, 57, 88, 1)

    # Iron corner brackets
    $bracketBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 30, 40, 55))
    $g.FillRectangle($bracketBrush, 22, 62, 5, 5)
    $g.FillRectangle($bracketBrush, 101, 62, 5, 5)
    $g.FillRectangle($bracketBrush, 22, 81, 5, 5)
    $g.FillRectangle($bracketBrush, 101, 81, 5, 5)

    # 6. Countertop Items
    $redPot = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 235, 40, 60))
    $glassHl = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $corkBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 180, 120, 70))
    $g.FillEllipse($redPot, 28, 51, 8, 8)
    $g.FillRectangle($redPot, 30, 48, 4, 4)
    $g.FillRectangle($corkBrush, 31, 46, 2, 2)
    $g.FillRectangle($glassHl, 29, 52, 2, 2)

    $bluePot = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 30, 160, 240))
    $g.FillEllipse($bluePot, 38, 50, 9, 9)
    $g.FillRectangle($bluePot, 41, 47, 3, 4)
    $g.FillRectangle($corkBrush, 41, 45, 3, 2)
    $g.FillRectangle($glassHl, 39, 51, 2, 2)

    $goldPot = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 250, 190, 30))
    $g.FillRectangle($goldPot, 88, 49, 7, 10)
    $g.FillRectangle($corkBrush, 90, 47, 3, 2)
    $g.FillRectangle($glassHl, 89, 50, 2, 3)

    $scrollPaper = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 245, 230, 190))
    $waxSeal = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 190, 25, 25))
    $g.FillRectangle($scrollPaper, 48, 54, 10, 4)
    $g.FillRectangle($waxSeal, 52, 55, 3, 3)

    $coinGold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 215, 0))
    $g.FillEllipse($coinGold, 78, 54, 5, 4)
    $g.FillEllipse($coinGold, 81, 55, 5, 4)
    $g.FillEllipse($coinGold, 79, 52, 5, 3)

    $g.FillEllipse($skinBrush, 55, 56, 6, 4)
    $g.FillEllipse($skinBrush, 67, 56, 6, 4)

    # 7. Crimson Canopy Tent Roof (Pitched with rich shading)
    $canopyShadow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 80, 12, 30))
    $canopyDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 140, 20, 50))
    $canopyMed = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 190, 28, 65))
    $canopyLight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 225, 45, 80))
    $canopyGold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 245, 190, 40))

    $roofPts = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(64, 2),
        [System.Drawing.Point]::new(118, 22),
        [System.Drawing.Point]::new(114, 32),
        [System.Drawing.Point]::new(14, 32),
        [System.Drawing.Point]::new(10, 22)
    )
    $g.FillPolygon($canopyDark, $roofPts)

    # Roof Stripes
    for ($s = 18; $s -lt 110; $s += 18) {
        $stripePts = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(64, 2),
            [System.Drawing.Point]::new($s + 9, 28),
            [System.Drawing.Point]::new($s, 28)
        )
        $g.FillPolygon($canopyMed, $stripePts)
    }

    # Canopy Front Scalloped Frills
    $g.FillRectangle($canopyDark, 12, 30, 104, 6)
    for ($x = 14; $x -lt 112; $x += 10) {
        $g.FillEllipse($canopyLight, $x, 30, 9, 8)
        $g.FillEllipse($canopyShadow, $x + 1, 35, 7, 3)
    }
    # Gold Trim Border
    $g.FillRectangle($canopyGold, 12, 29, 104, 2)
    for ($x = 18; $x -lt 112; $x += 10) {
        $g.FillRectangle($canopyGold, $x, 36, 2, 2)
    }

    # 8. Ornate Guild Crest Banner
    $bannerRed = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 160, 20, 35))
    $bannerGold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 250, 200, 50))
    $g.FillRectangle($bannerRed, 8, 34, 12, 20)
    $bannerPts = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(8, 54),
        [System.Drawing.Point]::new(14, 59),
        [System.Drawing.Point]::new(20, 54)
    )
    $g.FillPolygon($bannerRed, $bannerPts)
    $g.FillRectangle($bannerGold, 8, 34, 12, 2)
    $g.FillRectangle($bannerGold, 13, 39, 2, 8)
    $g.FillRectangle($bannerGold, 10, 42, 8, 2)

    # 9. Hanging Brass Lantern
    $brassDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 110, 70, 20))
    $brassGold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 215, 150, 40))
    $lanternGlass = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 220, 90))
    $lanternCore = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255, 210))

    $g.FillRectangle($brassDark, 104, 28, 2, 8)
    $lanternCap = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(100, 36),
        [System.Drawing.Point]::new(110, 36),
        [System.Drawing.Point]::new(108, 38),
        [System.Drawing.Point]::new(102, 38)
    )
    $g.FillPolygon($brassGold, $lanternCap)
    $g.FillRectangle($lanternGlass, 101, 38, 8, 10)
    $g.FillRectangle($brassDark, 101, 38, 8, 1)
    $g.FillRectangle($brassDark, 101, 47, 8, 1)
    $g.FillRectangle($lanternCore, 103, 40, 4, 6)
    $g.FillRectangle($brassGold, 103, 48, 4, 3)

    $g.Dispose()
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created Merchant Stall at $outPath"
}

function Create-DungeonDoors {
    param([string]$dir)

    $w = 84; $h = 96
    $glassHl = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    
    # ----------------------------------------------------
    # 1. NORMAL DOOR CLOSED
    # ----------------------------------------------------
    $bmpNorm = [System.Drawing.Bitmap]::new($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmpNorm)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor

    $stoneDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 30, 40, 55))
    $stoneMed = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 55, 65, 80))
    $stoneLight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 90, 105, 125))
    $stoneKeystone = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 120, 135, 155))

    $g.FillRectangle($stoneDark, 6, 12, 72, 84)
    $g.FillEllipse($stoneDark, 6, 2, 72, 40)
    $g.FillRectangle($stoneMed, 10, 14, 64, 82)
    $g.FillEllipse($stoneMed, 10, 4, 64, 36)

    $groovePen = [System.Drawing.Pen]::new([System.Drawing.Color]::FromArgb(255, 20, 25, 35), 2)
    for ($y = 20; $y -lt 96; $y += 14) {
        $g.DrawLine($groovePen, 6, $y, 16, $y)
        $g.DrawLine($groovePen, 68, $y, 78, $y)
    }
    $keystonePts = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(36, 0),
        [System.Drawing.Point]::new(48, 0),
        [System.Drawing.Point]::new(52, 16),
        [System.Drawing.Point]::new(32, 16)
    )
    $g.FillPolygon($stoneKeystone, $keystonePts)

    $doorDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 45, 25, 12))
    $doorMed = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 75, 42, 20))
    $doorLight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 110, 62, 30))
    $ironDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 25, 30, 40))
    $ironMed = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 60, 70, 85))

    $g.FillRectangle($doorDark, 18, 26, 48, 70)
    $g.FillEllipse($doorDark, 18, 14, 48, 28)
    $g.FillRectangle($doorMed, 20, 28, 44, 68)
    $g.FillEllipse($doorMed, 20, 16, 44, 24)

    $g.FillRectangle($ironDark, 41, 16, 2, 80)
    for ($x = 24; $x -lt 64; $x += 6) {
        if ($x -ne 42) {
            $g.FillRectangle($doorDark, $x, 26, 1, 70)
        }
    }
    $g.FillRectangle($ironDark, 20, 36, 44, 4)
    $g.FillRectangle($ironMed, 20, 37, 44, 2)
    $g.FillRectangle($ironDark, 20, 70, 44, 4)
    $g.FillRectangle($ironMed, 20, 71, 44, 2)

    $g.FillEllipse($ironDark, 35, 52, 6, 8)
    $g.FillEllipse($doorMed, 36, 54, 4, 4)
    $g.FillEllipse($ironDark, 43, 52, 6, 8)
    $g.FillEllipse($doorMed, 44, 54, 4, 4)

    # Dual Wall Torches
    $torchWood = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 90, 50, 20))
    $flameYellow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 220, 70))
    $flameOrange = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 245, 120, 30))
    $g.FillRectangle($ironDark, 8, 44, 5, 8)
    $g.FillRectangle($torchWood, 10, 38, 3, 10)
    $g.FillEllipse($flameOrange, 8, 30, 7, 10)
    $g.FillEllipse($flameYellow, 9, 32, 5, 6)

    $g.FillRectangle($ironDark, 71, 44, 5, 8)
    $g.FillRectangle($torchWood, 71, 38, 3, 10)
    $g.FillEllipse($flameOrange, 69, 30, 7, 10)
    $g.FillEllipse($flameYellow, 70, 32, 5, 6)

    $g.Dispose()
    $bmpNorm.Save("$dir/door_normal.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpNorm.Dispose()

    # ----------------------------------------------------
    # 1-B. NORMAL DOOR OPEN
    # ----------------------------------------------------
    $bmpNormOpen = [System.Drawing.Bitmap]::new($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmpNormOpen)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor

    $g.FillRectangle($stoneDark, 6, 12, 72, 84)
    $g.FillEllipse($stoneDark, 6, 2, 72, 40)
    $g.FillRectangle($stoneMed, 10, 14, 64, 82)
    $g.FillEllipse($stoneMed, 10, 4, 64, 36)
    for ($y = 20; $y -lt 96; $y += 14) {
        $g.DrawLine($groovePen, 6, $y, 16, $y)
        $g.DrawLine($groovePen, 68, $y, 78, $y)
    }
    $g.FillPolygon($stoneKeystone, $keystonePts)

    $portalDeep = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 12, 16, 28))
    $portalGlow1 = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 60, 40, 80))
    $portalGlow2 = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 230, 180, 70))
    $g.FillRectangle($portalDeep, 18, 26, 48, 70)
    $g.FillEllipse($portalDeep, 18, 14, 48, 28)
    $g.FillEllipse($portalGlow1, 24, 30, 36, 56)
    $g.FillEllipse($portalGlow2, 32, 46, 20, 32)
    $g.FillEllipse($glassHl, 38, 56, 8, 16)

    # Open Door Wings
    $leftWing = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(18, 26),
        [System.Drawing.Point]::new(24, 32),
        [System.Drawing.Point]::new(24, 94),
        [System.Drawing.Point]::new(18, 96)
    )
    $g.FillPolygon($doorDark, $leftWing)

    $rightWing = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(66, 26),
        [System.Drawing.Point]::new(60, 32),
        [System.Drawing.Point]::new(60, 94),
        [System.Drawing.Point]::new(66, 96)
    )
    $g.FillPolygon($doorDark, $rightWing)

    # Dual Wall Torches
    $g.FillRectangle($ironDark, 8, 44, 5, 8)
    $g.FillRectangle($torchWood, 10, 38, 3, 10)
    $g.FillEllipse($flameOrange, 8, 30, 7, 10)
    $g.FillEllipse($flameYellow, 9, 32, 5, 6)

    $g.FillRectangle($ironDark, 71, 44, 5, 8)
    $g.FillRectangle($torchWood, 71, 38, 3, 10)
    $g.FillEllipse($flameOrange, 69, 30, 7, 10)
    $g.FillEllipse($flameYellow, 70, 32, 5, 6)

    $g.Dispose()
    $bmpNormOpen.Save("$dir/door_normal_open.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpNormOpen.Dispose()

    # ----------------------------------------------------
    # 2. BOSS DOOR (Demonic Skull Arch & Red Portcullis)
    # ----------------------------------------------------
    $bw = 96; $bh = 114
    $bmpBoss = [System.Drawing.Bitmap]::new($bw, $bh)
    $g = [System.Drawing.Graphics]::FromImage($bmpBoss)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor

    $obsDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 18, 14, 24))
    $obsMed = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 36, 30, 48))
    $obsLight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 64, 52, 82))

    $g.FillRectangle($obsDark, 8, 30, 80, 84)
    $g.FillEllipse($obsDark, 8, 18, 80, 48)
    $g.FillRectangle($obsMed, 14, 32, 68, 82)
    $g.FillEllipse($obsMed, 14, 20, 68, 42)

    # Menacing Horned Skull Crest
    $skullBone = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 215, 200, 185))
    $skullDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 55, 40, 45))
    $hornBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 145, 50, 40))
    $hornHighlight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 185, 75, 55))
    $eyeRed = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 245, 30, 40))

    # Left Curved Ram/Demon Horn
    $leftHorn = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(40, 16),
        [System.Drawing.Point]::new(26, 4),
        [System.Drawing.Point]::new(14, 12),
        [System.Drawing.Point]::new(22, 22),
        [System.Drawing.Point]::new(36, 22)
    )
    $g.FillPolygon($hornBrush, $leftHorn)

    # Right Curved Ram/Demon Horn
    $rightHorn = [System.Drawing.Point[]]@(
        [System.Drawing.Point]::new(56, 16),
        [System.Drawing.Point]::new(70, 4),
        [System.Drawing.Point]::new(82, 12),
        [System.Drawing.Point]::new(74, 22),
        [System.Drawing.Point]::new(60, 22)
    )
    $g.FillPolygon($hornBrush, $rightHorn)

    # Skull Cranium & Fangs
    $g.FillEllipse($skullBone, 36, 8, 24, 22)
    $g.FillRectangle($skullBone, 41, 24, 14, 8)
    $g.FillEllipse($skullDark, 40, 15, 6, 7)
    $g.FillEllipse($skullDark, 50, 15, 6, 7)
    $g.FillEllipse($eyeRed, 42, 17, 3, 3)
    $g.FillEllipse($eyeRed, 52, 17, 3, 3)
    for ($t = 42; $t -le 52; $t += 3) {
        $g.FillRectangle($skullDark, $t, 27, 1, 5)
    }

    # Deep Portal Void
    $g.FillRectangle($obsDark, 22, 40, 52, 74)
    $g.FillEllipse($obsDark, 22, 26, 52, 34)

    # Red Glowing Iron Lattice Portcullis (쇠창살)
    $portcullisRed = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 185, 30, 45))
    $portcullisDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 90, 15, 25))
    $portcullisHot = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 245, 80, 95))

    for ($bx = 26; $bx -le 70; $bx += 7) {
        $g.FillRectangle($portcullisDark, $bx, 34, 3, 76)
        $g.FillRectangle($portcullisRed, $bx + 1, 34, 1, 76)
        $spikePts = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new($bx, 110),
            [System.Drawing.Point]::new($bx + 3, 110),
            [System.Drawing.Point]::new($bx + 1, 114)
        )
        $g.FillPolygon($portcullisHot, $spikePts)
    }
    for ($by = 46; $by -lt 110; $by += 15) {
        $g.FillRectangle($portcullisDark, 24, $by, 48, 3)
        $g.FillRectangle($portcullisHot, 24, $by + 1, 48, 1)
    }

    # Flanking Demonic Brazier Sconces
    $fireRed = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 240, 40, 40))
    $fireOrange = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 150, 40))
    $g.FillRectangle($obsDark, 9, 60, 6, 10)
    $g.FillEllipse($fireRed, 8, 48, 8, 14)
    $g.FillEllipse($fireOrange, 10, 52, 5, 8)
    $g.FillRectangle($obsDark, 81, 60, 6, 10)
    $g.FillEllipse($fireRed, 80, 48, 8, 14)
    $g.FillEllipse($fireOrange, 81, 52, 5, 8)

    $g.Dispose()
    $bmpBoss.Save("$dir/door_boss.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpBoss.Dispose()

    # ----------------------------------------------------
    # 2-B. BOSS DOOR OPEN (Blazing Eyes & Radiating Crimson Light)
    # ----------------------------------------------------
    $bmpBossOpen = [System.Drawing.Bitmap]::new($bw, $bh)
    $g = [System.Drawing.Graphics]::FromImage($bmpBossOpen)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor

    $g.FillRectangle($obsDark, 8, 30, 80, 84)
    $g.FillEllipse($obsDark, 8, 18, 80, 48)
    $g.FillRectangle($obsMed, 14, 32, 68, 82)
    $g.FillEllipse($obsMed, 14, 20, 68, 42)

    $g.FillPolygon($hornBrush, $leftHorn)
    $g.FillPolygon($hornBrush, $rightHorn)
    $g.FillEllipse($skullBone, 36, 8, 24, 22)
    $g.FillRectangle($skullBone, 41, 24, 14, 8)
    $g.FillEllipse($skullDark, 40, 15, 6, 7)
    $g.FillEllipse($skullDark, 50, 15, 6, 7)
    $g.FillEllipse($glassHl, 41, 16, 4, 5) # Blazing White-Hot Eyes!
    $g.FillEllipse($glassHl, 51, 16, 4, 5)

    $crimsonVoid = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 60, 10, 20))
    $crimsonOuter = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 200, 25, 45))
    $crimsonCore = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 65, 80))
    $crimsonWhite = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 230, 230))

    $g.FillRectangle($crimsonVoid, 22, 40, 52, 74)
    $g.FillEllipse($crimsonVoid, 22, 26, 52, 34)

    # Raised Portcullis
    for ($bx = 26; $bx -le 70; $bx += 7) {
        $g.FillRectangle($portcullisDark, $bx, 30, 3, 20)
        $liftSpike = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new($bx, 50),
            [System.Drawing.Point]::new($bx + 3, 50),
            [System.Drawing.Point]::new($bx + 1, 54)
        )
        $g.FillPolygon($portcullisHot, $liftSpike)
    }

    # Radiant Beams pouring outward
    $g.FillEllipse($crimsonOuter, 26, 42, 44, 66)
    $g.FillEllipse($crimsonCore, 32, 54, 32, 46)
    $g.FillEllipse($crimsonWhite, 40, 68, 16, 24)

    # Intense Torch Brazier
    $g.FillRectangle($obsDark, 9, 60, 6, 10)
    $g.FillEllipse($fireRed, 7, 44, 10, 18)
    $g.FillEllipse($flameYellow, 9, 48, 6, 10)
    $g.FillRectangle($obsDark, 81, 60, 6, 10)
    $g.FillEllipse($fireRed, 79, 44, 10, 18)
    $g.FillEllipse($flameYellow, 81, 48, 6, 10)

    $g.Dispose()
    $bmpBossOpen.Save("$dir/door_boss_open.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpBossOpen.Dispose()

    # ----------------------------------------------------
    # 3. LOCKED DOOR (Chains & Padlock)
    # ----------------------------------------------------
    $bmpLocked = [System.Drawing.Bitmap]::new($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmpLocked)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor

    $g.FillRectangle($stoneDark, 6, 12, 72, 84)
    $g.FillEllipse($stoneDark, 6, 2, 72, 40)
    $g.FillRectangle($stoneMed, 10, 14, 64, 82)
    $g.FillEllipse($stoneMed, 10, 4, 64, 36)
    for ($y = 20; $y -lt 96; $y += 14) {
        $g.DrawLine($groovePen, 6, $y, 16, $y)
        $g.DrawLine($groovePen, 68, $y, 78, $y)
    }

    $runeCyan = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 34, 211, 238))
    $g.FillRectangle($runeCyan, 11, 26, 3, 6)
    $g.FillRectangle($runeCyan, 11, 52, 3, 6)
    $g.FillRectangle($runeCyan, 70, 26, 3, 6)
    $g.FillRectangle($runeCyan, 70, 52, 3, 6)

    $g.FillRectangle($stoneDark, 18, 26, 48, 70)
    $g.FillEllipse($stoneDark, 18, 14, 48, 28)
    $g.FillRectangle($ironDark, 20, 28, 44, 68)
    $g.FillEllipse($ironDark, 20, 16, 44, 24)

    # Thick Rusted Crisscross Chains
    $chainRust = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 145, 90, 50))
    $chainDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 50, 45, 40))
    $chainHighlight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 200, 140, 85))

    $chainPen1 = [System.Drawing.Pen]::new($chainRust, 5)
    $chainPen2 = [System.Drawing.Pen]::new($chainDark, 7)
    $chainPenHl = [System.Drawing.Pen]::new($chainHighlight, 2)
    $g.DrawLine($chainPen2, 20, 30, 64, 90)
    $g.DrawLine($chainPen1, 20, 30, 64, 90)
    $g.DrawLine($chainPenHl, 20, 30, 64, 90)
    $g.DrawLine($chainPen2, 64, 30, 20, 90)
    $g.DrawLine($chainPen1, 64, 30, 20, 90)
    $g.DrawLine($chainPenHl, 64, 30, 20, 90)

    # Massive Center Padlock
    $padlockGold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 215, 160, 40))
    $padlockShackle = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 140, 150, 165))
    $g.FillEllipse($padlockShackle, 36, 46, 12, 14)
    $g.FillEllipse($stoneDark, 39, 49, 6, 8)
    $g.FillRectangle($padlockGold, 34, 54, 16, 16)
    $g.FillEllipse($padlockGold, 34, 52, 16, 8)
    $g.FillEllipse($stoneDark, 38, 58, 3, 4)
    $g.FillEllipse($stoneDark, 43, 58, 3, 4)
    $g.FillRectangle($stoneDark, 41, 63, 2, 5)

    $g.Dispose()
    $bmpLocked.Save("$dir/door_locked.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpLocked.Dispose()

    # ----------------------------------------------------
    # 3-B. LOCKED DOOR OPEN
    # ----------------------------------------------------
    $bmpLockedOpen = [System.Drawing.Bitmap]::new($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmpLockedOpen)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor

    $g.FillRectangle($stoneDark, 6, 12, 72, 84)
    $g.FillEllipse($stoneDark, 6, 2, 72, 40)
    $g.FillRectangle($stoneMed, 10, 14, 64, 82)
    $g.FillEllipse($stoneMed, 10, 4, 64, 36)
    for ($y = 20; $y -lt 96; $y += 14) {
        $g.DrawLine($groovePen, 6, $y, 16, $y)
        $g.DrawLine($groovePen, 68, $y, 78, $y)
    }

    $blueDeep = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 8, 20, 36))
    $blueGlow1 = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 14, 116, 144))
    $blueGlow2 = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
    $g.FillRectangle($blueDeep, 18, 26, 48, 70)
    $g.FillEllipse($blueDeep, 18, 14, 48, 28)
    $g.FillEllipse($blueGlow1, 24, 30, 36, 56)
    $g.FillEllipse($blueGlow2, 32, 46, 20, 32)
    $g.FillEllipse($glassHl, 38, 56, 8, 16)

    # Shattered Chains on floor
    $g.FillRectangle($chainRust, 20, 88, 12, 4)
    $g.FillRectangle($chainRust, 52, 88, 12, 4)

    $g.Dispose()
    $bmpLockedOpen.Save("$dir/door_locked_open.png", [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpLockedOpen.Dispose()

    Write-Host "Created All Dungeon Door Assets in $dir"
}

Create-MerchantStall "assets/props/merchant_stall.png"
Create-DungeonDoors "assets/props"
