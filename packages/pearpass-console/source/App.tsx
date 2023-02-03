import React from 'react'
import { Text, Box, useFocusManager, useFocus, useInput, useApp, Spacer } from 'ink'
import { Form } from 'ink-form'
import Header from './components/Header'
import useGlobalCommands from './hooks/useGlobalCommands'
import { useVault } from './hooks/useVault'
import EntryForm from './components/EntryForm'

const App = ({ name = 'Stranger' }) => {
  const [insertMode, setInsertMode] = React.useState(false)
  const { stats } = useVault()

  useGlobalCommands({ insertMode, setInsertMode })

  return (
    <>
      <Header insertMode={insertMode} name={name} />
      <Box>
        <Box flexGrow={1} flexDirection="column">
          <Box height={4}>
            <EntryForm insertMode={insertMode} setInsertMode={setInsertMode} />
          </Box>
          <Text>{JSON.stringify(stats.db)}</Text>
        </Box>
        <Box flexDirection="column" borderStyle="round" width={50} height={20} paddingX={1}>
          <Box>
            <Box width={20}>
              <Text color="greenBright">local hyperbee:</Text>
            </Box>
            <Box>
              <Text>v{stats?.localBeeVersion}</Text>
            </Box>
          </Box>
          <Box>
            <Box width={20}>
              <Text color="greenBright">remote hyperbee:</Text>
            </Box>
            <Box>
              <Text>v{stats?.remoteBeeVersion}</Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  )
}

export default App
