import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hypercore from 'hypercore'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'
import Vault from './Vault'

class Peer {
  private _vault: Vault
  private _connection
  private _identityBee: Hyperbee
  private _entryBee: Hyperbee
  private _entryCoreDiscoveryKey: string

  constructor({ vault, connection }) {
    this._vault = vault
    this._connection = connection

    if (!this._authorize()) return null

    console.log('* new connection from:', b4a.toString(connection.remotePublicKey, 'hex'), '*')

    this._vault.addPeer(this)
    this._connection.once('close', () => this._vault.removePeer(this))

    this._connection.on('data', (data) => {
      this._processConnectionMessage(data)
    })
  }

  connection = () => this._connection

  sendMessage(message) {
    this._connection.write(JSON.stringify(message))
  }

  get identityBee() {
    return this._identityBee
  }

  get entryBee() {
    return this._entryBee
  }

  private async _processConnectionMessage(data) {
    let message
    try {
      message = JSON.parse(data)
    } catch (error) {
      return
    }

    const { identityCoreDiscoveryKey } = message

    if (!identityCoreDiscoveryKey) return

    const core = await this._vault.initializeCoreFromKey(identityCoreDiscoveryKey)

    this._identityBee = new Hyperbee(core, {
      keyEncoding: 'utf-8',
      valueEncoding: 'utf-8',
    })

    this._identityBee.core.on('append', () => {
      console.log('got identityCore append 1')
      this._vault.onPeerAppend(this)
    })

    this._identityBee.core.on('append', () => {
      console.log('got identityCore append 2')
      this._onIdentityCoreAppend()
    })
    this._onIdentityCoreAppend()
  }

  private async _onIdentityCoreAppend() {
    if (this._entryCoreDiscoveryKey) return

    const entryCoreDiscoveryKey = await this._identityBee.get('entryCoreDiscoveryKey')
    this._vault.onPeerAppend(this)

    if (!entryCoreDiscoveryKey) return

    this._entryCoreDiscoveryKey = entryCoreDiscoveryKey.value

    const core = await this._vault.initializeCoreFromKey(this._entryCoreDiscoveryKey)
    this._entryBee = new Hyperbee(core, {
      keyEncoding: 'utf-8',
      valueEncoding: 'utf-8',
    })

    this._entryBee.core.on('append', () => {
      this._vault.onPeerAppend(this)
    })

    await this._entryBee.core.ready()
    this._vault.onPeerAppend(this)
  }

  private _authorize() {
    // TODO: Probably shouldn't authorize everyone to access our passwords
    return true
  }
}

export default Peer
