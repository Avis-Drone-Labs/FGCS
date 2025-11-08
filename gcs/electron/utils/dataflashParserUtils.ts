import type { MessageObject } from "../types/flaTypes"

interface RawMessageData {
  time_boot_ms?: { [index: number]: number }
  [fieldName: string]: { [index: number]: number | string } | undefined
}

function transformMessageData(messageData: RawMessageData): MessageObject[] {
  // Each message data object has a time_boot_ms field and the other data points
  // for the message are defined as fields on the object.
  // Each field is an object with the key being an index and the value being
  // the actual data point value.
  // We need to convert that into an array of objects where each object has
  // a name, type, typeUS and rest of the keys are the fields with their values.
  if (
    messageData.time_boot_ms === null ||
    messageData.time_boot_ms === undefined
  ) {
    return []
  }
  const maxIndexValue = Object.entries(messageData.time_boot_ms).length
  const transformedData: MessageObject[] = []
  for (let i = 0; i < maxIndexValue; i++) {
    const entry: MessageObject = {
      name: "", // Will be set by caller
    }

    for (const [key, value] of Object.entries(messageData)) {
      if (value && typeof value === "object") {
        if (key === "time_boot_ms") {
          entry.TimeUS = value[i] as number
        } else {
          entry[key] = value[i]
        }
      }
    }
    transformedData.push(entry)
  }
  return transformedData
}

interface RawMessages {
  [messageName: string]: RawMessageData
}

interface TransformedMessages {
  [messageName: string]: MessageObject[]
}

function transformMessages(messages: RawMessages): TransformedMessages {
  const transformedMessages: TransformedMessages = {}
  for (const [messageName, messageData] of Object.entries(messages)) {
    console.log(messageName)
    const transformedMessageData = transformMessageData(messageData)
    // Set the name on each message object
    transformedMessageData.forEach((msg) => {
      msg.name = messageName
    })
    transformedMessages[messageName] = transformedMessageData
  }
  return transformedMessages
}

interface MessageDefinition {
  expressions: string[]
  units?: string | string[]
  multipliers?: string | string[]
}

interface RawTypes {
  [messageName: string]: MessageDefinition
}

interface FormatMessages {
  [messageName: string]: {
    name: string
    fields: string[]
    units?: string | string[]
    multipliers?: string | string[]
  }
}

function getFormatMessages(types: RawTypes): FormatMessages {
  const formatMessages: FormatMessages = {}
  for (const [messageName, messageDef] of Object.entries(types)) {
    formatMessages[messageName] = {
      name: messageName,
      fields: messageDef.expressions,
      units: messageDef.units,
      multipliers: messageDef.multipliers,
    }
  }
  return formatMessages
}

export { getFormatMessages, transformMessages }
