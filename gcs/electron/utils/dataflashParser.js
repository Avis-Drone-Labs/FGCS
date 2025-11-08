/* eslint-disable no-unused-vars */
/* eslint-disable no-var */
/* eslint-disable no-prototype-builtins */
const MAV_TYPE_GENERIC = 0 // Generic micro air vehicle.
const MAV_TYPE_FIXED_WING = 1 // Fixed wing aircraft.
const MAV_TYPE_QUADROTOR = 2 // Quadrotor
const MAV_TYPE_COAXIAL = 3 // Coaxial helicopter
const MAV_TYPE_HELICOPTER = 4 // Normal helicopter with tail rotor.
const MAV_TYPE_ANTENNA_TRACKER = 5 // Ground installation
const MAV_TYPE_GCS = 6 // Operator control unit / ground control station
const MAV_TYPE_AIRSHIP = 7 // Airship, controlled
const MAV_TYPE_FREE_BALLOON = 8 // Free balloon, uncontrolled
const MAV_TYPE_ROCKET = 9 // Rocket
const MAV_TYPE_GROUND_ROVER = 10 // Ground rover
const MAV_TYPE_SURFACE_BOAT = 11 // Surface vessel, boat, ship
const MAV_TYPE_SUBMARINE = 12 // Submarine
const MAV_TYPE_HEXAROTOR = 13 // Hexarotor
const MAV_TYPE_OCTOROTOR = 14 // Octorotor
const MAV_TYPE_TRICOPTER = 15 // Tricopter
const MAV_TYPE_FLAPPING_WING = 16 // Flapping wing
const MAV_TYPE_KITE = 17 // Kite
const MAV_TYPE_ONBOARD_CONTROLLER = 18 // Onboard companion controller
const MAV_TYPE_VTOL_DUOROTOR = 19 // Two-rotor VTOL using control surfaces in vertical operation in addition. Tailsitter
const MAV_TYPE_VTOL_QUADROTOR = 20 // Quad-rotor VTOL using a V-shaped quad config in vertical operation.
// Tailsitter.
const MAV_TYPE_VTOL_TILTROTOR = 21 // Tiltrotor VTOL
const MAV_TYPE_VTOL_RESERVED2 = 22 // VTOL reserved 2
const MAV_TYPE_VTOL_RESERVED3 = 23 // VTOL reserved 3
const MAV_TYPE_VTOL_RESERVED4 = 24 // VTOL reserved 4
const MAV_TYPE_VTOL_RESERVED5 = 25 // VTOL reserved 5
const MAV_TYPE_GIMBAL = 26 // Onboard gimbal
const MAV_TYPE_ADSB = 27 // Onboard ADSB peripheral
const MAV_TYPE_PARAFOIL = 28 // Steerable, nonrigid airfoil
const MAV_TYPE_DODECAROTOR = 29 // Dodecarotor
const MAV_TYPE_CAMERA = 30 // Camera
const MAV_TYPE_CHARGING_STATION = 31 // Charging station
const MAV_TYPE_FLARM = 32 // Onboard FLARM collision avoidance system
const MAV_TYPE_ENUM_END = 33 //

const modeMappingApm = {
  0: "MANUAL",
  1: "CIRCLE",
  2: "STABILIZE",
  3: "TRAINING",
  4: "ACRO",
  5: "FBWA",
  6: "FBWB",
  7: "CRUISE",
  8: "AUTOTUNE",
  10: "AUTO",
  11: "RTL",
  12: "LOITER",
  13: "TAKEOFF",
  14: "AVOID_ADSB",
  15: "GUIDED",
  16: "INITIALISING",
  17: "QSTABILIZE",
  18: "QHOVER",
  19: "QLOITER",
  20: "QLAND",
  21: "QRTL",
  22: "QAUTOTUNE",
  23: "QACRO",
  24: "THERMAL",
}
const modeMappingAcm = {
  0: "STABILIZE",
  1: "ACRO",
  2: "ALT_HOLD",
  3: "AUTO",
  4: "GUIDED",
  5: "LOITER",
  6: "RTL",
  7: "CIRCLE",
  9: "LAND",
  11: "DRIFT",
  13: "SPORT",
  14: "FLIP",
  15: "AUTOTUNE",
  16: "POSHOLD",
  17: "BRAKE",
  18: "THROW",
  19: "AVOID_ADSB",
  20: "GUIDED_NOGPS",
  21: "SMART_RTL",
  22: "FLOWHOLD",
  23: "FOLLOW",
  24: "ZIGZAG",
  25: "SYSTEMID",
  26: "AUTOROTATE",
}
const modeMappingRover = {
  0: "MANUAL",
  1: "ACRO",
  3: "STEERING",
  4: "HOLD",
  5: "LOITER",
  6: "FOLLOW",
  7: "SIMPLE",
  8: "DOCK",
  9: "CIRCLE",
  10: "AUTO",
  11: "RTL",
  12: "SMART_RTL",
  15: "GUIDED",
  16: "INITIALISING",
}
const modeMappingTracker = {
  0: "MANUAL",
  1: "STOP",
  2: "SCAN",
  3: "SERVO_TEST",
  10: "AUTO",
  16: "INITIALISING",
}
const modeMappingSub = {
  0: "STABILIZE",
  1: "ACRO",
  2: "ALT_HOLD",
  3: "AUTO",
  4: "GUIDED",
  7: "CIRCLE",
  9: "SURFACE",
  16: "POSHOLD",
  19: "MANUAL",
  20: "MOTOR_DETECT",
}

