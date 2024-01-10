import { useLocalStorage } from '@mantine/hooks'
import Layout from './components/layout'

export default function Graphs() {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })
  return (
    <Layout currentPage='graphs'>
      <p>graphs page</p>
      <p>{connected}</p>
    </Layout>
  )
}
