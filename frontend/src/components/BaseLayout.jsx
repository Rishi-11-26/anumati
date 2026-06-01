import React, { useEffect, useState } from 'react'
import logoPath from '../assets/ngit-logo.png'
import { useNavigate } from 'react-router-dom'

export default function BaseLayout({ children }){
  const [user, setUser] = useState(null)
  const [notifCount, setNotifCount] = useState(0)
  const navigate = useNavigate()

  useEffect(()=>{
    fetch('/api/me', { credentials: 'include' })
      .then(r => r.json()).then(data => {
        if (data.user) setUser(data.user)
      })
  }, [])

  function handleLogout(){
    fetch('/api/logout', { method: 'POST', credentials: 'include' })
      .then(()=>{ setUser(null); navigate('/') })
  }

  return (
    <div>
      <header className="bg-white shadow-sm border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img src={logoPath} alt="NGIT logo" className="h-24 w-auto rounded-md shadow-xl" />
            <div className="text-5xl md:text-6xl font-extrabold text-[#7C3AED] tracking-tight">Anumati</div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-end">
            {user ? (
              <>
                <div className="relative">
                  <button className="relative p-2 rounded-full bg-slate-50 hover:bg-slate-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    <span className="absolute -top-1 -right-1 bg-[#7C3AED] text-white text-xs rounded-full px-1">{notifCount||''}</span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center">{user.faculty_id?.split('-')?.pop?.() || 'ID'}</div>
                  <div className="text-sm text-slate-600">{user.name}</div>
                  <button onClick={handleLogout} className="text-sm text-[#7C3AED] hover:underline">Logout</button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {React.cloneElement(children, { user })}
      </main>

      <footer className="bg-white border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col items-center text-center gap-3 text-sm text-slate-500">
          <div>© {new Date().getFullYear()} Teleparadigm Networks Pvt. Ltd. All rights reserved.</div>
        </div>
      </footer>
    </div>
  )
}

