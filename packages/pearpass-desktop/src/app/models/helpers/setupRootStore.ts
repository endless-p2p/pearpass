/**
 * This file is where we do "rehydration" of your RootStore from AsyncStorage.
 * This lets you persist your state between app launches.
 *
 * Navigation state persistence is handled in navigationUtilities.tsx.
 *
 * Note that Fast Refresh doesn't play well with this file, so if you edit this,
 * do a full refresh of your app instead.
 *
 * @refresh reset
 */
import { applySnapshot, IDisposer, onSnapshot } from 'mobx-state-tree'
import type { RootStore } from '../RootStore'

/**
 * Setup the root state.
 */
let _disposer: IDisposer
export async function setupRootStore(rootStore: RootStore) {
  let restoredState

  try {
    // Here is where we will load the last known state from IPC
    // or maybe local storage?
    restoredState = {}
    applySnapshot(rootStore, restoredState)
  } catch (e) {
    console.error(e.message, null)
  }

  // stop tracking state changes if we've already setup
  if (_disposer) _disposer()

  // track changes & save to db
  _disposer = onSnapshot(rootStore, (snapshot) => {
    // TODO: save state via IPC
    console.log(snapshot)
  })

  const unsubscribe = () => {
    _disposer()
    _disposer = undefined
  }

  return { rootStore, restoredState, unsubscribe }
}
