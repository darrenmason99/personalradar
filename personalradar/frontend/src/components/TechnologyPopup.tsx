import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Link,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
} from '@mui/material';
import { Technology } from '../services/api';

interface TechnologyPopupProps {
  technologies: Technology[];
  open: boolean;
  onClose: () => void;
}

const TechnologyPopup: React.FC<TechnologyPopupProps> = ({
  technologies,
  open,
  onClose,
}) => {
  const [selectedTech, setSelectedTech] = React.useState<Technology | null>(
    technologies.length === 1 ? technologies[0] : null
  );

  React.useEffect(() => {
    setSelectedTech(technologies.length === 1 ? technologies[0] : null);
  }, [technologies]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid date';
    }
  };

  const handleTechSelect = (tech: Technology) => {
    setSelectedTech(tech);
  };

  const handleClose = () => {
    onClose();
    setSelectedTech(null);
  };

  if (technologies.length === 0) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h5" component="div" fontWeight="bold">
          {technologies.length === 1 ? technologies[0].name : 'Technologies'}
        </Typography>
        {technologies.length === 1 && (
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={technologies[0].quadrant}
              color="primary"
              size="small"
              variant="outlined"
            />
            <Chip
              label={technologies[0].ring}
              color="secondary"
              size="small"
              variant="outlined"
            />
          </Box>
        )}
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {technologies.length > 1 ? (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {technologies.length} technologies in this area. Click on one to view details:
            </Typography>
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {technologies.map((tech, index) => (
                <ListItem key={tech._id || index} disablePadding>
                  <ListItemButton onClick={() => handleTechSelect(tech)}>
                    <ListItemText
                      primary={tech.name}
                      secondary={
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={tech.quadrant}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                          <Chip
                            label={tech.ring}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      }
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        ) : selectedTech ? (
          <Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                {selectedTech.description || 'No description available'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {selectedTech.source && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Source
                  </Typography>
                  <Typography variant="body2">
                    {selectedTech.source}
                  </Typography>
                </Box>
              )}

              {selectedTech.date_of_assessment && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Assessment Date
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedTech.date_of_assessment)}
                  </Typography>
                </Box>
              )}

              {selectedTech.uri && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Reference
                  </Typography>
                  <Link
                    href={selectedTech.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body2"
                    sx={{ wordBreak: 'break-all' }}
                  >
                    {selectedTech.uri}
                  </Link>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Created
                </Typography>
                <Typography variant="body2">
                  {formatDate(selectedTech.created_at || null)}
                </Typography>
              </Box>

              {selectedTech.updated_at && selectedTech.updated_at !== selectedTech.created_at && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Last Updated
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedTech.updated_at)}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        ) : null}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {technologies.length > 1 && selectedTech && (
          <Button 
            onClick={() => setSelectedTech(null)} 
            variant="outlined" 
            color="primary"
            sx={{ mr: 'auto' }}
          >
            Back to List
          </Button>
        )}
        <Button onClick={handleClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TechnologyPopup; 