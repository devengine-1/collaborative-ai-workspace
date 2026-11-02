import { sourceType } from '../lib/mentions.js'

const STYLES = {
  PDF: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  YT: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  WEB: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  MD: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  TXT: 'bg-stone-200 text-stone-600 dark:bg-white/10 dark:text-stone-300',
}

export default function SourceBadge({ filename, inverted = false }) {
  const type = sourceType(filename)
  return (
    <span
      className={`shrink-0 rounded px-1 py-px font-mono text-[9px] font-semibold leading-none tracking-wide ${
        inverted ? 'bg-white/25 text-white' : STYLES[type]
      }`}
    >
      {type}
    </span>
  )
}
