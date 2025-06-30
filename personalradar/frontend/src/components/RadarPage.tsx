import React, { useState } from 'react';
import { Container, Typography, Paper, AppBar, Toolbar, Button, Box, Avatar, Tabs, Tab } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ThoughtworksRadar from './ThoughtworksRadar';
import Technologies from './Technologies';
import NewsSources from './NewsSources';
import TechnologyDiscoveries from './TechnologyDiscoveries';

const RadarPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Personal Radar
          </Typography>
          {user && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">
                {user.email}
              </Typography>
              <Avatar sx={{ width: 32, height: 32 }}>
                {user.email.charAt(0).toUpperCase()}
              </Avatar>
              <Button color="inherit" onClick={handleLogout}>
                Logout
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Typography variant="h4" gutterBottom>
            Technology Radar
          </Typography>
          <Typography variant="body1" paragraph>
            Visualize your technology stack and track your progress across different areas.
          </Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab label="Radar" />
              <Tab label="Technologies" />
              <Tab label="News Sources" />
              <Tab label="Discoveries" />
            </Tabs>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {activeTab === 0 && <ThoughtworksRadar />}
            {activeTab === 1 && <Technologies />}
            {activeTab === 2 && <NewsSources />}
            {activeTab === 3 && <TechnologyDiscoveries />}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default RadarPage; 