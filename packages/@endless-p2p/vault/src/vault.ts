import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hypercore from 'hypercore'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'
import Peer from './Peer'

interface Props {
  name: string
  discoveryKey: string
}

class Vault {
  public db: Record<string, unknown>
  public name: string
  private _log: string[]
  private _corestore: Corestore
  private _identityBee: Hyperbee
  private _entryBee: Hyperbee
  private _topicBuffer: Uint8Array | Buffer
  private _topicHex: string
  private _swarm: Hyperswarm
  private _peers: any[]
  private _setStats: React.Dispatch<any>

  constructor({
    name,
    topic = '5f6101b77326a81705d662ad445f8ea6146ade0a553c31ef8d4d51fff7ca891c',
  }) {
    this.name = name

    this._topicBuffer = b4a.from(topic, 'hex') //generate a topic using crypto.randomBytes(32)
    this._topicHex = topic

    this.db = {}
    this._log = []
    this._peers = []

    this._corestore = new Corestore(this.storage())

    this._swarm = new Hyperswarm()
    this._swarm.on('connection', (connection) => new Peer({ connection, vault: this }))

    const foundPeers = this._corestore.findingPeers()
    this._swarm.join(this._topicBuffer)
    this._swarm.flush().then(() => foundPeers())

    this._identityBee = new Hyperbee(this._corestore.get({ name: 'identity-core' }), {
      keyEncoding: 'utf-8',
      valueEncoding: 'utf-8',
    })

    this._entryBee = new Hyperbee(this._corestore.get({ name: 'entry-core' }), {
      keyEncoding: 'utf-8',
      valueEncoding: 'utf-8',
    })

    this._identityBee.core.ready().then(() => {
      this._addLog('identityBee core ready')
      this._swarm.join(this._identityBee.core.discoveryKey)

      this._identityBee.core.on('append', () => {
        this._handleAppend(this._identityBee, this._entryBee)
      })
    })

    this._entryBee.core.ready().then(() => {
      this._addLog('entryBee core ready')
      this._swarm.join(this._entryBee.core.discoveryKey)

      this._entryBee.core.on('append', () => {
        this._handleAppend(this._identityBee, this._entryBee)
      })
    })
  }

  // const db = new Hyperbee(new Hypercore('./db'))
  // const swarm = new Hyperswarm()

  // swarm.on('connection', c => db.feed.replicate(c))

  // db.feed.ready().then(function () {
  //   console.log('Feed key: ' + db.feed.key.toString('hex'))
  //   swarm.join(db.feed.discoveryKey)
  // })

  async initialize({ setStats }) {
    this._setStats = setStats
  }

  addPeer(peer: Peer) {
    this._peers.push(peer)
    this._corestore.replicate(peer.connection())
    peer.sendMessage({
      identityCoreDiscoveryKey: b4a.toString(this._identityBee.core.discoveryKey, 'hex'),
    })
  }

  removePeer(peer: Peer) {
    this._peers.splice(this._peers.indexOf(peer), 1)
  }

  getCoreFromKey(key) {
    return this._corestore.get({
      key: b4a.from(key, 'hex'),
    })
  }

  addCoreToSwarm(core) {
    this._swarm.join(core.discoveryKey)
  }

  async put(key, value) {
    return this._entryBee.put(key?.trim(), value?.trim())
  }

  shutdown() {
    this._swarm.destroy()
  }

  private storage() {
    return `./temp/${this.name}`
  }

  private async _handleAppend(identityBee, entryBee, local = false) {
    const identity = {}
    for await (const { key, value } of identityBee.createReadStream()) {
      identity[key] = value
    }
    const entry = {}
    for await (const { key, value } of entryBee.createReadStream()) {
      entry[key] = value
    }
    console.log({ identity, entry })

    // this._setStats((stats) => {
    //   stats[name] = namedDb
    //   stats.db = this.db
    //   return stats
    // })
  }

  private _addLog(message) {
    console.log(message)
    this._log.push(message)
  }
}

export default Vault
