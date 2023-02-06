import Hyperswarm from 'hyperswarm'
import Corestore from 'corestore'
import Hypercore from 'hypercore'
import Hyperbee from 'hyperbee'
import b4a from 'b4a'
import Vault from './vault'

class Peer {
  private _vault: Vault
  private _connection
  private _identityBee: Hyperbee
  private _entryBee: Hyperbee

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

  private async _processConnectionMessage(data) {
    let message
    try {
      message = JSON.parse(data)
    } catch (error) {
      console.log({ error })
      return
    }

    const { identityCoreDiscoveryKey } = message

    if (!identityCoreDiscoveryKey) return

    const core = this._vault.getCoreFromKey(identityCoreDiscoveryKey)
    await core.ready()

    this._vault.addCoreToSwarm(core)
    await core.update()

    this._identityBee = new Hyperbee(core, {
      keyEncoding: 'utf-8',
      valueEncoding: 'utf-8',
    })

    // this._entryBee.core.on('append', () => {
    //   this._processReadStream('remote', remoteHyperbee.createReadStream())
    // })
  }

  private _authorize() {
    // TODO: Probably shouldn't authorize everyone to access our passwords
    return true
  }
}

export default Peer
