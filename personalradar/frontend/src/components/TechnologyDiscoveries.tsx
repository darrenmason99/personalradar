import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, List, ListItem, ListItemText, Paper, CircularProgress, Alert, Button } from '@mui/material';
import { technologyDiscoveryApi, TechnologyDiscovery } from '../services/api';

const TechnologyDiscoveries: React.FC = () => {
  const [discoveries, setDiscoveries] = useState<TechnologyDiscovery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);

  const fetchDiscoveries = useCallback(async () => {
    try {
      setLoading(true);
      const data = await technologyDiscoveryApi.list();
      setDiscoveries(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch technology discoveries.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscoveries();
  }, [fetchDiscoveries]);

  const handleRunDiscovery = async () => {
    console.log('Starting technology discovery process...');
    try {
      setIsDiscovering(true);
      setError(null);
      const result = await technologyDiscoveryApi.runDiscovery();
      console.log('Discovery process finished. Result:', result);
      await fetchDiscoveries(); // Refresh the list
      console.log('Discoveries list refreshed.');
    } catch (err) {
      setError('Failed to run technology discovery.');
      console.error('Error during technology discovery:', err);
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          Technology Discoveries
        </Typography>
        <Button
          variant="contained"
          onClick={handleRunDiscovery}
          disabled={isDiscovering}
        >
          {isDiscovering ? <CircularProgress size={24} /> : 'Run Discovery'}
        </Button>
      </Box>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <Paper>
          <List>
            {discoveries.length === 0 ? (
              <ListItem>
                <ListItemText primary="No discoveries found. Try running the discovery process." />
              </ListItem>
            ) : (
              discoveries.map((discovery) => (
                <ListItem key={discovery.id}>
                  <ListItemText
                    primary={discovery.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {discovery.description}
                        </Typography>
                        <br />
                        <Typography component="span" variant="body2" color="text.secondary">
                          Source: {discovery.source_url} - Status: {discovery.status}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))
            )}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default TechnologyDiscoveries; 