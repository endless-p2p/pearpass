import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Autobase from 'autobase'
import Hypercore from 'hypercore'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'
import { createHash, Hash } from 'crypto'
import Peer from './Peer'
import { until } from './util/delay'
import Autobee from './Autobee'
import { DB } from '@endless-p2p/pear-db'
import { BeeNode } from './types'

interface Props {
  name: string
  storage: string | (() => unknown)
  topic: string
  bootstrap?: () => unknown
}

class Vault {
  public name: string

  readonly corestore: Corestore
  readonly beeEncoding: any
  readonly identityBee: Hyperbee
  readonly entryBee: Hyperbee
  readonly autobase: Autobase
  readonly autobee: Autobee
  readonly db: DB
  readonly entries

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

    // TODO: Move all this object init and peer handshake into its own class
    this.corestore = new Corestore(storage)
    this._swarm = new Hyperswarm({ bootstrap })
    this._swarm.on('connection', (connection) => new Peer({ connection, vault: this }))

    this.beeEncoding = { keyEncoding: 'utf-8', valueEncoding: 'utf-8' }
    this.identityBee = new Hyperbee(
      this.corestore.get({ name: 'identity-core'.concat(this.name) }),
      this.beeEncoding,
    )
    this.entryBee = new Hyperbee(
      this.corestore.get({ name: 'entry-core'.concat(this.name) }),
      this.beeEncoding,
    )

    this.autobase = new Autobase({
      inputs: [this.entryBee.core],
      localInput: this.entryBee.core,
    })

    this.autobee = new Autobee(this.autobase)
    this.db = new DB(this.autobee)
    this.entries = this.db.collection('entries')

    this.identityBee.core.ready().then(() => {
      this.addCoreToSwarm(this.identityBee.core)

      this.identityBee.core.on('append', () => {
        this._handleAppend(this.identityBee, this.entryBee, true)
      })
    })

    this.entryBee.core.ready().then(() => {
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

    // console.log({ firstBootstrap: this._swarm.dht.bootstrapNodes[0] })

    const cores = [...this.corestore.cores.values()]
    const coresReady = cores.map((core) => core.ready)

    await until(() => this._identityReady)

    return Promise.all([this.ready, ...coresReady])
  }

  addPeer(peer: Peer) {
    this._peers.push(peer)
    this.corestore.replicate(peer.connection())
    peer.sendMessage({
      identityCoreDiscoveryKey: b4a.toString(this.identityBee.core.key, 'hex'),
    })
  }

  async removePeer(peer: Peer) {
    await this.autobase.removeInput(peer.entryBee.core)
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
    return this.entries.insert({ key, value })
  }

  async get(key: string) {
    let doc: BeeNode
    try {
      doc = await this.entries.findOne({ key })
    } catch (error) {
      // TODO: Think about pear-db design.  Do we really want it to throw every time it doesn't find anything?
      // console.log(error)
      return { seq: -1 } as BeeNode
    }
    return doc
  }

  shutdown() {
    return this._swarm.destroy()
  }

  private async _handleAppend(identityBee, entryBee, local = false) {}

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
}

export default Vault
