import Vault from './Vault'
import RAM from 'random-access-memory'
import { createHash } from 'crypto'
import b4a from 'b4a'

jest.setTimeout(100000)

const test = require('brittle')
const { timeout } = require('nonsynchronous')
const createTestnet = require('@hyperswarm/testnet')
const testTopic = 'topic words to test with'

let testnet
let firstVault
let secondVault

beforeAll(async () => {
  // testnet = await createTestnet(3)
  // firstVault = createVault('first-device-name', testTopic)
  // secondVault = createVault('second-device-name', testTopic)
  // await firstVault.ready()
  // await secondVault.ready()
  // await onConnection(firstVault)
})

afterAll(async () => {
  // await firstVault.shutdown()
  // await secondVault.shutdown()
  // await testnet.destroy()
})

function createVault(name, topic) {
  return new Vault({
    name: name,
    storage: () => new RAM(),
    topic: topic,
    bootstrap: testnet.bootstrap,
  })
}

// function onConnection(vault) {
//   console.log('waiting for remote peer connection...')
//   return new Promise((resolve) => {
//     vault._swarm.on('connection', (c) => resolve(c))
//   })
// }

// test('Vault takes a name', async () => {
//   expect(firstVault.name).toBe('first-device-name')
// })

// test('Vault finds pears based on the hash of a seed phrase (for now)', async () => {
//   const topicHex = createHash('sha256').update(testTopic).digest('hex')
//   expect(firstVault._topicHex).toBe(topicHex)
// })

// test('Vault persists identity data', async () => {
//   const identityBeeName = await firstVault.identityBee.get('name')
//   const entryBeeDiscoveryKey = b4a.toString(firstVault.entryBee.core.key, 'hex')
//   const identityBeeEntryBeeDiscoveryKey = await firstVault.identityBee.get('entryCoreDiscoveryKey')

//   expect(identityBeeName.value).toBe('first-device-name')
//   expect(identityBeeEntryBeeDiscoveryKey.value).toBe(entryBeeDiscoveryKey)
// })

// test('Vault persists entry data', async () => {
//   await firstVault.put('test', 'value')
//   const testEntry = await firstVault.get('test')

//   expect(testEntry).toEqual({ key: 'test', seq: 1, value: 'value' })
// })

test('Vault can receive remote peer connection', async (t) => {
  const testnet = await createTestnet(3, t.teardown)

  firstVault = new Vault({
    name: 'first-device-name',
    storage: () => new RAM(),
    topic: testTopic,
    bootstrap: testnet.bootstrap,
  })

  secondVault = new Vault({
    name: 'second-device-name',
    storage: () => new RAM(),
    topic: testTopic,
    bootstrap: testnet.bootstrap,
  })

  const connected = t.test('connection')
  connected.plan(2)

  firstVault._swarm.on('connection', (conn) => {
    conn.on('error', noop)
    connected.pass('firstVault swarm')
    conn.end()
  })

  secondVault._swarm.on('connection', (conn) => {
    conn.on('error', noop)
    connected.pass('secondVault swarm')
    conn.end()
  })

  await firstVault.ready()
  await secondVault.ready()

  await connected

  await firstVault._swarm.destroy()
  await secondVault._swarm.destroy()

  await timeout(30000)
})

function noop() {}
