Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Collections.Generic;
using System.IO;

public class PreciseExtractor {
    public static void Extract(string srcPath, Rectangle cropRect, string outPath, int targetW, int targetH, int groundOffset) {
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

            // Seed outer borders
            for (int x = 0; x < w; x++) {
                queue.Enqueue(new Point(x, 0));
                queue.Enqueue(new Point(x, h - 1));
            }
            for (int y = 0; y < h; y++) {
                queue.Enqueue(new Point(0, y));
                queue.Enqueue(new Point(w - 1, y));
            }

            // Seed bottom ground
            for (int x = w / 4; x <= (3 * w) / 4; x++) {
                queue.Enqueue(new Point(x, h - 1));
                if (h > 2) queue.Enqueue(new Point(x, h - 2));
            }

            while (queue.Count > 0) {
                Point pt = queue.Dequeue();
                int px = pt.X;
                int py = pt.Y;
                if (px < 0 || px >= w || py < 0 || py >= h) continue;
                if (visited[px, py]) continue;
                visited[px, py] = true;

                int idx = py * stride + px * 4;
                byte b = rgb[idx];
                byte gCol = rgb[idx + 1];
                byte r = rgb[idx + 2];

                // Dark navy/charcoal background threshold
                bool isBg = (b >= 18 && gCol >= 11 && b > r + 4 && r <= 34) || 
                            (r <= 9 && gCol <= 9 && b <= 14) ||
                            (r <= 22 && gCol <= 25 && b >= 28);

                if (isBg) {
                    rgb[idx + 3] = 0; // 100% Transparent
                    queue.Enqueue(new Point(px + 1, py));
                    queue.Enqueue(new Point(px - 1, py));
                    queue.Enqueue(new Point(px, py + 1));
                    queue.Enqueue(new Point(px, py - 1));
                }
            }

            // Connected component analysis to isolate main character and eliminate stray neighbors
            int[] compId = new int[w * h];
            int currentId = 1;
            Dictionary<int, int> compSizes = new Dictionary<int, int>();

            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    int idx = y * stride + x * 4;
                    if (rgb[idx + 3] == 0) continue;
                    if (compId[y * w + x] != 0) continue;

                    int id = currentId++;
                    int count = 0;
                    Queue<Point> q = new Queue<Point>();
                    q.Enqueue(new Point(x, y));
                    compId[y * w + x] = id;

                    while (q.Count > 0) {
                        Point p = q.Dequeue();
                        count++;
                        for (int dy = -1; dy <= 1; dy++) {
                            for (int dx = -1; dx <= 1; dx++) {
                                int nx = p.X + dx;
                                int ny = p.Y + dy;
                                if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
                                if (compId[ny * w + nx] != 0) continue;
                                int nidx = ny * stride + nx * 4;
                                if (rgb[nidx + 3] == 0) continue;
                                compId[ny * w + nx] = id;
                                q.Enqueue(new Point(nx, ny));
                            }
                        }
                    }
                    compSizes[id] = count;
                }
            }

            // Main character component (largest size, at least 80 pixels)
            int maxId = 0;
            int maxCount = 0;
            foreach (var pair in compSizes) {
                if (pair.Value > maxCount) {
                    maxCount = pair.Value;
                    maxId = pair.Key;
                }
            }

            // Remove any disconnected fragments (keeps main character + close components > 35 pixels)
            for (int y = 0; y < h; y++) {
                for (int x = 0; x < w; x++) {
                    int id = compId[y * w + x];
                    if (id != maxId && (id == 0 || compSizes[id] < 35 || Math.Abs(x - w / 2) > w * 0.42)) {
                        int idx = y * stride + x * 4;
                        rgb[idx + 3] = 0; // Erase stray neighbor pixels
                    }
                }
            }

            Marshal.Copy(rgb, 0, bData.Scan0, bytes);
            crop.UnlockBits(bData);

            // Center onto transparent square target canvas
            Bitmap final = new Bitmap(targetW, targetH, PixelFormat.Format32bppArgb);
            using (Graphics gFinal = Graphics.FromImage(final)) {
                gFinal.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.NearestNeighbor;
                int ox = (targetW - w) / 2;
                int oy = targetH - h - groundOffset;
                gFinal.DrawImage(crop, ox, oy);
            }
            crop.Dispose();

            string dir = Path.GetDirectoryName(outPath);
            if (!Directory.Exists(dir)) Directory.CreateDirectory(dir);
            final.Save(outPath, ImageFormat.Png);
            final.Dispose();
        }
    }
}
"@

