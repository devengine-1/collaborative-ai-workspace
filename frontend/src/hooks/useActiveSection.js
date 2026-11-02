import { useEffect, useState } from 'react'

/** Returns the id of the section currently crossing the middle of the viewport. */
export function useActiveSection(ids, enabled = true) {
  const [active, setActive] = useState(null)

  useEffect(() => {
    if (!enabled) return setActive(null)
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    // Sections mount slightly after the header; observe on the next frame.
    const raf = requestAnimationFrame(() => {
      ids.forEach((id) => {
        const el = document.getElementById(id)
        if (el) observer.observe(el)
      })
    })
    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [ids, enabled])

  return active
}
