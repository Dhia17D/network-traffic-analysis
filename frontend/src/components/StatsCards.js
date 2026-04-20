import React from 'react';
import styled from 'styled-components';
import { FaPackets, FaExchangeAlt, FaServer, FaChartLine } from 'react-icons/fa';

const CardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const StatCard = styled.div`
  background: rgba(20, 20, 35, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
`;

const IconContainer = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color || 'rgba(0, 255, 136, 0.15)'};
  color: ${props => props.iconColor || '#00ff88'};
  font-size: 24px;
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #888;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StatValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #e0e0e0;
  font-family: 'JetBrains Mono', monospace;
`;

const StatChange = styled.div`
  font-size: 12px;
  color: ${props => props.positive ? '#00ff88' : props.negative ? '#ff4444' : '#888'};
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

function StatsCards({ stats, formatBytes, capturing }) {
  const packetRate = capturing ? 'Live' : '0 pps';
  
  return (
    <CardsContainer>
      <StatCard>
        <IconContainer color="rgba(0, 255, 136, 0.15)" iconColor="#00ff88">
          <FaPackets />
        </IconContainer>
        <StatInfo>
          <StatLabel>Total Packets</StatLabel>
          <StatValue>{stats.total_packets.toLocaleString()}</StatValue>
          <StatChange positive={capturing}>
            {capturing ? '● Capturing' : '○ Stopped'}
          </StatChange>
        </StatInfo>
      </StatCard>

      <StatCard>
        <IconContainer color="rgba(0, 204, 255, 0.15)" iconColor="#00ccff">
          <FaExchangeAlt />
        </IconContainer>
        <StatInfo>
          <StatLabel>Total Traffic</StatLabel>
          <StatValue>{formatBytes(stats.total_bytes)}</StatValue>
          <StatChange>
            {packetRate}
          </StatChange>
        </StatInfo>
      </StatCard>

      <StatCard>
        <IconContainer color="rgba(255, 170, 0, 0.15)" iconColor="#ffaa00">
          <FaServer />
        </IconContainer>
        <StatInfo>
          <StatLabel>Active Protocols</StatLabel>
          <StatValue>{Object.keys(stats.protocols).length}</StatValue>
          <StatChange>
            {Object.entries(stats.protocols)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([proto]) => proto)
              .join(', ') || 'None'}
          </StatChange>
        </StatInfo>
      </StatCard>

      <StatCard>
        <IconContainer color="rgba(255, 68, 136, 0.15)" iconColor="#ff4488">
          <FaChartLine />
        </IconContainer>
        <StatInfo>
          <StatLabel>Connections</StatLabel>
          <StatValue>{stats.top_sources?.length || 0}</StatValue>
          <StatChange>
            Unique sources tracked
          </StatChange>
        </StatInfo>
      </StatCard>
    </CardsContainer>
  );
}

export default StatsCards;
