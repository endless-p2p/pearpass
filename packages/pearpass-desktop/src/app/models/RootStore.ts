import { Instance, SnapshotOut, types } from 'mobx-state-tree'
import { EntryStoreModel } from './EntryStore'

/**
 * A RootStore model.
 */
export const RootStoreModel = types.model('RootStore').props({
  entryStore: types.optional(EntryStoreModel, {}),
})

/**
 * The RootStore instance.
 */
export interface RootStore extends Instance<typeof RootStoreModel> {}

/**
 * The data of a RootStore.
 */
export interface RootStoreSnapshot extends SnapshotOut<typeof RootStoreModel> {}
