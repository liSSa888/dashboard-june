import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ReportsPage from './pages/ReportsPage'
import RetakesPage from './pages/RetakesPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import GroupRatingPage from './pages/GroupRatingPage'
import SchedulePage from './pages/SchedulePage'

function PrivateRoute({ children }) {
  const isAuth = localStorage.getItem('isAuth')
  return isAuth ? children : <Navigate to="/login" />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/group/*" element={<GroupRatingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={
        <PrivateRoute>
          <DashboardPage />
        </PrivateRoute>
      } />
      <Route path="/reports" element={
        <PrivateRoute>
          <ReportsPage />
        </PrivateRoute>
      } />
      <Route path="/retakes" element={
        <PrivateRoute>
          <RetakesPage />
        </PrivateRoute>
      } />
      <Route path="/settings" element={
        <PrivateRoute>
          <SettingsPage />
        </PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute>
          <ProfilePage />
        </PrivateRoute>
      } />
      <Route path="/schedule" element={<SchedulePage />} />
    </Routes>
  )
}

export default App