const multipliers = {
  "-": 0, // no multiplier e.g. a string
  "?": 1, // multipliers which haven't been worked out yet....
  // <leave a gap here, just in case....>
  2: 1e2,
  1: 1e1,
  0: 1,
  A: 1e-1,
  B: 1e-2,
  C: 1e-3,
  D: 1e-4,
  E: 1e-5,
  F: 1e-6,
  G: 1e-7,
  // <leave a gap here, just in case....>
  "!": 3.6, // (ampere*second => milliampere*hour) and (km/h => m/s)
  "/": 3600, // (ampere*second => ampere*hour)
}

const multipliersTable = {
  0.000001: "n",
  1000: "M",
  0.001: "m",
}

const HEAD1 = 163
const HEAD2 = 149

const units = {
  "-": "", // no units e.g. Pi, or a string
  "?": "UNKNOWN", // Units which haven't been worked out yet....
  A: "A", // Ampere
  d: "°", // of the angular variety, -180 to 180
  b: "B", // bytes
  k: "°/s", // degrees per second. Degrees are NOT SI, but is some situations more user-friendly than radians
  D: "°", // degrees of latitude
  e: "°/s/s", // degrees per second per second. Degrees are NOT SI, but is some situations more user-friendly
  E: "rad/s", // radians per second
  G: "Gauss", // Gauss is not an SI unit, but 1 tesla = 10000 gauss so a simple replacement is not possible here
  h: "°", // 0.? to 359.?
  i: "A.s", // Ampere second
  J: "W.s", // Joule (Watt second)
  // { 'l', "l" },          // litres
  L: "rad/s/s", // radians per second per second
  m: "m", // metres
  n: "m/s", // metres per second
  // { 'N', "N" },          // Newton
  o: "m/s/s", // metres per second per second
  O: "°C", // degrees Celsius. Not SI, but Kelvin is too cumbersome for most users
  "%": "%", // percent
  S: "satellites", // number of satellites
  s: "s", // seconds
  q: "rpm", // rounds per minute. Not SI, but sometimes more intuitive than Hertz
  r: "rad", // radians
  U: "°", // degrees of longitude
  u: "ppm", // pulses per minute
  v: "V", // Volt
  P: "Pa", // Pascal
  w: "Ohm", // Ohm
  Y: "us", // pulse width modulation in microseconds
  z: "Hz", // Hertz
  "#": "instance", // instance number for message
}

function getModeMap(mavType) {
  let map
  if (
    [
      MAV_TYPE_QUADROTOR,
      MAV_TYPE_HELICOPTER,
      MAV_TYPE_HEXAROTOR,
      MAV_TYPE_OCTOROTOR,
      MAV_TYPE_COAXIAL,
      MAV_TYPE_TRICOPTER,
    ].includes(mavType)
  ) {
    map = modeMappingAcm
  }
  if (mavType === MAV_TYPE_FIXED_WING) {
    map = modeMappingApm
  }
  if (mavType === MAV_TYPE_GROUND_ROVER) {
    map = modeMappingRover
  }
  if (mavType === MAV_TYPE_ANTENNA_TRACKER) {
    map = modeMappingTracker
  }
  if (mavType === MAV_TYPE_SUBMARINE) {
    map = modeMappingSub
  }
  if (map == null) {
    return null
  }
  return map
}

