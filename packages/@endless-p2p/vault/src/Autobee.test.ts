import Autobee from './Autobee'
import Hypercore from 'hypercore'
import Autobase from 'autobase'
import RAM from 'random-access-memory'
import { DB } from '@endless-p2p/pear-db'

let dbA
let dbB
let autobaseA: Autobase
let autobaseB: Autobase

function getAutobees() {
  const coreA = new Hypercore(RAM)
  const coreB = new Hypercore(RAM)

  autobaseA = new Autobase({
    inputs: [coreA, coreB],
    localInput: coreA,
  })
  autobaseB = new Autobase({
    inputs: [coreA, coreB],
    localInput: coreB,
  })

  return [new Autobee(autobaseA), new Autobee(autobaseB)]
}

beforeEach(() => {
  const [autobeeA, autobeeB] = getAutobees()
  dbA = new DB(autobeeA)
  dbB = new DB(autobeeB)
})

test('Create a document in a collection', async () => {
  const collection = dbA.collection('entries')
  const doc = await collection.insert({ user: 'orange', pass: 'pill' })
  const foundDoc = await collection.findOne({ _id: doc._id })

  expect(collection.name).toBe('entries')
  expect(doc._id).toBeDefined() // something like: "63f4284c26bb70f8f9c40120"
  expect(foundDoc).toStrictEqual({ _id: doc._id, user: 'orange', pass: 'pill' })
})

test('Create multiple documents and update', async () => {
  const collectionA = dbA.collection('entries')
  const collectionB = dbB.collection('entries')
  const orange = await collectionA.insert({ user: 'orange', pass: 'pill' })
  const red = await collectionA.insert({ user: 'red', pass: 'dawn' })
  const blue = await collectionA.insert({ user: 'blue', pass: 'gill' })
  const black = await collectionA.insert({ flower: 'black', type: 'lotus' })

  const white = await collectionB.insert({ flower: 'white', type: 'lilly' })
  await collectionB.update({ _id: red._id }, { pass: 'D@wn' })
  const owl = await collectionB.insert({ owl: 'spotted' })

  for (const collection of [collectionA, collectionB]) {
    const foundOrange = await collection.findOne({ _id: orange._id })
    const foundRed = await collection.findOne({ user: 'red' })
    const foundBlue = await collection.findOne({ pass: 'gill' })
    const foundBlack = await collection.findOne({ _id: black._id })

    expect(foundOrange).toStrictEqual({ _id: foundOrange._id, user: 'orange', pass: 'pill' })
    expect(foundRed).toStrictEqual({ _id: foundRed._id, user: 'red', pass: 'D@wn' })
    expect(foundBlue).toStrictEqual({ _id: foundBlue._id, user: 'blue', pass: 'gill' })
    expect(foundBlack).toStrictEqual({ _id: foundBlack._id, flower: 'black', type: 'lotus' })
  }
})

test('Create a document in A, delete in B', async () => {
  const collectionA = dbA.collection('entries')
  const collectionB = dbB.collection('entries')
  const doc = await collectionA.insert({ example: 'Hello World!' })
  const deletedDoc = await collectionB.delete({ _id: doc._id })

  expect(deletedDoc).toStrictEqual({ nDeleted: 1 })
})

afterEach(async () => {
  await dbA.close()
  await dbB.close()
})
