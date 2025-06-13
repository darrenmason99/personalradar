import React from 'react';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import RadarPage from './components/RadarPage';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <RadarPage />
    </ThemeProvider>
  );
};

export default App; 