import React, { useState } from 'react';
import styled from 'styled-components';
import { format } from 'date-fns';
import { FaChevronDown, FaChevronUp, FaFilter } from 'react-icons/fa';

const TableContainer = styled.div`
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

const TableHead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 10;
  
  th {
    background: rgba(20, 20, 35, 0.95);
    padding: 12px 16px;
    text-align: left;
    font-weight: 600;
    color: #888;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    white-space: nowrap;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    transition: background 0.2s;
    
    &:hover {
      background: rgba(255, 255, 255, 0.03);
    }
    
    &:last-child {
      border-bottom: none;
    }
  }
  
  td {
    padding: 10px 16px;
    color: #e0e0e0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
  }
`;

const ProtocolBadge = styled.span`
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  
  ${props => {
    const colors = {
      TCP: 'background: rgba(0, 255, 136, 0.15); color: #00ff88;',
      UDP: 'background: rgba(0, 204, 255, 0.15); color: #00ccff;',
      ICMP: 'background: rgba(255, 170, 0, 0.15); color: #ffaa00;',
      DNS: 'background: rgba(255, 68, 136, 0.15); color: #ff4488;',
      ARP: 'background: rgba(255, 102, 68, 0.15); color: #ff6644;',
      HTTP: 'background: rgba(170, 102, 255, 0.15); color: #aa66ff;',
      HTTPS: 'background: rgba(68, 136, 255, 0.15); color: #4488ff;',
    };
    return colors[props.protocol] || 'background: rgba(102, 102, 102, 0.15); color: #666;';
  }}
`;

const EmptyState = styled.div`
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 14px;
`;

const FilterBar = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const FilterInput = styled.input`
  background: rgba(10, 10, 15, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px 12px;
  color: #e0e0e0;
  font-size: 12px;
  width: 200px;
  
  &::placeholder {
    color: #555;
  }
  
  &:focus {
    border-color: #00ff88;
    outline: none;
  }
`;

const ExpandButton = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #00ff88;
  }
`;

const ExpandedRow = styled.tr`
  background: rgba(10, 10, 15, 0.5) !important;
`;

const ExpandedContent = styled.td`
  padding: 16px !important;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
`;

const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const DetailLabel = styled.span`
  font-size: 10px;
  color: #666;
  text-transform: uppercase;
`;

const DetailValue = styled.span`
  font-size: 12px;
  color: #00ff88;
  word-break: break-all;
`;

function PacketTable({ packets, formatBytes }) {
  const [filter, setFilter] = useState('');
  const [expandedRow, setExpandedRow] = useState(null);

  const filteredPackets = packets.filter(pkt => {
    if (!filter) return true;
    const searchTerm = filter.toLowerCase();
    return (
      (pkt.src && pkt.src.toLowerCase().includes(searchTerm)) ||
      (pkt.dst && pkt.dst.toLowerCase().includes(searchTerm)) ||
      (pkt.protocol && pkt.protocol.toLowerCase().includes(searchTerm)) ||
      (pkt.service && pkt.service.toLowerCase().includes(searchTerm))
    );
  });

  const formatTime = (timestamp) => {
    try {
      return format(new Date(timestamp * 1000), 'HH:mm:ss.SSS');
    } catch {
      return 'N/A';
    }
  };

  return (
    <>
      <FilterBar>
        <FaFilter style={{ color: '#888', fontSize: '14px', marginTop: '8px' }} />
        <FilterInput
          type="text"
          placeholder="Filter by IP, protocol, or service..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <span style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
          Showing {filteredPackets.length} of {packets.length} packets
        </span>
      </FilterBar>

      {filteredPackets.length === 0 ? (
        <EmptyState>
          {packets.length === 0 
            ? 'No packets captured yet. Start a capture session to see packets.'
            : 'No packets match your filter.'}
        </EmptyState>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <tr>
                <th>Time</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Protocol</th>
                <th>Length</th>
                <th>Info</th>
                <th></th>
              </tr>
            </TableHead>
            <TableBody>
              {filteredPackets.slice().reverse().map((pkt, index) => (
                <React.Fragment key={index}>
                  <tr>
                    <td>{formatTime(pkt.timestamp)}</td>
                    <td>{pkt.src || '-'}</td>
                    <td>{pkt.dst || '-'}</td>
                    <td>
                      <ProtocolBadge protocol={pkt.protocol}>
                        {pkt.protocol}
                      </ProtocolBadge>
                    </td>
                    <td>{formatBytes ? formatBytes(pkt.length) : pkt.length + ' B'}</td>
                    <td>
                      {pkt.service && (
                        <span style={{ color: '#888', fontSize: '11px' }}>
                          {pkt.service}
                          {pkt.sport && ` :${pkt.sport}`}
                        </span>
                      )}
                      {pkt.flags && (
                        <span style={{ color: '#00ccff', fontSize: '11px', marginLeft: '8px' }}>
                          [{pkt.flags}]
                        </span>
                      )}
                    </td>
                    <td>
                      <ExpandButton 
                        onClick={() => setExpandedRow(expandedRow === index ? null : index)}
                      >
                        {expandedRow === index ? <FaChevronUp /> : <FaChevronDown />}
                      </ExpandButton>
                    </td>
                  </tr>
                  {expandedRow === index && (
                    <ExpandedRow>
                      <ExpandedContent colSpan="7">
                        <DetailGrid>
                          {Object.entries(pkt).map(([key, value]) => (
                            <DetailItem key={key}>
                              <DetailLabel>{key}</DetailLabel>
                              <DetailValue>
                                {Array.isArray(value) ? value.join(', ') : String(value)}
                              </DetailValue>
                            </DetailItem>
                          ))}
                        </DetailGrid>
                      </ExpandedContent>
                    </ExpandedRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
}

export default PacketTable;
