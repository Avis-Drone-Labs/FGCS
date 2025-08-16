export default function ContextMenuItem({ children, onClick }) {
  return (
    <div
      className="hover:bg-falcongrey-800 hover:cursor-pointer py-1 px-4 rounded"
      onClick={onClick}
    >
      <div className="w-full flex justify-between gap-2">{children}</div>
    </div>
  )
}
