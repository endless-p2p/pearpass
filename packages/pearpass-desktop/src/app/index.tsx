import React from 'react'
import AddAccount from './AddAccount'

function App() {
  const accounts = false

  return (
    <div>
      {accounts ? (
        <h1>nope</h1>
      ) : (
        //<EnterPassword />
        <AddAccount />
      )}
    </div>
  )
}

export default App
