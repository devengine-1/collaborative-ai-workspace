import { useEffect, useRef } from 'react'
import { PALETTES, shadeBlackHole } from '../lib/blackHoleShader.js'

/**
 * Full-screen, pixel-art black hole rendered on a low-resolution canvas and
 * scaled up with `image-rendering: pixelated`.
 *
 * Every frame each low-res pixel is shaded by a tiny "fake ray tracer":
 *  - event horizon (shadow) + thin photon ring
 *  - tilted accretion disk, banded so it spins without winding up, with
 *    Doppler brightening on the approaching side
 *  - the lensed image of the disk's far side, wrapping over the shadow
 *  - a background starfield bent around the hole (gravitational lensing)
 * Colours are quantized to an 8-step palette with 4x4 Bayer dithering.
 *
 * Interactive: it leans toward the cursor, drifts with scroll (parallax),
 * and spins faster when you scroll quickly. Honours prefers-reduced-motion.
 */

export default function BlackHole({ theme }) {
  const canvasRef = useRef(null)
  const themeRef = useRef(theme)
  const redrawRef = useRef(() => {})
  themeRef.current = theme

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0, H = 0, PX = 6
    let image, buf
    let raf = 0, lastFrame = 0, lastTime = 0
    let phase = 4 // accumulated disk rotation
    let boost = 0 // extra spin from fast scrolling
    let lastScroll = window.scrollY
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 }

    const resize = () => {
      PX = window.innerWidth >= 1024 ? 6 : 5
      W = Math.ceil(window.innerWidth / PX)
      H = Math.ceil(window.innerHeight / PX)
      canvas.width = W
      canvas.height = H
      image = ctx.createImageData(W, H)
      buf = new Uint32Array(image.data.buffer)
    }

    const render = () => {
      const wide = window.innerWidth >= 1024
      shadeBlackHole(buf, W, H, {
        pal: PALETTES[themeRef.current] ?? PALETTES.dark,
        R: Math.min(W, H) * (wide ? 0.1 : 0.085), // shadow radius
        cx: W * (wide ? 0.74 : 0.5) + pointer.x * W * 0.03,
        cy: H * (wide ? 0.46 : 0.2) + pointer.y * H * 0.03 - (window.scrollY / PX) * 0.35,
        t: phase,
        starShift: (window.scrollY / PX) * 0.12,
      })
      ctx.putImageData(image, 0, 0)
    }

    const loop = (now) => {
      raf = requestAnimationFrame(loop)
      if (now - lastFrame < 1000 / 30) return // ~30 fps is plenty for pixel art
      const dt = Math.min(0.1, (now - (lastTime || now)) / 1000)
      lastFrame = lastTime = now
      phase += dt * (0.45 + boost)
      boost *= 0.92
      pointer.x += (pointer.tx - pointer.x) * 0.05
      pointer.y += (pointer.ty - pointer.y) * 0.05
      render()
    }

    const onPointerMove = (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onScroll = () => {
      boost = Math.min(3, boost + Math.abs(window.scrollY - lastScroll) * 0.004)
      lastScroll = window.scrollY
      if (reduceMotion) render()
    }
    const onResize = () => {
      resize()
      render()
    }

    resize()
    render()
    redrawRef.current = render
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onScroll, { passive: true })
    if (!reduceMotion) {
      window.addEventListener('pointermove', onPointerMove)
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onPointerMove)
      redrawRef.current = () => {}
    }
  }, [])

  // Repaint immediately on theme change (matters when animation is off).
  useEffect(() => redrawRef.current(), [theme])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full transition-opacity duration-700 [image-rendering:pixelated]"
    />
  )
}
