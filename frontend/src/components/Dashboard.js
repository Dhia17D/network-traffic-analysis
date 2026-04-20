import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import io from 'socket.io-client';
import axios from 'axios';
import { format } from 'date-fns';
import StatsCards from './StatsCards';
import ProtocolChart from './ProtocolChart';
import TrafficChart from './TrafficChart';
import PacketTable from './PacketTable';
import CaptureControls from './CaptureControls';
import TopHosts from './TopHosts';

const DashboardContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
`;

const GridRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: rgba(20, 20, 35, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #e0e0e0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: ${props => props.connected ? '#00ff88' : '#ff4444'};
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${props => props.connected ? '#00ff88' : '#ff4444'};
    animation: ${props => props.connected ? 'pulse 2s infinite' : 'none'};
  }
`;

function Dashboard() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [stats, setStats] = useState({
    total_packets: 0,
    total_bytes: 0,
    protocols: {},
    top_sources: [],
    top_destinations: [],
    traffic_over_time: []
  });
  const [packets, setPackets] = useState([]);
  const [interfaces, setInterfaces] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    newSocket.on('packet', (packet) => {
      setPackets(prev => {
        const newPackets = [...prev, packet];
        return newPackets.slice(-100);
      });
    });

    newSocket.on('stats_update', (newStats) => {
      setStats(newStats);
    });

    newSocket.on('capture_status', (status) => {
      setCapturing(status.status === 'started');
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Load interfaces
  useEffect(() => {
    axios.get('/api/interfaces')
      .then(response => {
        setInterfaces(response.data.interfaces);
      })
      .catch(console.error);
  }, []);

  // Refresh stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      axios.get('/api/stats')
        .then(response => {
          setStats(response.data);
        })
        .catch(console.error);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleStartCapture = useCallback((interfaceName, filter) => {
    axios.post('/api/start', { interface: interfaceName, filter })
      .then(() => setCapturing(true))
      .catch(console.error);
  }, []);

  const handleStopCapture = useCallback(() => {
    axios.post('/api/stop')
      .then(() => setCapturing(false))
      .catch(console.error);
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <DashboardContainer>
      <CaptureControls
        interfaces={interfaces}
        capturing={capturing}
        onStart={handleStartCapture}
        onStop={handleStopCapture}
      />

      <StatsCards 
        stats={stats} 
        formatBytes={formatBytes}
        capturing={capturing}
      />

      <GridRow>
        <Card>
          <CardHeader>
            <CardTitle>Protocol Distribution</CardTitle>
            <ConnectionStatus connected={connected}>
              {connected ? 'Live' : 'Offline'}
            </ConnectionStatus>
          </CardHeader>
          <ProtocolChart protocols={stats.protocols} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Traffic Over Time</CardTitle>
          </CardHeader>
          <TrafficChart data={stats.traffic_over_time} />
        </Card>
      </GridRow>

      <GridRow>
        <Card>
          <CardHeader>
            <CardTitle>Top Source Hosts</CardTitle>
          </CardHeader>
          <TopHosts hosts={stats.top_sources} />
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Destination Hosts</CardTitle>
          </CardHeader>
          <TopHosts hosts={stats.top_destinations} />
        </Card>
      </GridRow>

      <Card>
        <CardHeader>
          <CardTitle>Recent Packets</CardTitle>
          <span style={{ color: '#888', fontSize: '12px' }}>
            Last 100 packets
          </span>
        </CardHeader>
        <PacketTable packets={packets} formatBytes={formatBytes} />
      </Card>
    </DashboardContainer>
  );
}

export default Dashboard;
