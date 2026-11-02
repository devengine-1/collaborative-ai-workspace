import { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'

function focusPrompt() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  setTimeout(() => document.getElementById('prompt-input')?.focus({ preventScroll: true }), 600)
}

/** Button that is gently pulled toward the cursor. */
function MagneticButton({ children, onClick }) {
  const ref = useRef(null)
  const x = useSpring(useMotionValue(0), { stiffness: 250, damping: 15 })
  const y = useSpring(useMotionValue(0), { stiffness: 250, damping: 15 })

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      onPointerMove={(e) => {
        const r = ref.current.getBoundingClientRect()
        x.set((e.clientX - (r.left + r.width / 2)) * 0.35)
        y.set((e.clientY - (r.top + r.height / 2)) * 0.35)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
      whileTap={{ scale: 0.95 }}
      style={{ x, y }}
      className="rounded-2xl bg-stone-900 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-violet-500/20 transition-colors hover:bg-violet-700 dark:bg-white dark:text-stone-900 dark:hover:bg-violet-200"
    >
      {children}
    </motion.button>
  )
}

export default function FinalCta() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-16 pt-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 40 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="relative overflow-hidden rounded-[2rem] border border-violet-200 bg-gradient-to-br from-violet-100/90 via-white/90 to-orange-100/80 px-8 py-20 text-center backdrop-blur-xl dark:border-violet-400/20 dark:from-violet-950/80 dark:via-stone-950/80 dark:to-orange-950/50"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-violet-400/30 blur-3xl"
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <h2 className="relative font-serif text-4xl sm:text-5xl">Your next draft is one prompt away.</h2>
        <p className="relative mx-auto mt-4 max-w-lg text-stone-600 dark:text-stone-400">
          Start with a sentence. Shape it with a highlight.
        </p>
        <div className="relative mt-10">
          <MagneticButton onClick={focusPrompt}>Start writing ↑</MagneticButton>
        </div>
      </motion.div>

      <footer className="mt-16 flex flex-col items-center justify-between gap-2 text-xs text-stone-500 sm:flex-row dark:text-stone-500">
        <span>Collaborative AI Workspace · FastAPI · SQLite · React</span>
        <span>Powered by Claude</span>
      </footer>
    </section>
  )
}