// Converts from degrees to radians.
Math.radians = function (degrees) {
  return (degrees * Math.PI) / 180
}

// Converts from radians to degrees.
Math.degrees = function (radians) {
  return (radians * 180) / Math.PI
}

class DataflashParser {
  constructor(send_postMessage) {
    this.buffer = null
    this.data = null
    this.FMT = []
    this.FMT[128] = {
      Type: "128",
      length: "89",
      Name: "FMT",
      Format: "BBnNZ",
      Columns: ["Type", "Length", "Name", "Format", "Columns"],
    }
    this.offset = 0
    this.messages = {}
    this.sent = false
    this.messageTypes = {}
    this.send_postMessage = send_postMessage == null ? false : send_postMessage
  }

  // Return array for given data type with length len
  get_type_array(type, len) {
    // In the future we can could use the correct types where possible
    // Would have to check multipliers
    switch (type) {
      case "a": // int16_t[32]
      case "n": // char[4]
      case "N": // char[16]
      case "Z": // char[64]
        return new Array(len)
      case "b": // Int8
      case "B": // Uint8
      case "M": // Uint8 (flight mode)
      case "h": // Int16
      case "H": // Uint16
      case "i": // Int32
      case "L": // Int32
      case "I": // Uint32
      case "f": // Float32
      case "d": // Float64
      case "Q": // Uint64
      case "q": // Int64
      case "c": // Int16 / 100
      case "C": // Uint16 / 100
      case "E": // Uint32 / 100
      case "e": // Int32 / 100
        return new Float64Array(len)
    }
  }

  // Parse given data type from log
  parse_type(type) {
    let ret
    switch (type) {
      case "a": // int16_t[32]
        ret = []
        for (let j = 0; j < 32; j++) {
          ret[j] = this.data.getInt16(this.offset, true)
          this.offset += 2
        }
        break
      case "b":
        ret = this.data.getInt8(this.offset)
        this.offset += 1
        break
      case "B":
        ret = this.data.getUint8(this.offset)
        this.offset += 1
        break
      case "h":
        ret = this.data.getInt16(this.offset, true)
        this.offset += 2
        break
      case "H":
        ret = this.data.getUint16(this.offset, true)
        this.offset += 2
        break
      case "i":
        ret = this.data.getInt32(this.offset, true)
        this.offset += 4
        break
      case "I":
        ret = this.data.getUint32(this.offset, true)
        this.offset += 4
        break
      case "f":
        ret = this.data.getFloat32(this.offset, true)
        this.offset += 4
        break
      case "d":
        ret = this.data.getFloat64(this.offset, true)
        this.offset += 8
        break
      case "Q": {
        let low = this.data.getUint32(this.offset, true)
        this.offset += 4
        ret = this.data.getUint32(this.offset, true) * 4294967296.0 + low
        if (low < 0) ret += 4294967296
        this.offset += 4
        break
      }
      case "q": {
        let low = this.data.getInt32(this.offset, true)
        this.offset += 4
        ret = this.data.getInt32(this.offset, true) * 4294967296.0 + low
        if (low < 0) ret += 4294967296
        this.offset += 4
        break
      }
      case "n":
        // TODO: fix these regex and unsilent linter
        // eslint-disable-next-line
        ret = String.fromCharCode
          .apply(null, new Uint8Array(this.buffer, this.offset, 4))
          .replace(/\x00+$/g, "")
        this.offset += 4
        break
      case "N":
        // eslint-disable-next-line
        ret = String.fromCharCode
          .apply(null, new Uint8Array(this.buffer, this.offset, 16))
          .replace(/\x00+$/g, "")
        this.offset += 16
        break
      case "Z":
        // eslint-disable-next-line
        ret = String.fromCharCode
          .apply(null, new Uint8Array(this.buffer, this.offset, 64))
          .replace(/\x00+$/g, "")
        this.offset += 64
        break
      case "c":
        // this.this.data.setInt16(offset,true);
        ret = this.data.getInt16(this.offset, true) / 100
        this.offset += 2
        break
      case "C":
        // this.data.setUint16(offset,true);
        ret = this.data.getUint16(this.offset, true) / 100
        this.offset += 2
        break
      case "E":
        // this.data.setUint32(offset,true);
        ret = this.data.getUint32(this.offset, true) / 100
        this.offset += 4
        break
      case "e":
        // this.data.setInt32(offset,true);
        ret = this.data.getInt32(this.offset, true) / 100
        this.offset += 4
        break
      case "L":
        // this.data.setInt32(offset,true);
        ret = this.data.getInt32(this.offset, true)
        this.offset += 4
        break
      case "M":
        // this.data.setInt32(offset,true);
        ret = this.data.getUint8(this.offset)
        this.offset += 1
        break
    }
    return ret
  }

