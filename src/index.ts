#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createServer, VERSION } from './server.js'

if (process.argv.includes('--version')) { console.log(VERSION); process.exit(0) }
const server = createServer()
await server.connect(new StdioServerTransport())
console.error(`cn-dev-mcp v${VERSION} 已启动（stdio）`)
