import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InternshipList from './pages/InternshipList';
import RecommendedInternships from './pages/RecommendedInternships';
import CreateInternship from './pages/CreateInternship';
import ManageUsers from './pages/ManageUsers';
import Analytics from './pages/Analytics';
import IntelligentRanking from './pages/IntelligentRanking';
import ResumeIntelligence from './pages/ResumeIntelligence';
import StudentProfile from './pages/student/StudentProfile';
import CompanyProfile from './pages/company/CompanyProfile';
import AdminProfile from './pages/admin/AdminProfile';
import PrivateRoute from './components/PrivateRoute';
import authService from './services/authService';

// Create Material-UI theme
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
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4caf50',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#f44336',
              secondary: '#fff',
            },
          },
        }}
      />
      <Router>
        <Routes>
          {/* Redirect root to dashboard if authenticated, otherwise to login */}
          <Route
            path="/"
            element={
              authService.isAuthenticated() ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/internships"
            element={
              <PrivateRoute>
                <InternshipList />
              </PrivateRoute>
            }
          />
          <Route
            path="/recommendations"
            element={
              <PrivateRoute>
                <RecommendedInternships />
              </PrivateRoute>
            }
          />
          <Route
            path="/internships/create"
            element={
              <PrivateRoute>
                <CreateInternship />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute>
                <ManageUsers />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <PrivateRoute>
                <Analytics />
              </PrivateRoute>
            }
          />
          <Route
            path="/intelligent-ranking"
            element={
              <PrivateRoute>
                <IntelligentRanking />
              </PrivateRoute>
            }
          />
          <Route
            path="/resume-intelligence"
            element={
              <PrivateRoute>
                <ResumeIntelligence />
              </PrivateRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <PrivateRoute>
                <StudentProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/company/profile"
            element={
              <PrivateRoute>
                <CompanyProfile />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <PrivateRoute>
                <AdminProfile />
              </PrivateRoute>
            }
          />

          {/* Redirect old upload-resume route to resume-intelligence */}
          <Route path="/upload-resume" element={<Navigate to="/resume-intelligence" replace />} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
