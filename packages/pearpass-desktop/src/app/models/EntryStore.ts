import { withSetPropAction } from './helpers/withSetPropAction'
import { types } from 'mobx-state-tree'
import { EntryModel } from './Entry'
import { v4 as uuid } from 'uuid'

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const EntryStoreModel = types
  .model('EntryStore')
  .props({
    all: types.array(EntryModel),
  })
  .actions(withSetPropAction)
  .actions((store) => ({
    async syncEntities() {
      // Sync with Electron main process and holepunch db here
      const data = [
        {
          guid: uuid(),
          name: 'Amazon',
          password: 'soup-er-secure',
        },
        {
          guid: uuid(),\
          name: 'Coinbase',
          password: '!urKeys=!urCoins',
        },
      ]

      // simulate p2p synced db
      await delay(3000)

      store.setProp('all', data)
    },
  }))
