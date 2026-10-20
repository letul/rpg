Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.IO;

public class AssetBuilder {
    // Cleanly extract a sprite with flood-fill background removal and connected-component filtering
    public static Bitmap ExtractCleanSprite(string srcPath, Rectangle cropRect, int targetW, int targetH, int groundOffset, bool trimNeighbors = true) {
        using (Bitmap src = new Bitmap(srcPath)) {
            int cx = Math.Max(0, cropRect.X);
            int cy = Math.Max(0, cropRect.Y);
            int cw = Math.Min(cropRect.Width, src.Width - cx);
            int ch = Math.Min(cropRect.Height, src.Height - cy);

            Bitmap crop = new Bitmap(cw, ch, PixelFormat.Format32bppArgb);
            using (Graphics g = Graphics.FromImage(crop)) {
                g.DrawImage(src, new Rectangle(0, 0, cw, ch), new Rectangle(cx, cy, cw, ch), GraphicsUnit.Pixel);
            }

            int w = crop.Width;
            int h = crop.Height;
            BitmapData bData = crop.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            int bytes = Math.Abs(bData.Stride) * h;
            byte[] rgb = new byte[bytes];
            Marshal.Copy(bData.Scan0, rgb, 0, bytes);
            int stride = bData.Stride;

            bool[,] visited = new bool[w, h];
            Queue<Point> queue = new Queue<Point>();

            Func<byte, byte, byte, bool> isBg = (b, gCol, r) => {
                // Background dark navy in reference sheet
                return (b >= 18 && b <= 44 && gCol >= 12 && gCol <= 32 && r <= 26 && (b - r >= 5)) ||
                       (r <= 9 && gCol <= 9 && b <= 14);
            };

            // Seed only the border pixels that match background navy
            for (int x = 0; x < w; x++) {
                int iTop = 0 * stride + x * 4;
                if (isBg(rgb[iTop], rgb[iTop + 1], rgb[iTop + 2])) {
                    visited[x, 0] = true;
                    queue.Enqueue(new Point(x, 0));
                }
                int iBot = (h - 1) * stride + x * 4;
                if (isBg(rgb[iBot], rgb[iBot + 1], rgb[iBot + 2])) {
                    visited[x, h - 1] = true;
                    queue.Enqueue(new Point(x, h - 1));
                }
            }
            for (int y = 0; y < h; y++) {
                int iLeft = y * stride + 0 * 4;
                if (isBg(rgb[iLeft], rgb[iLeft + 1], rgb[iLeft + 2])) {
                    visited[0, y] = true;
                    queue.Enqueue(new Point(0, y));
                }
                int iRight = y * stride + (w - 1) * 4;
                if (isBg(rgb[iRight], rgb[iRight + 1], rgb[iRight + 2])) {
                    visited[w - 1, y] = true;
                    queue.Enqueue(new Point(w - 1, y));
                }
            }

            int[] dx = { 1, -1, 0, 0 };
            int[] dy = { 0, 0, 1, -1 };

            while (queue.Count > 0) {
                Point p = queue.Dequeue();
                int idx = p.Y * stride + p.X * 4;
                rgb[idx + 3] = 0; // Transparent

                for (int i = 0; i < 4; i++) {
                    int nx = p.X + dx[i];
                    int ny = p.Y + dy[i];
                    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                    if (visited[nx, ny]) continue;

                    int nidx = ny * stride + nx * 4;
                    byte nb = rgb[nidx];
                    byte ng = rgb[nidx + 1];
                    byte nr = rgb[nidx + 2];

                    if (isBg(nb, ng, nr)) {
                        visited[nx, ny] = true;
                        queue.Enqueue(new Point(nx, ny));
                    }
                }
            }

            if (trimNeighbors) {
                // Connected component analysis to drop neighbor bleed
                int[] compId = new int[w * h];
                int curId = 1;
                Dictionary<int, int> compSizes = new Dictionary<int, int>();

                for (int y = 0; y < h; y++) {
                    for (int x = 0; x < w; x++) {
                        int idx = y * stride + x * 4;
                        if (rgb[idx + 3] == 0) continue;
                        if (compId[y * w + x] != 0) continue;

                        int id = curId++;
                        int count = 0;
                        Queue<Point> q2 = new Queue<Point>();
                        q2.Enqueue(new Point(x, y));
                        compId[y * w + x] = id;

                        while (q2.Count > 0) {
                            Point cp = q2.Dequeue();
                            count++;
                            for (int cdy = -1; cdy <= 1; cdy++) {
                                for (int cdx = -1; cdx <= 1; cdx++) {
                                    int nx = cp.X + cdx;
                                    int ny = cp.Y + cdy;
                                    if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                                    if (compId[ny * w + nx] != 0) continue;
                                    int nidx = ny * stride + nx * 4;
                                    if (rgb[nidx + 3] == 0) continue;
                                    compId[ny * w + nx] = id;
                                    q2.Enqueue(new Point(nx, ny));
                                }
                            }
                        }
                        compSizes[id] = count;
                    }
                }

                int mainId = 0;
                int maxSz = 0;
                foreach (var kvp in compSizes) {
                    if (kvp.Value > maxSz) {
                        maxSz = kvp.Value;
                        mainId = kvp.Key;
                    }
                }

                // Remove disconnected stray pixels that are not part of main character
                for (int y = 0; y < h; y++) {
                    for (int x = 0; x < w; x++) {
                        int id = compId[y * w + x];
                        if (id != mainId) {
                            // If small component or far from center
                            if (id == 0 || compSizes[id] < 35 || Math.Abs(x - w / 2) > w * 0.42) {
                                int idx = y * stride + x * 4;
                                rgb[idx + 3] = 0;
                            }
                        }
                    }
                }
            }

            Marshal.Copy(rgb, 0, bData.Scan0, bytes);
            crop.UnlockBits(bData);

            Bitmap final = new Bitmap(targetW, targetH, PixelFormat.Format32bppArgb);
            using (Graphics gf = Graphics.FromImage(final)) {
                gf.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.NearestNeighbor;
                gf.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.Half;
                int ox = (targetW - w) / 2;
                int oy = targetH - h - groundOffset;
                gf.DrawImage(crop, ox, oy);
            }
            crop.Dispose();
            return final;
        }
    }

