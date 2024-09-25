/*
  Custom Component for a menu item to reduce duplicate code
*/

export default function MenuItem(props) {
  return (
    <div className="flex flex-row w-full gap-x-3 justify-between rounded-md px-3 hover:cursor-pointer hover:bg-falcongrey-800" onClick={props.callback}>
      {props.link ? <a href={props.href} target="_blank">{props.name}</a> : <div>{props.name}</div>}
      <div className="text-falcongray-90 opacity-50">{props.shortcut}</div>
    </div>
  )
}