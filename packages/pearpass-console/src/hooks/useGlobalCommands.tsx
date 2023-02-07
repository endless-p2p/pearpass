import React from 'react'
import { useInput, useApp } from 'ink'

const useGlobalCommands = ({ insertMode, setInsertMode }) => {
  const { exit } = useApp()
  useInput((input, key) => {
    if (key.escape) {
      setInsertMode(false)
    }

    if (!insertMode) {
      if (input === 'q') {
        exit()
      }
      if (input === 'i') {
        setInsertMode((mode) => !mode)
      }
    }
  })
}

export default useGlobalCommands
