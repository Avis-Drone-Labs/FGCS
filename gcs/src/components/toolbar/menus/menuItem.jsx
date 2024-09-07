/*
  Custom Component for a menu item to reduce duplicate code
*/

export default function MenuItem(props) {
  return (
    <div className="flex flex-row w-full gap-x-3 justify-between rounded-md px-3 hover:cursor-pointer hover:bg-falcongrey-100" onClick={props.callbackFunction}>
      <div>{props.name}</div>
      <div className="text-falcongray-90 opacity-50">{props.shortcut}</div>
    </div>
  )
}