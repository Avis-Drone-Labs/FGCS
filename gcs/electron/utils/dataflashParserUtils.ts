import type {
  AircraftType,
  FormatMessage,
  MessageObject,
  ParamObject,
} from "../types/flaTypes"

interface RawMessageData {
  time_boot_ms?: { [index: number]: number }
  [fieldName: string]: { [index: number]: number | string } | undefined
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
  [messageName: string]: FormatMessage
}

function transformMessageData(messageData: RawMessageData): MessageObject[] {
  // Each message data object has a time_boot_ms field and the other data points
  // for the message are defined as fields on the object.
  // Each field is an object with the key being an index and the value being
  // the actual data point value.
  // We need to convert that into an array of objects where each object has
  // a name, type, timeUS and rest of the keys are the fields with their values.
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
          entry.TimeUS = entry.TimeUS * 1000 // Convert ms to us
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
    const transformedMessageData = transformMessageData(messageData)
    // Set the name on each message object
    transformedMessageData.forEach((msg) => {
      msg.name = messageName
    })
    transformedMessages[messageName] = transformedMessageData
  }

  // Normalize message names to remove [0] suffix when there's only one instance
  return normalizeMessageNames(transformedMessages)
}

function getFormatMessages(types: RawTypes): FormatMessages {
  const formatMessages: FormatMessages = {}
  for (const [messageName, messageDef] of Object.entries(types)) {
    formatMessages[messageName] = {
      name: messageName,
      fields: messageDef.expressions,
      units: messageDef.units,
      multipliers: messageDef.multipliers,
      format: "",
    }
  }
  return formatMessages
}

function getAircraftTypeFromMavType(mavType: number): AircraftType {
  if (mavType === 1) {
    return "plane"
  } else if (mavType === 2) {
    return "copter"
  }

  return null
}

function normalizeFormatMessageNames(
  formatMessages: FormatMessages,
  messageNames: string[],
): FormatMessages {
  const normalizedFormatMessages: FormatMessages = {}

  // Create a set of normalized message names for quick lookup
  const normalizedNameMap: { [originalName: string]: string } = {}

  // First, identify all base message types and their instances
  const messageGroups: { [baseName: string]: string[] } = {}

  for (const messageName of messageNames) {
    const match = messageName.match(/^(.+)\[(\d+)\]$/)
    if (match) {
      const baseName = match[1]
      if (!messageGroups[baseName]) {
        messageGroups[baseName] = []
      }
      messageGroups[baseName].push(messageName)
    }
  }

  // Build mapping of original names to normalized names
  for (const [baseName, instances] of Object.entries(messageGroups)) {
    if (instances.length === 1 && instances[0].endsWith("[0]")) {
      normalizedNameMap[instances[0]] = baseName
    } else {
      instances.forEach((instanceName) => {
        normalizedNameMap[instanceName] = instanceName
      })
    }
  }

  // Apply normalization to format messages
  for (const [messageName, formatMessage] of Object.entries(formatMessages)) {
    const normalizedName = normalizedNameMap[messageName] || messageName
    normalizedFormatMessages[normalizedName] = {
      ...formatMessage,
      name: normalizedName,
    }
  }

  return normalizedFormatMessages
}

function normalizeMessageNames(
  messages: TransformedMessages,
): TransformedMessages {
  const normalizedMessages: TransformedMessages = {}

  // First, identify all base message types and their instances
  const messageGroups: { [baseName: string]: string[] } = {}

  for (const messageName of Object.keys(messages)) {
    const match = messageName.match(/^(.+)\[(\d+)\]$/)
    if (match) {
      const baseName = match[1]
      if (!messageGroups[baseName]) {
        messageGroups[baseName] = []
      }
      messageGroups[baseName].push(messageName)
    } else {
      // Regular message without instance suffix
      normalizedMessages[messageName] = messages[messageName]
    }
  }

  // Process each message group
  for (const [baseName, instances] of Object.entries(messageGroups)) {
    if (instances.length === 1 && instances[0].endsWith("[0]")) {
      // Single instance with [0] suffix - rename to base name
      const newName = baseName
      normalizedMessages[newName] = messages[instances[0]]

      // Update the name property in each message object
      normalizedMessages[newName].forEach((msg) => {
        msg.name = newName
      })
    } else {
      // Multiple instances - keep original names
      instances.forEach((instanceName) => {
        normalizedMessages[instanceName] = messages[instanceName]
      })
    }
  }

  return normalizedMessages
}

function getParamObjects(paramMessages: MessageObject[]): ParamObject[] {
  // Use a map to avoid duplicate params
  const params: { [paramName: string]: ParamObject } = {}
  for (const msg of paramMessages) {
    const name = (msg as { Name?: unknown }).Name
    const value = (msg as { Value?: unknown }).Value
    if (typeof name !== "string") {
      continue
    }
    if (typeof value !== "string" && typeof value !== "number") {
      continue
    }

    const paramObj: ParamObject = {
      name: name,
      value: value,
    }
    params[paramObj.name] = paramObj
  }

  // Sort alphabetically by param name
  const sortedParams = Object.values(params).sort((a, b) =>
    a.name.localeCompare(b.name),
  )

  return sortedParams
}

export {
  getAircraftTypeFromMavType,
  getFormatMessages,
  getParamObjects,
  normalizeFormatMessageNames,
  normalizeMessageNames,
  transformMessages,
}
