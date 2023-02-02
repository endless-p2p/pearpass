#!/usr/bin/env node
import React from 'react'
import { render } from 'ink'
import meow from 'meow'
import App from './ui'

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
		},
	},
)

const { waitUntilExit } = render(<App name={cli.flags.name} />)

const endless = async () => {
	setInterval(async () => {
		await waitUntilExit()
	}, 500)
}

endless()
