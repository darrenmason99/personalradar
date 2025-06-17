import React from 'react';
import { Container, Typography, Paper, AppBar, Toolbar, Button, Box, Avatar } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Personal Tech Radar
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user?.picture && (
              <Avatar src={user.picture} alt={user.full_name} />
            )}
            <Typography variant="body1">
              {user?.full_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {user?.id}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

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
    </div>
  );
};

export default RadarPage; 