import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Spinner from './Spinner.jsx'
import SourceBadge from './SourceBadge.jsx'
import { displayName, formatChars } from '../lib/mentions.js'

const MAX_REF_CHARS = 15_000 // mirrors backend MAX_REFERENCE_CHARS

/**
 * Collapsible "Context Pinboard": drag-and-drop upload + list of reference
 * files with a global-generation toggle and delete.
 *
 * Props: open, onOpenChange(bool), ctx (from useContextFiles)
 */
export default function ContextSidebar({ open, onOpenChange, ctx }) {
  const { files, activeIds, uploading, addingUrl, error, upload, addUrl, remove, toggle } = ctx
  const [dragging, setDragging] = useState(false)
  const [url, setUrl] = useState('')
  const inputRef = useRef(null)
  const dragDepth = useRef(0)

  const onDrop = (e) => {
    e.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    if (e.dataTransfer.files?.length) upload(e.dataTransfer.files)
  }

  return (
    <>
      {/* Collapsed tab */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -60, opacity: 0 }}
            onClick={() => onOpenChange(true)}
            aria-label="Open context pinboard"
            className="fixed left-0 top-1/2 z-30 flex -translate-y-1/2 flex-col items-center gap-2 rounded-r-2xl border border-l-0 border-stone-200 bg-white/90 px-2 py-4 text-xs font-medium text-stone-600 shadow-lg backdrop-blur-xl transition-colors hover:text-violet-700 dark:border-white/10 dark:bg-stone-900/80 dark:text-stone-300 dark:hover:text-violet-200"
          >
            <span aria-hidden>📌</span>
            <span className="[writing-mode:vertical-rl]">Context</span>
            {files.length > 0 && (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-violet-600 px-1 text-[10px] text-white">
                {activeIds.size}/{files.length}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: -340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -340, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed bottom-4 left-4 top-20 z-30 flex w-[300px] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white/90 shadow-2xl shadow-stone-300/40 backdrop-blur-xl dark:border-white/10 dark:bg-stone-950/85 dark:shadow-black/60"
            aria-label="Context pinboard"
          >
            <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-white/10">
              <div>
                <h2 className="text-sm font-semibold">📌 Context Pinboard</h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  {activeIds.size} of {files.length} active for generation
                </p>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                aria-label="Collapse context pinboard"
                className="grid h-7 w-7 place-items-center rounded-lg text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 dark:hover:bg-white/10 dark:hover:text-white"
              >
                ‹
              </button>
            </div>

            <div className="p-3">
              {/* URL input (web page or YouTube) */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault()
                  if (url.trim() && !addingUrl && (await addUrl(url.trim()))) setUrl('')
                }}
                className="mb-2 flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white/70 p-1 focus-within:border-violet-400 dark:border-white/10 dark:bg-white/[0.03] dark:focus-within:border-violet-400/60"
              >
                <span className="pl-1.5 text-xs text-stone-400" aria-hidden>🔗</span>
                <input
                  type="url"
                  inputMode="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={addingUrl}
                  placeholder="Paste a web or YouTube URL"
                  className="min-w-0 flex-1 bg-transparent py-1 text-xs outline-none placeholder:text-stone-400 disabled:opacity-60 dark:placeholder:text-stone-500"
                />
                <motion.button
                  type="submit"
                  whileTap={{ scale: 0.94 }}
                  disabled={!url.trim() || addingUrl}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-violet-600 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-violet-700 disabled:bg-stone-200 disabled:text-stone-400 dark:disabled:bg-white/10 dark:disabled:text-stone-500"
                >
                  {addingUrl ? <><Spinner className="h-3 w-3" /> Adding</> : 'Add Link'}
                </motion.button>
              </form>

              {/* Drop zone */}
              <motion.div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
                onDragEnter={(e) => {
                  e.preventDefault()
                  dragDepth.current += 1
                  setDragging(true)
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={() => {
                  dragDepth.current -= 1
                  if (dragDepth.current <= 0) setDragging(false)
                }}
                onDrop={onDrop}
                animate={{ scale: dragging ? 1.02 : 1 }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-3 py-6 text-center transition-colors ${
                  dragging
                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-500/10'
                    : 'border-stone-300 hover:border-violet-400 dark:border-white/15 dark:hover:border-violet-400/60'
                }`}
              >
                {uploading ? (
                  <>
                    <Spinner className="h-5 w-5 text-violet-600" />
                    <span className="text-xs text-stone-500">Extracting text…</span>
                  </>
                ) : (
                  <>
                    <span className="text-xl" aria-hidden>⇪</span>
                    <span className="text-xs font-medium">Drop PDF, MD or TXT files</span>
                    <span className="text-[11px] text-stone-500 dark:text-stone-400">or click to browse</span>
                  </>
                )}
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept=".pdf,.md,.markdown,.txt,application/pdf,text/markdown,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) upload(e.target.files)
                    e.target.value = ''
                  }}
                />
              </motion.div>
              {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
            </div>

            {/* File list */}
            <ul className="flex-1 space-y-2 overflow-y-auto px-3 pb-3">
              <AnimatePresence initial={false}>
                {files.map((f) => {
                  const active = activeIds.has(f.id)
                  return (
                    <motion.li
                      key={f.id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0, marginTop: 0 }}
                      className={`rounded-xl border p-3 transition-colors ${
                        active
                          ? 'border-violet-300 bg-violet-50/70 dark:border-violet-400/40 dark:bg-violet-500/10'
                          : 'border-stone-200 bg-white/60 dark:border-white/10 dark:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-sm font-medium" title={f.filename}>
                            <SourceBadge filename={f.filename} />
                            <span className="truncate">{displayName(f.filename)}</span>
                          </p>
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            {formatChars(f.char_count)} chars
                            {f.char_count > MAX_REF_CHARS && ' · first 15k used'}
                          </p>
                        </div>
                        <button
                          onClick={() => remove(f.id)}
                          aria-label={`Delete ${f.filename}`}
                          className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-stone-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        >
                          ✕
                        </button>
                      </div>
                      <label className="mt-2 flex cursor-pointer items-center gap-2 text-[11px] text-stone-600 dark:text-stone-300">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggle(f.id)}
                          className="h-3.5 w-3.5 accent-violet-600"
                        />
                        Active for global generation
                      </label>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
              {!files.length && !uploading && (
                <li className="px-2 pt-4 text-center text-xs text-stone-500 dark:text-stone-400">
                  No reference files yet. Pinned files can ground new documents and inline edits; mention one as
                  <code className="mx-1 rounded bg-stone-100 px-1 dark:bg-white/10">@filename</code>in the edit toolbar.
                </li>
              )}
            </ul>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
