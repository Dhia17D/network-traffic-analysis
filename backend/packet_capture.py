"""
Packet Capture Module
Handles real-time packet capture using Scapy
"""

import socket
import time
import platform
from collections import defaultdict
from typing import Callable, Optional, List, Dict

try:
    from scapy.all import sniff, get_if_list, get_if_addr
    from scapy.layers.inet import IP, TCP, UDP, ICMP
    from scapy.layers.l2 import Ether, ARP
    from scapy.layers.dns import DNS
    from scapy.packet import Packet
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False

import psutil


class PacketCapture:
    """Network packet capture handler"""
    
    def __init__(self, interface: str = 'eth0', filter_expr: str = ''):
        self.interface = interface
        self.filter_expr = filter_expr
        self.is_running = False
        self.packet_count = 0
        self._stop_flag = False
        
    @staticmethod
    def list_interfaces() -> List[Dict]:
        """List available network interfaces"""
        interfaces = []
        
        # Get interface info from psutil
        io_counters = psutil.net_io_counters(pernic=True)
        addrs = psutil.net_if_addrs()
        
        for name, addr_list in addrs.items():
            ipv4 = None
            ipv6 = None
            mac = None
            
            for addr in addr_list:
                if addr.family == socket.AF_INET:
                    ipv4 = addr.address
                elif addr.family == socket.AF_INET6:
                    ipv6 = addr.address
                elif addr.family == psutil.AF_LINK:
                    mac = addr.address
            
            stats = io_counters.get(name, None)
            
            interfaces.append({
                'name': name,
                'ipv4': ipv4,
                'ipv6': ipv6,
                'mac': mac,
                'bytes_sent': stats.bytes_sent if stats else 0,
                'bytes_recv': stats.bytes_recv if stats else 0
            })
        
        return interfaces
    
    def start(self, callback: Callable[[Dict], None]) -> None:
        """Start packet capture"""
        if not SCAPY_AVAILABLE:
            raise RuntimeError("Scapy not available. Running in simulation mode.")
        
        self.is_running = True
        self._stop_flag = False
        
        def packet_handler(pkt: Packet):
            if self._stop_flag:
                raise KeyboardInterrupt()
            
            packet_data = self._parse_packet(pkt)
            if packet_data:
                callback(packet_data)
                self.packet_count += 1
        
        try:
            sniff(
                iface=self.interface,
                filter=self.filter_expr if self.filter_expr else None,
                prn=packet_handler,
                stop_filter=lambda x: self._stop_flag
            )
        except KeyboardInterrupt:
            pass
        finally:
            self.is_running = False
    
    def stop(self) -> None:
        """Stop packet capture"""
        self._stop_flag = True
        self.is_running = False
    
    def _parse_packet(self, pkt: Packet) -> Optional[Dict]:
        """Parse packet into dictionary"""
        try:
            data = {
                'timestamp': time.time(),
                'length': len(pkt),
                'protocol': 'OTHER',
                'layers': []
            }
            
            # Ethernet layer
            if pkt.haslayer(Ether):
                eth = pkt[Ether]
                data['src_mac'] = eth.src
                data['dst_mac'] = eth.dst
                data['layers'].append('Ethernet')
            
            # IP layer
            if pkt.haslayer(IP):
                ip = pkt[IP]
                data['src'] = ip.src
                data['dst'] = ip.dst
                data['ttl'] = ip.ttl
                data['layers'].append('IP')
                
                # Transport layer
                if pkt.haslayer(TCP):
                    tcp = pkt[TCP]
                    data['protocol'] = 'TCP'
                    data['sport'] = tcp.sport
                    data['dport'] = tcp.dport
                    data['flags'] = str(tcp.flags)
                    data['seq'] = tcp.seq
                    data['ack'] = tcp.ack
                    data['layers'].append('TCP')
                    
                    # Check for common services
                    service = self._get_service_name(tcp.dport)
                    if service:
                        data['service'] = service
                    
                elif pkt.haslayer(UDP):
                    udp = pkt[UDP]
                    data['protocol'] = 'UDP'
                    data['sport'] = udp.sport
                    data['dport'] = udp.dport
                    data['length'] = udp.len
                    data['layers'].append('UDP')
                    
                    service = self._get_service_name(udp.dport)
                    if service:
                        data['service'] = service
                    
                    # DNS
                    if pkt.haslayer(DNS):
                        dns = pkt[DNS]
                        data['protocol'] = 'DNS'
                        data['dns_id'] = dns.id
                        data['dns_qr'] = dns.qr
                        if dns.qd:
                            data['dns_query'] = dns.qd.qname.decode() if isinstance(dns.qd.qname, bytes) else str(dns.qd.qname)
                        data['layers'].append('DNS')
                
                elif pkt.haslayer(ICMP):
                    icmp = pkt[ICMP]
                    data['protocol'] = 'ICMP'
                    data['icmp_type'] = icmp.type
                    data['icmp_code'] = icmp.code
                    data['layers'].append('ICMP')
            
            # ARP
            elif pkt.haslayer(ARP):
                arp = pkt[ARP]
                data['protocol'] = 'ARP'
                data['src'] = arp.psrc
                data['dst'] = arp.pdst
                data['hw_src'] = arp.hwsrc
                data['hw_dst'] = arp.hwdst
                data['arp_op'] = 'REQUEST' if arp.op == 1 else 'REPLY' if arp.op == 2 else arp.op
                data['layers'].append('ARP')
            
            return data
            
        except Exception as e:
            return None
    
    @staticmethod
    def _get_service_name(port: int) -> Optional[str]:
        """Get service name for common ports"""
        services = {
            20: 'FTP-DATA', 21: 'FTP', 22: 'SSH', 23: 'TELNET',
            25: 'SMTP', 53: 'DNS', 80: 'HTTP', 110: 'POP3',
            143: 'IMAP', 443: 'HTTPS', 445: 'SMB', 3306: 'MySQL',
            3389: 'RDP', 5432: 'PostgreSQL', 8080: 'HTTP-ALT',
            8443: 'HTTPS-ALT', 9200: 'Elasticsearch', 27017: 'MongoDB'
        }
        return services.get(port)


