import React from 'react';
import styled from 'styled-components';
import { FaDesktop, FaGlobe, FaArrowUp, FaArrowDown } from 'react-icons/fa';

const HostList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
`;

const HostItem = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: rgba(10, 10, 15, 0.5);
  border-radius: 8px;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(0, 255, 136, 0.05);
  }
`;

const HostIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(0, 255, 136, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00ff88;
  font-size: 16px;
  flex-shrink: 0;
`;

const HostInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const HostAddress = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const HostMeta = styled.div`
  font-size: 11px;
  color: #666;
  margin-top: 2px;
`;

const HostStats = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #00ff88;
`;

const ProgressBar = styled.div`
  width: 60px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #00ff88, #00ccff);
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const EmptyState = styled.div`
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 14px;
  text-align: center;
  padding: 20px;
`;

function TopHosts({ hosts }) {
  if (!hosts || hosts.length === 0) {
    return (
      <EmptyState>
        No host data available yet.<br />
        Start capture to see top hosts.
      </EmptyState>
    );
  }

  const maxCount = Math.max(...hosts.map(h => h.count));

  const isPrivateIP = (ip) => {
    return ip.startsWith('192.168.') || 
           ip.startsWith('10.') || 
           ip.startsWith('172.16.') ||
           ip.startsWith('172.17.') ||
           ip.startsWith('172.18.') ||
           ip.startsWith('172.19.') ||
           ip.startsWith('172.20.') ||
           ip.startsWith('172.21.') ||
           ip.startsWith('172.22.') ||
           ip.startsWith('172.23.') ||
           ip.startsWith('172.24.') ||
           ip.startsWith('172.25.') ||
           ip.startsWith('172.26.') ||
           ip.startsWith('172.27.') ||
           ip.startsWith('172.28.') ||
           ip.startsWith('172.29.') ||
           ip.startsWith('172.30.') ||
           ip.startsWith('172.31.') ||
           ip.startsWith('127.');
  };

  return (
    <HostList>
      {hosts.map((host, index) => {
        const isPrivate = isPrivateIP(host.ip);
        const percentage = (host.count / maxCount) * 100;
        
        return (
          <HostItem key={index}>
            <HostIcon>
              {isPrivate ? <FaDesktop /> : <FaGlobe />}
            </HostIcon>
            <HostInfo>
              <HostAddress>{host.ip}</HostAddress>
              <HostMeta>
                {isPrivate ? 'Private Network' : 'External'} • Rank #{index + 1}
              </HostMeta>
            </HostInfo>
            <ProgressBar>
              <ProgressFill percentage={percentage} />
            </ProgressBar>
            <HostStats>
              {host.count.toLocaleString()}
            </HostStats>
          </HostItem>
        );
      })}
    </HostList>
  );
}

export default TopHosts;
