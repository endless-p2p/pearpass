import Corestore from 'corestore'
import Hyperswarm from 'hyperswarm'

const userDataPath = app.getPath('userData')
const storage = userDataPath + '/pearpass-storage'

const store = new Corestore(storage)
const swarm = new Hyperswarm()


console.log('asdf asdf')