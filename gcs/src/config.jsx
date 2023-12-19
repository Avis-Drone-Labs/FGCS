import Layout from './components/layout'
import { socket } from './socket'
import { useEffect, useState } from 'react'
import {
  NumberInput,
  Progress,
  Table,
  TextInput,
  Group,
  Button,
} from '@mantine/core'
import { useDebouncedValue } from '@mantine/hooks'
import {
  IconPencil,
  IconRefresh,
  IconTool,
  IconPower,
} from '@tabler/icons-react'

export default function Config() {
  const [fetchingVars, setFetchingVars] = useState(false)
  const [fetchingVarsProgress, setFetchingVarsProgress] = useState(0)
  const [params, setParams] = useState(null)
  const [shownParams, setShownParams] = useState(null)
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue] = useDebouncedValue(searchValue, 350)

  useEffect(() => {
    if (params === null && !fetchingVars) {
      console.log('setting state')
      socket.emit('set_state', { state: 'config' })
      setFetchingVars(true)
    }

    socket.on('params', (params) => {
      setParams(params)
      setShownParams(params)
      setFetchingVars(false)
      setFetchingVarsProgress(0)
    })

    socket.on('param_request_update', (msg) => {
      setFetchingVarsProgress(
        (msg.current_param_index / msg.total_number_of_params) * 100,
      )
    })

    socket.on('error', (err) => {
      console.error(err.message)
      setFetchingVars(false)
    })

    return () => {
      socket.off('params')
      socket.off('param_request_update')
      socket.off('error')
    }
  })

  useEffect(() => {
    if (!params) return

    const filteredParams = Object.keys(params)
      .filter(
        (key) =>
          key.toLowerCase().indexOf(debouncedSearchValue.toLowerCase()) == 0,
      )
      .reduce((obj, key) => {
        return Object.assign(obj, {
          [key]: params[key],
        })
      }, {})

    setShownParams(filteredParams)
  }, [debouncedSearchValue])

  return (
    <Layout currentPage="config">
      {fetchingVars && <Progress radius="xs" value={fetchingVarsProgress} />}
      {params !== null && (
        <div className="w-2/3 mx-auto">
          <Group justify="center">
            <TextInput
              label="Search"
              placeholder="Search by parameter name"
              value={searchValue}
              onChange={(event) => setSearchValue(event.currentTarget.value)}
            />
            <Button size="sm" rightSection={<IconPencil size={14} />}>
              Save params
            </Button>
            <Button size="sm" rightSection={<IconRefresh size={14} />}>
              Refresh params
            </Button>
            <Button size="sm" rightSection={<IconTool size={14} />}>
              Modified params
            </Button>
            <Button size="sm" rightSection={<IconPower size={14} />}>
              Reboot FC
            </Button>
          </Group>
          <Table stickyHeader highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Value</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {Object.keys(shownParams).map((param) => {
                return (
                  <Table.Tr key={param}>
                    <Table.Td>{param}</Table.Td>
                    <Table.Td>
                      <NumberInput
                        value={+params[param].param_value.toFixed(5)}
                      />
                    </Table.Td>
                  </Table.Tr>
                )
              })}
            </Table.Tbody>
          </Table>
        </div>
      )}
    </Layout>
  )
}
