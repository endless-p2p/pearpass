#!/usr/bin/env node
import React from 'react'
import { render } from 'ink'
import meow from 'meow'
import App from './App'
import Vault from '../../vault/src'
import { VaultProvider } from './hooks/useVault'

const cli = meow(
  `
	Usage
	  $ pearpass-console

	Options
		--name  Your name

	Examples
	  $ pearpass-console --name=Jane
	  Hello, Jane
`,
  {
    flags: {
      name: {
        type: 'string',
      },
      topic: {
        type: 'string',
      },
    },
  },
)

const {
  flags: { name, topic },
} = cli

const vault = new Vault({ name, topic })

const { waitUntilExit } = render(
  <VaultProvider vault={vault}>
    <App name={name} />
  </VaultProvider>,
)