    public static void SaveBitmap(Bitmap bmp, string path) {
        string dir = Path.GetDirectoryName(path);
        if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
        bmp.Save(path, ImageFormat.Png);
    }

    // Creates an armored Goblin Warrior with shield and sword on a 72x72 transparent canvas
    public static void BuildGoblinWarrior(string srcPath, string outPath, int frame) {
        // Base goblin
        using (Bitmap goblin = ExtractCleanSprite(srcPath, new Rectangle(426, 312, 44, 56), 72, 72, 4, true)) {
            // Skeleton warrior round shield
            using (Bitmap shieldRaw = ExtractCleanSprite(srcPath, new Rectangle(503, 330, 18, 26), 22, 30, 0, false)) {
                // Sword
                using (Bitmap swordRaw = ExtractCleanSprite(srcPath, new Rectangle(158, 335, 14, 28), 16, 32, 0, false)) {
                    Bitmap warrior = new Bitmap(72, 72, PixelFormat.Format32bppArgb);
                    using (Graphics g = Graphics.FromImage(warrior)) {
                        g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.NearestNeighbor;
                        g.PixelOffsetMode = System.Drawing.Drawing2D.PixelOffsetMode.Half;

                        int bounce = (frame % 2 == 1) ? 2 : 0;
                        int lean = (frame == 1) ? -1 : (frame == 3 ? 1 : 0);

                        // Draw base goblin slightly bulkier (scale 1.15x for warrior build)
                        int gw = 50;
                        int gh = 62;
                        int gx = (72 - gw) / 2 + lean;
                        int gy = 72 - gh - 4 + bounce;
                        g.DrawImage(goblin, new Rectangle(gx, gy, gw, gh), new Rectangle(12, 6, 48, 58), GraphicsUnit.Pixel);

                        // Attach authentic round shield
                        g.DrawImage(shieldRaw, gx + 30, gy + 22 + bounce / 2, 20, 26);

                        // Attach steel sword
                        g.DrawImage(swordRaw, gx - 3, gy + 24 + bounce / 2, 14, 26);
                    }
                    SaveBitmap(warrior, outPath);
                    warrior.Dispose();
                }
            }
        }
    }
}
"@

$sheet = (Resolve-Path "assets/reference_sheet.jpg").Path