  // Get size of given type
  get_size_of(type) {
    switch (type) {
      case "b": // Int8
      case "B": // Uint8
      case "M": // Uint8 flight mode
        return 1
      case "h": // Int16
      case "H": // Uint16
      case "c": // Int16 * 100
      case "C": // Uint16 * 100
        return 2
      case "i": // Int32
      case "I": // Uint32
      case "f": // Float32
      case "n": // char[4]
      case "E": // Uint32 * 100
      case "e": // Int32 * 100
      case "L": // Int32 latitude/longitude
        return 4
      case "d": // Float64
      case "Q": // Uint64
      case "q": // int64
        return 8
      case "N": // char[16]
        return 16
      case "a": // int16_t[32]
      case "Z": // char[64]
        return 64
    }
  }

  FORMAT_TO_STRUCT(obj) {
    const dict = {}
    for (let i = 0; i < obj.Format.length; i++) {
      dict[obj.Columns[i]] = this.parse_type(obj.Format.charAt(i))
    }
    return dict
  }

  getFMT(element) {
    for (let i = 0; i < this.FMT.length; i++) {
      if (this.FMT[i] != null) {
        // eslint-disable-next-line
        if (this.FMT[i].Name == element) {
          return this.FMT[i]
        }
      }
    }
  }

  // Next three functions are used for transfering data on postmessage, instead of cloning
  isTypedArray(arr) {
    return ArrayBuffer.isView(arr) && !(arr instanceof DataView)
  }

  getType(arr) {
    return this.isTypedArray(arr) && arr.constructor.name
  }

  postData(data) {
    data.dataType = {}
    const transferables = []
    for (const field of Object.keys(data.messageList)) {
      const arrayType = this.getType(data.messageList[field])
      if (arrayType) {
        transferables.push(data.messageList[field].buffer)
      }
      // Apparently it is magically decoded on the other end, no need for metadata
      // data['dataType'][field] = arrayType
    }
    self.postMessage(data, transferables)
  }

  // Log name, optional instance name, optional field
  get_instance(name, instance, field) {
    // Read and return array for given log field, this will not be stored locally
    const msg_FMT = this.getFMT(name)
    if (msg_FMT == null) {
      // no such message
      return
    }

    if (
      instance != null &&
      !(
        "InstancesOffsetArray" in msg_FMT &&
        instance in msg_FMT.InstancesOffsetArray
      )
    ) {
      // instance given but no instances or don't have the given instance
      return
    }

    const parse = (offsets) => {
      const len = offsets.length
      if (len == 0) {
        // no data
        return
      }

      const parse_all = () => {
        // Return object with all fields
        const ret = {}

        const num_fields = msg_FMT.Format.length
        for (let i = 0; i < num_fields; i++) {
          // Use correct array type for this format
          ret[msg_FMT.Columns[i]] = this.get_type_array(
            msg_FMT.Format.charAt(i),
            len,
          )
        }

        // For each log message
        for (let i = 0; i < len; i++) {
          this.offset = offsets[i]

          // For each field
          for (let j = 0; j < num_fields; j++) {
            ret[msg_FMT.Columns[j]][i] = this.parse_type(
              msg_FMT.Format.charAt(j),
            )
          }
        }

        return ret
      }

      const parse_field = () => {
        // Just return array for given field
        const field_index = msg_FMT.Columns.indexOf(field)
        if (field_index == -1) {
          // no such field
          return
        }

        // Get offset of field within msg and type
        const offset = msg_FMT.FormatOffset[field_index]
        const type = msg_FMT.Format.charAt(field_index)

        // Read data
        const ret = this.get_type_array(type, len)
        for (let i = 0; i < len; i++) {
          this.offset = offsets[i] + offset
          ret[i] = this.parse_type(type)
        }

        return ret
      }

      if (field) {
        return parse_field()
      }
      return parse_all()
    }

    if (instance != null) {
      return parse(msg_FMT.InstancesOffsetArray[instance])
    }
    return parse(msg_FMT.OffsetArray)
  }

