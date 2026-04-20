import React from 'react';
import styled from 'styled-components';
import { FaNetworkWired, FaGithub } from 'react-icons/fa';

const HeaderContainer = styled.header`
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 255, 136, 0.2);
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  
  svg {
    color: #00ff88;
    font-size: 28px;
  }
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #00ff88 0%, #00ccff 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.5px;
`;

const Subtitle = styled.span`
  font-size: 12px;
  color: #888;
  margin-left: 8px;
  font-weight: 400;
`;

const Nav = styled.nav`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const NavLink = styled.a`
  color: #888;
  text-decoration: none;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.2s;
  
  &:hover {
    color: #00ff88;
  }
  
  svg {
    font-size: 18px;
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(0, 255, 136, 0.1);
  border: 1px solid rgba(0, 255, 136, 0.3);
  border-radius: 20px;
  font-size: 12px;
  color: #00ff88;
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #00ff88;
    animation: pulse 2s infinite;
  }
`;

function Header() {
  return (
    <HeaderContainer>
      <Logo>
        <FaNetworkWired />
        <div>
          <Title>NTA</Title>
          <Subtitle>Network Traffic Analysis</Subtitle>
        </div>
      </Logo>
      
      <Nav>
        <StatusIndicator>System Ready</StatusIndicator>
        <NavLink 
          href="https://github.com" 
          target="_blank" 
          rel="noopener noreferrer"
        >
          <FaGithub />
          GitHub
        </NavLink>
      </Nav>
    </HeaderContainer>
  );
}

export default Header;