# =========================================================================
# 1. ARDEN ACTION FRAMES (84x84 Transparent Canvas, Zero Hair/Weapon Clipping)
# =========================================================================
# Hair tufts start at y=302, baseline of soles at y=368 (h=66)
$idleRect  = [System.Drawing.Rectangle]::new(10, 302, 46, 66)
$walkRect  = [System.Drawing.Rectangle]::new(64, 302, 46, 66)
$atkRect   = [System.Drawing.Rectangle]::new(116, 302, 54, 66)
$sk1Rect   = [System.Drawing.Rectangle]::new(172, 302, 54, 66)
$sk2Rect   = [System.Drawing.Rectangle]::new(228, 302, 60, 66)
$hitRect   = [System.Drawing.Rectangle]::new(290, 302, 48, 66)
$dodgeRect = [System.Drawing.Rectangle]::new(344, 302, 48, 66)
$deathRect = [System.Drawing.Rectangle]::new(398, 302, 52, 66)

# Idle
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $idleRect, 84, 84, 6, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/idle_0.png")
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/idle_2.png")
[AssetBuilder]::SaveBitmap($b, "assets/characters/player_idle.png")
$b.Dispose()
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $idleRect, 84, 84, 5, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/idle_1.png")
$b.Dispose()
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $idleRect, 84, 84, 7, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/idle_3.png")
$b.Dispose()

# Walk
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $walkRect, 84, 84, 6, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/walk_0.png")
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/walk_2.png")
$b.Dispose()
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $walkRect, 84, 84, 4, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/walk_1.png")
[AssetBuilder]::SaveBitmap($b, "assets/characters/player_walk.png")
$b.Dispose()
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $walkRect, 84, 84, 5, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/walk_3.png")
$b.Dispose()

# Attack (Wide 54px crop to preserve full sword blade and tip)
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $atkRect, 84, 84, 6, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/attack_0.png")
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/attack_2.png")
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/attack_3.png")
$b.Dispose()
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $atkRect, 84, 84, 5, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/attack_1.png")
[AssetBuilder]::SaveBitmap($b, "assets/characters/player_attack.png")
$b.Dispose()

# Skills
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $sk1Rect, 84, 84, 6, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/skill_0.png")
$b.Dispose()
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $sk1Rect, 84, 84, 5, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/skill_1.png")
[AssetBuilder]::SaveBitmap($b, "assets/characters/player_skill1.png")
$b.Dispose()
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $sk2Rect, 84, 84, 6, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/skill_2.png")
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/skill_3.png")
[AssetBuilder]::SaveBitmap($b, "assets/characters/player_skill2.png")
$b.Dispose()

# Hit
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $hitRect, 84, 84, 6, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/hit_0.png")
[AssetBuilder]::SaveBitmap($b, "assets/characters/player_hit.png")
$b.Dispose()
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $hitRect, 84, 84, 5, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/hit_1.png")
$b.Dispose()

# Dodge
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $dodgeRect, 84, 84, 6, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/dodge_0.png")
$b.Dispose()
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $dodgeRect, 84, 84, 5, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/dodge_1.png")
$b.Dispose()

# Death
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $deathRect, 84, 84, 6, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/death_0.png")
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/death_1.png")
$b.Dispose()
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $deathRect, 84, 84, 5, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/death_2.png")
$b.Dispose()
$b = [AssetBuilder]::ExtractCleanSprite($sheet, $deathRect, 84, 84, 4, $true)
[AssetBuilder]::SaveBitmap($b, "assets/characters/arden/death_3.png")
[AssetBuilder]::SaveBitmap($b, "assets/characters/player_death.png")
$b.Dispose()

Write-Output "ARDEN_EXTRACTED_SUCCESS"

# =========================================================================
# 2. MONSTERS
# =========================================================================
function BuildMonsterFrames($rect, $folder, $baseName, $w, $h) {
    for ($f = 0; $f -lt 4; $f++) {
        $off = 6
        if ($f % 2 -eq 1) { $off = 5 }
        $b = [AssetBuilder]::ExtractCleanSprite($sheet, $rect, $w, $h, $off, $true)
        [AssetBuilder]::SaveBitmap($b, "$folder/idle_$f.png")
        [AssetBuilder]::SaveBitmap($b, "$folder/walk_$f.png")
        if ($f -lt 3) { [AssetBuilder]::SaveBitmap($b, "$folder/attack_$f.png") }
        if ($f -lt 2) { [AssetBuilder]::SaveBitmap($b, "$folder/hit_$f.png") }
        if ($f -lt 3) {
            $deathOff = 6 - $f * 2
            $bd = [AssetBuilder]::ExtractCleanSprite($sheet, $rect, $w, $h, $deathOff, $true)
            [AssetBuilder]::SaveBitmap($bd, "$folder/death_$f.png")
            $bd.Dispose()
        }
        if ($f -eq 0) { [AssetBuilder]::SaveBitmap($b, "assets/enemies/$baseName.png") }
        $b.Dispose()
    }
}

