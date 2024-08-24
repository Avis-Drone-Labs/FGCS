/*
  Toolbar component

  This is the bar above the navbar which has windows and mac controls (minimize, maximize, close).
  This also holds the "FGCS", "view", ... dropdowns that users can use.
*/


export default function Toolbar() {
  return (
    <div className="flex flex-col content-center bg-falcongrey-100 px-2 h-max" id="toolbar">
      <div className="h-max">
        <p>Test</p>
      </div>
    </div>
  )
}