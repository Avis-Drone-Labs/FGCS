import { mavlinkMsgParams } from "./mavllinkDataStreams"
import jsonData from "../../settings/dataStreams.json"

const desiredDefaultMessages = jsonData.data

export const defaultDataMessages = desiredDefaultMessages.map((msg, idx) => {
  const [stream, field] = msg.split(".")
  const display_name = mavlinkMsgParams[stream][field]
  return {
    boxId: idx,
    currently_selected: msg,
    display_name,
    value: 0,
  }
})
