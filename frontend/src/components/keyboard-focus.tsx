"use client"

import { useEffect } from "react"

export function KeyboardFocus() {
  useEffect(() => {
    function handleFirstTab(e: KeyboardEvent) {
      if (e.key === "Tab") {
        document.body.classList.add("keyboard-focus")
        window.removeEventListener("keydown", handleFirstTab)
        window.addEventListener("mousedown", handleMouseDownOnce)
      }
    }

    function handleMouseDownOnce() {
      document.body.classList.remove("keyboard-focus")
      window.removeEventListener("mousedown", handleMouseDownOnce)
      window.addEventListener("keydown", handleFirstTab)
    }

    window.addEventListener("keydown", handleFirstTab)

    return () => {
      window.removeEventListener("keydown", handleFirstTab)
      window.removeEventListener("mousedown", handleMouseDownOnce)
    }
  }, [])

  return null
} 