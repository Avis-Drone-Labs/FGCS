"use client"

import { Table } from "@mantine/core"
import { useEffect, useState } from "react"

function readableBytes(bytes) {
  if (bytes === 0) return "0"
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const sizes = ["", "K", "M", "G"]

  return (
    (Math.round((bytes / Math.pow(1024, i)) * 100) / 100).toFixed(2) +
    "" +
    sizes[i]
  )
}

export default function LinkStatsWindow() {
  const [linkStats, setLinkStats] = useState({
    total_packets_sent: 0,
    avg_packets_sent_per_sec: 0,
    total_bytes_sent: 0,
    avg_bytes_sent_per_sec: 0,
    total_packets_received: 0,
    avg_packets_received_per_sec: 0,
    total_bytes_received: 0,
    avg_bytes_received_per_sec: 0,
    total_receive_errors: 0,
    uptime: 0,
  })

  useEffect(() => {
    window.ipcRenderer.onGetLinkStats((stats) => {
      setLinkStats(stats)
    })
  }, [])

  return (
    <div className="w-full h-full bg-falcongrey-800">
      <div
        className={
          "flex flex-col items-center justify-between w-full h-full gap text-center p-4"
        }
      >
        <div>
          <p>Downlink</p>
          <Table tabularNums>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Packets</Table.Th>
                <Table.Th>Packets/s</Table.Th>
                <Table.Th>Bytes</Table.Th>
                <Table.Th>Bytes/s</Table.Th>
                <Table.Th>Errors</Table.Th>
                <Table.Th>Quality</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>{linkStats.total_packets_received}</Table.Td>
                <Table.Td>{linkStats.avg_packets_received_per_sec}</Table.Td>
                <Table.Td>
                  {readableBytes(linkStats.total_bytes_received)}
                </Table.Td>
                <Table.Td>{linkStats.avg_bytes_received_per_sec}</Table.Td>
                <Table.Td>{linkStats.total_receive_errors}</Table.Td>
                <Table.Td>
                  {linkStats.total_packets_received > 0
                    ? (
                        ((linkStats.total_packets_received -
                          linkStats.total_receive_errors) /
                          linkStats.total_packets_received) *
                        100
                      ).toFixed(0) + "%"
                    : "0%"}
                </Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </div>

        <div>
          <p>Uplink</p>
          <Table tabularNums>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Packets</Table.Th>
                <Table.Th>Packets/s</Table.Th>
                <Table.Th>Bytes</Table.Th>
                <Table.Th>Bytes/s</Table.Th>
                <Table.Th></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td>{linkStats.total_packets_sent}</Table.Td>
                <Table.Td>{linkStats.avg_packets_sent_per_sec}</Table.Td>
                <Table.Td>{readableBytes(linkStats.total_bytes_sent)}</Table.Td>
                <Table.Td>{linkStats.avg_bytes_sent_per_sec}</Table.Td>
                <Table.Td></Table.Td>
              </Table.Tr>
            </Table.Tbody>
          </Table>
        </div>
      </div>
    </div>
  )
}
