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
  await secondVault.put('to first vault', 'value')
  await timeout(500) // wait for data replication

  const peerEntryBee = firstVault._peers[0].entryBee
  const peerEntry = await peerEntryBee.get('to first vault')

  expect(peerEntry.value).toEqual('value')
})

test('Vault merges remote peer entry data', async () => {
  await secondVault.put('merge me', 'value')
  await timeout(500) // wait for data replication

  await firstVault.mergePeerEntryBees()

  const mergeEntry = await firstVault.get('merge me')
  expect(mergeEntry.value).toEqual('value')
})
