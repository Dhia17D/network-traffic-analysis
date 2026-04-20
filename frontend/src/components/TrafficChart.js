import React from 'react';
import styled from 'styled-components';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

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

function TrafficChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <EmptyState>
        No traffic data available. Start capture to see traffic over time.
      </EmptyState>
    );
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp) => {
    try {
      return format(new Date(timestamp * 1000), 'HH:mm:ss');
    } catch {
      return '';
    }
  };

  return (
    <ChartContainer>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00ff88" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(255, 255, 255, 0.05)"
          />
          <XAxis 
            dataKey="time"
            tickFormatter={formatTime}
            stroke="#666"
            fontSize={11}
            tickLine={false}
          />
          <YAxis 
            tickFormatter={formatBytes}
            stroke="#666"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'rgba(20, 20, 35, 0.95)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#e0e0e0'
            }}
            labelFormatter={(value) => formatTime(value)}
            formatter={(value) => [formatBytes(value), 'Traffic']}
          />
          <Area
            type="monotone"
            dataKey="bytes"
            stroke="#00ff88"
            strokeWidth={2}
            fill="url(#trafficGradient)"
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export default TrafficChart;
