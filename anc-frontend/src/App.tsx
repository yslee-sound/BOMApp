import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography } from '@mui/material';
import ProjectList from './components/ProjectList';
import HouseList from './components/HouseList';
import SurveyForm from './components/SurveyForm';
import DesignView from './components/DesignView';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              ANC 자동 설계 시스템
            </Typography>
          </Toolbar>
        </AppBar>

        <Routes>
          <Route path="/" element={<ProjectList />} />
          <Route path="/projects/:projectId" element={<HouseList />} />
          <Route path="/houses/:houseId" element={<SurveyForm />} />
          <Route path="/houses/:houseId/design" element={<DesignView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
