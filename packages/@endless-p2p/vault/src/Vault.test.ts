import Vault from './Vault'
import RAM from 'random-access-memory'
import createTestnet from '@hyperswarm/testnet'
import { createHash } from 'crypto'
import b4a from 'b4a'
import { forResult, until } from './util/delay'
import { BeeNode } from './types'

const testTopic = 'topic words to test with'
const topicHex = createHash('sha256').update(testTopic).digest('hex')
//const topicBuffer = b4a.from(topicHex, 'hex')

const firstVaultName = Math.random().toString()
const secondVaultName = Math.random().toString()

let testnet
let firstVault: Vault
let secondVault: Vault

beforeAll(async () => {
  testnet = await createTestnet(3)

  firstVault = createVault(firstVaultName, testTopic)
  secondVault = createVault(secondVaultName, testTopic)
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
  expect(firstVault.name).toBe(firstVaultName)
})

test('Vault finds peers based on the hash of a phrase', async () => {
  expect(firstVault._topicHex).toBe(topicHex)
})

test('Vault persists identity data', async () => {
  const identityBeeName = await firstVault.identityBee.get('name')
  const entryBeeDiscoveryKey = b4a.toString(firstVault.entryBee.core.key, 'hex')
  const identityBeeEntryBeeDiscoveryKey = await firstVault.identityBee.get('entryCoreDiscoveryKey')

  expect(identityBeeName.value).toBe(firstVaultName)
  expect(identityBeeEntryBeeDiscoveryKey.value).toBe(entryBeeDiscoveryKey)
})

test('Vault creates remote peer object', async () => {
  await until(() => firstVault.autobase.inputs.length === 2)

  expect(firstVault._peers.length).toBe(1)
  expect(firstVault.autobase.inputs.length).toBe(2)
})

test('Vault appends entry to autobase', async () => {
  const testName = expect.getState().currentTestName

  await firstVault.put(testName, 'value')
  const testEntry = await firstVault.get(testName)

  expect(testEntry).toEqual({ key: testName, seq: 1, value: 'value' })
})

test('Vault merges remote peer entry data', async () => {
  const testName = expect.getState().currentTestName

  await secondVault.put(testName, 'value')

  const firstVaultEntry = await forNotNullBeeNode(() => firstVault.get(testName))

  expect(firstVaultEntry.value).toEqual('value')
})

const forNotNullBeeNode = (getNodeFunction: () => Promise<BeeNode>) => {
  return forResult<BeeNode>(getNodeFunction, (result) => result !== null)
}
