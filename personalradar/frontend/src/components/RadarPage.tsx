import React from 'react';
import { Container, Typography, Paper } from '@mui/material';
import Radar from './Radar';

const sampleData = [
  { name: "Frontend", value: 0.8 },
  { name: "Backend", value: 0.7 },
  { name: "DevOps", value: 0.6 },
  { name: "Database", value: 0.75 },
  { name: "Security", value: 0.65 },
  { name: "Testing", value: 0.85 }
];

const RadarPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Technology Radar
        </Typography>
        <Typography variant="body1" paragraph>
          Visualize your technology stack and track your progress across different areas.
        </Typography>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Radar data={sampleData} width={600} height={600} />
        </div>
      </Paper>
    </Container>
  );
};

export default RadarPage; 