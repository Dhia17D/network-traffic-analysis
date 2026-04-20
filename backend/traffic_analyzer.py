"""
Traffic Analyzer Module
Provides deep packet inspection and traffic analysis
"""

import os
import json
import time
from collections import Counter, defaultdict
from datetime import datetime
from typing import Dict, List, Optional, Tuple

try:
    from scapy.all import rdpcap
    from scapy.layers.inet import IP, TCP, UDP
    from scapy.layers.dns import DNS
    from scapy.layers.http import HTTPRequest, HTTPResponse
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False


class TrafficAnalyzer:
    """Analyze network traffic patterns and detect anomalies"""
    
    def __init__(self):
        self.suspicious_ports = [
            4444, 5555, 6666, 8888, 9999, 31337, 12345, 54321  # Common backdoor ports
        ]
        self.known_malicious_ips = set()
        
    def analyze_file(self, filepath: str) -> Dict:
        """Analyze a pcap file"""
        if not SCAPY_AVAILABLE:
            return self._simulate_analysis()
        
        try:
            packets = rdpcap(filepath)
            return self.analyze_packets(packets)
        except Exception as e:
            return {'error': str(e)}
    
    def analyze_packets(self, packets) -> Dict:
        """Analyze a list of packets"""
        stats = {
            'summary': {
                'total_packets': len(packets),
                'total_bytes': sum(len(p) for p in packets),
                'start_time': None,
                'end_time': None,
                'duration_seconds': 0
            },
            'protocols': {},
            'ip_statistics': {
                'sources': Counter(),
                'destinations': Counter(),
                'conversations': Counter()
            },
            'port_statistics': {
                'source_ports': Counter(),
                'dest_ports': Counter()
            },
            'services': Counter(),
            'packet_sizes': {
                'min': float('inf'),
                'max': 0,
                'avg': 0,
                'distribution': defaultdict(int)
            },
            'dns_queries': [],
            'http_requests': [],
            'suspicious_activity': [],
            'geoip': {}
        }
        
        if not packets:
            return stats
        
        # Time range
        try:
            stats['summary']['start_time'] = datetime.fromtimestamp(
                float(packets[0].time)
            ).isoformat()
            stats['summary']['end_time'] = datetime.fromtimestamp(
                float(packets[-1].time)
            ).isoformat()
            stats['summary']['duration_seconds'] = float(packets[-1].time) - float(packets[0].time)
        except:
            pass
        
        total_size = 0
        
        for pkt in packets:
            pkt_len = len(pkt)
            total_size += pkt_len
            
            # Packet size stats
            stats['packet_sizes']['min'] = min(stats['packet_sizes']['min'], pkt_len)
            stats['packet_sizes']['max'] = max(stats['packet_sizes']['max'], pkt_len)
            
            # Size distribution (buckets of 100 bytes)
            bucket = (pkt_len // 100) * 100
            stats['packet_sizes']['distribution'][bucket] += 1
            
            # Protocol analysis
            if pkt.haslayer(IP):
                ip = pkt[IP]
                proto_num = ip.proto
                proto_name = self._get_protocol_name(proto_num)
                stats['protocols'][proto_name] = stats['protocols'].get(proto_name, 0) + 1
                
                src = ip.src
                dst = ip.dst
                
                stats['ip_statistics']['sources'][src] += 1
                stats['ip_statistics']['destinations'][dst] += 1
                stats['ip_statistics']['conversations'][f"{src} -> {dst}"] += 1
                
                # Check for suspicious activity
                self._check_suspicious(pkt, src, dst, stats)
                
                # Transport layer
                if pkt.haslayer(TCP):
                    tcp = pkt[TCP]
                    stats['port_statistics']['source_ports'][tcp.sport] += 1
                    stats['port_statistics']['dest_ports'][tcp.dport] += 1
                    
                    service = self._identify_service(tcp.dport)
                    if service:
                        stats['services'][service] += 1
                    
                    # HTTP analysis
                    if pkt.haslayer(HTTPRequest):
                        http = pkt[HTTPRequest]
                        stats['http_requests'].append({
                            'method': http.Method.decode() if isinstance(http.Method, bytes) else http.Method,
                            'host': http.Host.decode() if isinstance(http.Host, bytes) else http.Host,
                            'path': http.Path.decode() if isinstance(http.Path, bytes) else http.Path
                        })
                
                elif pkt.haslayer(UDP):
                    udp = pkt[UDP]
                    stats['port_statistics']['source_ports'][udp.sport] += 1
                    stats['port_statistics']['dest_ports'][udp.dport] += 1
                    
                    service = self._identify_service(udp.dport)
                    if service:
                        stats['services'][service] += 1
                    
                    # DNS analysis
                    if pkt.haslayer(DNS):
                        dns = pkt[DNS]
                        if dns.qd:
                            query = dns.qd.qname
                            if isinstance(query, bytes):
                                query = query.decode()
                            stats['dns_queries'].append({
                                'query': str(query).rstrip('.'),
                                'type': dns.qd.qtype
                            })
        
        # Finalize stats
        if stats['summary']['total_packets'] > 0:
            stats['packet_sizes']['avg'] = total_size / stats['summary']['total_packets']
        
        # Convert counters to sorted lists
        stats['ip_statistics']['sources'] = self._counter_to_list(
            stats['ip_statistics']['sources'], 20
        )
        stats['ip_statistics']['destinations'] = self._counter_to_list(
            stats['ip_statistics']['destinations'], 20
        )
        stats['ip_statistics']['conversations'] = self._counter_to_list(
            stats['ip_statistics']['conversations'], 20
        )
        stats['port_statistics']['source_ports'] = self._counter_to_list(
            stats['port_statistics']['source_ports'], 20
        )
        stats['port_statistics']['dest_ports'] = self._counter_to_list(
            stats['port_statistics']['dest_ports'], 20
        )
        stats['services'] = self._counter_to_list(stats['services'], 20)
        
        # Convert distribution to sorted list
        stats['packet_sizes']['distribution'] = [
            {'size_range': f"{k}-{k+99}", 'count': v}
            for k, v in sorted(stats['packet_sizes']['distribution'].items())
        ]
        
        return stats
    
    def _check_suspicious(self, pkt, src: str, dst: str, stats: Dict):
        """Check for suspicious activity"""
        suspicious = []
        
        # Check ports
        if pkt.haslayer(TCP):
            tcp = pkt[TCP]
            if tcp.dport in self.suspicious_ports or tcp.sport in self.suspicious_ports:
                suspicious.append(f"Suspicious port activity: {tcp.dport}")
        
        if pkt.haslayer(UDP):
            udp = pkt[UDP]
            if udp.dport in self.suspicious_ports or udp.sport in self.suspicious_ports:
                suspicious.append(f"Suspicious port activity: {udp.dport}")
        
        # Large packet size (potential exfiltration)
        if len(pkt) > 1400:
            suspicious.append("Large packet size")
        
        # High frequency from same source
        if stats['ip_statistics']['sources'][src] > 1000:
            suspicious.append("High frequency from source")
        
        if suspicious:
            stats['suspicious_activity'].append({
                'timestamp': datetime.now().isoformat(),
                'src': src,
                'dst': dst,
                'indicators': suspicious
            })
    
    def detect_anomalies(self, traffic_data: List[Dict]) -> List[Dict]:
        """Detect anomalies in traffic patterns"""
        anomalies = []
        
        if len(traffic_data) < 100:
            return anomalies
        
        # Calculate baseline
        packet_sizes = [p.get('length', 0) for p in traffic_data]
        avg_size = sum(packet_sizes) / len(packet_sizes)
        size_std = (sum((x - avg_size) ** 2 for x in packet_sizes) / len(packet_sizes)) ** 0.5
        
        # Detect anomalies
        for pkt in traffic_data:
            size = pkt.get('length', 0)
            
            # Size anomaly (3 standard deviations)
            if abs(size - avg_size) > 3 * size_std:
                anomalies.append({
                    'type': 'size_anomaly',
                    'packet': pkt,
                    'expected_size': avg_size,
                    'actual_size': size
                })
            
            # Protocol anomaly
            if pkt.get('protocol') in ['OTHER']:
                anomalies.append({
                    'type': 'unknown_protocol',
                    'packet': pkt
                })
        
        return anomalies
    
    @staticmethod
    def _get_protocol_name(proto_num: int) -> str:
        """Get protocol name from number"""
        protocols = {
            1: 'ICMP', 6: 'TCP', 17: 'UDP', 2: 'IGMP',
            47: 'GRE', 50: 'ESP', 51: 'AH', 89: 'OSPF'
        }
        return protocols.get(proto_num, f'OTHER({proto_num})')
    
    @staticmethod
    def _identify_service(port: int) -> Optional[str]:
        """Identify service from port number"""
        services = {
            20: 'FTP-DATA', 21: 'FTP', 22: 'SSH', 23: 'TELNET',
            25: 'SMTP', 53: 'DNS', 80: 'HTTP', 110: 'POP3',
            143: 'IMAP', 443: 'HTTPS', 445: 'SMB', 993: 'IMAPS',
            995: 'POP3S', 3306: 'MySQL', 3389: 'RDP', 5432: 'PostgreSQL',
            8080: 'HTTP-ALT', 8443: 'HTTPS-ALT'
        }
        return services.get(port)
    
    @staticmethod
    def _counter_to_list(counter: Counter, limit: int = 10) -> List[Dict]:
        """Convert Counter to sorted list of dicts"""
        return [
            {'value': value, 'count': count}
            for value, count in counter.most_common(limit)
        ]
    
    def _simulate_analysis(self) -> Dict:
        """Generate simulated analysis results"""
        import random
        
        return {
            'summary': {
                'total_packets': random.randint(1000, 10000),
                'total_bytes': random.randint(1000000, 100000000),
                'duration_seconds': random.randint(60, 3600)
            },
            'protocols': {
                'TCP': random.randint(500, 5000),
                'UDP': random.randint(200, 2000),
                'ICMP': random.randint(10, 100),
                'DNS': random.randint(100, 1000)
            },
            'services': [
                {'value': 'HTTP', 'count': random.randint(200, 2000)},
                {'value': 'HTTPS', 'count': random.randint(300, 3000)},
                {'value': 'DNS', 'count': random.randint(100, 1000)}
            ],
            'note': 'Simulated analysis (Scapy not available)'
        }
