import { useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { SectionHeading } from './SectionHeading.jsx'

const FEATURES = [
  { icon: '◐', title: 'Context-aware edits', body: 'Every rewrite sees the whole document, so tone and terminology stay consistent.' },
  { icon: '⌖', title: 'Pixel-precise selection', body: 'Selections map to exact character offsets, so the right passage changes even if it repeats.' },
  { icon: '↻', title: 'No page reloads', body: 'New text is swapped in place with a soft highlight so you can see what changed.' },
  { icon: '▤', title: 'Local by default', body: 'Documents and edit history live in a SQLite file on your machine.' },
  { icon: '⌘', title: 'Keyboard friendly', body: 'Shift + arrows to select, Enter to rewrite, Esc to dismiss.' },
  { icon: '☾', title: 'Light & dark', body: 'A theme for daytime drafting and one for late-night writing sessions.' },
]

/** Card that tilts toward the cursor with a spotlight following it. */
function TiltCard({ children, index }) {
  const ref = useRef(null)
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const rotateX = useSpring(useTransform(my, [0, 1], [7, -7]), { stiffness: 220, damping: 18 })
  const rotateY = useSpring(useTransform(mx, [0, 1], [-7, 7]), { stiffness: 220, damping: 18 })
  const gx = useTransform(mx, (v) => `${v * 100}%`)
  const gy = useTransform(my, (v) => `${v * 100}%`)
  const spotlight = useMotionTemplate`radial-gradient(260px circle at ${gx} ${gy}, rgba(167,139,250,0.22), transparent 70%)`

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }
  const reset = () => {
    mx.set(0.5)
    my.set(0.5)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: 'spring', stiffness: 180, damping: 22, delay: (index % 3) * 0.08 }}
      style={{ perspective: 800 }}
    >
      <motion.div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={reset}
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="group relative h-full overflow-hidden rounded-2xl border border-stone-200 bg-white/85 p-6 shadow-sm backdrop-blur-xl transition-colors hover:border-violet-300 dark:border-white/10 dark:bg-stone-900/60 dark:hover:border-violet-400/40"
      >
        <motion.div
          style={{ background: spotlight }}
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <div className="relative" style={{ transform: 'translateZ(30px)' }}>
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Features() {
  return (
    <section id="features" className="mx-auto max-w-5xl scroll-mt-24 px-6 py-24">
      <SectionHeading eyebrow="Features" title="Small surface, sharp tools." />
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f, i) => (
          <TiltCard key={f.title} index={i}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-lg text-violet-700 dark:bg-violet-400/15 dark:text-violet-200">
              {f.icon}
            </span>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">{f.body}</p>
          </TiltCard>
        ))}
      </div>
    </section>
  )
}