  get(name, field) {
    return this.get_instance(name, null, field)
  }

  parseAtOffset(name) {
    const msg_FMT = this.getFMT(name)
    if (msg_FMT == null) {
      return
    }

    const parse = (msg, offsets) => {
      const len = offsets.length
      if (len == 0) {
        return {}
      }
      const Format = msg.Format
      const num_fields = Format.length
      let time_index

      // Pre allocate arrays
      const parsed = {}
      for (let i = 0; i < num_fields; i++) {
        const name = msg.Columns[i]
        if (name == "TimeUS") {
          // Override TimeUS to time_boot_ms allowing conversion to milliseconds
          time_index = i
          parsed.time_boot_ms = new Float64Array(len)
        } else {
          // Use correct array type for this format
          parsed[name] = this.get_type_array(Format.charAt(i), len)
        }
      }

      // For each log message
      for (let i = 0; i < len; i++) {
        this.offset = offsets[i]

        // For each field
        for (let j = 0; j < num_fields; j++) {
          if (j == time_index) {
            // us to ms
            parsed.time_boot_ms[i] = this.parse_type(Format.charAt(j)) / 1000.0
          } else {
            const name = msg.Columns[j]
            parsed[name][i] = this.parse_type(Format.charAt(j))
          }
        }

        if (this.send_postMessage && i % 1000 === 0) {
          const perc = (100 * i) / len
          self.postMessage({ percentage: perc })
        }
      }

      return parsed
    }

    const has_instance = "InstancesOffsetArray" in msg_FMT
    console.log(name, has_instance ? "has instances" : "has no instances")

    if (has_instance) {
      // Parse instances
      for (const [index, offsets] of Object.entries(
        msg_FMT.InstancesOffsetArray,
      )) {
        const inst_name = name + "[" + index + "]"
        this.messages[inst_name] = parse(msg_FMT, offsets)
        if (this.send_postMessage) {
          this.postData({
            messageType: inst_name,
            messageList: this.messages[inst_name],
          })
        }
      }
      if (this.send_postMessage) {
        self.postMessage({ percentage: 100 })
      }

      return
    }

    // Parse as single msg
    this.messages[name] = parse(msg_FMT, msg_FMT.OffsetArray)

    // Add mode string to mode message
    if (msg_FMT.Name === "MODE") {
      const mode_len = this.messages[name].Mode.length
      this.messages[name].asText = new Array(mode_len)
      for (let i = 0; i < mode_len; i++) {
        this.messages[name].asText[i] = this.getModeString(
          this.messages[name].Mode[i],
        )
      }
    }

    if (this.send_postMessage) {
      // let's not send FMT as it is not useful for users...
      // (and because we need the data and we can't access it after postData with transferables)
      if (name.indexOf("FMT") === -1) {
        this.postData({ messageType: name, messageList: this.messages[name] })
      }
      self.postMessage({ percentage: 100 })
    }
  }

  checkNumberOfInstances(msg) {
    // Parse whole log checking only instance field
    // Populates array offsets of instances, this allows them to be loaded individually

    if (msg.units === undefined) {
      // Need units for instance flag
      return
    }

    const instance_index = msg.units.indexOf("instance")
    if (instance_index == -1) {
      // No instances
      return
    }

    // Find the offset of the instance field
    // this means we can jump to it without parsing the whole msg
    const instance_offset = msg.FormatOffset[instance_index]
    const instance_type = msg.Format.charAt(instance_index)

    const availableInstances = []
    msg.InstancesOffsetArray = {}
    const len = msg.OffsetArray.length
    for (let i = 0; i < len; i++) {
      this.offset = msg.OffsetArray[i] + instance_offset
      const instance = this.parse_type(instance_type)
      if (msg.InstancesOffsetArray[instance] == null) {
        msg.InstancesOffsetArray[instance] = []
        availableInstances.push(instance)
      }
      msg.InstancesOffsetArray[instance].push(msg.OffsetArray[i])
    }

    // Don't need array at base level anymore
    delete msg.OffsetArray

    return availableInstances
  }

