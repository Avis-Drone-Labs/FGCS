import { useLocalStorage } from '@mantine/hooks'
import Layout from './components/layout'

export default function AllData() {
  const [connected] = useLocalStorage({
    key: 'connectedToDrone',
    defaultValue: false,
  })

  return (
    <Layout currentPage="all-data">
      <p>all data page</p>
    </Layout>
  )
}
