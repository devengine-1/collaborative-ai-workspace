import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useScroll, useSpring } from 'framer-motion'
import Spinner from '../Spinner.jsx'
import { SectionHeading } from './SectionHeading.jsx'

const STEPS = [
  { n: '01', title: 'Describe it', body: 'Write a prompt and Claude drafts the full document in seconds.' },
  { n: '02', title: 'Highlight it', body: 'Select any sentence or paragraph. A toolbar appears right at your cursor.' },
  { n: '03', title: 'Refine it', body: 'Say what to change. The new text is swapped in place, no reload.' },
]

export default function HowItWorks() {
  const ref = useRef(null)
  // Connector line draws itself as the section scrolls through the viewport.
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'start 35%'] })
  const line = useSpring(scrollYProgress, { stiffness: 120, damping: 24 })

  return (
    <section id="how" ref={ref} className="mx-auto max-w-5xl scroll-mt-24 px-6 py-24">
      <SectionHeading eyebrow="How it works" title="Write with AI, one highlight at a time." />

      <div className="relative mt-14">
        <motion.div
          style={{ scaleX: line }}
          className="absolute left-[16%] right-[16%] top-5 hidden h-px origin-left bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-300 sm:block"
        />
        <div className="grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ type: 'spring', stiffness: 200, damping: 24, delay: i * 0.12 }}
              className="text-center"
            >
              <motion.div
                whileHover={{ scale: 1.12, rotate: -6 }}
                className="relative mx-auto grid h-10 w-10 place-items-center rounded-full border border-violet-300 bg-white font-mono text-xs text-violet-600 shadow-sm dark:border-violet-400/40 dark:bg-stone-900 dark:text-violet-300"
              >
                {s.n}
              </motion.div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mx-auto mt-1 max-w-60 text-sm leading-6 text-stone-500 dark:text-stone-400">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <EditDemo />
    </section>
  )
}

/* Looping mini-demo of highlight -> toolbar -> rewrite; runs while visible. */
const DEMO_BEFORE = 'The app saves your notes to the cloud.'
const DEMO_AFTER = 'Notes sync through an end-to-end encrypted, offline-first replication layer.'

function EditDemo() {
  const ref = useRef(null)
  const inView = useInView(ref, { amount: 0.5 })
  const [step, setStep] = useState(0) // 0 idle, 1 highlighted, 2 toolbar, 3 rewriting, 4 swapped

  useEffect(() => {
    if (!inView) return
    const durations = [900, 900, 1500, 1100, 2600]
    const t = setTimeout(() => setStep((s) => (s + 1) % 5), durations[step])
    return () => clearTimeout(t)
  }, [step, inView])

  const highlighted = step >= 1 && step <= 3
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      className="relative mx-auto mt-16 max-w-2xl rounded-3xl border border-stone-200 bg-white/90 px-8 pb-12 pt-24 shadow-2xl shadow-stone-300/40 backdrop-blur-xl dark:border-white/10 dark:bg-stone-900/70 dark:shadow-black/50"
    >
      <div className="absolute right-6 top-6 flex gap-1.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.span
            key={i}
            animate={{ width: step === i ? 18 : 6, opacity: step === i ? 1 : 0.35 }}
            className="h-1.5 rounded-full bg-violet-500"
          />
        ))}
      </div>

      <AnimatePresence>
        {(step === 2 || step === 3) && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="absolute left-8 top-6 flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs shadow-xl dark:border-white/10 dark:bg-stone-800"
          >
            <span className="text-violet-600 dark:text-violet-300">✦</span>
            <span className="text-stone-700 dark:text-stone-200">Make this more technical</span>
            <span className="ml-2 rounded-lg bg-violet-600 px-2 py-1 font-semibold text-white">
              {step === 3 ? <Spinner className="h-3 w-3" /> : 'Rewrite'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="font-serif text-xl leading-9 text-stone-800 dark:text-stone-200">
        Your workspace keeps every draft in one place.{' '}
        <AnimatePresence mode="wait">
          <motion.span
            key={step === 4 ? 'after' : 'before'}
            initial={{ opacity: 0, filter: 'blur(6px)' }}
            animate={{
              opacity: 1,
              filter: 'blur(0px)',
              backgroundColor: highlighted || step === 4 ? 'rgba(167,139,250,0.35)' : 'rgba(167,139,250,0)',
            }}
            exit={{ opacity: 0, filter: 'blur(6px)' }}
            transition={{ duration: 0.4 }}
            className={`rounded-[3px] ${step === 3 ? 'pending-shimmer' : ''}`}
          >
            {step === 4 ? DEMO_AFTER : DEMO_BEFORE}
          </motion.span>
        </AnimatePresence>{' '}
        Share a link and collaborators see changes as they happen.
      </p>
    </motion.div>
  )
}
