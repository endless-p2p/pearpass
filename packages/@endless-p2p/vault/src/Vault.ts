import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hypercore from 'hypercore'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'
import { createHash, Hash } from 'crypto'
import Peer from './Peer'
import { waitUntil } from './util/delay'

interface Props {
  name: string
  storage: string | (() => unknown)
  topic: string
  bootstrap: () => unknown
}

class Vault {
  public name: string

  readonly corestore: Corestore
  readonly identityBee: Hyperbee
  readonly entryBee: Hyperbee

  readonly _topic: string
  readonly _topicHex: string
  readonly _topicBuffer: Uint8Array | Buffer
  readonly _peers: any[]
  readonly _swarm: Hyperswarm

  private _stats: Record<string, unknown>
  private _log: string[]
  private _identityReady: boolean = false
  private _setStats: React.Dispatch<any>

  constructor({ name, storage, topic, bootstrap }: Props) {
    this.name = name

    this._topic = topic
    this._topicHex = createHash('sha256').update(this._topic).digest('hex')
    this._topicBuffer = b4a.from(this._topicHex, 'hex')

    this._stats = {}
    this._log = []
    this._peers = []

    this.corestore = new Corestore(storage)
    this._swarm = new Hyperswarm({ bootstrap })
    this._swarm.on('connection', (connection) => new Peer({ connection, vault: this }))

    this.identityBee = new Hyperbee(this.corestore.get({ name: 'identity-core' }), {
      keyEncoding: 'utf-8',
      valueEncoding: 'utf-8',
    })

    this.entryBee = new Hyperbee(this.corestore.get({ name: 'entry-core' }), {
      keyEncoding: 'utf-8',
      valueEncoding: 'utf-8',
    })

    this.identityBee.core.ready().then(() => {
      this._addLog('identityBee core ready')

      this.addCoreToSwarm(this.identityBee.core)

      this.identityBee.core.on('append', () => {
        this._handleAppend(this.identityBee, this.entryBee, true)
      })
    })

    this.entryBee.core.ready().then(() => {
      this._addLog('entryBee core ready')

      this.addCoreToSwarm(this.entryBee.core)

      this.entryBee.core.update().then(() => {
        // console.log('local _entryBee.core.update()')
      })

      this.entryBee.core.on('append', () => {
        // console.log('local _entryBee appended')
        this._handleAppend(this.identityBee, this.entryBee, true)
      })

      const discoveryKey = b4a.toString(this.entryBee.core.key, 'hex')
      this.identityBee.put('entryCoreDiscoveryKey', discoveryKey)
      this.identityBee.put('name', this.name)
      this._identityReady = true
    })
  }

  async initialize({ setStats }) {
    this._setStats = setStats
  }

  async ready() {
    const foundPeers = this.corestore.findingPeers()
    this._swarm.join(this._topicBuffer)
    this._swarm.flush().then(() => foundPeers())

    console.log({ firstBootstrap: this._swarm.dht.bootstrapNodes[0] })

    const cores = [...this.corestore.cores.values()]
    const coresReady = cores.map((core) => core.ready)

    await waitUntil(() => this._identityReady)

    return Promise.all([this.ready, ...coresReady])
  }

  addPeer(peer: Peer) {
    this._peers.push(peer)
    this.corestore.replicate(peer.connection())
    peer.sendMessage({
      identityCoreDiscoveryKey: b4a.toString(this.identityBee.core.key, 'hex'),
    })
  }

  removePeer(peer: Peer) {
    this._peers.splice(this._peers.indexOf(peer), 1)
  }

  async initializeCoreFromKey(key: string) {
    const core = this.corestore.get({ key: b4a.from(key, 'hex') })
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

  put(key: string, value: string) {
    return this.entryBee.put(key?.trim(), value?.trim())
  }

  get(key: string) {
    return this.entryBee.get(key)
  }

  shutdown() {
    return this._swarm.destroy()
  }

  async mergePeerEntryBees() {
    if (this._peers.length === 0) return

    const cas = (prev, next) => prev.value !== next.value
    const entryBeeBatch = this.entryBee.batch({ update: false })

    for (const peer of this._peers) {
      for await (const { key, value } of peer.entryBee.createReadStream()) {
        await entryBeeBatch.put(key, value, { cas })
        console.log(`PUT "${key}": "${value}" -> ${this.name}`)
      }
    }

    await entryBeeBatch.flush()
  }

  private async _handleAppend(identityBee, entryBee, local = false) {
    await this._updateStats()
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

  private async _updateStats() {
    const stats = {
      identityBee: await this._beeToKeyValue(this.identityBee),
      entryBee: await this._beeToKeyValue(this.entryBee),
      peers: await Promise.all(
        this._peers.map(async (peer) => ({
          identityBee: await this._beeToKeyValue(peer.identityBee),
          entryBee: await this._beeToKeyValue(peer.entryBee),
        })),
      ),
    }
    if (this._setStats) this._setStats(stats)
  }

  private _addLog(message) {
    this._log.push(message)
  }
}

export default Vault
