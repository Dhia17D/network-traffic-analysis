import React from 'react';
import styled from 'styled-components';
import Dashboard from './components/Dashboard';
import Header from './components/Header';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  color: #e0e0e0;
  font-family: 'Inter', sans-serif;
`;

const MainContent = styled.main`
  padding: 20px;
  max-width: 1800px;
  margin: 0 auto;
`;

function App() {
  return (
    <AppContainer>
      <Header />
      <MainContent>
        <Dashboard />
      </MainContent>
    </AppContainer>
  );
}

export default App;
