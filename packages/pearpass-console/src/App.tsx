import React from 'react'
import { Text, Box, useFocusManager, useFocus, useInput, useApp, Spacer } from 'ink'
import { Form } from 'ink-form'
import Header from './components/Header'
import useGlobalCommands from './hooks/useGlobalCommands'
import { useVault } from './hooks/useVault'
import EntryForm from './components/EntryForm'
import Peer from './components/Peer'

const App = ({ name = 'Stranger' }) => {
  const [insertMode, setInsertMode] = React.useState(false)
  const { stats } = useVault()

  useGlobalCommands({ insertMode, setInsertMode })

  const peers = stats.peers?.map((peer, i) => <Peer key={i} peerData={peer} />)

  return (
    <>
      <Header insertMode={insertMode} name={name} />
      <Box>
        <Box flexGrow={1} flexDirection="column">
          <Box height={4}>
            <EntryForm insertMode={insertMode} setInsertMode={setInsertMode} />
          </Box>
          <Text>{JSON.stringify(stats)}</Text>
        </Box>
        <Box flexDirection="column" width="50%">
          <Peer peerData={stats} />
          {peers}
        </Box>
      </Box>
    </>
  )
}

export default App
