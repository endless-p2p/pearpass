import { types } from 'mobx-state-tree'
import { withSetPropAction } from './helpers/withSetPropAction'

export const EntryModel = types
  .model('Entry')
  .props({
    guid: types.identifier,
    name: '',
    password: '',
  })
  .actions(withSetPropAction)
