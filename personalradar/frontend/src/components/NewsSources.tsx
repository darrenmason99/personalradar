import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import { newsSourceApi, NewsSource } from '../services/api';

const NewsSources: React.FC = () => {
  const [newsSources, setNewsSources] = useState<NewsSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState<NewsSource | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    cadence_days: 7,
    is_active: true
  });

  useEffect(() => {
    fetchNewsSources();
  }, []);

  const fetchNewsSources = async () => {
    try {
      setLoading(true);
      const data = await newsSourceApi.list();
      setNewsSources(data);
    } catch (error) {
      console.error('Error fetching news sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForm = (source?: NewsSource) => {
    if (source) {
      setEditingSource(source);
      setFormData({
        name: source.name,
        url: source.url,
        description: source.description || '',
        cadence_days: source.cadence_days,
        is_active: source.is_active
      });
    } else {
      setEditingSource(null);
      setFormData({
        name: '',
        url: '',
        description: '',
        cadence_days: 7,
        is_active: true
      });
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingSource(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingSource) {
        await newsSourceApi.update(editingSource._id!, formData);
      } else {
        await newsSourceApi.create(formData);
      }
      handleCloseForm();
      fetchNewsSources();
    } catch (error) {
      console.error('Error saving news source:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this news source?')) {
      try {
        await newsSourceApi.delete(id);
        fetchNewsSources();
      } catch (error) {
        console.error('Error deleting news source:', error);
      }
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          News Sources
        </Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenForm()}>
          Add News Source
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="body1">
          {newsSources.length === 0 
            ? 'No news sources found. Add some to get started!' 
            : `Found ${newsSources.length} news sources.`
          }
        </Typography>
        
        {newsSources.map((source) => (
          <Box key={source._id} sx={{ mt: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6">{source.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {source.url}
                </Typography>
                {source.description && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {source.description}
                  </Typography>
                )}
                <Typography variant="body2">
                  Cadence: {source.cadence_days} days
                </Typography>
                <Typography variant="body2">
                  Status: {source.is_active ? 'Active' : 'Inactive'}
                </Typography>
                {source.last_checked && (
                  <Typography variant="body2" color="text.secondary">
                    Last checked: {new Date(source.last_checked).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button size="small" onClick={() => handleOpenForm(source)}>
                  Edit
                </Button>
                <Button size="small" color="error" onClick={() => handleDelete(source._id!)}>
                  Delete
                </Button>
              </Box>
            </Box>
          </Box>
        ))}
      </Paper>

      {showForm && (
        <Box sx={{ 
          position: 'fixed', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          bgcolor: 'rgba(0,0,0,0.5)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <Paper sx={{ p: 3, maxWidth: 500, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <Typography variant="h6" gutterBottom>
              {editingSource ? 'Edit News Source' : 'Add News Source'}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <input
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <input
                placeholder="URL"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', resize: 'vertical' }}
              />
              <input
                type="number"
                placeholder="Cadence (days)"
                value={formData.cadence_days}
                onChange={(e) => setFormData({ ...formData, cadence_days: parseInt(e.target.value) || 7 })}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                Active
              </label>
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button onClick={handleCloseForm}>Cancel</Button>
              <Button variant="contained" onClick={handleSubmit}>
                {editingSource ? 'Update' : 'Create'}
              </Button>
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  );
};

export default NewsSources; 