export default function ContextMenuItem({ text, onClick }) {
  return (
    <div
      className='hover:bg-falcongrey-800 hover:cursor-pointer py-1 px-6 rounded'
      onClick={onClick}
    >
      {text}
    </div>
  )
}
