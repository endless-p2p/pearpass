import Vault from './Vault'
import RAM from 'random-access-memory'
import { timeout } from 'nonsynchronous'
import createTestnet from '@hyperswarm/testnet'
import { createHash } from 'crypto'
import b4a from 'b4a'

const testTopic = 'topic words to test with'
const topicHex = createHash('sha256').update(testTopic).digest('hex')
const topicBuffer = b4a.from(topicHex, 'hex')

let testnet
let firstVault
let secondVault

beforeAll(async () => {
  testnet = await createTestnet(3)

  firstVault = createVault('first-device-name', testTopic)
  secondVault = createVault('second-device-name', testTopic)
  await firstVault.ready()
  await secondVault.ready()
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

test('Vault takes a name', async () => {
  expect(firstVault.name).toBe('first-device-name')
})

test('Vault finds peers based on the hash of a phrase', async () => {
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

test('Vault creates remote peer object', async () => {
  await timeout(500)
  expect(firstVault._peers.length).toBe(1)
})

test('Vault persists remote peer entry data', async () => {
  const testName = expect.getState().currentTestName

  await secondVault.put(testName, 'value')
  await timeout(500) // wait for data replication

  const peerEntryBee = firstVault._peers[0].entryBee
  const peerEntry = await peerEntryBee.get(testName)

  expect(peerEntry.value).toEqual('value')
})

test('Vault merges remote peer entry data', async () => {
  const testName = expect.getState().currentTestName

  await secondVault.put(testName, 'value')
  await timeout(500) // wait for data replication

  await firstVault.mergePeerEntryBees()

  const mergeEntry = await firstVault.get(testName)
  expect(mergeEntry.value).toEqual('value')
})

test('Vault merges latest same entry key after coming back online', async () => {
  const testName = expect.getState().currentTestName

  // first device creates entry offline
  const firstVaultLocal = createVault('first-device-name', testTopic)
  await firstVaultLocal.put(testName, 'value day 1')

  // second device create entry later
  await secondVault.put(testName, 'value day 2')

  // first device goes online
  await firstVaultLocal.ready()
  await timeout(500) // wait for data replication

  await firstVaultLocal.mergePeerEntryBees()

  // first device receives latest entry (from second device)
  const firstVaultALocalEntry = await firstVaultLocal.get(testName)
  expect(firstVaultALocalEntry.value).toEqual('value day 2')

  // second device still has latest entry
  const secondVaultEntry = await secondVault.get(testName)
  expect(secondVaultEntry.value).toEqual('value day 2')

  await firstVaultLocal.shutdown()
})
