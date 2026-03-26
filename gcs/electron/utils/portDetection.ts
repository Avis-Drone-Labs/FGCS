import { createServer } from "node:net"

/**
 * Finds an available port starting from the given port
 * @param startPort The port to start checking from (default: 5173)
 * @returns A promise that resolves to an available port number
 */
export function findAvailablePort(startPort = 5173): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()

    server.once("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        // Port is in use, try the next one
        resolve(findAvailablePort(startPort + 1))
      } else {
        reject(err)
      }
    })

    server.once("listening", () => {
      server.close()
      resolve(startPort)
    })

    server.listen(startPort)
  })
}
