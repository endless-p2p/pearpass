import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { withSetPropAction } from "./helpers/withSetPropAction"

/**
 * Model description here for TypeScript hints.
 */
export const PasswordModel = types
  .model("Password")
  .props({})
  .actions(withSetPropAction)
  .views((self) => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars
  .actions((self) => ({})) // eslint-disable-line @typescript-eslint/no-unused-vars

export interface Password extends Instance<typeof PasswordModel> {}
export interface PasswordSnapshotOut extends SnapshotOut<typeof PasswordModel> {}
export interface PasswordSnapshotIn extends SnapshotIn<typeof PasswordModel> {}
export const createPasswordDefaultModel = () => types.optional(PasswordModel, {})
