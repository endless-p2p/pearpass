import React from 'react'
import { Text, Box, Spacer } from 'ink'

import BigText from 'ink-big-text'

const Header = ({ insertMode, name = 'Stranger' }) => {
  const commands = insertMode ? 'Enter key: value' : 'q: quit | i: insert'
  return (
    <Box flexDirection="column">
      <BigText
        text="PearPass"
        font="chrome"
        colors={['white', 'greenBright', 'greenBright']}
        align="right"
      />
      <Box marginX={1}>
        <Box flexGrow={1}>
          <Box>
            <Text>{commands}</Text>
            <Spacer />
          </Box>
        </Box>
        <Box flexShrink={1}>{/* <Text color="magenta">{name}</Text> */}</Box>
      </Box>
    </Box>
  )
}

export default Header