  DfReader() {
    let lastOffset = 0
    let msg_OffsetArray = []
    while (this.offset < this.buffer.byteLength - 3) {
      if (
        this.data.getUint8(this.offset) !== HEAD1 ||
        this.data.getUint8(this.offset + 1) !== HEAD2
      ) {
        this.offset += 1
        continue
      }
      this.offset += 2

      const attribute = this.data.getUint8(this.offset)
      this.offset += 1

      if (msg_OffsetArray[attribute] == null) {
        msg_OffsetArray[attribute] = []
      }
      msg_OffsetArray[attribute].push(this.offset)

      if (this.FMT[attribute] != null) {
        try {
          // Load FMT messages
          if (attribute === 128) {
            // Parse full message
            const value = this.FORMAT_TO_STRUCT(this.FMT[attribute])
            // Pre-calculate size of message and offsets
            let Size = 0
            let FormatOffset = new Array(value.Format.length)
            for (let i = 0; i < value.Format.length; i++) {
              FormatOffset[i] = Size
              Size += this.get_size_of(value.Format.charAt(i))
            }
            this.FMT[value.Type] = {
              Type: value.Type,
              length: value.Length,
              Name: value.Name,
              Format: value.Format,
              Columns: value.Columns.split(","),
              FormatOffset,
              Size,
            }
          } else {
            // Don't need to parse, advance by msg length
            this.offset += this.FMT[attribute].Size
          }
        } catch (e) {
          // console.log('reached log end?')
          // console.log(e)
          this.offset += 1
        }
      }
      if (this.send_postMessage && this.offset - lastOffset > 50000) {
        const perc = (100 * this.offset) / this.buffer.byteLength
        self.postMessage({ percentage: perc })
        lastOffset = this.offset
      }
    }

    // Assign offsets to format
    const len = this.FMT.length
    for (let i = 0; i < len; i++) {
      if (this.FMT[i] != null) {
        if (msg_OffsetArray[i] == null) {
          // No messages received
          this.FMT[i].Total_Length = 0
          this.FMT[i].OffsetArray = []
          continue
        }
        this.FMT[i].OffsetArray = msg_OffsetArray[i]

        // Check that there is room for the final message
        const msg_end =
          this.FMT[i].OffsetArray[this.FMT[i].OffsetArray.length - 1] +
          this.FMT[i].Size
        if (msg_end > this.buffer.byteLength) {
          // Last message will overflow, remove
          this.FMT[i].OffsetArray.pop()
        }
        this.FMT[i].Total_Length = this.FMT[i].OffsetArray.length
      }
    }

    if (this.send_postMessage) {
      self.postMessage({ percentage: 100 })
      self.postMessage({ messages: this.messages })
      this.sent = true
    }
  }

  getModeString(cmode) {
    let mavtype
    const msgs = this.messages.MSG
    for (const i in msgs.Message) {
      if (msgs.Message.hasOwnProperty(i)) {
        if (msgs.Message[i].toLowerCase().includes("arduplane")) {
          mavtype = MAV_TYPE_FIXED_WING
          return getModeMap(mavtype)[cmode]
        } else if (msgs.Message[i].toLowerCase().includes("arducopter")) {
          mavtype = MAV_TYPE_QUADROTOR
          return getModeMap(mavtype)[cmode]
        } else if (msgs.Message[i].toLowerCase().includes("ardusub")) {
          mavtype = MAV_TYPE_SUBMARINE
          return getModeMap(mavtype)[cmode]
        } else if (msgs.Message[i].toLowerCase().includes("rover")) {
          mavtype = MAV_TYPE_GROUND_ROVER
          return getModeMap(mavtype)[cmode]
        } else if (msgs.Message[i].toLowerCase().includes("tracker")) {
          mavtype = MAV_TYPE_ANTENNA_TRACKER
          return getModeMap(mavtype)[cmode]
        }
      }
    }
    console.log("defaulting to quadcopter")
    return getModeMap(MAV_TYPE_QUADROTOR)[cmode]
  }

  concatTypedArrays(a, b) {
    // a, b TypedArray of same type
    const c = new a.constructor(a.length + b.length)
    c.set(a, 0)
    c.set(b, a.length)
    return c
  }

  createUint8ArrayFromString(str) {
    const array = new Uint8Array(str.length)
    for (let i = 0, strLen = str.length; i < strLen; i++) {
      array[i] = str.charCodeAt(i)
    }
    return array
  }

