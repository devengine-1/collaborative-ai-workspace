/**
 * Pure per-pixel shader for the pixel-art black hole (no DOM), so it can run
 * in the browser or be rendered offline for testing.
 */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => v / 16 - 0.5)

// Pack an RGBA colour into the little-endian ABGR uint32 ImageData expects.
const rgba = (hex, a = 255) => {
  const n = parseInt(hex.slice(1), 16)
  return ((a << 24) | ((n & 255) << 16) | (((n >> 8) & 255) << 8) | ((n >> 16) & 255)) >>> 0
}

const DISK = ['#3b0d3f', '#6d1745', '#a62b3a', '#d9502a', '#f2862e', '#fbb54a', '#ffe08a', '#fff7e0']
const LIGHT_DISK_ALPHA = [0, 80, 150, 210, 240, 255, 255, 255] // faintest step transparent: no haze

export const PALETTES = {
  dark: {
    space: rgba('#05040a'),
    horizon: rgba('#000000'),
    disk: DISK.map((c) => rgba(c)),
    stars: [rgba('#2f2a45'), rgba('#7d76a3'), rgba('#ece8ff')],
  },
  light: {
    space: 0, // transparent: page background shows through
    horizon: rgba('#120f1a'),
    disk: DISK.map((c, i) => rgba(c, LIGHT_DISK_ALPHA[i])),
    stars: [rgba('#a8a29e', 60), rgba('#78716c', 110), rgba('#57534e', 170)],
  },
}

// Cheap integer hash -> [0, 1)
const hash = (x, y) => {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

/**
 * Shade a W x H uint32 (ABGR) buffer.
 * opts: { pal, R, cx, cy, t, starShift }
 */
export function shadeBlackHole(buf, W, H, { pal, R, cx, cy, t, starShift = 0 }) {
  const rIn = R * 1.55
  const rOut = R * 4.4
  const tilt = -0.18
  const cosT = Math.cos(tilt)
  const sinT = Math.sin(tilt)
  const flat = 0.2 // disk inclination (ellipse squash)

  // Disk brightness at disk-plane radius rd and angle phi.
  const emission = (rd, phi) => {
    const x = (rd - rIn) / (rOut - rIn)
    if (x <= 0 || x >= 1) return 0
    const base = Math.pow(1 - x, 1.7) * Math.min(1, 0.55 + x * 9) // brightest near the inner edge
    // Rigid rotation per radial band: inner bands faster, no winding.
    const band = Math.floor(rd * 0.55)
    const speed = 1.4 * Math.pow(rIn / rd, 1.5)
    const a = phi + t * speed + hash(band, 7) * 6.283
    const streak = 0.62 + 0.38 * Math.sin(a * 2) * Math.sin(a * 5 + band)
    const doppler = 1 + 0.55 * Math.cos(phi - 0.4)
    return base * streak * doppler
  }

  let i = 0
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++, i++) {
      const dx = x + 0.5 - cx
      const dy = y + 0.5 - cy
      const r = Math.hypot(dx, dy)
      const dither = BAYER[((y & 3) << 2) | (x & 3)]

      // Disk plane coordinates (rotated + un-squashed).
      const u = dx * cosT + dy * sinT
      const v = (-dx * sinT + dy * cosT) / flat
      const rd = Math.hypot(u, v)
      // Near half (v > 0) sits in front of the hole; far half is hidden inside the shadow.
      const onDisk = rd > rIn && rd < rOut && (v > 0 || r > R)

      let I = onDisk ? emission(rd, Math.atan2(v, u)) : 0

      if (!onDisk && r < R) {
        buf[i] = pal.horizon
        continue
      }

      if (r > R) {
        // Lensed far side of the disk: a ring hugging the shadow.
        // Applied on both halves (max-blended) so there is no seam at the midplane.
        if (r > R && r < R * 2.2) {
          const rr = rIn + (r - R) * 2.6
          const fall = 1 - (r - R) / (R * 1.2)
          if (fall > 0) I = Math.max(I, emission(rr, Math.atan2(dy, dx) + Math.PI / 2) * fall * 0.85)
        }
        // Photon ring.
        const pr = (r - R * 1.04) / (R * 0.07)
        I = Math.max(I, Math.exp(-pr * pr) * 0.95)
      }

      if (I > 0.03) {
        const idx = Math.max(0, Math.min(7, Math.floor((I + dither * 0.2) * 8)))
        buf[i] = pal.disk[idx]
        continue
      }

      // Starfield, sampled along a ray bent by the hole.
      const deflect = (R * R * 1.6) / Math.max(r, 0.001)
      const k = (r - deflect) / Math.max(r, 0.001)
      const sx = Math.floor(cx + dx * k + t * 0.6)
      const sy = Math.floor(cy + dy * k + starShift)
      const h = hash(sx, sy)
      if (h > 0.988) {
        const twinkle = Math.sin(t * 2.2 + h * 900)
        buf[i] = pal.stars[h > 0.997 ? 2 : twinkle > 0.2 ? 1 : 0]
      } else {
        buf[i] = pal.space
      }
    }
  }
}
