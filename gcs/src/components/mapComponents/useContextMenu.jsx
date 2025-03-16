/*
  Use Context Menu. A handler for the right click context menu on the map.
*/

import { useEffect, useState } from "react"

export default function useContextMenu() {
  const [clicked, setClicked] = useState(false)
  const [points, setPoints] = useState({
    x: 0,
    y: 0,
  })

  useEffect(() => {
    const handleClick = () => setClicked(false)
    document.addEventListener("click", handleClick)
    return () => {
      document.removeEventListener("click", handleClick)
    }
  }, [])

  return {
    clicked,
    setClicked,
    points,
    setPoints,
  }
}
