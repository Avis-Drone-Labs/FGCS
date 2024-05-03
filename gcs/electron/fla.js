import fs from 'fs'

function parseDataflashLogFile(fileData, webContents) {
  // https://ardupilot.org/copter/docs/logmessages.html
  // https://github.com/ArduPilot/ardupilot/tree/master/libraries/AP_Logger

  const stringTypes = ['n', 'N', 'Z']

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

function parseFgcsTelemetryLogFile(fileData, webContents) {
  const formatMessages = {}
  const messages = {}
  const numberOfLines = fileData.length
  for (const [idx, line] of fileData.entries()) {
    if (line.includes('==')) {
      // ignore lines which aren't meant for parsing
      continue
    }

    const splitLineData = line.split(',').map(function (item) {
      return item.trim()
    })
    const timestamp = parseFloat(splitLineData[0])
    const messageName = splitLineData[1]
    const messageData = splitLineData.splice(2)

    if (messageName === 'STATUSTEXT') {
      continue
    }

    if (!(messageName in formatMessages)) {
      const fields = messageData.map((keyVal) => keyVal.split(':')[0])

      formatMessages[messageName] = {
        fields,
      }
    }

    const messageObj = {
      // moment (the datatime adapter for chartjs) uses milliseconds from epoch
      // as default, so this is a small hack to convert the seconds into milliseconds
      // as the timestamp recorded in a .ftlog is higher precision.
      TimeUS: parseInt(timestamp * 1000),
      name: messageName,
    }

    messageData.forEach((keyVal) => {
      const [key, value] = keyVal.split(':')

      if (
        messageName === 'BATTERY_STATUS' &&
        ['voltages', 'voltages_ext'].includes(key)
      ) {
        // the data we gather stores these values in an array, for the time being we just ignore it
        // TODO: fix
        messageObj[key] = null
      } else {
        try {
          messageObj[key] = parseFloat(value)
        } catch (e) {
          // messageObj[key] = null
        }
      }
    })

    if (!(messageName in messages)) {
      messages[messageName] = []
    }

    messages[messageName].push(messageObj)

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

function determineLogFileType(filePath, firstLine) {
  const reFileExtension = /(?:\.([^.]+))?$/ // https://stackoverflow.com/a/680982
  const ext = reFileExtension.exec(filePath)[1]

  const extensionToTypeMap = {
    log: 'dataflash',
    ftlog: 'fgcs_telemetry',
    // exclude txt from map as txt's are ambiguous
  }

  if (ext !== undefined && ext !== 'txt' && ext in extensionToTypeMap) {
    return extensionToTypeMap[ext]
  } else {
    // Try to figure out the type of log file from the first line of the file
    if (
      firstLine === 'FMT, 128, 89, FMT, BBnNZ, Type,Length,Name,Format,Columns'
    ) {
      return 'dataflash'
    } else if (firstLine.includes('==START_TIME==')) {
      return 'fgcs_telemetry'
    } else if (firstLine.match(/\d{2}\/\d{2}\/\d{4}\s\d{2}:\d{2}:\d{2}/)) {
      // check if first line contains a string similar to "30/04/2024 13:08:13"
      return 'mp_telemetry'
    } else {
      return null
    }
  }
}

export default function openFile(event, filePath) {
  if (filePath == null) {
    return null
  }

  try {
    const fileData = fs.readFileSync(filePath, 'utf8')
    const fileLines = fileData.split('\n')

    const logType = determineLogFileType(filePath, fileLines[0])

    if (logType === null) {
      return { success: false, error: 'Unknown log file type' }
    }

    var messages = null

    if (logType === 'dataflash') {
      messages = parseDataflashLogFile(fileLines, event.sender)
    } else if (logType === 'fgcs_telemetry') {
      messages = parseFgcsTelemetryLogFile(fileLines, event.sender)
    } else if (logType === 'mp_telemetry') {
      // messages = parseMpTelemetryLogFile(fileLines, event.sender)
    } else {
      return { success: false, error: 'Unknown log file type' }
    }

    return {
      success: true,
      messages,
      logType,
    }
  } catch (err) {
    console.error(err)
    return { success: false, error: err }
  }
}
