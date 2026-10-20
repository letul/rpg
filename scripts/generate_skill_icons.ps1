Add-Type -AssemblyName System.Drawing

function Create-SkillIcon([string]$path, [string]$type) {
    $w = 40; $h = 40
    $bmp = [System.Drawing.Bitmap]::new($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::Half

    # 1. Dark metallic icon background & border
    $bgBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 15, 23, 42))
    $innerBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 24, 34, 56))
    $borderDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 10, 15, 28))
    $borderGold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 217, 119, 6))
    $borderHighlight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 251, 191, 36))

    $g.FillRectangle($bgBrush, 0, 0, $w, $h)
    $g.FillRectangle($innerBrush, 2, 2, $w - 4, $h - 4)

    # Beveled Metallic Frame
    $g.FillRectangle($borderHighlight, 1, 1, $w - 2, 1)
    $g.FillRectangle($borderHighlight, 1, 1, 1, $h - 2)
    $g.FillRectangle($borderDark, 1, $h - 2, $w - 2, 1)
    $g.FillRectangle($borderDark, $w - 2, 1, 1, $h - 2)

    if ($type -eq 'atk') {
        # Crossed Swords with Crimson Slash Flare
        $flareBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 220, 38, 38))
        $flareHl = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 254, 202, 202))
        $g.FillEllipse($flareBrush, 8, 8, 24, 24)
        $g.FillEllipse($flareHl, 14, 14, 12, 12)

        $bladeBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 241, 245, 249))
        $bladeShadow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
        $goldHilt = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 245, 158, 11))
        $darkGrip = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 69, 26, 3))

        $blade1 = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(34, 6),
            [System.Drawing.Point]::new(31, 5),
            [System.Drawing.Point]::new(12, 24),
            [System.Drawing.Point]::new(15, 27)
        )
        $g.FillPolygon($bladeBrush, $blade1)
        $g.FillRectangle($goldHilt, 10, 24, 7, 3)
        $g.FillRectangle($darkGrip, 7, 28, 3, 4)
        $g.FillRectangle($goldHilt, 6, 32, 4, 3)

        $blade2 = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(6, 6),
            [System.Drawing.Point]::new(9, 5),
            [System.Drawing.Point]::new(28, 24),
            [System.Drawing.Point]::new(25, 27)
        )
        $g.FillPolygon($bladeShadow, $blade2)
        $g.FillRectangle($goldHilt, 23, 24, 7, 3)
        $g.FillRectangle($darkGrip, 29, 28, 3, 4)
        $g.FillRectangle($goldHilt, 30, 32, 4, 3)
    }
    elseif ($type -eq 'smash') { # Q
        $burstDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 185, 28, 28))
        $burstLight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 245, 158, 11))
        $burstWhite = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
        $steelBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 226, 232, 240))
        $steelDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 100, 116, 139))
        $goldBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 251, 191, 36))

        $g.FillPolygon($burstDark, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(20, 22),
            [System.Drawing.Point]::new(36, 36),
            [System.Drawing.Point]::new(4, 36)
        ))
        $g.FillPolygon($burstLight, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(20, 26),
            [System.Drawing.Point]::new(32, 35),
            [System.Drawing.Point]::new(8, 35)
        ))
        $g.FillEllipse($burstWhite, 16, 28, 8, 7)

        $g.FillRectangle($steelDark, 18, 4, 4, 24)
        $g.FillRectangle($steelBrush, 18, 4, 2, 24)
        $g.FillPolygon($steelBrush, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(18, 28),
            [System.Drawing.Point]::new(22, 28),
            [System.Drawing.Point]::new(20, 32)
        ))
        $g.FillRectangle($goldBrush, 13, 8, 14, 3)
        $g.FillRectangle($steelDark, 18, 2, 4, 6)
        $g.FillEllipse($goldBrush, 18, 0, 4, 3)
    }
    elseif ($type -eq 'whirlwind') { # E
        $windCyan = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 6, 182, 212))
        $windLight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 165, 243, 252))
        $steelBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 241, 245, 249))

        $g.FillEllipse($windCyan, 4, 4, 32, 32)
        $g.FillEllipse($innerBrush, 8, 8, 24, 24)

        $g.FillPolygon($steelBrush, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(20, 4),
            [System.Drawing.Point]::new(34, 12),
            [System.Drawing.Point]::new(26, 16),
            [System.Drawing.Point]::new(18, 12)
        ))
        $g.FillPolygon($steelBrush, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(20, 36),
            [System.Drawing.Point]::new(6, 28),
            [System.Drawing.Point]::new(14, 24),
            [System.Drawing.Point]::new(22, 28)
        ))

        $g.FillEllipse($windLight, 14, 14, 12, 12)
        $g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255, 255)), 17, 17, 6, 6)
    }
    elseif ($type -eq 'shield') { # R
        $shieldDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 30, 41, 59))
        $shieldSteel = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 71, 85, 105))
        $shieldHl = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
        $goldBrush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 245, 158, 11))
        $goldLight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 254, 240, 138))

        $shieldPts = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(8, 6),
            [System.Drawing.Point]::new(32, 6),
            [System.Drawing.Point]::new(32, 22),
            [System.Drawing.Point]::new(20, 35),
            [System.Drawing.Point]::new(8, 22)
        )
        $g.FillPolygon($goldBrush, $shieldPts)

        $innerPts = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(10, 8),
            [System.Drawing.Point]::new(30, 8),
            [System.Drawing.Point]::new(30, 21),
            [System.Drawing.Point]::new(20, 33),
            [System.Drawing.Point]::new(10, 21)
        )
        $g.FillPolygon($shieldSteel, $innerPts)

        $leftShade = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(10, 8),
            [System.Drawing.Point]::new(20, 8),
            [System.Drawing.Point]::new(20, 33),
            [System.Drawing.Point]::new(10, 21)
        )
        $g.FillPolygon($shieldHl, $leftShade)

        $g.FillRectangle($goldBrush, 18, 11, 4, 16)
        $g.FillRectangle($goldBrush, 13, 14, 14, 4)
        $g.FillRectangle($goldLight, 19, 12, 2, 14)
        $g.FillRectangle($goldLight, 14, 15, 12, 2)
    }
    elseif ($type -eq 'ult') { # F
        $crimsonDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 153, 27, 27))
        $crimsonHot = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 239, 68, 68))
        $fireOrange = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 249, 115, 22))
        $goldLight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 254, 240, 138))
        $skullBone = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 241, 245, 249))

        $g.FillEllipse($crimsonDark, 4, 4, 32, 32)
        $g.FillEllipse($fireOrange, 7, 7, 26, 26)
        $g.FillEllipse($goldLight, 11, 11, 18, 18)

        $g.FillEllipse($skullBone, 14, 12, 12, 11)
        $g.FillRectangle($skullBone, 16, 21, 8, 5)
        $g.FillPolygon($crimsonDark, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(14, 14),
            [System.Drawing.Point]::new(8, 7),
            [System.Drawing.Point]::new(12, 18)
        ))
        $g.FillPolygon($crimsonDark, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(26, 14),
            [System.Drawing.Point]::new(32, 7),
            [System.Drawing.Point]::new(28, 18)
        ))

        $g.FillRectangle($crimsonDark, 16, 16, 2, 3)
        $g.FillRectangle($crimsonDark, 22, 16, 2, 3)
        $g.FillRectangle($goldLight, 17, 17, 1, 1)
        $g.FillRectangle($goldLight, 23, 17, 1, 1)
    }
    elseif ($type -eq 'dash') { # Space
        $dashCyan = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 34, 211, 238))
        $dashWhite = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
        $bootDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 51, 65, 85))
        $bootLight = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 148, 163, 184))
        $goldWing = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 251, 191, 36))

        $g.FillRectangle($dashCyan, 3, 12, 12, 2)
        $g.FillRectangle($dashWhite, 6, 18, 14, 2)
        $g.FillRectangle($dashCyan, 4, 26, 10, 2)

        $g.FillRectangle($bootDark, 18, 10, 8, 14)
        $g.FillRectangle($bootLight, 19, 10, 6, 14)
        $g.FillPolygon($bootDark, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(18, 24),
            [System.Drawing.Point]::new(33, 24),
            [System.Drawing.Point]::new(35, 28),
            [System.Drawing.Point]::new(18, 28)
        ))
        $g.FillPolygon($bootLight, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(19, 25),
            [System.Drawing.Point]::new(32, 25),
            [System.Drawing.Point]::new(33, 27),
            [System.Drawing.Point]::new(19, 27)
        ))

        $wingPts = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(18, 16),
            [System.Drawing.Point]::new(8, 8),
            [System.Drawing.Point]::new(12, 18),
            [System.Drawing.Point]::new(6, 16),
            [System.Drawing.Point]::new(16, 22)
        )
        $g.FillPolygon($goldWing, $wingPts)
    }
    elseif ($type -eq 'fire') {
        # Fireball
        $fireDark = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 185, 28, 28))
        $fireMid = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 249, 115, 22))
        $fireCore = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 254, 240, 138))
        $g.FillEllipse($fireDark, 6, 6, 28, 28)
        $g.FillEllipse($fireMid, 10, 10, 20, 20)
        $g.FillEllipse($fireCore, 14, 14, 12, 12)
        $g.FillEllipse([System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255, 255)), 17, 17, 6, 6)
    }
    elseif ($type -eq 'ice') {
        # Ice Spear / Frost Crystal
        $iceDeep = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 2, 132, 199))
        $iceCyan = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
        $iceWhite = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 240, 249, 255))
        $crystalPts = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(20, 4),
            [System.Drawing.Point]::new(28, 16),
            [System.Drawing.Point]::new(20, 36),
            [System.Drawing.Point]::new(12, 16)
        )
        $g.FillPolygon($iceDeep, $crystalPts)
        $halfPts = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(20, 4),
            [System.Drawing.Point]::new(20, 36),
            [System.Drawing.Point]::new(12, 16)
        )
        $g.FillPolygon($iceCyan, $halfPts)
        $g.FillRectangle($iceWhite, 19, 6, 2, 28)
    }
    elseif ($type -eq 'lightning') {
        # Chain Lightning
        $voltYellow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 250, 204, 21))
        $voltWhite = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
        $g.FillPolygon($voltYellow, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(24, 4),
            [System.Drawing.Point]::new(12, 18),
            [System.Drawing.Point]::new(20, 18),
            [System.Drawing.Point]::new(16, 36),
            [System.Drawing.Point]::new(30, 16),
            [System.Drawing.Point]::new(22, 16)
        ))
        $g.FillPolygon($voltWhite, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(23, 7),
            [System.Drawing.Point]::new(15, 17),
            [System.Drawing.Point]::new(20, 17),
            [System.Drawing.Point]::new(18, 30),
            [System.Drawing.Point]::new(26, 17),
            [System.Drawing.Point]::new(22, 17)
        ))
    }
    elseif ($type -eq 'bow') {
        # Bow & Arrow
        $wood = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 180, 83, 9))
        $arrow = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 245, 158, 11))
        $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
        $g.DrawArc([System.Drawing.Pen]::new($wood, 3), 6, 6, 24, 28, 45, 270)
        $g.DrawLine([System.Drawing.Pen]::new($white, 1), 24, 8, 24, 32)
        $g.DrawLine([System.Drawing.Pen]::new($arrow, 2), 6, 20, 32, 20)
        $g.FillPolygon($white, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(34, 20),
            [System.Drawing.Point]::new(30, 17),
            [System.Drawing.Point]::new(30, 23)
        ))
    }
    elseif ($type -eq 'dagger') {
        # Poison Shadow Dagger
        $poisonGreen = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 34, 197, 94))
        $darkSteel = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 30, 41, 59))
        $gold = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(255, 234, 179, 8))
        $dPts = [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(32, 6),
            [System.Drawing.Point]::new(28, 8),
            [System.Drawing.Point]::new(14, 22),
            [System.Drawing.Point]::new(18, 26)
        )
        $g.FillPolygon($darkSteel, $dPts)
        $g.FillPolygon($poisonGreen, [System.Drawing.Point[]]@(
            [System.Drawing.Point]::new(32, 6),
            [System.Drawing.Point]::new(26, 12),
            [System.Drawing.Point]::new(18, 26)
        ))
        $g.FillRectangle($gold, 11, 24, 8, 3)
        $g.FillRectangle($darkSteel, 7, 28, 4, 6)
    }

    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Host "Created Skill Icon [$type] -> $path"
}

Create-SkillIcon "assets/ui/skill_atk.png" "atk"
Create-SkillIcon "assets/ui/skill_q.png" "smash"
Create-SkillIcon "assets/ui/skill_e.png" "whirlwind"
Create-SkillIcon "assets/ui/skill_r.png" "shield"
Create-SkillIcon "assets/ui/skill_ult.png" "ult"
Create-SkillIcon "assets/ui/skill_w.png" "ult"
Create-SkillIcon "assets/ui/skill_dash.png" "dash"
Create-SkillIcon "assets/ui/skill_fire.png" "fire"
Create-SkillIcon "assets/ui/skill_ice.png" "ice"
Create-SkillIcon "assets/ui/skill_lightning.png" "lightning"
Create-SkillIcon "assets/ui/skill_bow.png" "bow"
Create-SkillIcon "assets/ui/skill_dagger.png" "dagger"
