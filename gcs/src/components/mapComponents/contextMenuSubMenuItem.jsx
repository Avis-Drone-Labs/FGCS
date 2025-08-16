import { useEffect, useRef, useState } from "react"

export default function ContextMenuSubMenuItem({ children, title }) {
  const [isHovered, setIsHovered] = useState(false)
  const [submenuPosition, setSubmenuPosition] = useState({ top: 0, left: 0 })
  const parentRef = useRef(null)
  const subMenuRef = useRef(null)

  useEffect(() => {
    if (isHovered && parentRef.current && subMenuRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect()
      const submenuRect = subMenuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth

      // Calculate whether to position the submenu to the right or left
      const shouldAppearToLeft =
        parentRect.right + submenuRect.width > viewportWidth

      setSubmenuPosition({
        top: parentRect.top,
        left: shouldAppearToLeft
          ? parentRect.left - submenuRect.width
          : parentRect.right,
      })
    }
  }, [isHovered])

  return (
    <div
      ref={parentRef}
      className="hover:bg-falcongrey-800 hover:cursor-pointer py-1 px-4 rounded"
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
    >
      <div className="w-full flex justify-between items-center gap-2">
        <p>{title}</p>
        <span className="text-gray-400">▶</span>
      </div>
      {isHovered && (
        <div
          ref={subMenuRef}
          className="absolute top-0 left-full bg-falcongrey-700  rounded p-1"
          style={{
            top: `${submenuPosition.top}px`,
            left: `${submenuPosition.left}px`,
            position: "fixed", // Use fixed to align with the viewport
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
