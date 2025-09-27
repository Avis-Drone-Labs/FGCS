import React, { useEffect, useRef } from "react"

// Dev-only render counter. Safe to call unconditionally.
export function useRenderCount(label) {
  const countRef = useRef(0)
  countRef.current += 1

  // Log after commit to avoid noise during render; guard to dev only.
  if (import.meta && import.meta.env && import.meta.env.DEV) {
    useEffect(() => {
      // eslint-disable-next-line no-console
      console.log(`FLA Render [${label}]: #${countRef.current}`)
    })
  }

  return countRef.current
}


// How to use:
// import { useRenderCount } from "./debug/renderCount.js"
// function MyComponent() {
//   const renderCount = useRenderCount("MyComponent")
//   return <div>Render count: {renderCount}</div>
// }
// Check your console!