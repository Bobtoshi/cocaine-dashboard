const express = require('express');
const fetch = require('node-fetch');
const open = require('open');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const PORT = 8080;
const DAEMON_RPC = 'http://127.0.0.1:19081/json_rpc';
const DAEMON_HTTP = 'http://127.0.0.1:19081';
const WALLET_RPC = 'http://127.0.0.1:19083/json_rpc';

// Cross-platform wallet directory in user's home
const WALLET_DIR = path.join(os.homedir(), '.cocaine', 'wallets');

// Ensure wallet directory exists
if (!fs.existsSync(WALLET_DIR)) {
    fs.mkdirSync(WALLET_DIR, { recursive: true });
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper: Call wallet RPC
async function walletRpc(method, params = {}) {
    const response = await fetch(WALLET_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: '0',
            method: method,
            params: params
        })
    });
    return response.json();
}

// Helper: Call daemon RPC
async function daemonRpc(method, params = {}) {
    const response = await fetch(DAEMON_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: '0',
            method: method,
            params: params
        })
    });
    return response.json();
}

// ==================== DAEMON ENDPOINTS ====================

// Get daemon info
app.get('/api/info', async (req, res) => {
    try {
        const data = await daemonRpc('get_info');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message, daemon_running: false });
    }
});

// Get daemon status (direct to daemon)
app.get('/api/daemon/status', async (req, res) => {
    try {
        const response = await fetch(`${DAEMON_HTTP}/get_info`);
        const data = await response.json();
        res.json({
            running: true,
            height: data.height,
            synchronized: data.synchronized,
            connections: (data.outgoing_connections_count || 0) + (data.incoming_connections_count || 0)
        });
    } catch (error) {
        res.json({ running: false, error: error.message });
    }
});

