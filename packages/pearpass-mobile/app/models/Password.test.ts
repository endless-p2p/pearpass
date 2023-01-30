import { PasswordModel } from "./Password"

test("can be created", () => {
  const instance = PasswordModel.create({})

  expect(instance).toBeTruthy()
})
