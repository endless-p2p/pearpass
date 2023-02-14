import Vault from './Vault'
import RAM from 'random-access-memory'
import { createHash } from 'crypto'
import b4a from 'b4a'

jest.setTimeout(50000)

const testTopic = 'topic words to test with'
const firstVault = createVault('first-device-name', testTopic)
const secondVault = createVault('second-device-name', testTopic)

beforeAll(async () => {
  await firstVault.ready()
  await secondVault.ready()
})

afterAll(async () => {
  await firstVault.shutdown()
  await secondVault.shutdown()
})

function createVault(name, topic) {
  return new Vault({
    name: name,
    storage: () => new RAM(),
    topic: topic,
  })
}

test('Vault takes a name', async () => {
  expect(firstVault.name).toBe('first-device-name')
})

test('Vault finds pears based on the hash of a seed phrase (for now)', async () => {
  const topicHex = createHash('sha256').update(testTopic).digest('hex')
  expect(firstVault._topicHex).toBe(topicHex)
})

test('Vault persists identity data', async () => {
  const identityBeeName = await firstVault.identityBee.get('name')
  const entryBeeDiscoveryKey = b4a.toString(firstVault.entryBee.core.key, 'hex')
  const identityBeeEntryBeeDiscoveryKey = await firstVault.identityBee.get('entryCoreDiscoveryKey')

  expect(identityBeeName.value).toBe('first-device-name')
  expect(identityBeeEntryBeeDiscoveryKey.value).toBe(entryBeeDiscoveryKey)
})

test('Vault persists entry data', async () => {
  await firstVault.put('test', 'value')
  const testEntry = await firstVault.get('test')

  expect(testEntry).toEqual({ key: 'test', seq: 1, value: 'value' })
})

test('Vault can receive remote peer connection', () => {
  function peerLengthIsOne() {
    if (firstVault._peers.length != 1) {
      setTimeout(peerLengthIsOne, 50)
      return
    }

    firstVault._peers.length
  }

  return expect(Promise.resolve(peerLengthIsOne())).resolves.toBe(1)
  //expect(firstVault._peers.length).toBeGreaterThanOrEqual(1)
})

// test('Vault can send data to remote peer', () => {})

// test('Vault persists remote peer data', () => {})
