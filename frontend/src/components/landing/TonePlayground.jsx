import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SectionHeading } from './SectionHeading.jsx'

// Pre-written variants: lets visitors feel the interaction without an API call.
const TONES = [
  {
    id: 'original',
    label: 'Original',
    text: 'Our new feature lets teams leave comments on documents so they can work together more easily.',
  },
  {
    id: 'technical',
    label: 'Technical',
    text: 'The feature adds threaded, range-anchored annotations to documents, persisted per revision and resolved via character offsets so comments survive concurrent edits.',
  },
  {
    id: 'concise',
    label: 'Concise',
    text: 'Teams can now comment directly on documents.',
  },
  {
    id: 'friendly',
    label: 'Friendly',
    text: 'Good news: you can now drop comments right on a doc, so working with your team feels like chatting across the table.',
  },
  {
    id: 'persuasive',
    label: 'Persuasive',
    text: 'Stop losing feedback in email threads. Inline comments keep every decision next to the words it shapes, so your team ships faster.',
  },
]

const countWords = (s) => s.trim().split(/\s+/).length

export default function TonePlayground() {
  const [active, setActive] = useState('original')
  const tone = TONES.find((t) => t.id === active)
  const delta = countWords(tone.text) - countWords(TONES[0].text)

  return (
    <section id="playground" className="mx-auto max-w-4xl scroll-mt-24 px-6 py-24">
      <SectionHeading
        eyebrow="Playground"
        title="One sentence, many voices."
        body="Pick an instruction and see how a single highlighted passage changes."
      />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ type: 'spring', stiffness: 140, damping: 22 }}
        className="mt-12 overflow-hidden rounded-3xl border border-stone-200 bg-white/90 shadow-xl shadow-stone-300/30 backdrop-blur-xl dark:border-white/10 dark:bg-stone-900/70 dark:shadow-black/40"
      >
        <div className="flex flex-wrap gap-1 border-b border-stone-200 p-2 dark:border-white/10" role="tablist">
          {TONES.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={active === t.id}
              onClick={() => setActive(t.id)}
              className={`relative rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
                active === t.id
                  ? 'text-white'
                  : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
              }`}
            >
              {active === t.id && (
                <motion.span
                  layoutId="tone-pill"
                  className="absolute inset-0 rounded-xl bg-violet-600 dark:bg-violet-500"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="relative min-h-44 px-8 py-10">
          <AnimatePresence mode="wait">
            <motion.p
              key={tone.id}
              initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
              transition={{ duration: 0.3 }}
              className="font-serif text-2xl leading-10 text-stone-800 dark:text-stone-100"
            >
              {tone.text}
            </motion.p>
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between border-t border-stone-200 px-8 py-3 text-xs text-stone-500 dark:border-white/10 dark:text-stone-400">
          <span>
            Instruction: <span className="text-stone-800 dark:text-stone-200">“{tone.id === 'original' ? '—' : `Make this ${tone.label.toLowerCase()}`}”</span>
          </span>
          <motion.span key={tone.id} initial={{ scale: 1.3, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            {countWords(tone.text)} words
            {delta !== 0 && (
              <span className={delta > 0 ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}>
                {' '}({delta > 0 ? '+' : ''}{delta})
              </span>
            )}
          </motion.span>
        </div>
      </motion.div>
    </section>
  )
}