$sheet = (Resolve-Path "assets/reference_sheet.jpg").Path

# =========================================================================
# 1. ARDEN ACTION FRAMES (76x76 Transparent Canvas)
# =========================================================================
# 1) Idle (대기)
$idleRect = New-Object System.Drawing.Rectangle(12, 310, 44, 58)
[PreciseExtractor]::Extract($sheet, $idleRect, "assets/characters/arden/idle_0.png", 76, 76, 6)
[PreciseExtractor]::Extract($sheet, $idleRect, "assets/characters/arden/idle_1.png", 76, 76, 5)
[PreciseExtractor]::Extract($sheet, $idleRect, "assets/characters/arden/idle_2.png", 76, 76, 6)
[PreciseExtractor]::Extract($sheet, $idleRect, "assets/characters/arden/idle_3.png", 76, 76, 7)
Copy-Item "assets/characters/arden/idle_0.png" "assets/characters/player_idle.png" -Force

# 2) Walk (이동) - trimmed width 42 to avoid neighbor hilt
$walkRect = New-Object System.Drawing.Rectangle(68, 310, 42, 58)
[PreciseExtractor]::Extract($sheet, $walkRect, "assets/characters/arden/walk_0.png", 76, 76, 6)
[PreciseExtractor]::Extract($sheet, $walkRect, "assets/characters/arden/walk_1.png", 76, 76, 4)
[PreciseExtractor]::Extract($sheet, $walkRect, "assets/characters/arden/walk_2.png", 76, 76, 6)
[PreciseExtractor]::Extract($sheet, $walkRect, "assets/characters/arden/walk_3.png", 76, 76, 5)
Copy-Item "assets/characters/arden/walk_1.png" "assets/characters/player_walk.png" -Force

# 3) Attack (공격) - trimmed x: 122, w: 48 to avoid neighbor blade
$atkRect = New-Object System.Drawing.Rectangle(122, 310, 48, 58)
[PreciseExtractor]::Extract($sheet, $atkRect, "assets/characters/arden/attack_0.png", 76, 76, 6)
[PreciseExtractor]::Extract($sheet, $atkRect, "assets/characters/arden/attack_1.png", 76, 76, 5)
[PreciseExtractor]::Extract($sheet, $atkRect, "assets/characters/arden/attack_2.png", 76, 76, 6)
[PreciseExtractor]::Extract($sheet, $atkRect, "assets/characters/arden/attack_3.png", 76, 76, 6)
Copy-Item "assets/characters/arden/attack_1.png" "assets/characters/player_attack.png" -Force

# 4) Skill 1 & 2 (스킬 1 & 스킬 2)
$sk1Rect = New-Object System.Drawing.Rectangle(176, 310, 52, 58)
$sk2Rect = New-Object System.Drawing.Rectangle(234, 306, 54, 62)
[PreciseExtractor]::Extract($sheet, $sk1Rect, "assets/characters/arden/skill_0.png", 76, 76, 6)
[PreciseExtractor]::Extract($sheet, $sk1Rect, "assets/characters/arden/skill_1.png", 76, 76, 5)
[PreciseExtractor]::Extract($sheet, $sk2Rect, "assets/characters/arden/skill_2.png", 76, 76, 6)
[PreciseExtractor]::Extract($sheet, $sk2Rect, "assets/characters/arden/skill_3.png", 76, 76, 6)
Copy-Item "assets/characters/arden/skill_1.png" "assets/characters/player_skill1.png" -Force
Copy-Item "assets/characters/arden/skill_2.png" "assets/characters/player_skill2.png" -Force

