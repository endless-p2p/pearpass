import Vault from './Vault'
import RAM from 'random-access-memory'
import b4a from 'b4a'

const storage = () => new RAM()
const vault = new Vault({ name: 'device-name', storage })

test('Vault takes a name', () => {
  //expect(vault._entryBee.core.ready()).resolves.toBeTruthy()
  expect(vault.name).toBe('device-name')
})

// test('Vault persists identity data', async () => {
//   expect(vault._entryBee.core.ready()).toBeTruthy()

//   const identityBeeName = await vault._identityBee.get('name')
//   const entryBeeDiscoveryKey = b4a.toString(vault._entryBee.core.key, 'hex')
//   const identityBeeEntryBeeDiscoveryKey = await vault._identityBee.get('entryCoreDiscoveryKey')

//   expect(identityBeeName).toBe('device-name')
//   expect(identityBeeEntryBeeDiscoveryKey).toBe(entryBeeDiscoveryKey)
// })

// test('Vault persists entry data', () => {})

// test('Vault can receive remote peer connection', () => {})

// test('Vault can send data to remote peer', () => {})

// test('Vault persists remote peer data', () => {})
