# Network Traffic Analyzer - Architecture

## System Overview

The Network Traffic Analyzer consists of three main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ Dashboard│ │  Charts  │ │  Tables  │ │ Controls │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│                         │                                   │
│                    WebSocket/HTTP                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                   Backend (Flask)                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              REST API + SocketIO                     │  │
│  └─────────────────────────────────────────────────────┘  │
│                         │                                   │
│  ┌──────────────────────┼──────────────────────────────┐ │
│  │  Packet Capture      │      Traffic Analyzer        │ │
│  │  ┌────────────────┐   │   ┌──────────────────────┐   │ │
│  │  │   Scapy/Npcap  │   │   │   Deep Inspection    │   │ │
│  │  │   Raw Sockets  │   │   │   Protocol Parsing   │   │ │
│  │  │   BPF Filter   │   │   │   Anomaly Detection  │   │ │
│  │  └────────────────┘   │   └──────────────────────┘   │ │
│  └─────────────────────────┴──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Capture Flow

```
Network Interface
       │
       ▼
┌──────────────┐
│  Scapy Sniff │ ← BPF Filter applied
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Parse Packet │ ← Extract headers and payload
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Buffer/     │ ← Store in memory buffer
│  WebSocket   │ ← Emit to clients
└──────────────┘
```

### Analysis Flow

```
Packet Buffer
     │
     ▼
┌────────────┐
│  Protocol  │ ← Classify by protocol
│ Statistics │
└─────┬──────┘
      │
      ▼
┌────────────┐
│   Host     │ ← Track source/dest
│ Statistics │
└─────┬──────┘
      │
      ▼
┌────────────┐
│   Time     │ ← Traffic over time
│  Buckets   │
└────────────┘
```

## Component Details

### Backend Components

#### `PacketCapture`

Responsibilities:
- Interface enumeration
- BPF filter application
- Raw packet capture
- Packet parsing
- Event emission

Key Methods:
- `list_interfaces()` - Get available interfaces
- `start(callback)` - Begin capture
- `stop()` - End capture
- `_parse_packet()` - Extract packet data

#### `TrafficAnalyzer`

Responsibilities:
- Statistical aggregation
- Protocol classification
- Anomaly detection
- PCAP file analysis

Key Methods:
- `analyze_packets()` - Analyze packet list
- `detect_anomalies()` - Find suspicious patterns
- `analyze_file()` - Process PCAP file

### Frontend Components

#### `Dashboard`

State Management:
- Socket connection
- Packet buffer
- Statistics cache
- Capture status

Effects:
- WebSocket setup
- Periodic stats refresh
- Interface loading

#### `CaptureControls`

Features:
- Interface selection
- BPF filter input
- Start/Stop capture
- Interface info display

#### Charts (ProtocolChart, TrafficChart)

Libraries:
- Recharts for visualization
- Real-time data updates
- Interactive tooltips

## Communication Protocol

### REST API

Standard HTTP endpoints for:
- Configuration (interfaces, filters)
- Control (start/stop capture)
- Data retrieval (stats, packets)
- File operations (upload, export)

### WebSocket Events

| Event | Payload | Description |
|-------|---------|-------------|
| `packet` | `{timestamp, src, dst, protocol, length, ...}` | Single packet data |
| `stats_update` | `{total_packets, protocols, ...}` | Aggregated statistics |
| `capture_status` | `{status, interface}` | Capture state change |
| `error` | `{message}` | Error notification |

## Data Models

### Packet

```javascript
{
  timestamp: number,      // Unix timestamp
  length: number,         // Packet size in bytes
  protocol: string,       // TCP, UDP, ICMP, etc.
  src: string,           // Source IP
  dst: string,           // Destination IP
  sport?: number,        // Source port (TCP/UDP)
  dport?: number,        // Destination port
  flags?: string,        // TCP flags
  service?: string,      // Detected service (HTTP, etc.)
  layers: string[]       // Protocol stack
}
```

### Statistics

```javascript
{
  total_packets: number,
  total_bytes: number,
  protocols: { [protocol]: count },
  top_sources: [{ ip, count }],
  top_destinations: [{ ip, count }],
  traffic_over_time: [{ time, bytes }]
}
```

## Performance Considerations

### Buffer Management

- Packet buffer capped at 1000 entries
- Stats update every 100 packets
- Time buckets for traffic chart (10-second windows)

### Memory Optimization

- Packet objects are lightweight (extracted fields only)
- Full packet data only available via PCAP export
- Automatic buffer rotation

### Network Efficiency

- WebSocket for real-time (low latency)
- REST for bulk operations
- Stats updates batched (every 2 seconds)

## Security

### Privilege Requirements

Packet capture requires:
- Linux: `CAP_NET_RAW` capability or root
- macOS: root access
- Windows: Administrator or Npcap driver

### Data Handling

- No persistent storage of raw packets by default
- PCAP exports in `exports/` directory
- User responsible for sensitive data handling

## Extending the System

### Adding Protocol Support

1. Update `_parse_packet()` in `packet_capture.py`
2. Add protocol badge styling in `ProtocolChart.js`
3. Update packet table columns if needed

### Adding Analysis Features

1. Implement analyzer method in `traffic_analyzer.py`
2. Add API endpoint in `app.py`
3. Create React component for visualization
4. Connect via WebSocket or REST

### Custom Exports

Supported formats:
- JSON (full data)
- CSV (packet list)
- PCAP (via Scapy)

Add new format:
1. Extend `export_data()` in `app.py`
2. Add frontend export option
