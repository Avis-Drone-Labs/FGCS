import {useSessionStorage} from "@mantine/hooks"

export const [connected, setConnected] = useSessionStorage({
          key: "connectedToDrone",
          defaultValue: false,
  })
export const [connectedToSocket, setConnectedToSocket] = useSessionStorage({
        key: "socketConnection",
        defaultValue: false,
  })
  