/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 */

import './index.css'
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'

const root = createRoot(document.getElementById('app'))

root.render(<App />)
