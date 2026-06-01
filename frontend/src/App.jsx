import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import Login from './components/Login'
import FacultyDashboard from './components/FacultyDashboard'
import HODDashboard from './components/HODDashboard'
import PrincipalDashboard from './components/PrincipalDashboard'
import AdminPanel from './components/AdminPanel'
import BaseLayout from './components/BaseLayout'

export default function App(){
  return (
    <Routes>
      <Route path="/" element={<BaseLayout><Login/></BaseLayout>} />
      <Route path="/faculty" element={<BaseLayout><FacultyDashboard/></BaseLayout>} />
      <Route path="/hod" element={<BaseLayout><HODDashboard/></BaseLayout>} />
      <Route path="/principal" element={<BaseLayout><PrincipalDashboard/></BaseLayout>} />
      <Route path="/admin" element={<BaseLayout><AdminPanel/></BaseLayout>} />
    </Routes>
  )
}
