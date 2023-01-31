import { EntryModel } from './Entry'

test('can be created', () => {
  const instance = EntryModel.create({
    guid: 'f91f2ea0-378a-4a90-9a83-d438a0cc32f6',
    name: 'Amazon',
    password: 'p@ssword',
  })

  expect(instance).toBeTruthy()
  expect(instance.password).toBe('p@ssword')
})
