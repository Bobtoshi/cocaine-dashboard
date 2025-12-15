# COCAINE Dashboard

A web-based interface for the COCAINE (COCA) cryptocurrency daemon.

## What Is This?

This dashboard provides a browser-based UI for interacting with a running COCAINE daemon. It's a simple frontend that communicates with the daemon's RPC interface - it doesn't run any blockchain logic itself.

## Features

- **Dashboard** - Network status, sync progress, hashrate charts
- **Wallet** - Create/restore wallets, send/receive COCA
- **Mining** - Start/stop CPU mining via daemon
- **Network** - View peer connections
- **Explorer** - Browse blocks

## Requirements

- **Node.js** - Download from https://nodejs.org
- **Running COCAINE daemon** - The daemon must be running and accessible

## Quick Start

```bash
# Install dependencies
npm install

# Start the dashboard
node server.js

# Open in browser
open http://localhost:8080
```

## Configuration

The dashboard connects to these default endpoints:

| Service | Default Address |
|---------|-----------------|
| Daemon RPC | http://127.0.0.1:19081 |
| Wallet RPC | http://127.0.0.1:19083 |

These can be modified in `server.js` if your daemon runs on different ports.

## How It Works

The dashboard is a thin interface layer:

1. **Frontend** (`public/index.html`) - Single-page app with tabs for different functions
2. **Backend** (`server.js`) - Express server that proxies requests to daemon/wallet RPC

All blockchain operations happen through the daemon. The dashboard just provides a user-friendly way to interact with it.

## Running With The Daemon

Make sure your daemon is running first:

```bash
# Start daemon
./cocained --data-dir ~/.cocaine \
  --p2p-bind-port 19080 \
  --rpc-bind-ip 127.0.0.1 \
  --rpc-bind-port 19081

# Then start dashboard in another terminal
cd cocaine-dashboard
node server.js
```

## License

MIT License - Use freely.

## Disclaimer

This is experimental software for a meme coin. Use at your own risk.
