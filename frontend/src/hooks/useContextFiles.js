import { useCallback, useEffect, useState } from 'react'
import { addContextUrl, deleteContextFile, listContextFiles, uploadContextFiles } from '../lib/api.js'

const ACTIVE_KEY = 'context-active-ids'

/** Uploaded reference files + which are active for global generation. */
export function useContextFiles() {
  const [files, setFiles] = useState([])
  const [activeIds, setActiveIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(ACTIVE_KEY) ?? '[]'))
    } catch {
      return new Set()
    }
  })
  const [uploading, setUploading] = useState(false)
  const [addingUrl, setAddingUrl] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    listContextFiles()
      .then((list) => {
        setFiles(list)
        // Drop ids of files that no longer exist.
        setActiveIds((prev) => new Set([...prev].filter((id) => list.some((f) => f.id === id))))
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify([...activeIds]))
    } catch {}
  }, [activeIds])

  const upload = useCallback(async (fileList) => {
    const accepted = [...fileList].filter((f) => /\.(pdf|txt|md|markdown)$/i.test(f.name))
    if (!accepted.length) return setError('Only PDF, TXT and MD files are supported.')
    setUploading(true)
    setError(null)
    try {
      const added = await uploadContextFiles(accepted)
      setFiles((prev) => [...prev, ...added])
      setActiveIds((prev) => new Set([...prev, ...added.map((f) => f.id)])) // new files start active
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }, [])

  const addUrl = useCallback(async (url) => {
    setAddingUrl(true)
    setError(null)
    try {
      const added = await addContextUrl(url)
      setFiles((prev) => [...prev, added])
      setActiveIds((prev) => new Set([...prev, added.id]))
      return true
    } catch (e) {
      setError(e.message)
      return false
    } finally {
      setAddingUrl(false)
    }
  }, [])

  const remove = useCallback(async (id) => {
    setError(null)
    try {
      await deleteContextFile(id)
      setFiles((prev) => prev.filter((f) => f.id !== id))
      setActiveIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    } catch (e) {
      setError(e.message)
    }
  }, [])

  const toggle = useCallback((id) => {
    setActiveIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  return { files, activeIds, uploading, addingUrl, error, upload, addUrl, remove, toggle, clearError: () => setError(null) }
}
