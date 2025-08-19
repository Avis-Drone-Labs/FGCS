// subscribe to store updates
// and save to local storage any values that have changed

import { store } from "../store"

store.subscribe(() => {
  // create a mutable copy of the store
  let store_mut = store.getState()

  // droneConnection
  // may need to serialize the stored variables

  // PERFORMANCE WAY BE BAD
  // POTENTIALLY ADD CHECK TO SEE IF THESE VARIABLES HAVE EVEN BEEN MODIFIED IN THE STORE
  window.localStorage.setItem(
    "wirelessConnection",
    store_mut.droneConnection.wireless,
  )
  window.localStorage.setItem("baudrate", store_mut.droneConnection.baudrate)
  window.localStorage.setItem(
    "connectionType",
    store_mut.droneConnection.connection_type,
  )
  window.localStorage.setItem(
    "networkType",
    store_mut.droneConnection.network_type,
  )
  window.localStorage.setItem("ip", store_mut.droneConnection.ip)
  window.localStorage.setItem("port", store_mut.droneConnection.port)
  window.localStorage.setItem(
    "connectedToDrone",
    store_mut.droneConnection.connected,
  )
})
