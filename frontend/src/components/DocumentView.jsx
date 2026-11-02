import { useMemo } from 'react'
import { motion } from 'framer-motion'

/**
 * Split the document into blocks on blank lines, keeping each block's
 * [start, end) offsets in the source string. Offsets are what make
 * highlight-to-edit precise: useTextSelection maps DOM positions back to
 * these offsets via the `data-start` attribute.
 */
function splitBlocks(text) {
  const blocks = []
  const re = /\n{2,}/g
  let last = 0
  let m
  while ((m = re.exec(text))) {
    blocks.push({ start: last, end: m.index })
    last = m.index + m[0].length
  }
  blocks.push({ start: last, end: text.length })
  return blocks.filter((b) => b.end > b.start)
}

const looksLikeTitle = (text) => text.length < 120 && !/[.!?]$/.test(text.trim()) && !text.includes('\n')

/** Render one block's text, wrapping the part covered by `mark` in a span. */
function Segments({ content, start, end, mark }) {
  if (!mark || mark.end <= start || mark.start >= end) return content.slice(start, end)

  const s = Math.max(start, mark.start)
  const e = Math.min(end, mark.end)
  const inner = content.slice(s, e)

  return (
    <>
      {content.slice(start, s)}
      {mark.kind === 'pending' ? (
        <span className="pending-shimmer">{inner}</span>
      ) : (
        <motion.span
          key={`fresh-${mark.key}-${s}`}
          initial={{ opacity: 0, filter: 'blur(6px)', backgroundColor: 'rgba(167,139,250,0.45)' }}
          animate={{ opacity: 1, filter: 'blur(0px)', backgroundColor: 'rgba(167,139,250,0)' }}
          transition={{
            opacity: { duration: 0.4 },
            filter: { duration: 0.4 },
            backgroundColor: { duration: 1.8, delay: 0.5 },
          }}
          className="rounded-[3px]"
        >
          {inner}
        </motion.span>
      )}
      {content.slice(e, end)}
    </>
  )
}

/**
 * Props:
 *  - content:      full document string
 *  - mark:         { kind: 'pending' | 'fresh', start, end, key? } | null
 *  - containerRef: ref passed to useTextSelection
 */
export default function DocumentView({ content, mark, containerRef }) {
  const blocks = useMemo(() => splitBlocks(content), [content])

  return (
    <motion.article
      layoutId="workspace-surface"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 140, damping: 22 }}
      className="mx-auto w-full max-w-3xl rounded-3xl border border-stone-200 bg-white/95 px-8 py-12 shadow-2xl shadow-stone-300/40 backdrop-blur-xl sm:px-16 sm:py-16 dark:border-white/10 dark:bg-stone-950/80 dark:shadow-black/60"
    >
      {/* Only source text may live inside this container - see useTextSelection. */}
      <div ref={containerRef} data-length={content.length} className="doc-surface selection:text-inherit">
        {blocks.map((b, i) => {
          const text = content.slice(b.start, b.end)
          const isTitle = i === 0 && looksLikeTitle(text)
          const Tag = isTitle ? motion.h1 : motion.p
          return (
            <Tag
              key={i}
              data-start={b.start}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '0px 0px -8% 0px' }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className={
                isTitle
                  ? 'mb-8 whitespace-pre-wrap font-serif text-4xl font-semibold leading-tight text-stone-900 dark:text-stone-50'
                  : 'mb-6 whitespace-pre-wrap font-serif text-[1.2rem] leading-8 text-stone-800 dark:text-stone-300'
              }
            >
              <Segments content={content} start={b.start} end={b.end} mark={mark} />
            </Tag>
          )
        })}
      </div>
    </motion.article>
  )
}
