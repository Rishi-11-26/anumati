import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login(){
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    })
    const data = await res.json()
    if (!res.ok){ setError(data.error||'Login failed'); return }
    const role = data.user.role
    if (role === 'faculty') navigate('/faculty')
    else if (role === 'hod') navigate('/hod')
    else if (role === 'principal') navigate('/principal')
    else if (role === 'admin') navigate('/admin')
    else navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-[28px] border border-slate-200 shadow-xl p-6 sm:p-8">
        <h2 className="text-3xl sm:text-4xl font-semibold text-slate-800 mb-2">Welcome to Anumati</h2>
        <p className="text-sm sm:text-base text-slate-500 mb-6">Sign in with your Faculty ID or phone number.</p>
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-600">Faculty ID / Phone</label>
            <input
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              name="identifier"
              autoComplete="username"
              required
              className="mt-2 w-full border border-slate-200 rounded-2xl p-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              placeholder="Faculty ID or Phone"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600">Password</label>
            <input
              value={password}
              onChange={e => setPassword(e.target.value)}
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-2 w-full border border-slate-200 rounded-2xl p-3 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
              placeholder="••••••"
            />
          </div>
          <div>
            <button type="submit" className="w-full py-3.5 rounded-2xl bg-[#7C3AED] hover:bg-[#6b21a8] text-white font-semibold transition">Sign in</button>
          </div>
        </form>
      </div>
    </div>
  )
}