# 5) Hit (피격)
$hitRect = New-Object System.Drawing.Rectangle(292, 310, 48, 58)
[PreciseExtractor]::Extract($sheet, $hitRect, "assets/characters/arden/hit_0.png", 76, 76, 6)
[PreciseExtractor]::Extract($sheet, $hitRect, "assets/characters/arden/hit_1.png", 76, 76, 5)
Copy-Item "assets/characters/arden/hit_0.png" "assets/characters/player_hit.png" -Force

# 6) Dodge (회피)
$dodgeRect = New-Object System.Drawing.Rectangle(348, 310, 46, 58)
[PreciseExtractor]::Extract($sheet, $dodgeRect, "assets/characters/arden/dodge_0.png", 76, 76, 6)
[PreciseExtractor]::Extract($sheet, $dodgeRect, "assets/characters/arden/dodge_1.png", 76, 76, 5)

# 7) Death (사망)
$deathRect = New-Object System.Drawing.Rectangle(400, 310, 48, 58)
[PreciseExtractor]::Extract($sheet, $deathRect, "assets/characters/arden/death_0.png", 76, 76, 6)
[PreciseExtractor]::Extract($sheet, $deathRect, "assets/characters/arden/death_1.png", 76, 76, 6)
[PreciseExtractor]::Extract($sheet, $deathRect, "assets/characters/arden/death_2.png", 76, 76, 5)
[PreciseExtractor]::Extract($sheet, $deathRect, "assets/characters/arden/death_3.png", 76, 76, 4)
Copy-Item "assets/characters/arden/death_3.png" "assets/characters/player_death.png" -Force

Write-Output "EXTRACTED_CLEAN_ARDEN_SUCCESS"

# =========================================================================
# 2. MONSTERS (68x68 Transparent Canvas)
# =========================================================================
# 1) Goblin
$gobRect = New-Object System.Drawing.Rectangle(426, 312, 44, 56)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/idle_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/idle_1.png", 68, 68, 5)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/walk_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/walk_1.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/walk_2.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/walk_3.png", 68, 68, 5)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/attack_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/attack_1.png", 68, 68, 5)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/attack_2.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/hit_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/hit_1.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/death_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/death_1.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $gobRect, "assets/enemies/goblin/death_2.png", 68, 68, 2)
Copy-Item "assets/enemies/goblin/idle_0.png" "assets/enemies/goblin.png" -Force

# 2) Skeleton Warrior
$skelRect = New-Object System.Drawing.Rectangle(476, 310, 46, 58)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/idle_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/idle_1.png", 68, 68, 5)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/walk_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/walk_1.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/walk_2.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/walk_3.png", 68, 68, 5)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/attack_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/attack_1.png", 68, 68, 5)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/attack_2.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/hit_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/hit_1.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/death_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/death_1.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $skelRect, "assets/enemies/skeleton_warrior/death_2.png", 68, 68, 2)
Copy-Item "assets/enemies/skeleton_warrior/idle_0.png" "assets/enemies/skeleton_warrior.png" -Force

# 3) Skeleton Archer
$archRect = New-Object System.Drawing.Rectangle(526, 310, 46, 58)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/idle_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/idle_1.png", 68, 68, 5)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/walk_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/walk_1.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/walk_2.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/walk_3.png", 68, 68, 5)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/attack_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/attack_1.png", 68, 68, 5)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/attack_2.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/hit_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/hit_1.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/death_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/death_1.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $archRect, "assets/enemies/skeleton_archer/death_2.png", 68, 68, 2)
Copy-Item "assets/enemies/skeleton_archer/idle_0.png" "assets/enemies/skeleton_archer.png" -Force

# 4) Slime
$slimeRect = New-Object System.Drawing.Rectangle(576, 318, 48, 50)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/idle_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/idle_1.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/walk_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/walk_1.png", 68, 68, 3)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/walk_2.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/walk_3.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/attack_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/attack_1.png", 68, 68, 2)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/attack_2.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/hit_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/hit_1.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/death_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/death_1.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $slimeRect, "assets/enemies/slime/death_2.png", 68, 68, 2)
Copy-Item "assets/enemies/slime/idle_0.png" "assets/enemies/slime.png" -Force

