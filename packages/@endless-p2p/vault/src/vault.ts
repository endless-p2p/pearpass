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
  public name: string
  private _stats: Record<string, unknown>
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

    this._stats = {}
    this._log = []
    this._peers = []

    this._corestore = new Corestore(this._storage())

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

      this.addCoreToSwarm(this._identityBee.core)

      this._identityBee.core.on('append', () => {
        this._handleAppend(this._identityBee, this._entryBee, true)
      })
    })

    this._entryBee.core.ready().then(() => {
      this._addLog('entryBee core ready')

      this.addCoreToSwarm(this._entryBee.core)

      this._entryBee.core.update().then(() => {
        console.log('local _entryBee.core.update()')
      })

      this._entryBee.core.on('append', () => {
        console.log('local _entryBee appended')
        this._handleAppend(this._identityBee, this._entryBee, true)
      })

      const discoveryKey = b4a.toString(this._entryBee.core.key, 'hex')
      this._identityBee.put('entryCoreDiscoveryKey', discoveryKey)
      this._identityBee.put('name', this.name)
    })
  }

  async initialize({ setStats }) {
    this._setStats = setStats
  }

  addPeer(peer: Peer) {
    this._peers.push(peer)
    this._corestore.replicate(peer.connection())
    peer.sendMessage({
      identityCoreDiscoveryKey: b4a.toString(this._identityBee.core.key, 'hex'),
    })
  }

  removePeer(peer: Peer) {
    this._peers.splice(this._peers.indexOf(peer), 1)
  }

  async initializeCoreFromKey(key: string) {
    const core = this._corestore.get({ key: b4a.from(key, 'hex') })
    await core.ready()
    this.addCoreToSwarm(core)
    await core.update()

    return core
  }

  addCoreToSwarm(core: Hypercore) {
    this._swarm.join(core.discoveryKey)
  }

  onPeerAppend(peer: Peer) {
    this._handleAppend(peer.identityBee, peer.entryBee)
  }

  async put(key, value) {
    return this._entryBee.put(key?.trim(), value?.trim())
  }

  shutdown() {
    this._swarm.destroy()
  }

  private _storage() {
    return `./temp/${this.name}`
  }

  private async _handleAppend(identityBee, entryBee, local = false) {
    const identity = {}
    if (identityBee) {
      for await (const { key, value } of identityBee.createReadStream()) {
        identity[key] = value
      }
    }

    const entry = {}
    if (entryBee) {
      for await (const { key, value } of entryBee.createReadStream()) {
        entry[key] = value
      }
    }
    console.log({ identity, entry, local })
  }

  private async _beeToKeyValue(bee: Hyperbee) {
    if (!bee) return {}

    const db = {}
    if (bee) {
      for await (const { key, value } of bee.createReadStream()) {
        db[key] = value
      }
    }
    return db
  }

  private _updateStats(stats) {
    this._setStats({})
  }

  private _addLog(message) {
    console.log(message)
    this._log.push(message)
  }
}

export default Vault
