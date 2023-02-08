import Vault from './Vault'
import RAM from 'random-access-memory'

const storage = () => new RAM()

test('It takes a name', () => {
  const vault = new Vault({ name: 'device-name', storage } as any)

  expect(vault.name).toBe('device-name')
})
