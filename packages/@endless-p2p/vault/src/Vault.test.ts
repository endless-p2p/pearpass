import Vault from './Vault'
import RAM from 'random-access-memory'
import createTestnet from '@hyperswarm/testnet'
import { createHash } from 'crypto'
import * as b4a from 'b4a'
import { forResult, until } from './util/delay'
import { BeeNode } from './types'

jest.setTimeout(10000)

const testTopic = 'topic words to test with'
const topicHex = createHash('sha256').update(testTopic).digest('hex')
//const topicBuffer = b4a.from(topicHex, 'hex')

const firstVaultName = Math.random().toString()
const secondVaultName = Math.random().toString()

let testnet
let vaultA: Vault
let vaultB: Vault

beforeEach(async () => {
  testnet = await createTestnet(3)

  vaultA = createVault(firstVaultName, testTopic)
  vaultB = createVault(secondVaultName, testTopic)
  await vaultA.ready()
  await vaultB.ready()
})

afterEach(async () => {
  await vaultA.shutdown()
  await vaultB.shutdown()
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
  expect(vaultA.name).toBe(firstVaultName)
})

test('Vault finds peers based on the hash of a phrase', async () => {
  expect(vaultA._topicHex).toBe(topicHex)
})

test('Vault persists identity data', async () => {
  const identityBeeName = await vaultA.identityBee.get('name')
  const entryBeeDiscoveryKey = b4a.toString(vaultA.entryBee.core.key, 'hex')
  const identityBeeEntryBeeDiscoveryKey = await vaultA.identityBee.get('entryCoreDiscoveryKey')

  expect(identityBeeName.value).toBe(firstVaultName)
  expect(identityBeeEntryBeeDiscoveryKey.value).toBe(entryBeeDiscoveryKey)
})

test('Vault creates remote peer object', async () => {
  await until(() => {
    return vaultA.autobase.inputs.length === 2
  })

  expect(vaultA._peers.length).toBe(1)
  expect(vaultA.autobase.inputs.length).toBe(2)
})

const forEntry = (getNodeFunction: () => Promise<BeeNode>) => {
  return forResult<BeeNode>(getNodeFunction, (result) => result !== null)
}
