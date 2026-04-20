# Network Traffic Analyzer

A real-time network traffic analysis tool with a modern web-based dashboard. Capture, analyze, and visualize network packets with an intuitive interface.


## Features

- **Real-time Packet Capture**: Live capture from any network interface
- **Protocol Analysis**: Deep inspection of TCP, UDP, ICMP, DNS, ARP, and more
- **Visual Dashboard**: Interactive charts and statistics
- **Traffic Visualization**: Protocol distribution, traffic over time, top hosts
- **BPF Filtering**: Apply Berkeley Packet Filter expressions
- **Packet Inspection**: Expand packets to see full details
- **PCAP Analysis**: Upload and analyze capture files
- **Export Data**: Export captures to JSON or CSV

## Architecture

```
network-traffic-analysis/
├── backend/           # Flask + SocketIO API
│   ├── app.py        # Main application
│   ├── packet_capture.py   # Scapy capture handler
│   └── traffic_analyzer.py # Analysis engine
├── frontend/         # React dashboard
│   └── src/
│       └── components/  # React components
└── docs/            # Documentation
```

## Prerequisites

- Python 3.8+
- Node.js 16+
- Wireshark/WinPcap/Npcap (Windows)
- Root/Administrator privileges (for live capture)

## Installation

### Backend

```bash
# Create virtual environment
python -m venv venv

# Activate
# Linux/Mac:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Frontend

```bash
cd frontend
npm install
```

## Usage

### Start Backend

```bash
# From project root
python -m backend.app
# or
cd backend && python app.py
```

Backend runs on `http://localhost:5000`

### Start Frontend

```bash
cd frontend
npm start
```

Frontend runs on `http://localhost:3000`

### Capture Packets

1. Open the dashboard at `http://localhost:3000`
2. Select a network interface
3. Optionally add a BPF filter (e.g., `tcp port 80`)
4. Click **Start Capture**
5. View real-time statistics and packets

## BPF Filter Examples

```
tcp port 80              # HTTP traffic only
host 192.168.1.1         # Traffic to/from specific host
port 443                 # HTTPS traffic
not arp                  # Exclude ARP packets
icmp                     # ICMP (ping) only
dst host 8.8.8.8         # Traffic to Google DNS
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/status` | GET | Get capture status |
| `/api/interfaces` | GET | List network interfaces |
| `/api/start` | POST | Start packet capture |
| `/api/stop` | POST | Stop packet capture |
| `/api/stats` | GET | Get traffic statistics |
| `/api/packets` | GET | Get recent packets |
| `/api/analyze` | POST | Analyze PCAP file |
| `/api/export` | POST | Export capture data |

## Socket.IO Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `packet` | Server → Client | New packet captured |
| `stats_update` | Server → Client | Statistics updated |
| `capture_status` | Server → Client | Capture started/stopped |

## Development

### Project Structure

```
network-traffic-analysis/
├── backend/
│   ├── app.py              # Flask app & WebSocket
│   ├── packet_capture.py   # Packet capture logic
│   └── traffic_analyzer.py # Traffic analysis
├── frontend/src/components/
│   ├── Dashboard.js        # Main dashboard
│   ├── CaptureControls.js  # Start/stop capture
│   ├── StatsCards.js       # Statistics cards
│   ├── ProtocolChart.js    # Protocol pie chart
│   ├── TrafficChart.js     # Traffic area chart
│   ├── PacketTable.js      # Packet list
│   └── TopHosts.js         # Top hosts list
└── requirements.txt
```

### Adding Features

1. Backend: Add routes in `backend/app.py`
2. Frontend: Add components in `frontend/src/components/`
3. WebSocket: Emit events via `socketio.emit()`

## Security Considerations

- Requires elevated privileges for packet capture
- Consider running in isolated environment
- Filter sensitive traffic in production
- PCAP files may contain sensitive data

## Troubleshooting

### Permission Denied

**Linux/Mac:**
```bash
sudo python backend/app.py
# or
sudo setcap cap_net_raw,cap_net_admin+eip $(which python)
```

**Windows:**
Run as Administrator or install Npcap in WinPcap compatible mode.

### Scapy Not Found

```bash
pip install scapy
```

### Interface Not Listed

Check interface permissions and ensure Wireshark/Npcap is installed.

## Technologies

- **Backend**: Python, Flask, SocketIO, Scapy
- **Frontend**: React, Recharts, Styled Components
- **Communication**: REST API + WebSocket

## License

MIT License - See LICENSE file

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## Author

Created for network analysis and educational purposes.
