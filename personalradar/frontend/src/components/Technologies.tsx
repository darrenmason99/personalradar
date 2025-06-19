import React, { useEffect, useState } from 'react';
import { technologyApi, Technology } from '../services/api';
import { Box, Typography, Paper, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';

const QUADRANTS = ['Techniques', 'Tools', 'Platforms', 'Languages & Frameworks'];
const RINGS = ['Adopt', 'Trial', 'Assess', 'Hold'];

const initialForm = {
  name: '',
  quadrant: '',
  ring: '',
  description: '',
  source: '',
  date_of_assessment: '',
  uri: '',
};

const Technologies: React.FC = () => {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTechnologies = async () => {
    setLoading(true);
    try {
      const data = await technologyApi.list();
      setTechnologies(data);
    } catch (err) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnologies();
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await technologyApi.update(editingId, form);
      } else {
        await technologyApi.create(form);
      }
      setForm(initialForm);
      setEditingId(null);
      fetchTechnologies();
    } catch (err) {
      // handle error
    }
  };

  const handleEdit = (tech: Technology) => {
    setForm({
      name: tech.name,
      quadrant: tech.quadrant,
      ring: tech.ring,
      description: tech.description,
      source: tech.source,
      date_of_assessment: tech.date_of_assessment ? tech.date_of_assessment.slice(0, 10) : '',
      uri: tech.uri || '',
    });
    setEditingId(tech._id || null);
  };

  const handleDelete = async (id: string) => {
    try {
      await technologyApi.delete(id);
      fetchTechnologies();
    } catch (err) {
      // handle error
    }
  };

  const handleCancel = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Technologies</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <TextField label="Name" name="name" value={form.name} onChange={handleTextChange} required size="small" />
          <FormControl size="small" required sx={{ minWidth: 200 }}>
            <InputLabel>Quadrant</InputLabel>
            <Select
              name="quadrant"
              value={form.quadrant}
              onChange={handleSelectChange}
              label="Quadrant"
            >
              {QUADRANTS.map((quadrant) => (
                <MenuItem key={quadrant} value={quadrant}>
                  {quadrant}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" required sx={{ minWidth: 200 }}>
            <InputLabel>Ring</InputLabel>
            <Select
              name="ring"
              value={form.ring}
              onChange={handleSelectChange}
              label="Ring"
            >
              {RINGS.map((ring) => (
                <MenuItem key={ring} value={ring}>
                  {ring}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Description" name="description" value={form.description} onChange={handleTextChange} required size="small" />
          <TextField label="Source" name="source" value={form.source} onChange={handleTextChange} required size="small" />
          <TextField label="Date of Assessment" name="date_of_assessment" type="date" value={form.date_of_assessment} onChange={handleTextChange} required size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="URI" name="uri" value={form.uri} onChange={handleTextChange} size="small" />
          <Button type="submit" variant="contained" color="primary" sx={{ minWidth: 120 }}>
            {editingId ? 'Update' : 'Add'}
          </Button>
          {editingId && (
            <Button onClick={handleCancel} variant="outlined" color="secondary">Cancel</Button>
          )}
        </form>
      </Paper>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Quadrant</TableCell>
              <TableCell>Ring</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Source</TableCell>
              <TableCell>Date of Assessment</TableCell>
              <TableCell>URI</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {technologies.map((tech) => (
              <TableRow key={tech._id}>
                <TableCell>{tech.name}</TableCell>
                <TableCell>{tech.quadrant}</TableCell>
                <TableCell>{tech.ring}</TableCell>
                <TableCell>{tech.description}</TableCell>
                <TableCell>{tech.source}</TableCell>
                <TableCell>{tech.date_of_assessment ? tech.date_of_assessment.slice(0, 10) : ''}</TableCell>
                <TableCell>{tech.uri ? <a href={tech.uri} target="_blank" rel="noopener noreferrer">{tech.uri}</a> : ''}</TableCell>
                <TableCell>
                  <Button 
                    size="small" 
                    onClick={() => handleEdit(tech)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={() => handleDelete(tech._id!)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Technologies; 