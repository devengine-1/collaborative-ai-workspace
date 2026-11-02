// Shared @mention helpers (mirrors backend `_norm_name` / `mentioned_context_ids`).

const MENTION_RE = /@([^\s@,;:!?()[\]{}"'<>]+)/g

/** Case/spacing-insensitive key: 'My Paper.pdf' -> 'my-paper.pdf' */
export const normName = (name) =>
  name.trim().toLowerCase().replace(/[\s_:\-@,;!?()[\]{}"'<>]+/g, '-').replace(/^-+|-+$/g, '')

/** Token inserted by autocomplete: spaces become dashes so the mention stays one word. */
export const mentionSlug = (filename) =>
  filename.trim().replace(/[\s@,;:!?()[\]{}"'<>]+/g, '-').replace(/^-+|-+$/g, '')

const stem = (name) => name.replace(/\.[^.]+$/, '')

/** Ids of files referenced as @filename (or @filename-without-extension). */
export function findMentionedIds(text, files) {
  const tokens = new Set([...text.matchAll(MENTION_RE)].map((m) => normName(m[1].replace(/\.+$/, ''))))
  if (!tokens.size) return []
  return files
    .filter((f) => tokens.has(normName(f.filename)) || tokens.has(normName(stem(f.filename))))
    .map((f) => f.id)
}

/** The partial "@que" token immediately before the caret, if any. */
export function activeMentionQuery(text, caret) {
  const m = /(^|\s)@([^\s@]*)$/.exec(text.slice(0, caret))
  return m ? { query: m[2], start: caret - m[2].length - 1 } : null
}

/** Source badge from the stored filename: 'YT: …' / 'WEB: …' / extension. */
export function sourceType(filename) {
  if (filename.startsWith('YT: ')) return 'YT'
  if (filename.startsWith('WEB: ')) return 'WEB'
  const ext = filename.split('.').pop().toLowerCase()
  return ext === 'pdf' ? 'PDF' : ext === 'txt' ? 'TXT' : 'MD'
}

/** Display name without the YT:/WEB: prefix (the badge shows it). */
export const displayName = (filename) => filename.replace(/^(YT|WEB): /, '')

export const formatChars = (n) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1)}k` : `${n}`)
