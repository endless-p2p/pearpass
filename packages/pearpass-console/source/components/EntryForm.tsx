import React from 'react'
import { Text, Box, Spacer } from 'ink'
import TextInput from 'ink-text-input'
import { useVault } from '../hooks/useVault'

const EntryForm = ({ insertMode, setInsertMode }) => {
  const [value, setValue] = React.useState('')
  const { vault } = useVault()

  if (!insertMode) return null

  const handleSubmit = async (submitValue) => {
    const [key, value] = submitValue.split(': ')
    setValue('submitting...')
    await vault.put(key, value)
    setValue('')
    setInsertMode(false)
  }

  return (
    <Box borderStyle="bold" width="50%" padding={1}>
      <TextInput value={value} onChange={setValue} onSubmit={handleSubmit} />
    </Box>
  )
}

export default EntryForm