// Get last block header
app.get('/api/last_block', async (req, res) => {
    try {
        const data = await daemonRpc('get_last_block_header');
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get block by height
app.get('/api/block/:height', async (req, res) => {
    try {
        const data = await daemonRpc('get_block_header_by_height', {
            height: parseInt(req.params.height)
        });
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==================== MINING ENDPOINTS ====================

// Mining status (via daemon RPC)
app.get('/api/mining_status', async (req, res) => {
    try {
        const response = await fetch(`${DAEMON_HTTP}/mining_status`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start mining (via daemon RPC)
app.post('/api/mining/start', async (req, res) => {
    const { address, threads } = req.body;
    try {
        const response = await fetch(`${DAEMON_HTTP}/start_mining?miner_address=${address}&threads_count=${threads || 2}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Stop mining (via daemon RPC)
app.post('/api/mining/stop', async (req, res) => {
    try {
        const response = await fetch(`${DAEMON_HTTP}/stop_mining`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
    }
});

// Get miner status (via daemon RPC)
app.get('/api/miner/status', async (req, res) => {
    try {
        const response = await fetch(`${DAEMON_HTTP}/mining_status`);
        const data = await response.json();
        res.json({
            running: data.active,
            hashrate: data.speed,
            threads: data.threads_count,
            address: data.address,
            difficulty: data.difficulty
        });
    } catch (error) {
        res.status(500).json({ running: false, error: error.message });
    }
});

// ==================== WALLET ENDPOINTS ====================
// Note: These require cocaine-wallet-rpc to be running separately on port 19083

// List available wallets
app.get('/api/wallet/list', async (req, res) => {
    try {
        const files = fs.readdirSync(WALLET_DIR);
        const wallets = files
            .filter(f => f.endsWith('.keys'))
            .map(f => f.replace('.keys', ''));
        res.json({ wallets });
    } catch (error) {
        res.json({ wallets: [] });
    }
});

// Create new wallet
app.post('/api/wallet/create', async (req, res) => {
    const { name, password } = req.body;

    if (!name || name.length < 1) {
        return res.status(400).json({ error: 'Wallet name required' });
    }

    try {
        const data = await walletRpc('create_wallet', {
            filename: name,
            password: password || '',
            language: 'English'
        });

        if (data.error) {
            return res.json({ success: false, error: data.error.message });
        }

        // Get the seed phrase
        const seedData = await walletRpc('query_key', { key_type: 'mnemonic' });
        const addressData = await walletRpc('get_address');

        res.json({
            success: true,
            name: name,
            address: addressData.result?.address,
            seed: seedData.result?.key
        });
    } catch (error) {
        res.status(500).json({ error: 'Wallet RPC not running. Start cocaine-wallet-rpc first.' });
    }
});

// Open existing wallet
app.post('/api/wallet/open', async (req, res) => {
    const { name, password } = req.body;

    try {
        const data = await walletRpc('open_wallet', {
            filename: name,
            password: password || ''
        });

        if (data.error) {
            return res.json({ success: false, error: data.error.message });
        }

        const addressData = await walletRpc('get_address');

        res.json({
            success: true,
            name: name,
            address: addressData.result?.address
        });
    } catch (error) {
        res.status(500).json({ error: 'Wallet RPC not running. Start cocaine-wallet-rpc first.' });
    }
});

// Restore wallet from seed
app.post('/api/wallet/restore', async (req, res) => {
    const { name, password, seed } = req.body;

    if (!name || !seed) {
        return res.status(400).json({ error: 'Name and seed required' });
    }

    try {
        const data = await walletRpc('restore_deterministic_wallet', {
            filename: name,
            password: password || '',
            seed: seed,
            restore_height: 0,
            language: 'English'
        });

        if (data.error) {
            return res.json({ success: false, error: data.error.message });
        }

        res.json({
            success: true,
            name: name,
            address: data.result?.address,
            info: data.result?.info
        });
    } catch (error) {
        res.status(500).json({ error: 'Wallet RPC not running. Start cocaine-wallet-rpc first.' });
    }
});

// Get wallet balance
app.get('/api/wallet/balance', async (req, res) => {
    try {
        const data = await walletRpc('get_balance');

        if (data.error) {
            return res.json({ error: data.error.message });
        }

        res.json({
            balance: data.result?.balance || 0,
            unlocked_balance: data.result?.unlocked_balance || 0,
            balance_display: ((data.result?.balance || 0) / 1e12).toFixed(4),
            unlocked_display: ((data.result?.unlocked_balance || 0) / 1e12).toFixed(4)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get wallet address
app.get('/api/wallet/address', async (req, res) => {
    try {
        const data = await walletRpc('get_address');
        res.json({
            address: data.result?.address,
            addresses: data.result?.addresses
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get transaction history
app.get('/api/wallet/transfers', async (req, res) => {
    try {
        const data = await walletRpc('get_transfers', {
            in: true,
            out: true,
            pending: true,
            pool: true
        });

        if (data.error) {
            return res.json({ error: data.error.message });
        }

        res.json({
            incoming: data.result?.in || [],
            outgoing: data.result?.out || [],
            pending: data.result?.pending || [],
            pool: data.result?.pool || []
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Send transaction
app.post('/api/wallet/send', async (req, res) => {
    const { address, amount, payment_id } = req.body;

    if (!address || !amount) {
        return res.status(400).json({ error: 'Address and amount required' });
    }

    try {
        const atomicAmount = Math.floor(parseFloat(amount) * 1e12);

        const params = {
            destinations: [{ address: address, amount: atomicAmount }],
            priority: 1,
            ring_size: 16,
            get_tx_key: true
        };

        if (payment_id) {
            params.payment_id = payment_id;
        }

        const data = await walletRpc('transfer', params);

        if (data.error) {
            return res.json({ success: false, error: data.error.message });
        }

        res.json({
            success: true,
            tx_hash: data.result?.tx_hash,
            tx_key: data.result?.tx_key,
            fee: (data.result?.fee || 0) / 1e12
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Refresh wallet
app.post('/api/wallet/refresh', async (req, res) => {
    try {
        const data = await walletRpc('refresh');
        res.json({
            blocks_fetched: data.result?.blocks_fetched,
            received_money: data.result?.received_money
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Close wallet
app.post('/api/wallet/close', async (req, res) => {
    try {
        await walletRpc('close_wallet');
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get wallet status
app.get('/api/wallet/status', async (req, res) => {
    try {
        const height = await walletRpc('get_height');
        const address = await walletRpc('get_address');
        res.json({
            open: !!address.result?.address,
            address: address.result?.address,
            height: height.result?.height
        });
    } catch (error) {
        res.json({ open: false });
    }
});

// ==================== SERVER START ====================

const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║     ██████╗ ██████╗  ██████╗ █████╗ ██╗███╗   ██╗███████╗ ║
║    ██╔════╝██╔═══██╗██╔════╝██╔══██╗██║████╗  ██║██╔════╝ ║
║    ██║     ██║   ██║██║     ███████║██║██╔██╗ ██║█████╗   ║
║    ██║     ██║   ██║██║     ██╔══██║██║██║╚██╗██║██╔══╝   ║
║    ╚██████╗╚██████╔╝╚██████╗██║  ██║██║██║ ╚████║███████╗ ║
║     ╚═════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝╚══════╝ ║
║                                                           ║
║                    DASHBOARD v2.1                         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

Dashboard running at http://127.0.0.1:${PORT}

Requirements:
  - cocained must be running on port 19081
  - cocaine-wallet-rpc on port 19083 (optional, for wallet features)

Wallet directory: ${WALLET_DIR}

Press Ctrl+C to stop
`);

    // Auto-open browser
    setTimeout(() => {
        open(`http://localhost:${PORT}`).catch(() => {});
    }, 500);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n[!] Port ${PORT} is already in use.\n`);
        process.exit(1);
    }
    throw err;
});

process.on('SIGINT', () => {
    console.log('\n[*] Shutting down...');
    process.exit(0);
});
