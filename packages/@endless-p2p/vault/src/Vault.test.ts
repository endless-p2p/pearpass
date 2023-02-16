import Vault from './Vault'
import RAM from 'random-access-memory'
import { createHash } from 'crypto'
import b4a from 'b4a'

jest.setTimeout(100000)

const createTestnet = require('@hyperswarm/testnet')
const testTopic = 'topic words to test with'

let testnet
let firstVault
let secondVault

beforeAll(async () => {
  testnet = await createTestnet(3)

  firstVault = createVault('first-device-name', testTopic)
  secondVault = createVault('second-device-name', testTopic)
  await firstVault.ready()
  await secondVault.ready()

  await onConnection(firstVault)
})

afterAll(async () => {
  await firstVault.shutdown()
  await secondVault.shutdown()
  await testnet.destroy()
})

function createVault(name, topic) {
  return new Vault({
    name: name,
    storage: () => new RAM(),
    topic: topic,
    bootstrap: testnet.bootstrap,
  })
}

function onConnection(vault) {
  console.log('waiting for remote peer connection...')
  return new Promise((resolve) => {
    vault._swarm.on('connection', (c) => resolve(c))
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
  expect(firstVault._peers.length).toBeGreaterThanOrEqual(1)
})