class SimulatedCapture(PacketCapture):
    """Simulated packet capture for testing without privileges"""
    
    def start(self, callback: Callable[[Dict], None]) -> None:
        """Generate simulated traffic"""
        import random
        
        self.is_running = True
        self._stop_flag = False
        
        protocols = ['TCP', 'UDP', 'ICMP', 'DNS']
        services = ['HTTP', 'HTTPS', 'DNS', 'SSH']
        
        sample_ips = [
            '192.168.1.1', '192.168.1.100', '10.0.0.1', '8.8.8.8',
            '1.1.1.1', '172.16.0.1', '192.168.0.1'
        ]
        
        while not self._stop_flag:
            time.sleep(random.uniform(0.01, 0.5))
            
            proto = random.choice(protocols)
            src_ip = random.choice(sample_ips)
            dst_ip = random.choice([ip for ip in sample_ips if ip != src_ip])
            
            packet = {
                'timestamp': time.time(),
                'length': random.randint(64, 1500),
                'protocol': proto,
                'src': src_ip,
                'dst': dst_ip,
                'layers': ['Ethernet', 'IP', proto]
            }
            
            if proto in ['TCP', 'UDP']:
                packet['sport'] = random.randint(1024, 65535)
                packet['dport'] = random.choice([80, 443, 53, 22, 8080])
                service = self._get_service_name(packet['dport'])
                if service:
                    packet['service'] = service
            
            if proto == 'TCP':
                packet['flags'] = random.choice(['S', 'SA', 'A', 'PA', 'FA'])
            
            callback(packet)
            self.packet_count += 1
        
        self.is_running = False
