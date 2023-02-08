import Vault from './Vault'

test('It takes a name', () => {
  const vault = new Vault({ name: 'device-name' })

  expect(vault.name).toBe('device-name')
})
