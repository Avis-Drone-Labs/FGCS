import { useLocalStorage } from '@mantine/hooks'
import Layout from './components/layout'

export default function Config() {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })

  return (
    <Layout currentPage='config'>
      <p>Config page</p>
      <p>{connected}</p>
    </Layout>
  )
}