  processFiles() {
    this.files = {}
    if (this.messages.FILE === undefined) {
      return
    }
    for (const i in this.messages.FILE.FileName) {
      if (this.messages.FILE.FileName.hasOwnProperty(i)) {
        const name = this.messages.FILE.FileName[i]
        const Data = this.messages.FILE.Data[i]
        if (!this.files.hasOwnProperty(name)) {
          this.files[name] = this.createUint8ArrayFromString(Data)
        } else {
          this.files[name] = this.concatTypedArrays(
            this.files[name],
            this.createUint8ArrayFromString(Data),
          )
        }
      }
    }
    if (this.send_postMessage) {
      self.postMessage({ files: this.files })
    }
  }

  populateUnits() {
    const FMTU = this.get("FMTU")
    for (const index in FMTU.FmtType) {
      const type = FMTU.FmtType[index]
      this.FMT[type].units = []
      for (const unit of FMTU.UnitIds[index]) {
        this.FMT[type].units.push(units[unit])
      }
      this.FMT[type].multipliers = []
      for (const mult of FMTU.MultIds[index]) {
        this.FMT[type].multipliers.push(multipliers[mult])
      }
    }
  }

  extractStartTime() {
    if (!("GPS" in this.messageTypes)) {
      // No GPS time, can't get timestamp
      return
    }
    // Find the fist log message with timestamp
    let first_time_offset
    for (const msg of this.FMT) {
      if (msg == null) {
        // Invalid message type
        continue
      }

      // Look for timestamp
      const time_index = msg.Columns.indexOf("TimeUS")
      if (time_index == -1 || msg.Format.charAt(time_index) != "Q") {
        // No timestamp, or unexpected format
        continue
      }

      // Offset of timestamp within message
      const TimeUS_offset = msg.FormatOffset[time_index]

      // Helper to record first offset of time stamp
      function update_first_offset(new_msg_offset) {
        const time_offset = new_msg_offset + TimeUS_offset
        if (first_time_offset == null || time_offset < first_time_offset) {
          first_time_offset = time_offset
        }
      }

      // Offset of message, only check first, assume time never goes backwards
      if ("InstancesOffsetArray" in msg) {
        // Multiple instances
        for (const inst of Object.values(msg.InstancesOffsetArray)) {
          if (inst.length > 0) {
            update_first_offset(inst[0])
          }
        }
      } else {
        // Single instance
        if (msg.OffsetArray.length > 0) {
          update_first_offset(msg.OffsetArray[0])
        }
      }
    }
    let start_time_us
    if (first_time_offset != null) {
      this.offset = first_time_offset
      start_time_us = this.parse_type("Q")
    }

    // Helper to get the first week and ms time from GPS message
    function get_gps_time(time, status, weeks, ms) {
      // Must have 3D fix
      const GPS_OK_FIX_3D = 3

      const len = time.length
      for (let i = 0; i < len; i++) {
        if (
          status[i] >= GPS_OK_FIX_3D &&
          weeks[i] > 1000 && // lousy validation
          ms[i] > 0
        ) {
          return {
            TimeUS: time[i],
            weeks: weeks[i],
            ms: ms[i],
          }
        }
      }
    }

    // Pick the instance with the first valid time
    let time
    function update_first_time(new_time) {
      if (new_time == null) {
        return
      }
      if (time == null || new_time.TimeUS < time.TimeUS) {
        time = new_time
      }
    }

    if ("instances" in this.messageTypes.GPS) {
      // Newer instance message
      for (const inst of Object.keys(this.messageTypes.GPS.instances)) {
        // Check each instance
        update_first_time(
          get_gps_time(
            this.get_instance("GPS", inst, "TimeUS"),
            this.get_instance("GPS", inst, "Status"),
            this.get_instance("GPS", inst, "GWk"),
            this.get_instance("GPS", inst, "GMS"),
          ),
        )
      }
    } else {
      // Old log before instances, just look at GPS, not GPS2
      update_first_time(
        get_gps_time(
          this.get("GPS", "TimeUS"),
          this.get("GPS", "Status"),
          this.get("GPS", "GWk"),
          this.get("GPS", "GMS"),
        ),
      )
    }

    // No valid time
    if (time == null) {
      return
    }

    // Calculate GPS time in seconds
    const ms_per_week = 7 * 24 * 60 * 60 * 1000
    const GPS_ms = time.weeks * ms_per_week + time.ms

    // Log was started before GPS msg
    const log_start_offset_ms = (time.TimeUS - start_time_us) * 0.001

    // Convert to unix time
    const unix_gps_offset_ms = 315964800 * 1000
    const unix_ms = unix_gps_offset_ms + GPS_ms - log_start_offset_ms
    let d = new Date(unix_ms)

    // Get the number of GPS leap seconds
    const leap_seconds = this.leapSecondsGPS(
      d.getUTCFullYear(),
      d.getUTCMonth() + 1,
    )

    // adjust for leap seconds
    return new Date(d.getTime() - leap_seconds * 1000)
  }

