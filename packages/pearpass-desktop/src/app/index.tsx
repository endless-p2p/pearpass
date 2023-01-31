import React from 'react'
import AddAccount from './AddAccount'
import { useStores } from './models'

function App() {
  const accounts = true
  const [loading, setLoading] = React.useState(true)
  const { entryStore } = useStores()

  React.useEffect(() => {
    const syncWithHolepunch = async () => {
      setLoading(true)
      await entryStore.syncEntities()
      setLoading(false)
    }
    syncWithHolepunch()
  }, [entryStore])

  if (!accounts) return <AddAccount />

  const entries = entryStore.all.map((entry) => <li key={entry.guid}>{entry.name}</li>)

  return (
    <div>
      <h1>PearPass</h1>
      {loading && <p>loading...</p>}
      <ul>{entries}</ul>
    </div>
  )
}

export default App
