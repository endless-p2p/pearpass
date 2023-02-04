import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hypercore from 'hypercore'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'

interface Props {
  name: string
  discoveryKey: string
}

class Vault {
  public db: Record<string, unknown>
  public name: string
  public log: string[]
  private _topicBuffer: Uint8Array | Buffer
  private _topicHex: string
  private _corestore: Hyperbee
  private _swarm: Hyperswarm
  private _localCore: Hypercore
  private _localBee: Hyperbee
  private _remoteConnections: any[]
  private _remoteCores: Hypercore[]
  private _remoteBees: Hyperbee[]
  private _setStats: React.Dispatch<any>

  constructor({
    name,
    topic = '5f6101b77326a81705d662ad445f8ea6146ade0a553c31ef8d4d51fff7ca891c',
  }) {
    this.name = name

    this._topicBuffer = b4a.from(topic, 'hex') //generate a topic using crypto.randomBytes(32)
    this._topicHex = topic

    this.db = {}
    this.log = []

    this._remoteConnections = []
    this._remoteCores = []
    this._remoteBees = []

    this._corestore = new Corestore(this.storage())

    this._swarm = new Hyperswarm()
    this._swarm.on('connection', (connection) => {
      this._processNewConnection(connection)
      return this._corestore.replicate(connection)
    })

    this._localCore = this._corestore.get({ name })
  }

  public async initialize({ setStats }) {
    this._setStats = setStats

    await this._localCore.ready()
    this.log.push('localCore ready')

    const foundPeers = this._corestore.findingPeers()
    this._swarm.join(this._topicBuffer)
    this._swarm.flush().then(() => foundPeers())

    this._localBee = new Hyperbee(this._localCore, {
      keyEncoding: 'utf-8',
      valueEncoding: 'utf-8',
    })

    this._localCore.on('append', () => {
      this._processReadStream(this.name, this._localBee.createReadStream())
    })
  }

  private storage() {
    return `./temp/${this.name}`
  }

  private async _processReadStream(name, stream) {
    const namedDb = {}
    for await (const { key, value } of stream) {
      this.db[key] = value
      namedDb[key] = value
    }

    this._setStats((stats) => {
      stats[name] = namedDb
      stats.db = this.db
      return stats
    })
  }

  private _processNewConnection(conn) {
    console.log('* new connection from:', b4a.toString(conn.remotePublicKey, 'hex'), '*')

    this._remoteConnections.push(conn)
    conn.once('close', () =>
      this._remoteConnections.splice(this._remoteConnections.indexOf(conn), 1),
    )
    conn.on('data', (data) => {
      this._processConnectionMessage(data)
    })

    // send local hypercore discovery key
    conn.write(JSON.stringify({ remoteHypercoreKey: b4a.toString(this._localCore.key, 'hex') }))
  }

  private async _processConnectionMessage(data) {
    // TODO: authorize peer here

    if (!this._isJsonString(data)) return
    let json = JSON.parse(data)
    if (!json.remoteHypercoreKey) return

    let remoteHypercore = this._corestore.get({ key: b4a.from(json.remoteHypercoreKey, 'hex') })
    await remoteHypercore.ready()

    this._swarm.join(remoteHypercore.discoveryKey)
    await remoteHypercore.update()

    const remoteHyperbee = new Hyperbee(remoteHypercore, {
      keyEncoding: 'utf-8',
      valueEncoding: 'utf-8',
    })

    this._remoteCores.push(remoteHypercore)
    this._remoteBees.push(remoteHyperbee)

    remoteHypercore.on('append', () => {
      this._processReadStream('remote', remoteHyperbee.createReadStream())
    })
  }

  private _isJsonString(str) {
    try {
      JSON.parse(str)
    } catch (e) {
      return false
    }
    return true
  }

  public async put(key, value) {
    return this._localBee.put(key?.trim(), value?.trim())
  }

  public shutdown() {
    this._swarm.destroy()
  }
}

export default Vault