BuildMonsterFrames ([System.Drawing.Rectangle]::new(426, 312, 44, 56)) "assets/enemies/goblin" "goblin" 68 68
BuildMonsterFrames ([System.Drawing.Rectangle]::new(476, 308, 46, 60)) "assets/enemies/skeleton_warrior" "skeleton_warrior" 68 68
BuildMonsterFrames ([System.Drawing.Rectangle]::new(526, 308, 46, 60)) "assets/enemies/skeleton_archer" "skeleton_archer" 68 68
BuildMonsterFrames ([System.Drawing.Rectangle]::new(576, 318, 48, 50)) "assets/enemies/slime" "slime" 68 68
BuildMonsterFrames ([System.Drawing.Rectangle]::new(628, 312, 48, 54)) "assets/enemies/bat" "bat" 68 68
BuildMonsterFrames ([System.Drawing.Rectangle]::new(680, 308, 48, 60)) "assets/enemies/dark_mage" "mage" 68 68

# Orc (using giant orc/goblin king model scaled to 84x84)
BuildMonsterFrames ([System.Drawing.Rectangle]::new(12, 412, 94, 90)) "assets/enemies/orc" "orc" 84 84

# Goblin Warrior (Distinct armored goblin with round shield and sword)
for ($f = 0; $f -lt 4; $f++) {
    [AssetBuilder]::BuildGoblinWarrior($sheet, "assets/enemies/goblin_warrior/idle_$f.png", $f)
    [AssetBuilder]::BuildGoblinWarrior($sheet, "assets/enemies/goblin_warrior/walk_$f.png", $f)
    if ($f -lt 3) { [AssetBuilder]::BuildGoblinWarrior($sheet, "assets/enemies/goblin_warrior/attack_$f.png", $f) }
    if ($f -lt 2) { [AssetBuilder]::BuildGoblinWarrior($sheet, "assets/enemies/goblin_warrior/hit_$f.png", $f) }
    if ($f -lt 3) { [AssetBuilder]::BuildGoblinWarrior($sheet, "assets/enemies/goblin_warrior/death_$f.png", $f) }
    if ($f -eq 0) { Copy-Item "assets/enemies/goblin_warrior/idle_0.png" "assets/enemies/goblin_warrior.png" -Force }
}

Write-Output "MONSTERS_EXTRACTED_SUCCESS"

# =========================================================================
# 3. BOSSES (160x160 and 180x180 Transparent Canvas)
# =========================================================================
$b = [AssetBuilder]::ExtractCleanSprite($sheet, [System.Drawing.Rectangle]::new(12, 412, 94, 90), 160, 160, 4, $true)
[AssetBuilder]::SaveBitmap($b, "assets/bosses/goblin_king.png")
$b.Dispose()

$b = [AssetBuilder]::ExtractCleanSprite($sheet, [System.Drawing.Rectangle]::new(114, 412, 86, 90), 160, 160, 4, $true)
[AssetBuilder]::SaveBitmap($b, "assets/bosses/cursed_knight.png")
$b.Dispose()

$b = [AssetBuilder]::ExtractCleanSprite($sheet, [System.Drawing.Rectangle]::new(202, 412, 66, 90), 160, 160, 4, $true)
[AssetBuilder]::SaveBitmap($b, "assets/bosses/abyss_witch.png")
$b.Dispose()

$b = [AssetBuilder]::ExtractCleanSprite($sheet, [System.Drawing.Rectangle]::new(282, 380, 136, 122), 180, 180, 4, $true)
[AssetBuilder]::SaveBitmap($b, "assets/bosses/ancient_dragon.png")
$b.Dispose()

$b = [AssetBuilder]::ExtractCleanSprite($sheet, [System.Drawing.Rectangle]::new(428, 410, 84, 92), 160, 160, 4, $true)
[AssetBuilder]::SaveBitmap($b, "assets/bosses/void_lord.png")
$b.Dispose()

Write-Output "ALL_SPRITES_EXTRACTED_AND_SAVED_SUCCESS"
