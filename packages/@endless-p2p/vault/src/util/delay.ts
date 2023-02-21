type Condition = () => boolean
type Resolve = (resolve?: (value: unknown) => void, reject?: (reason?: any) => void) => void

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const until = async (condition: Condition, delayInMilliseconds: number = 50) => {
  const poll = (resolve: Resolve) => {
    if (condition()) resolve()
    else setTimeout(() => poll(resolve), delayInMilliseconds)
  }

  return new Promise(poll)
}

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
