import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import Header from './components/Header.jsx'
import Landing, { LANDING_SECTIONS } from './components/landing/Landing.jsx'
import BlackHole from './components/BlackHole.jsx'
import DocumentView from './components/DocumentView.jsx'
import FloatingToolbar from './components/FloatingToolbar.jsx'
import ContextSidebar from './components/ContextSidebar.jsx'
import { useContextFiles } from './hooks/useContextFiles.js'
import { useTextSelection } from './hooks/useTextSelection.js'
import { useTheme } from './hooks/useTheme.js'
import { generateDocument, refineSelection } from './lib/api.js'
import { SAMPLE_DOCUMENT } from './lib/sample.js'

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme()
  const ctx = useContextFiles()
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1280)
  const [doc, setDoc] = useState(null) // { id, content }
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState(null)

  const [refining, setRefining] = useState(false)
  const [refineError, setRefineError] = useState(null)
  const [mark, setMark] = useState(null) // { kind: 'pending' | 'fresh', start, end, key? }

  const containerRef = useRef(null)
  const toolbarRef = useRef(null)
  const abortRef = useRef(null)

  const { selection, clear } = useTextSelection(containerRef, {
    enabled: Boolean(doc) && !refining,
    ignoreRef: toolbarRef,
  })

  const selectedText = selection && doc ? doc.content.slice(selection.start, selection.end) : ''
  const showToolbar = Boolean(selection && selectedText.trim())

  // A new selection resets the previous edit's error.
  useEffect(() => setRefineError(null), [selection?.start, selection?.end])

  // Let the "fresh" highlight finish animating, then drop it.
  useEffect(() => {
    if (mark?.kind !== 'fresh') return
    const t = setTimeout(() => setMark(null), 2600)
    return () => clearTimeout(t)
  }, [mark])

  const handleGenerate = async (prompt) => {
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await generateDocument(prompt, [...ctx.activeIds])
      setDoc({ id: res.id, content: res.content })
      window.scrollTo({ top: 0 })
    } catch (e) {
      setGenerateError(e.message)
    } finally {
      setGenerating(false)
    }
  }

  const openSample = () => {
    setGenerateError(null)
    setDoc({ id: null, content: SAMPLE_DOCUMENT }) // not persisted; refine still works
    window.scrollTo({ top: 0 })
  }

  const handleRefine = useCallback(
    async (instruction, contextIds = []) => {
      if (!selection || !doc) return
      const { start, end } = selection
      const controller = new AbortController()
      abortRef.current = controller

      setRefining(true)
      setRefineError(null)
      setMark({ kind: 'pending', start, end })
      window.getSelection()?.removeAllRanges() // the shimmer replaces the native highlight

      try {
        const res = await refineSelection(
          {
            document: doc.content,
            selected_text: doc.content.slice(start, end),
            instruction,
            start,
            end,
            document_id: doc.id,
            context_ids: contextIds,
          },
          controller.signal,
        )
        // Inline swap: the server returns the spliced document; no reload.
        setDoc((d) => ({ ...d, content: res.document }))
        setMark({ kind: 'fresh', start: res.start, end: res.start + res.replacement.length, key: Date.now() })
        clear()
      } catch (e) {
        setMark(null)
        if (e.name !== 'AbortError') setRefineError(e.message)
      } finally {
        abortRef.current = null
        setRefining(false)
      }
    },
    [selection, doc, clear],
  )

  const cancelRefine = () => abortRef.current?.abort()

  const startOver = () => {
    cancelRefine()
    clear()
    setMark(null)
    setDoc(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const wordCount = doc ? doc.content.trim().split(/\s+/).length : 0

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <BlackHole theme={theme} />

      <Header
        mode={doc ? 'document' : 'landing'}
        sections={LANDING_SECTIONS}
        wordCount={wordCount}
        onNew={startOver}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <ContextSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} ctx={ctx} />

      <main className={`px-4 pb-32 pt-28 transition-[padding] duration-300 ${sidebarOpen ? 'xl:pl-[332px]' : ''}`}>
        {/* Prompt card fades out, then morphs (shared layoutId) into the document page. */}
        <AnimatePresence mode="wait">
          {doc ? (
            <DocumentView key="doc" content={doc.content} mark={mark} containerRef={containerRef} />
          ) : (
            <Landing key="landing" onGenerate={handleGenerate} onSample={openSample} loading={generating} error={generateError} contextCount={ctx.activeIds.size} onOpenContext={() => setSidebarOpen(true)} />
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showToolbar && (
          <FloatingToolbar
            key={`${selection.start}-${selection.end}`}
            ref={toolbarRef}
            selection={selection}
            selectedText={selectedText}
            files={ctx.files}
            defaultContextIds={ctx.activeIds}
            loading={refining}
            error={refineError}
            onSubmit={handleRefine}
            onCancel={cancelRefine}
            onClose={clear}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
