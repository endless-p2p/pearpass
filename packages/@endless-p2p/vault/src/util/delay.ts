type Condition = () => boolean
type Resolve = (resolve?: (value: unknown) => void, reject?: (reason?: any) => void) => void

/**
 * Simply awaits the number of milliseconds
 *
 * @param ms Milliseconds to await
 * @returns undefined
 */
export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Executes a given function (the condition) over and over until the result
 * returns truthy
 *
 * @param condition
 * @param delayInMilliseconds
 * @returns
 */
export const until = async (condition: Condition, delayInMilliseconds: number = 50) => {
  const poll = (resolve: Resolve) => {
    if (condition()) resolve()
    else setTimeout(() => poll(resolve), delayInMilliseconds)
  }

  return new Promise(poll)
}

/**
 * Preforms an await on a function (that returns a promise) over and over until
 * a certain condition is met.  This condition (the second argument) is expressed as a function
 * that takes the result from the awaited-on promise.  When this condition function returns true,
 * the polling stops and that result is finally returned.
 *
 * This is useful when you want to asynchronously check something over and over in a test
 * until you get what you want. For example, you may need to poll for a database entry to eventually
 * be consistent.
 *
 * @param promise Any function that can be awaited on.  example: db.get({ key }))
 * @param condition A function that evaluates the result of the above promise and returns boolean.
 * @param delayInMilliseconds How often to poll the promise
 * @returns The result that finally causes the condition to return truthy
 */
export const forResult = async <T>(
  promise: () => Promise<T>,
  condition: (result: T) => boolean,
  delayInMilliseconds: number = 50,
) => {
  let result: undefined | null | T = await promise()

  while (!condition(result)) {
    await delay(delayInMilliseconds)
    result = await promise()
  }

  return result
}
