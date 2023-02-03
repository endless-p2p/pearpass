import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hypercore from 'hypercore'
import Hyperbee from 'hyperbee'
import goodbye from 'graceful-goodbye'
import b4a from 'b4a'

interface Props {
  name: string
  discoveryKey: string
}

class Vault {
  public db: Record<string, unknown>
  public name: string
  public log: string[]
  private _corestore: Hyperbee
  private _swarm: Hyperswarm
  private _localCore: Hypercore
  private _localBee: Hyperbee
  private _remoteCores: Hypercore[]
  private _remoteBees: Hyperbee[]

  constructor({ name, discoveryKey }: Props) {
    this.name = name

    this.db = {}
    this.log = []

    this._remoteCores = []
    this._remoteBees = []

    // Corestore is a Hypercore factory
    // create a corestore instance with the given location
    this._corestore = new Corestore(this.storage())

    // Hyperswarm allows you to find and connect to peers announcing a common 'topic'
    this._swarm = new Hyperswarm()
    goodbye(() => this._swarm.destroy())

    // Emitted whenever the swarm connects to a new peer
    // Replication of the corestore instance on connection with other peers
    this._swarm.on('connection', (conn) => {
      this.log.push('connection!')

      const name = b4a.toString(conn.remotePublicKey, 'hex')
      this.log.push('* got a connection from:', name, '*')
      return this._corestore.replicate(conn)
    })

    // Hypercore is a secure, distributed append-only log built for sharing large datasets and streams of real-time data.
    // Loads a Hypercore, either by name (if the name option is provided),
    // or from the provided key (if the first argument is a Buffer, or if the key option is set).
    this._localCore = this._corestore.get({ name })
    if (discoveryKey) {
      this._remoteCores[0] = this._corestore.get({ key: b4a.from(discoveryKey, 'hex') })
    }
  }

  public async initialize() {
    await this._localCore.ready()
    this.log.push('localCore ready')
    if (this._remoteCores[0]) {
      await this._remoteCores[0].ready()
      this.log.push('remoteCore ready')
    }

    // flush() will wait until *all* discoverable peers have been connected to
    // It might take a while, so don't await it
    // Instead, use core.findingPeers() to mark when the discovery process is completed
    const foundPeers = this._corestore.findingPeers()
    this._swarm.join(this._localCore.discoveryKey)
    if (this._remoteCores[0]) this._swarm.join(this._remoteCores[0].discoveryKey)
    this._swarm.flush().then(() => foundPeers())

    // Wait for the core to try and find a signed update to its length
    // Does not download any data from peers except for proof of the new core length
    await this._localCore.update()
    this.log.push('localCore updated')

    if (this._remoteCores[0]) {
      await this._remoteCores[0].update()
      this.log.push('remoteCore updated')
    }

    // console.log({
    //   // core: this.localCore,
    //   // coreKey: this.localCore.key,
    //   // coreKeyPair: this.localCore.keyPair,
    //   // coreDiscoveryKey: this.localCore.discoveryKey,
    //   localCoreHexDiscoveryKey: b4a.toString(this.localCore.key, 'hex'),
    //   remoteCoreHexDiscoveryKey: b4a.toString(this.remoteCores[0].key, 'hex'),
    // })

    // Hyperbee is an append-only B-tree based on Hypercore
    this._localBee = new Hyperbee(this._localCore, {
      keyEncoding: 'utf-8',
      valueEncoding: 'utf-8',
    })

    if (this._remoteCores[0]) {
      this._remoteBees[0] = new Hyperbee(this._remoteCores[0], {
        keyEncoding: 'utf-8',
        valueEncoding: 'utf-8',
      })
    }
  }

  private storage() {
    return `./temp/${this.name}`
  }

  public waitForUpdate(setStats) {
    let localBeeVersion = 0
    let remoteBeeVersion = 0
    const intervalId = setInterval(async () => {
      if (
        this._localBee.version > localBeeVersion ||
        this._remoteBees[0].version > remoteBeeVersion
      ) {
        localBeeVersion = this._localBee.version
        remoteBeeVersion = this._remoteBees[0].version

        await this.logReadStream()

        setStats({ localBeeVersion, remoteBeeVersion, db: this.db })
      }
    }, 500)

    return intervalId
  }

  private async logReadStream() {
    for await (const { key, value } of this._remoteBees[0].createReadStream()) {
      this.db[key] = value
    }
    for await (const { key, value } of this._localBee.createReadStream()) {
      this.db[key] = value
    }
  }

  public async put(key, value) {
    return this._localBee.put(key?.trim(), value?.trim())
  }

  public shutdown() {
    this._swarm.destroy()
  }
}

export default Vault
