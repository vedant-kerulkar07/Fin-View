import React from 'react'
import AuthLayout from './layouts/AuthLayout'
import SignIn from './pages/SignIn'
import { Route, Routes } from 'react-router-dom'
import SignUp from './pages/SignUp'
import Success from './components/LogInSuccess'
import ForgotPassword from './pages/ForgotPassword'
import ResetPasswordSuccess from './components/ResetPasswordSuccess'
import BudgetOnboardingSinglePage from './pages/AccountSetup'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import LogoutSuccess from './components/LogoutSuccess'
import NotificationsPage from './Notification/Notification'
import ProfilePage from './pages/Profile'
import Analytics from './pages/Analytics'
import SmartForecasting from './pages/smartforcasting'
import TransactionsPage from './components/Transaction'

const App = () => {
  return (
    <Routes>
       <Route element={<AuthLayout />}>
       <Route path="/" element={<SignIn />} />
        <Route path="/register" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password-success" element={<ResetPasswordSuccess />} />
        <Route path="/Success" element={<Success />} />
        <Route path="/LogoutSuccess" element={<LogoutSuccess />} />
        <Route path="/AccountSetup" element={<BudgetOnboardingSinglePage />} />
      </Route>

      <Route path="/dashboard" element={<MainLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/dashboard/notifications" element={<NotificationsPage />} />
        <Route path="/dashboard/profile" element={<ProfilePage />} />
        <Route path="/dashboard/analytics" element={<Analytics />} />
        <Route path="/dashboard/smartforecasting" element={<SmartForecasting />} />
        <Route path="/dashboard/transaction" element={<TransactionsPage />} />
      </Route>
    </Routes>
  )
}

export default App
