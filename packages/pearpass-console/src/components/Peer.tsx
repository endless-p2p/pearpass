import React from 'react'
import { Text, Box } from 'ink'

function Row({ name, value }) {
  return (
    <Box>
      <Box width={20}>
        <Text color="greenBright">{name}:</Text>
      </Box>
      <Box>
        <Text>{value}</Text>
      </Box>
    </Box>
  )
}

const Peer = ({ peerData }) => {
  if (!peerData) return null

  const { identityBee, entryBee } = peerData

  if (!identityBee || !entryBee) return null

  const rows = Object.entries(entryBee).map(([key, value]) => (
    <Row key={key} name={key} value={value} />
  ))

  return (
    <Box flexDirection="column" borderStyle="round" paddingX={1}>
      <Box alignItems="center">
        <Text color="magenta">{identityBee.name}</Text>
      </Box>
      {rows}
    </Box>
  )
}

export default Peer
