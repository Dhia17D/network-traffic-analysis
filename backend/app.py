"""
Network Traffic Analysis - Flask Backend
Real-time packet capture and analysis API
"""

import os
import sys
import json
import time
import threading
from datetime import datetime
from collections import defaultdict, Counter
from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
from flask_cors import CORS

from packet_capture import PacketCapture
from traffic_analyzer import TrafficAnalyzer

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Global state
capture = None
analyzer = TrafficAnalyzer()
capture_thread = None
is_capturing = False
packet_buffer = []
BUFFER_SIZE = 1000

# Stats tracking
stats_cache = {
    'total_packets': 0,
    'total_bytes': 0,
    'protocols': {},
    'top_sources': [],
    'top_destinations': [],
    'traffic_over_time': [],
    'connections': []
}

@app.route('/api/status')
def get_status():
    """Get current capture status"""
    return jsonify({
        'capturing': is_capturing,
        'interface': capture.interface if capture else None,
        'packets_captured': stats_cache['total_packets']
    })

@app.route('/api/interfaces')
def get_interfaces():
    """Get available network interfaces"""
    interfaces = PacketCapture.list_interfaces()
    return jsonify({'interfaces': interfaces})

@app.route('/api/start', methods=['POST'])
def start_capture():
    """Start packet capture"""
    global capture, is_capturing, capture_thread
    
    if is_capturing:
        return jsonify({'error': 'Capture already running'}), 400
    
    data = request.json or {}
    interface = data.get('interface', 'eth0')
    filter_expr = data.get('filter', '')
    
    try:
        capture = PacketCapture(interface=interface, filter_expr=filter_expr)
        is_capturing = True
        
        capture_thread = threading.Thread(target=capture_worker)
        capture_thread.daemon = True
        capture_thread.start()
        
        socketio.emit('capture_status', {'status': 'started', 'interface': interface})
        return jsonify({'status': 'started', 'interface': interface})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/stop', methods=['POST'])
def stop_capture():
    """Stop packet capture"""
    global is_capturing, capture
    
    if not is_capturing:
        return jsonify({'error': 'No capture running'}), 400
    
    is_capturing = False
    if capture:
        capture.stop()
    
    socketio.emit('capture_status', {'status': 'stopped'})
    return jsonify({'status': 'stopped'})

@app.route('/api/stats')
def get_stats():
    """Get traffic statistics"""
    return jsonify(stats_cache)

@app.route('/api/packets')
def get_packets():
    """Get recent packets"""
    limit = request.args.get('limit', 100, type=int)
    return jsonify({'packets': packet_buffer[-limit:]})

@app.route('/api/analyze', methods=['POST'])
def analyze_pcap():
    """Analyze uploaded pcap file"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    # Save and analyze
    filepath = os.path.join('uploads', file.filename)
    os.makedirs('uploads', exist_ok=True)
    file.save(filepath)
    
    try:
        results = analyzer.analyze_file(filepath)
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

@app.route('/api/export', methods=['POST'])
def export_data():
    """Export capture data"""
    data = request.json or {}
    format_type = data.get('format', 'json')
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"capture_{timestamp}.{format_type}"
    
    export_path = os.path.join('exports', filename)
    os.makedirs('exports', exist_ok=True)
    
    if format_type == 'json':
        with open(export_path, 'w') as f:
            json.dump({
                'packets': packet_buffer,
                'stats': stats_cache
            }, f, indent=2)
    elif format_type == 'csv':
        import csv
        if packet_buffer:
            keys = packet_buffer[0].keys()
            with open(export_path, 'w', newline='') as f:
                writer = csv.DictWriter(f, fieldnames=keys)
                writer.writeheader()
                writer.writerows(packet_buffer)
    
    return jsonify({'filename': filename, 'path': export_path})

def capture_worker():
    """Background worker for packet capture"""
    global packet_buffer, stats_cache
    
    def packet_handler(packet_data):
        if not is_capturing:
            return
        
        # Add to buffer
        packet_buffer.append(packet_data)
        if len(packet_buffer) > BUFFER_SIZE:
            packet_buffer.pop(0)
        
        # Update stats
        stats_cache['total_packets'] += 1
        stats_cache['total_bytes'] += packet_data.get('length', 0)
        
        # Protocol stats
        proto = packet_data.get('protocol', 'OTHER')
        stats_cache['protocols'][proto] = stats_cache['protocols'].get(proto, 0) + 1
        
        # Emit to clients
        socketio.emit('packet', packet_data)
        
        # Periodic stats update
        if stats_cache['total_packets'] % 100 == 0:
            update_stats()
    
    try:
        capture.start(packet_handler)
    except Exception as e:
        socketio.emit('error', {'message': str(e)})
    finally:
        is_capturing = False

def update_stats():
    """Update aggregated statistics"""
    if not packet_buffer:
        return
    
    # Source/Destination stats
    sources = Counter(p.get('src', 'unknown') for p in packet_buffer)
    dests = Counter(p.get('dst', 'unknown') for p in packet_buffer)
    
    stats_cache['top_sources'] = [
        {'ip': ip, 'count': count} 
        for ip, count in sources.most_common(10)
    ]
    stats_cache['top_destinations'] = [
        {'ip': ip, 'count': count} 
        for ip, count in dests.most_common(10)
    ]
    
    # Traffic over time (last 60 seconds)
    current_time = time.time()
    recent_packets = [
        p for p in packet_buffer 
        if current_time - p.get('timestamp', 0) < 60
    ]
    
    time_buckets = defaultdict(int)
    for p in recent_packets:
        bucket = int(p.get('timestamp', 0) / 10) * 10
        time_buckets[bucket] += p.get('length', 0)
    
    stats_cache['traffic_over_time'] = [
        {'time': t, 'bytes': b} 
        for t, b in sorted(time_buckets.items())
    ]
    
    socketio.emit('stats_update', stats_cache)

@socketio.on('connect')
def handle_connect():
    emit('connected', {'data': 'Connected to network analyzer'})

@socketio.on('disconnect')
def handle_disconnect():
    pass

if __name__ == '__main__':
    os.makedirs('captures', exist_ok=True)
    os.makedirs('logs', exist_ok=True)
    os.makedirs('exports', exist_ok=True)
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
