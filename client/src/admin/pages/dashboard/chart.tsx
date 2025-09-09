import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const MyBarChart = ({ data }) => {
  // Check if we're on mobile
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <ResponsiveContainer width="100%" height={isMobile ? 250 : 430}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="_id"
          fontSize={isMobile ? 10 : 12}
          angle={isMobile ? -45 : 0}
          textAnchor={isMobile ? 'end' : 'middle'}
          height={isMobile ? 60 : 30}
        />
        <YAxis fontSize={isMobile ? 10 : 12} />
        <Tooltip />
        <Bar dataKey="totalRevenue" fill="#8884d8" />
        <Bar dataKey="totalGross" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default MyBarChart;