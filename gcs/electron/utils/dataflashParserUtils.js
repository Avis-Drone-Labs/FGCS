function transformMessageData(messageData) {
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
  const transformedData = []
  for (let i = 0; i < maxIndexValue; i++) {
    const entry = {}

    for (const [key, value] of Object.entries(messageData)) {
      if (key === "time_boot_ms") {
        entry.TimeUS = value[i]
      } else {
        entry[key] = value[i]
      }
    }
    transformedData.push(entry)
  }
  return transformedData
}

function transformMessages(messages) {
  const transformedMessages = {}
  for (const [messageName, messageData] of Object.entries(messages)) {
    console.log(messageName)
    const transformedMessageData = transformMessageData(messageData)
    transformedMessageData.name = messageName
    transformedMessages[messageName] = transformedMessageData
  }
  return transformedMessages
}

function getFormatMessages(types) {
  const formatMessages = {}
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
