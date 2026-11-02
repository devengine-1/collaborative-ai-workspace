import { motion, useScroll, useSpring, useTransform } from 'framer-motion'
import { useMemo } from 'react'
import ThemeToggle from './ThemeToggle.jsx'
import { useActiveSection } from '../hooks/useActiveSection.js'

/**
 * Props:
 *  - mode: 'landing' | 'document'
 *  - sections: [{ id, label }] (landing nav)
 *  - wordCount, onNew (document mode)
 *  - theme, onToggleTheme
 */
export default function Header({ mode, sections = [], wordCount, onNew, theme, onToggleTheme }) {
  const { scrollY, scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30, mass: 0.3 })
  const pad = useTransform(scrollY, [0, 120], [18, 10])
  const glass = useTransform(scrollY, [0, 120], [0, 1])

  const ids = useMemo(() => sections.map((s) => s.id), [sections])
  const active = useActiveSection(ids, mode === 'landing')

  return (
    <motion.header
      style={{ paddingTop: pad, paddingBottom: pad }}
      className="fixed inset-x-0 top-0 z-40"
    >
      {/* Glass backdrop fades in as you scroll (theme handled by Tailwind dark: classes). */}
      <motion.div
        style={{ opacity: glass }}
        className="absolute inset-0 -z-10 border-b border-stone-200 bg-stone-50/75 backdrop-blur-md dark:border-white/10 dark:bg-[#0a0910]/75"
      />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6">
        <a href="#top" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="flex items-center gap-2">
          <motion.span
            whileHover={{ rotate: 90 }}
            className="grid h-7 w-7 place-items-center rounded-lg bg-stone-900 text-sm text-white dark:bg-white dark:text-stone-900"
          >
            ✦
          </motion.span>
          <span className="text-sm font-semibold tracking-tight">Workspace</span>
        </a>

        {mode === 'landing' && (
          <nav className="hidden items-center gap-1 rounded-full border border-stone-200/80 bg-white/60 p-1 backdrop-blur md:flex dark:border-white/10 dark:bg-white/5">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`relative rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  active === s.id ? 'text-white dark:text-stone-900' : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white'
                }`}
              >
                {active === s.id && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-full bg-stone-900 dark:bg-white"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                  />
                )}
                <span className="relative">{s.label}</span>
              </a>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-3">
          {mode === 'document' && (
            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
              <span className="hidden text-xs text-stone-500 sm:inline dark:text-stone-400">
                Highlight text to edit with AI · {wordCount} words
              </span>
              <button
                onClick={onNew}
                className="rounded-lg border border-stone-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-stone-700 transition hover:border-stone-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-stone-200 dark:hover:bg-white/10"
              >
                New document
              </button>
            </motion.div>
          )}
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>

      <motion.div
        style={{ scaleX: progress }}
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400"
      />
    </motion.header>
  )
}
