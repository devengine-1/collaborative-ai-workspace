import { AnimatePresence, motion } from 'framer-motion'

export default function ThemeToggle({ theme, onToggle }) {
  const dark = theme === 'dark'
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.9 }}
      aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
      title={`Switch to ${dark ? 'light' : 'dark'} mode`}
      className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-stone-200 bg-white/80 text-stone-700 backdrop-blur transition-colors hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-amber-200 dark:hover:border-violet-400/50"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg
          key={dark ? 'moon' : 'sun'}
          initial={{ rotate: -90, scale: 0, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {dark ? (
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </>
          )}
        </motion.svg>
      </AnimatePresence>
    </motion.button>
  )
}
