import { motion } from 'framer-motion'

export function SectionHeading({ eyebrow, title, body }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-2xl text-center"
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-violet-600 dark:text-violet-300">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl sm:text-4xl">{title}</h2>
      {body && <p className="mt-3 text-stone-500 dark:text-stone-400">{body}</p>}
    </motion.div>
  )
}
