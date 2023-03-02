import { delay, forResult, until } from './delay'

describe('delay', () => {
  test('awaits the number of milliseconds given', async () => {
    const start = new Date().getTime()
    await delay(5)
    const end = new Date().getTime()

    expect(end - start).toBeGreaterThanOrEqual(5)
    expect(end - start).toBeLessThan(50)
  })

  test('awaits the number of milliseconds given', async () => {
    const start = new Date().getTime()
    await delay(50)
    const end = new Date().getTime()

    expect(end - start).toBeGreaterThanOrEqual(50 - 1)
  })
})

describe('until', () => {
  test('repeatedly runs a function until it returns true', async () => {
    let count = 0
    const counter = () => count++
    const delayInMilliseconds = 5

    const start = new Date().getTime()
    await until(() => counter() > 3, delayInMilliseconds)
    const end = new Date().getTime()

    expect(end - start).toBeGreaterThanOrEqual(15)
    expect(count).toBeGreaterThan(3)
  })
})

describe('forResult', () => {
  test('repeatedly awaits for a promise to resolve to a value that satisfies the condition', async () => {
    let count = 0
    const promise = async () => {
      await delay(1)
      count++
      if (count < 10) return null
      return count
    }
    const condition = (result) => result !== null

    const delayInMilliseconds = 1
    const result = await forResult(promise, condition, delayInMilliseconds)

    expect(count).toBe(10)
  })
})
