import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

const MyBarChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={430}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="_id" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="totalRevenue" fill="#8884d8" />
      <Bar dataKey="totalGross" fill="#82ca9d" />
    </BarChart>
  </ResponsiveContainer>
);

export default MyBarChart;