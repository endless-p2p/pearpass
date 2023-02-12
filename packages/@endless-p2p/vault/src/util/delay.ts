type Condition = () => boolean
type Resolve = (resolve?: (value: unknown) => void, reject?: (reason?: any) => void) => void

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const waitUntil = async (condition: Condition) => {
  const poll = (resolve: Resolve) => {
    if (condition()) resolve()
    else setTimeout(() => poll(resolve), 50)
  }

  return new Promise(poll)
}