  leapSecondsGPS(year, month) {
    return this.leapSecondsTAI(year, month) - 19
  }

  leapSecondsTAI(year, month) {
    const yyyymm = year * 100 + month
    if (yyyymm >= 201701) return 37
    if (yyyymm >= 201507) return 36
    if (yyyymm >= 201207) return 35
    if (yyyymm >= 200901) return 34
    if (yyyymm >= 200601) return 33
    if (yyyymm >= 199901) return 32
    if (yyyymm >= 199707) return 31
    if (yyyymm >= 199601) return 30

    return 0
  }

  processData(data, msgs) {
    this.buffer = data
    this.data = new DataView(this.buffer)
    this.DfReader()
    const messageTypes = {}
    try {
      this.populateUnits()
    } catch (e) {
      console.log("error populating units")
      console.log(e)
    }
    for (const msg of this.FMT) {
      if (msg && msg.Total_Length != 0) {
        const fields = msg.Columns
        const complexFields = {}
        for (let i = 0; i < fields.length; i++) {
          complexFields[fields[i]] = {
            name: fields[i],
            units: !msg.units
              ? "?"
              : (multipliersTable[msg.multipliers[i]] || "") + msg.units[i],
            multiplier: !msg.units ? 1.0 : msg.multipliers[i],
          }
        }
        messageTypes[msg.Name] = {
          expressions: fields,
          units: msg.units,
          multipliers: msg.multipliers,
          complexFields: complexFields,
        }
        const availableInstances = this.checkNumberOfInstances(msg)
        if (availableInstances != null) {
          messageTypes[msg.Name].instances = {}
          for (const instance of availableInstances) {
            const inst_name = msg.Name + "[" + instance + "]"
            messageTypes[msg.Name].instances[instance] = inst_name
            messageTypes[inst_name] = {
              expressions: fields,
              units: msg.units,
              multipliers: msg.multipliers,
              complexFields: complexFields,
            }
          }
        }
      }
    }
    if (this.send_postMessage) {
      self.postMessage({ availableMessages: messageTypes })
    }
    this.messageTypes = messageTypes

    if (msgs === undefined) {
      // Default messages
      msgs = [
        "CMD",
        "MSG",
        "FILE",
        "MODE",
        "AHR2",
        "ATT",
        "GPS",
        "POS",
        "XKQ1",
        "XKQ",
        "NKQ1",
        "NKQ2",
        "XKQ2",
        "PARM",
        "MSG",
        "STAT",
        "EV",
      ]
    }
    for (const msg of msgs) {
      this.parseAtOffset(msg)
      if (msg === "FILE") {
        this.processFiles()
      }
    }

    if (this.send_postMessage) {
      const metadata = {
        startTime: this.extractStartTime(),
      }
      self.postMessage({ metadata: metadata })
      self.postMessage({ messagesDoneLoading: true })
    }

    return { types: this.messageTypes, messages: this.messages }
  }

  loadType(type) {
    this.parseAtOffset(type)
    console.log("done")
  }

  // Return array of objects giving stats about the composition of the log, sizes in bytes
  stats() {
    let ret = {}
    for (const msg of this.FMT) {
      if (msg) {
        // All message have a 3 byte header
        const msg_size = msg.Size + 3
        const count = msg.Total_Length
        const size = msg_size * count
        ret[msg.Name] = { count, msg_size, size }
      }
    }

    return ret
  }
}

// self.addEventListener("message", function (event) {
//   let parser
//   if (event.data === null) {
//     console.log("got bad file message!")
//   } else if (event.data.action === "parse") {
//     parser = new DataflashParser(true)
//     const data = event.data.file
//     parser.processData(data)
//   } else if (event.data.action === "loadType") {
//     parser.loadType(event.data.type.split("[")[0])
//   } else if (event.data.action === "trimFile") {
//     parser.trimFile(event.data.time)
//   }
// })

export default DataflashParser
