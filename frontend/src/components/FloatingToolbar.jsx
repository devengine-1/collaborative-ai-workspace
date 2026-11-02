import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Spinner from './Spinner.jsx'
import SourceBadge from './SourceBadge.jsx'
import { activeMentionQuery, displayName, findMentionedIds, mentionSlug, normName } from '../lib/mentions.js'

const QUICK_ACTIONS = ['More technical', 'Shorter', 'Friendlier tone', 'Fix grammar', 'Expand with an example']
const TOOLBAR_WIDTH = 420
const EDGE = 12

/**
 * Floating "edit with AI" toolbar, portaled to <body> and absolutely
 * positioned in page coordinates so it scrolls with the document.
 *
 * Props:
 *  - selection: snapshot from useTextSelection ({ anchor, rect, ... })
 *  - selectedText, loading, error
 *  - files: uploaded context files [{ id, filename, char_count }]
 *  - defaultContextIds: Set of ids pre-selected for this edit (global actives)
 *  - onSubmit(instruction, contextIds), onCancel(), onClose()
 *  - ref: forwarded so useTextSelection can ignore clicks inside the toolbar
 */
export default function FloatingToolbar({
  ref,
  selection,
  selectedText,
  files = [],
  defaultContextIds,
  loading,
  error,
  onSubmit,
  onCancel,
  onClose,
}) {
  const [instruction, setInstruction] = useState('')
  const [pinned, setPinned] = useState(() => new Set(defaultContextIds ?? []))
  const [mention, setMention] = useState(null) // { query, start }
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef(null)

  const mentionedIds = useMemo(() => new Set(findMentionedIds(instruction, files)), [instruction, files])
  const suggestions = useMemo(() => {
    if (!mention) return []
    const q = normName(mention.query)
    return files.filter((f) => normName(f.filename).includes(q)).slice(0, 6)
  }, [mention, files])

  const togglePin = (id) =>
    setPinned((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })

  const updateMention = (value, caret) => {
    setMention(activeMentionQuery(value, caret))
    setHighlight(0)
  }

  const insertMention = (file) => {
    const el = inputRef.current
    const caret = el?.selectionStart ?? instruction.length
    const start = mention?.start ?? caret
    const token = `@${mentionSlug(file.filename)} `
    const next = instruction.slice(0, start) + token + instruction.slice(caret)
    setInstruction(next)
    setMention(null)
    setPinned((prev) => new Set(prev).add(file.id))
    requestAnimationFrame(() => {
      el?.focus({ preventScroll: true })
      el?.setSelectionRange(start + token.length, start + token.length)
    })
  }

  useEffect(() => {
    // Focus without scrolling the page; the selection snapshot is already saved.
    inputRef.current?.focus({ preventScroll: true })
  }, [selection?.start, selection?.end])

  const { anchor, rect } = selection
  const minX = window.scrollX + TOOLBAR_WIDTH / 2 + EDGE
  const maxX = window.scrollX + document.documentElement.clientWidth - TOOLBAR_WIDTH / 2 - EDGE
  const x = Math.min(Math.max(anchor.x, minX), Math.max(minX, maxX))
  // Not enough room above the selection -> show below it.
  const below = anchor.y - window.scrollY < 250
  const y = below ? anchor.y + rect.height + EDGE : anchor.y - EDGE

  const submit = (text) => {
    const value = (text ?? instruction).trim()
    if (value && !loading) onSubmit(value, [...new Set([...pinned, ...findMentionedIds(value, files)])])
  }

  const words = selectedText.trim().split(/\s+/).length

  return createPortal(
    <motion.div
      ref={ref}
      role="dialog"
      aria-label="Edit selection with AI"
      initial={{ opacity: 0, scale: 0.94, y: below ? -8 : 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: below ? -8 : 8, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: TOOLBAR_WIDTH,
        translateX: '-50%',
        translateY: below ? '0%' : '-100%',
        transformOrigin: below ? 'top center' : 'bottom center',
      }}
      className="z-50 rounded-2xl border border-stone-200 bg-white/95 p-2 shadow-2xl shadow-stone-400/30 backdrop-blur dark:border-white/10 dark:bg-stone-900/95 dark:shadow-black/60"
      onKeyDown={(e) => {
        if (e.key === 'Escape') loading ? onCancel() : onClose()
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex items-center gap-2"
      >
        <span className="pl-2 text-violet-600 dark:text-violet-300" aria-hidden>✦</span>
        <input
          ref={inputRef}
          value={instruction}
          onChange={(e) => {
            setInstruction(e.target.value)
            updateMention(e.target.value, e.target.selectionStart ?? e.target.value.length)
          }}
          onKeyDown={(e) => {
            if (!suggestions.length) return
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault()
              const step = e.key === 'ArrowDown' ? 1 : -1
              setHighlight((h) => (h + step + suggestions.length) % suggestions.length)
            } else if (e.key === 'Enter' || e.key === 'Tab') {
              e.preventDefault()
              insertMention(suggestions[highlight] ?? suggestions[0])
            } else if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation() // close the menu, not the toolbar
              setMention(null)
            }
          }}
          onBlur={() => setTimeout(() => setMention(null), 120)}
          disabled={loading}
          placeholder={files.length ? 'e.g. Update these stats using @paper.pdf' : 'e.g. Make this paragraph more technical'}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-stone-400 disabled:opacity-60 dark:text-stone-100 dark:placeholder:text-stone-500"
        />
        {loading ? (
          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 rounded-xl bg-stone-100 px-3 py-2 text-xs font-medium text-stone-600 hover:bg-stone-200 dark:bg-white/10 dark:text-stone-300 dark:hover:bg-white/15"
          >
            <Spinner className="h-3.5 w-3.5 text-violet-600" /> Cancel
          </button>
        ) : (
          <motion.button
            type="submit"
            whileTap={{ scale: 0.94 }}
            disabled={!instruction.trim()}
            className="rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:bg-stone-200 disabled:text-stone-400 dark:disabled:bg-white/10 dark:disabled:text-stone-500"
          >
            Rewrite
          </motion.button>
        )}
      </form>

      {/* @mention autocomplete */}
      <AnimatePresence>
        {suggestions.length > 0 && !loading && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            role="listbox"
            className="mx-1 mt-1 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-stone-800"
          >
            {suggestions.map((f, i) => (
              <li
                key={f.id}
                role="option"
                aria-selected={i === highlight}
                onMouseDown={(e) => {
                  e.preventDefault() // keep input focus
                  insertMention(f)
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-xs ${
                  i === highlight
                    ? 'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-100'
                    : 'text-stone-700 dark:text-stone-300'
                }`}
              >
                <SourceBadge filename={f.filename} />
                <span className="truncate">@{mentionSlug(f.filename)}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Per-edit context pills */}
      {files.length > 0 && (
        <div className="mt-1.5 flex items-center gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-stone-400 dark:text-stone-500">
            Context
          </span>
          {files.map((f) => {
            const on = pinned.has(f.id) || mentionedIds.has(f.id)
            const viaMention = !pinned.has(f.id) && mentionedIds.has(f.id)
            return (
              <motion.button
                key={f.id}
                type="button"
                disabled={loading}
                whileTap={{ scale: 0.94 }}
                onClick={() => togglePin(f.id)}
                title={viaMention ? `${f.filename} (included via @mention)` : f.filename}
                aria-pressed={on}
                className={`flex max-w-40 shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors disabled:opacity-60 ${
                  on
                    ? 'border-violet-500 bg-violet-600 text-white dark:border-violet-400 dark:bg-violet-500'
                    : 'border-stone-200 bg-white text-stone-600 hover:border-violet-300 hover:text-violet-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:border-violet-400/50'
                }`}
              >
                <SourceBadge filename={f.filename} inverted={on} />
                <span className="truncate">{displayName(f.filename)}</span>
                {viaMention && <span aria-hidden>@</span>}
              </motion.button>
            )
          })}
        </div>
      )}

      {!loading && (
        <div className="mt-1.5 flex flex-wrap gap-1.5 px-1 pb-1">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => submit(a)}
              className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600 transition hover:bg-violet-100 hover:text-violet-700 dark:bg-white/5 dark:text-stone-300 dark:hover:bg-violet-500/20 dark:hover:text-violet-200"
            >
              {a}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-stone-400 dark:text-stone-500">
        <span>
          {loading
            ? 'Rewriting selection…'
            : `${words} word${words === 1 ? '' : 's'} selected${
                pinned.size || mentionedIds.size
                  ? ` · ${new Set([...pinned, ...mentionedIds]).size} reference${new Set([...pinned, ...mentionedIds]).size === 1 ? '' : 's'}`
                  : ''
              }`}
        </span>
        <span>Esc to {loading ? 'cancel' : 'close'}</span>
      </div>

      {error && <p className="px-2 pb-1 pt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </motion.div>,
    document.body,
  )
}
