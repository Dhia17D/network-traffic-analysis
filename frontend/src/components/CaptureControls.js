import React, { useState } from 'react';
import styled from 'styled-components';
import { FaPlay, FaStop, FaFilter, FaNetworkWired } from 'react-icons/fa';

const ControlsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  background: rgba(20, 20, 35, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 20px;
  align-items: center;
`;

const ControlGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 200px;
`;

const Label = styled.label`
  font-size: 12px;
  color: #888;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Select = styled.select`
  background: rgba(10, 10, 15, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  color: #e0e0e0;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.2s;
  
  &:hover, &:focus {
    border-color: #00ff88;
    outline: none;
  }
  
  option {
    background: #1a1a2e;
    color: #e0e0e0;
  }
`;

const Input = styled.input`
  background: rgba(10, 10, 15, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 10px 12px;
  color: #e0e0e0;
  font-size: 14px;
  transition: border-color 0.2s;
  
  &::placeholder {
    color: #555;
  }
  
  &:hover, &:focus {
    border-color: #00ff88;
    outline: none;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-left: auto;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 14px;
  }
`;

const StartButton = styled(Button)`
  background: linear-gradient(135deg, #00ff88 0%, #00cc66 100%);
  color: #0a0a0a;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 255, 136, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const StopButton = styled(Button)`
  background: linear-gradient(135deg, #ff4444 0%, #cc3333 100%);
  color: white;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(255, 68, 68, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
`;

const InterfaceInfo = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 4px;
  
  span {
    color: #00ff88;
  }
`;

function CaptureControls({ interfaces, capturing, onStart, onStop }) {
  const [selectedInterface, setSelectedInterface] = useState('');
  const [filter, setFilter] = useState('');

  const selectedIface = interfaces.find(i => i.name === selectedInterface);

  const handleStart = () => {
    onStart(selectedInterface || 'eth0', filter);
  };

  return (
    <ControlsContainer>
      <ControlGroup>
        <Label>
          <FaNetworkWired style={{ marginRight: '6px' }} />
          Network Interface
        </Label>
        <Select 
          value={selectedInterface} 
          onChange={(e) => setSelectedInterface(e.target.value)}
          disabled={capturing}
        >
          <option value="">Select interface...</option>
          {interfaces.map((iface) => (
            <option key={iface.name} value={iface.name}>
              {iface.name} {iface.ipv4 ? `(${iface.ipv4})` : ''}
            </option>
          ))}
        </Select>
        {selectedIface && (
          <InterfaceInfo>
            MAC: <span>{selectedIface.mac || 'N/A'}</span> | 
            RX: <span>{(selectedIface.bytes_recv / 1024 / 1024).toFixed(2)} MB</span> | 
            TX: <span>{(selectedIface.bytes_sent / 1024 / 1024).toFixed(2)} MB</span>
          </InterfaceInfo>
        )}
      </ControlGroup>

      <ControlGroup>
        <Label>
          <FaFilter style={{ marginRight: '6px' }} />
          BPF Filter (optional)
        </Label>
        <Input
          type="text"
          placeholder="e.g., tcp port 80 or host 192.168.1.1"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          disabled={capturing}
        />
      </ControlGroup>

      <ButtonGroup>
        <StartButton 
          onClick={handleStart} 
          disabled={capturing}
        >
          <FaPlay />
          Start Capture
        </StartButton>
        <StopButton 
          onClick={onStop} 
          disabled={!capturing}
        >
          <FaStop />
          Stop
        </StopButton>
      </ButtonGroup>
    </ControlsContainer>
  );
}

export default CaptureControls;
