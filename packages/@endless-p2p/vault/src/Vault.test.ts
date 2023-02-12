import Vault from './Vault'
import RAM from 'random-access-memory'
import { randomBytes } from 'hypercore-crypto'
import { createHash } from 'crypto'
import b4a from 'b4a'

const vault = new Vault({
  name: 'device-name',
  storage: () => new RAM(),
  topic: 'topic words to test with',
})

beforeAll(async () => {
  await vault.ready()
})

afterAll(async () => {
  await vault.shutdown()
})

test('Vault takes a name', async () => {
  expect(vault.name).toBe('device-name')
})

test('Vault finds pears based on the hash of a seed phrase (for now)', async () => {
  expect(vault._topicHex).toBe('3a25bb73f25e3568ae3d03efa4a0f16b20ced144d21b81867b9d168e8b399043')
})

test('Vault persists identity data', async () => {
  const identityBeeName = await vault.identityBee.get('name')
  const entryBeeDiscoveryKey = b4a.toString(vault.entryBee.core.key, 'hex')
  const identityBeeEntryBeeDiscoveryKey = await vault.identityBee.get('entryCoreDiscoveryKey')

  expect(identityBeeName.value).toBe('device-name')
  expect(identityBeeEntryBeeDiscoveryKey.value).toBe(entryBeeDiscoveryKey)
})

test('Vault persists entry data', async () => {
  await vault.put('test', 'value')
  const testEntry = await vault.get('test')

  expect(testEntry).toEqual({ key: 'test', seq: 1, value: 'value' })
})

// test('Vault can receive remote peer connection', () => {})

// test('Vault can send data to remote peer', () => {})

// test('Vault persists remote peer data', () => {})