# 5) Bat
$batRect = New-Object System.Drawing.Rectangle(628, 312, 48, 54)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/idle_0.png", 68, 68, 8)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/idle_1.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/walk_0.png", 68, 68, 8)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/walk_1.png", 68, 68, 5)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/walk_2.png", 68, 68, 8)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/walk_3.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/attack_0.png", 68, 68, 8)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/attack_1.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/attack_2.png", 68, 68, 8)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/hit_0.png", 68, 68, 8)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/hit_1.png", 68, 68, 8)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/death_0.png", 68, 68, 8)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/death_1.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $batRect, "assets/enemies/bat/death_2.png", 68, 68, 2)
Copy-Item "assets/enemies/bat/idle_0.png" "assets/enemies/bat.png" -Force

# 6) Dark Mage
$mageRect = New-Object System.Drawing.Rectangle(680, 308, 48, 60)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/idle_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/idle_1.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/walk_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/walk_1.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/walk_2.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/walk_3.png", 68, 68, 5)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/attack_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/attack_1.png", 68, 68, 5)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/attack_2.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/hit_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/hit_1.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/death_0.png", 68, 68, 6)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/death_1.png", 68, 68, 4)
[PreciseExtractor]::Extract($sheet, $mageRect, "assets/enemies/dark_mage/death_2.png", 68, 68, 2)
Copy-Item "assets/enemies/dark_mage/idle_0.png" "assets/enemies/mage.png" -Force

# 7) Orc
$bossGobRect = New-Object System.Drawing.Rectangle(12, 418, 96, 96)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/bosses/goblin_king.png", 140, 140, 8)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/idle_0.png", 84, 84, 6)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/idle_1.png", 84, 84, 5)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/walk_0.png", 84, 84, 6)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/walk_1.png", 84, 84, 4)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/walk_2.png", 84, 84, 6)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/walk_3.png", 84, 84, 5)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/attack_0.png", 84, 84, 6)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/attack_1.png", 84, 84, 5)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/attack_2.png", 84, 84, 6)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/hit_0.png", 84, 84, 6)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/hit_1.png", 84, 84, 6)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/death_0.png", 84, 84, 6)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/death_1.png", 84, 84, 4)
[PreciseExtractor]::Extract($sheet, $bossGobRect, "assets/enemies/orc/death_2.png", 84, 84, 2)
Copy-Item "assets/enemies/orc/idle_0.png" "assets/enemies/orc.png" -Force

# 8) Goblin Warrior (Armored)
$knightRect = New-Object System.Drawing.Rectangle(116, 416, 86, 98)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/bosses/cursed_knight.png", 148, 148, 8)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/idle_0.png", 72, 72, 6)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/idle_1.png", 72, 72, 5)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/walk_0.png", 72, 72, 6)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/walk_1.png", 72, 72, 4)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/walk_2.png", 72, 72, 6)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/walk_3.png", 72, 72, 5)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/attack_0.png", 72, 72, 6)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/attack_1.png", 72, 72, 5)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/attack_2.png", 72, 72, 6)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/hit_0.png", 72, 72, 6)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/hit_1.png", 72, 72, 6)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/death_0.png", 72, 72, 6)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/death_1.png", 72, 72, 4)
[PreciseExtractor]::Extract($sheet, $knightRect, "assets/enemies/goblin_warrior/death_2.png", 72, 72, 2)
Copy-Item "assets/enemies/goblin_warrior/idle_0.png" "assets/enemies/goblin_warrior.png" -Force

# 3. Bosses
$witchRect = New-Object System.Drawing.Rectangle(208, 418, 76, 96)
[PreciseExtractor]::Extract($sheet, $witchRect, "assets/bosses/abyss_witch.png", 140, 140, 8)

$dragonRect = New-Object System.Drawing.Rectangle(288, 405, 140, 110)
[PreciseExtractor]::Extract($sheet, $dragonRect, "assets/bosses/ancient_dragon.png", 168, 168, 8)

$voidRect = New-Object System.Drawing.Rectangle(432, 415, 82, 100)
[PreciseExtractor]::Extract($sheet, $voidRect, "assets/bosses/void_lord.png", 160, 160, 8)

Write-Output "EXTRACT_ALL_WITH_CONNECTED_COMPONENT_CLEANUP_SUCCESS"
