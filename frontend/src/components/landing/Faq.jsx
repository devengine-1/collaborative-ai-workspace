import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SectionHeading } from './SectionHeading.jsx'

const FAQS = [
  {
    q: 'How big can a selection be?',
    a: 'Anything from a single word to several paragraphs. Paragraph breaks inside the selection are preserved unless you ask to restructure.',
  },
  {
    q: 'What if the same sentence appears twice?',
    a: 'Selections are sent as exact character offsets, so only the passage you highlighted is rewritten. If the document changed in the meantime, the server rejects the stale edit instead of guessing.',
  },
  {
    q: 'Where are my documents stored?',
    a: 'In a local SQLite file next to the backend (workspace.db). Every rewrite is logged with its instruction, so you have a full edit history.',
  },
  {
    q: 'Which model writes the text?',
    a: 'Claude Opus 5.5 by default. You can change the model and how hard it thinks per endpoint in backend/.env.',
  },
  {
    q: 'Can I cancel a rewrite?',
    a: 'Yes. Press Esc or the Cancel button in the toolbar while a rewrite is running; the original text stays untouched.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState(0)

  return (
    <section id="faq" className="mx-auto max-w-3xl scroll-mt-24 px-6 py-24">
      <SectionHeading eyebrow="FAQ" title="Questions, answered." />
      <div className="mt-12 space-y-3">
        {FAQS.map((item, i) => {
          const isOpen = open === i
          return (
            <motion.div
              key={item.q}
              initial={{ opacity: 0, x: i % 2 ? 30 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
              className={`overflow-hidden rounded-2xl border backdrop-blur-xl transition-colors ${
                isOpen
                  ? 'border-violet-300 bg-white/95 dark:border-violet-400/40 dark:bg-stone-900/80'
                  : 'border-stone-200 bg-white/75 dark:border-white/10 dark:bg-stone-900/50'
              }`}
            >
              <button
                onClick={() => setOpen(isOpen ? -1 : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left font-medium"
              >
                {item.q}
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-500 dark:bg-white/10 dark:text-stone-300"
                >
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <p className="px-6 pb-5 text-sm leading-6 text-stone-600 dark:text-stone-400">{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}
