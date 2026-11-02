import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Map a DOM position (node, offset) inside `container` to a character offset
 * in the source document string.
 *
 * Contract with the renderer: every block element carries `data-start` (its
 * offset in the source string) and contains *only* the source text for that
 * block (spans are fine; extra decorative text is not). The container carries
 * `data-length` (total source length).
 */
function toDocOffset(container, node, offset) {
  // Selection boundary sits directly on the container (e.g. triple-click).
  if (node === container) {
    const blocks = container.querySelectorAll('[data-start]')
    const child = container.childNodes[offset]
    if (!child) return Number(container.dataset.length)
    const block = child.nodeType === 1 && child.matches('[data-start]') ? child : null
    return block ? Number(block.dataset.start) : Number(blocks[blocks.length - 1]?.dataset.start ?? 0)
  }

  const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement
  const block = el?.closest('[data-start]')
  if (!block || !container.contains(block)) return null

  const range = document.createRange()
  range.selectNodeContents(block)
  range.setEnd(node, offset)
  return Number(block.dataset.start) + range.toString().length
}

/**
 * useTextSelection - captures a text selection inside `containerRef` using the
 * browser Selection API and returns a *snapshot* of it.
 *
 * The snapshot survives the native selection being cleared (which happens the
 * moment the user clicks into the floating toolbar's input), and is only
 * dropped when the user clicks elsewhere, presses Escape, or calls `clear()`.
 *
 * Pass `enabled: false` to pause listening (the existing snapshot is kept).
 *
 * Returns { selection, clear } where selection is
 *   { start, end, anchor: { x, y }, rect } | null
 * `anchor` is in page coordinates (scroll-independent) and marks where a
 * toolbar should sit: horizontally at the cursor, vertically at the top of
 * the selection.
 */
export function useTextSelection(containerRef, { enabled = true, ignoreRef } = {}) {
  const [selection, setSelection] = useState(null)
  const frame = useRef(0)

  const clear = useCallback(() => {
    setSelection(null)
    window.getSelection()?.removeAllRanges()
  }, [])

  useEffect(() => {
    if (!enabled) return

    const isInsideIgnored = (target) => ignoreRef?.current?.contains(target)

    const capture = (pointer) => {
      cancelAnimationFrame(frame.current)
      // Wait a frame so the browser has finalized the selection.
      frame.current = requestAnimationFrame(() => {
        const container = containerRef.current
        const sel = window.getSelection()
        if (!container || !sel || sel.rangeCount === 0 || sel.isCollapsed) {
          setSelection(null)
          return
        }
        const range = sel.getRangeAt(0)
        if (!container.contains(range.commonAncestorContainer)) {
          setSelection(null)
          return
        }

        const start = toDocOffset(container, range.startContainer, range.startOffset)
        const end = toDocOffset(container, range.endContainer, range.endOffset)
        if (start == null || end == null || end <= start) {
          setSelection(null)
          return
        }

        // Use the first line's rect so the toolbar sits above where the
        // selection begins, even for multi-paragraph selections.
        const rects = range.getClientRects()
        const rect = rects.length ? rects[0] : range.getBoundingClientRect()
        const full = range.getBoundingClientRect()
        const x = pointer?.x ?? rect.left + rect.width / 2

        setSelection({
          start,
          end,
          anchor: { x: x + window.scrollX, y: Math.min(rect.top, full.top) + window.scrollY },
          rect: { top: full.top, left: full.left, width: full.width, height: full.height },
        })
      })
    }

    const onPointerUp = (e) => {
      if (isInsideIgnored(e.target)) return
      capture({ x: e.clientX, y: e.clientY })
    }

    const onPointerDown = (e) => {
      // Clicking outside both the document and the toolbar dismisses.
      if (isInsideIgnored(e.target)) return
      if (!containerRef.current?.contains(e.target)) setSelection(null)
    }

    const onKeyUp = (e) => {
      if (isInsideIgnored(e.target)) return
      // Keyboard selection (Shift + arrows, Cmd/Ctrl + A).
      if (e.shiftKey || e.key === 'a') capture(null)
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') clear()
    }

    document.addEventListener('pointerup', onPointerUp)
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keyup', onKeyUp)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame.current)
      document.removeEventListener('pointerup', onPointerUp)
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [enabled, containerRef, ignoreRef, clear])

  // Note: when `enabled` flips to false the current snapshot is intentionally
  // kept (e.g. while a refine request is in flight) - call clear() to drop it.
  return { selection, clear }
}
