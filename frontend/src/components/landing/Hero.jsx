import { useEffect, useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Spinner from '../Spinner.jsx'

export const SUGGESTIONS = [
  'A one-page product brief for an offline-first notes app',
  'An explainer on how vector databases work, for engineers',
  'A warm welcome email for new members of a hiking club',
  'A short story about a lighthouse keeper on Mars',
]

export const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } } }
export const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 220, damping: 24 } },
}

/** Types out each suggestion as a cycling placeholder. */
function useTypewriter(lines, active) {
  const [text, setText] = useState('')
  useEffect(() => {
    if (!active) return
    let line = 0, char = 0, deleting = false, timer
    const tick = () => {
      const full = lines[line]
      char += deleting ? -1 : 1
      setText(full.slice(0, char))
      let delay = deleting ? 18 : 45
      if (!deleting && char === full.length) { deleting = true; delay = 1800 }
      else if (deleting && char === 0) { deleting = false; line = (line + 1) % lines.length; delay = 300 }
      timer = setTimeout(tick, delay)
    }
    timer = setTimeout(tick, 600)
    return () => clearTimeout(timer)
  }, [lines, active])
  return text
}

export default function Hero({ onGenerate, onSample, loading, error, contextCount = 0, onOpenContext }) {
  const [prompt, setPrompt] = useState('')
  const [focused, setFocused] = useState(false)
  const placeholder = useTypewriter(SUGGESTIONS, !prompt && !focused)

  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 600], [0, -140])
  const opacity = useTransform(scrollY, [0, 500], [1, 0.1])
  const cueOpacity = useTransform(scrollY, [0, 120], [1, 0])

  const submit = (e) => {
    e?.preventDefault()
    if (prompt.trim() && !loading) onGenerate(prompt.trim())
  }

  return (
    <motion.section
      id="top"
      style={{ y, opacity }}
      className="relative mx-auto grid min-h-[94vh] w-full max-w-6xl items-center px-6 pt-[26vh] lg:grid-cols-[1.1fr_0.9fr] lg:pt-0"
    >
      <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-xl">
        <motion.div
          variants={rise}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-3 py-1 text-xs font-medium text-violet-700 backdrop-blur dark:border-violet-400/20 dark:bg-violet-400/10 dark:text-violet-200"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
          </span>
          Collaborative AI Workspace
        </motion.div>

        <motion.h1 variants={rise} className="font-serif text-5xl leading-[1.05] tracking-tight sm:text-6xl">
          Write anything.
          <br />
          <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-orange-400 bg-clip-text text-transparent dark:from-violet-300 dark:via-fuchsia-300 dark:to-amber-200">
            Reshape it with a highlight.
          </span>
        </motion.h1>
        <motion.p variants={rise} className="mt-5 text-lg text-stone-600 dark:text-stone-400">
          Generate a draft, select any sentence or paragraph, and tell the AI exactly how to change it.
        </motion.p>

        <motion.form
          variants={rise}
          layoutId="workspace-surface"
          onSubmit={submit}
          className={`mt-8 rounded-2xl border bg-white/90 p-2 shadow-xl backdrop-blur-xl transition-[border-color,box-shadow] duration-300 dark:bg-stone-900/70 ${
            focused
              ? 'border-violet-400 shadow-violet-300/40 dark:border-violet-400/60 dark:shadow-violet-900/40'
              : 'border-stone-200 shadow-stone-300/40 dark:border-white/10 dark:shadow-black/40'
          }`}
        >
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e)
            }}
            disabled={loading}
            rows={4}
            placeholder={focused ? 'Describe the document you want...' : placeholder || ' '}
            className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-lg outline-none placeholder:text-stone-400 disabled:opacity-60 dark:placeholder:text-stone-500"
          />
          <div className="flex items-center justify-between gap-2 px-2 pb-1">
            <button
              type="button"
              onClick={onSample}
              disabled={loading}
              className="text-xs text-stone-500 underline-offset-4 transition hover:text-violet-600 hover:underline dark:text-stone-400 dark:hover:text-violet-300"
            >
              or open a sample document
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onOpenContext}
                title="Reference files active for generation"
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  contextCount
                    ? 'bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-500/20 dark:text-violet-200'
                    : 'text-stone-400 hover:text-violet-600 dark:hover:text-violet-300'
                }`}
              >
                📌 {contextCount ? `${contextCount} reference${contextCount === 1 ? '' : 's'}` : 'Add context'}
              </button>
              <span className="hidden text-xs text-stone-400 xl:inline">⌘ / Ctrl + Enter</span>
              <motion.button
                type="submit"
                disabled={!prompt.trim() || loading}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-stone-300 dark:bg-violet-500 dark:hover:bg-violet-400 dark:disabled:bg-white/10 dark:disabled:text-stone-500"
              >
                {loading && <Spinner />}
                {loading ? 'Writing…' : 'Generate'}
              </motion.button>
            </div>
          </div>
          {loading && <WritingSkeleton />}
        </motion.form>

        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </motion.p>
        )}

        <motion.div variants={rise} className="mt-5 flex flex-wrap gap-2">
          {SUGGESTIONS.slice(0, 3).map((s) => (
            <motion.button
              key={s}
              type="button"
              disabled={loading}
              onClick={() => setPrompt(s)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-full border border-stone-200 bg-white/80 px-3 py-1.5 text-left text-sm text-stone-600 backdrop-blur transition-colors hover:border-violet-300 hover:text-violet-700 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:border-violet-400/50 dark:hover:text-violet-200"
            >
              {s}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Right column is left open for the black hole render. */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="pointer-events-none hidden self-end justify-self-end pb-16 font-mono text-[10px] uppercase tracking-[0.2em] text-stone-400 lg:block dark:text-stone-500"
      >
        live render · 1/6 resolution · move your cursor
      </motion.p>

      <motion.a
        href="#how"
        style={{ opacity: cueOpacity }}
        className="absolute bottom-4 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-xs text-stone-500 dark:text-stone-400"
      >
        Scroll to explore
        <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
          ↓
        </motion.span>
      </motion.a>
    </motion.section>
  )
}

function WritingSkeleton() {
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 px-4 pb-4 pt-2">
      {[92, 100, 76, 88].map((w, i) => (
        <motion.div
          key={i}
          className="h-3 rounded-full bg-stone-100 dark:bg-white/10"
          style={{ width: `${w}%` }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </motion.div>
  )
}
