import React from 'react';
import styled from 'styled-components';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend
} from 'recharts';

const ChartContainer = styled.div`
  width: 100%;
  height: 280px;
`;

const EmptyState = styled.div`
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 14px;
`;

const COLORS = {
  'TCP': '#00ff88',
  'UDP': '#00ccff',
  'ICMP': '#ffaa00',
  'DNS': '#ff4488',
  'HTTP': '#aa66ff',
  'HTTPS': '#4488ff',
  'ARP': '#ff6644',
  'OTHER': '#666666'
};

function ProtocolChart({ protocols }) {
  const data = Object.entries(protocols).map(([name, value]) => ({
    name,
    value
  }));

  if (data.length === 0) {
    return (
      <EmptyState>
        No protocol data available. Start capture to see statistics.
      </EmptyState>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <ChartContainer>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.name] || `hsl(${(index * 360) / data.length}, 70%, 60%)`}
              />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{
              background: 'rgba(20, 20, 35, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#e0e0e0'
            }}
            formatter={(value) => [
              `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`,
              'Packets'
            ]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
            wrapperStyle={{
              color: '#888',
              fontSize: '12px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export default ProtocolChart;
