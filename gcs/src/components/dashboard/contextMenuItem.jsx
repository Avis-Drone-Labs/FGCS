export default function ContextMenuItem({ text, onClick }) {
  return (
    <div
      className='hover:bg-falcongrey-500 hover:cursor-pointer p-2 px-6'
      onClick={onClick}
    >
      {text}
    </div>
  )
}
