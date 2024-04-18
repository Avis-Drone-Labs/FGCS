import fs from 'fs'

// https://ardupilot.org/copter/docs/logmessages.html
// https://github.com/ArduPilot/ardupilot/tree/master/libraries/AP_Logger

const stringTypes = ['n', 'N', 'Z']
const floatTypes = ['f', 'd']

function parseLogFile(fileData, webContents) {
  const formatMessages = {}
  const messages = {}
  const numberOfLines = fileData.length
  for (const [idx, line] of fileData.entries()) {
    const splitLineData = line.split(',').map(function (item) {
      return item.trim()
    })
    const messageName = splitLineData[0]
    if (messageName === 'FMT') {
      // Message defining the format of messages in this file
      const definedMessageType = parseInt(splitLineData[1]) // unique-to-this-log identifier for message being defined
      const definedMessageLength = parseInt(splitLineData[2]) // the number of bytes taken up by this message (including all headers)
      const definedMessageName = splitLineData[3] // name of the message being defined
      const definedMessageFormat = splitLineData[4] // character string defining the C-storage-type of the fields in this message
      const fields = splitLineData.slice(5)

      formatMessages[definedMessageName] = {
        length: definedMessageLength, // is this even needed?
        name: definedMessageName,
        type: definedMessageType,
        format: definedMessageFormat,
        fields,
      }

      // if (definedMessageName === 'ATT') {
      //   console.log(formatMessages[definedMessageName])
      // }
    } else if (messageName === 'UNIT') {
      // Message mapping from single character to SI unit
    } else if (messageName === 'FMTU') {
      // Message defining units and multipliers used for fields of other messages
    } else if (messageName === 'MULT') {
      // Message mapping from single character to numeric multiplier
    } else if (messageName === 'PARM') {
      // Parameter value
    } else if (messageName === 'FILE') {
      // File data
    } else {
      // Message data
      if (Object.keys(formatMessages).includes(messageName)) {
        if (!Object.keys(messages).includes(messageName)) {
          messages[messageName] = []
        }

        const formatMessage = formatMessages[messageName]

        const messageObj = {
          name: messageName,
          type: formatMessage.type,
          // length: formatMessage.length, // is this even needed?
        }

        const messageData = splitLineData.slice(1)
        const fields = formatMessage.fields
        const format = formatMessage.format

        for (let i = 0; i < fields.length; i++) {
          let field = fields[i]
          let formatType = format[i]
          let value = messageData[i]

          if (stringTypes.includes(formatType)) {
            messageObj[field] = value
          } else {
            messageObj[field] = parseFloat(value)
          }
        }

        // if (messageName === 'ATT' && messages[messageName].length === 0) {
        //   console.log(messageObj)
        // }

        messages[messageName].push(messageObj)
      }
    }
    if (idx % 5000 === 0) {
      webContents.send('fla:log-parse-progress', {
        percent: Math.round((idx / numberOfLines) * 100),
      })
    }
  }

  webContents.send('fla:log-parse-progress', {
    percent: 100,
  })

  // Add format messages to messages for later digesting and return
  messages['format'] = formatMessages
  return messages
}

export default function openFile(event, filePath) {
  if (filePath == null) {
    return null
  }

  try {
    const data = fs.readFileSync(filePath, 'utf8')
    return {
      success: true,
      messages: parseLogFile(data.split('\n'), event.sender),
    }
  } catch (err) {
    console.error(err)
    return { success: false, error: err }
  }
}
