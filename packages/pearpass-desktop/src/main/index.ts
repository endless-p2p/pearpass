import Electron from 'electron'
import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'

export async function main(app: Electron.App) {
  const userDataPath = app.getPath('userData')
  const appDataPath = userDataPath + '/pearpass'

  const store = new Corestore(appDataPath)
  const swarm = new Hyperswarm()

  swarm.on('connection', (conn) => store.replicate(conn))

  const core = store.get({ name: 'pearpass-core' })
  const bee = new Hyperbee(core, {
    keyEncoding: 'utf-8',
    valueEncoding: 'utf-8',
  })

  await core.ready()
  swarm.join(core.discoveryKey)

  const discoveryKey = b4a.toString(core.key, 'hex')
  console.log({ discoveryKey })

  await bee.put('test_key', 'test_value')
  const whatIsIt = await bee.get('test_key')
  console.log({ whatIsIt })
}
