import React from 'react'
import Vault from '../../../vault/src'

interface Props {
  children: React.ReactNode
  vault: Vault
}
const VaultContext = React.createContext<any>({ vault: null, stats: {} })

export function VaultProvider({ children, vault }: Props) {
  const [stats, setStats] = React.useState<any>({})

  React.useEffect(() => {
    let intervalId

    const initialize = async () => {
      console.log('initializing...')
      await vault.initialize({ setStats })
      console.log('ready...')
      // intervalId = vault.waitForUpdate(setStats)
    }
    initialize()

    return () => {
      console.log('Shutting down the swarm...')
      clearInterval(intervalId)
      vault.shutdown()
    }
  }, [])

  return <VaultContext.Provider value={{ vault, stats }}>{children}</VaultContext.Provider>
}

export const useVault = () => React.useContext(VaultContext)
