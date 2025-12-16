# COCAINE Dashboard

```
 ██████╗ ██████╗  ██████╗ █████╗ ██╗███╗   ██╗███████╗
██╔════╝██╔═══██╗██╔════╝██╔══██╗██║████╗  ██║██╔════╝
██║     ██║   ██║██║     ███████║██║██╔██╗ ██║█████╗
██║     ██║   ██║██║     ██╔══██║██║██║╚██╗██║██╔══╝
╚██████╗╚██████╔╝╚██████╗██║  ██║██║██║ ╚████║███████╗
 ╚═════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝
```

Web-based dashboard for [COCAINE](https://github.com/Bobtoshi/cocaine) cryptocurrency with wallet management, mining controls, and block explorer.

## Features

- Real-time network stats and sync status
- Wallet creation, restore, send/receive
- Mining start/stop with hashrate monitoring
- Block explorer with transaction details
- No scrolling, tabbed interface

## Requirements

- [Node.js](https://nodejs.org/) 16+
- COCAINE daemon running (`cocained`)
- COCAINE wallet RPC (optional, for wallet features)

## Quick Start

### 1. Download the Core Binaries

Get the latest release from [github.com/Bobtoshi/cocaine/releases](https://github.com/Bobtoshi/cocaine/releases):

| Platform | Download |
|----------|----------|
| **Linux x64** | [cocaine-linux-x64.tar.gz](https://github.com/Bobtoshi/cocaine/releases/latest/download/cocaine-linux-x64.tar.gz) |
| **macOS** | [cocaine-macos.tar.gz](https://github.com/Bobtoshi/cocaine/releases/latest/download/cocaine-macos.tar.gz) |
| **Windows** | [cocaine-windows-x64.zip](https://github.com/Bobtoshi/cocaine/releases/latest/download/cocaine-windows-x64.zip) |

### 2. Start the Daemon

```bash
./cocained --data-dir ~/.cocaine --p2p-bind-port 19080 --rpc-bind-ip 127.0.0.1 --rpc-bind-port 19081
```

### 3. Install and Run Dashboard

```bash
git clone https://github.com/Bobtoshi/cocaine-dashboard.git
cd cocaine-dashboard
npm install
npm start
```

Open **http://localhost:8080** in your browser.

## Configuration

The dashboard connects to:
- **Daemon RPC**: `http://127.0.0.1:19081`
- **Wallet RPC**: `http://127.0.0.1:19083` (started automatically if wallet binaries available)

Place binaries in parent directory or set paths via environment:
```bash
COCAINE_BIN_DIR=/path/to/binaries npm start
```

## Tabs

| Tab | Description |
|-----|-------------|
| **Overview** | Network status, height, peer count, sync progress |
| **Wallet** | Create/restore wallets, view balance, send/receive |
| **Mining** | Start/stop mining, hashrate graph, statistics |
| **Network** | Peer connections, network hashrate |
| **Explorer** | Browse blocks and transactions |

## Network Info

| Property | Value |
|----------|-------|
| **Ticker** | COCA |
| **Algorithm** | RandomX (CPU mining) |
| **Block Time** | ~2 minutes |
| **P2P Port** | 19080 |
| **RPC Port** | 19081 |
| **Seed Node** | `138.68.128.104:19080` |

## Troubleshooting

**Dashboard won't connect?**
- Ensure daemon is running: `curl http://127.0.0.1:19081/get_info`
- Check firewall allows localhost connections

**Wallet features disabled?**
- Wallet RPC binary (`cocaine-wallet-rpc`) must be in parent directory
- Or set `COCAINE_BIN_DIR` environment variable

**Mining not starting?**
- Must be fully synced first
- Need a valid wallet address

## License

BSD-3-Clause

## Links

- **Core Repository**: [github.com/Bobtoshi/cocaine](https://github.com/Bobtoshi/cocaine)
- **Releases**: [Download Binaries](https://github.com/Bobtoshi/cocaine/releases)
