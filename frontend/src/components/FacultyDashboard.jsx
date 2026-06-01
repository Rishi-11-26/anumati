import React, { useEffect, useState } from 'react'

const Card = ({children}) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">{children}</div>
)

export default function FacultyDashboard({ user }){
  const [leaves, setLeaves] = useState([])
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [passwordMessage, setPasswordMessage] = useState('')

  useEffect(()=>{
    fetch('/api/leaves', { credentials: 'include' })
      .then(r=>r.json()).then(d=> setLeaves(d.leaves || []))
  }, [])

  function handlePasswordChangeInput(event){
    const { name, value } = event.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
  }

  async function handlePasswordChangeSubmit(event){
    event.preventDefault()
    setPasswordMessage('')
    const res = await fetch('/api/change_password', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordForm),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setPasswordMessage(data.error || 'Unable to update password')
      return
    }
    setPasswordMessage('Password updated successfully.')
    setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">My Leave Applications</h3>
              <p className="text-sm text-slate-500">Track status and details of your requests</p>
            </div>
            <a href="/apply" className="text-[#7C3AED] hover:underline">Apply for leave</a>
          </div>

          {leaves.length? (
            <div className="space-y-3">
              {leaves.map(l => (
                <div key={l.leave_id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{l.leave_type} — {l.start_date} to {l.end_date} ({l.total_days} days)</div>
                      <div className="text-xs text-slate-500">Status: <span className="font-semibold text-sm">{l.status}</span></div>
                    </div>
                    <div className="text-sm text-slate-600">Dept: {l.department}</div>
                  </div>
                  <div className="mt-2 text-sm text-slate-700">{l.reason}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No leave applications yet.</div>
          )}
        </Card>
      </div>

      <div>
        <Card>
          <h4 className="text-sm font-semibold">Profile</h4>
          <div className="mt-3 text-sm text-slate-600">{user?.name}</div>
          <div className="mt-2 text-sm text-slate-500">Faculty ID: {user?.faculty_id}</div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">CL Balance</div>
              <div className="text-lg font-semibold text-slate-800">{user?.cl_balance ?? 0}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-xs text-slate-500">ML Balance</div>
              <div className="text-lg font-semibold text-slate-800">{user?.ml_balance ?? 0}</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold mb-3">Change Password</h4>
            <form onSubmit={handlePasswordChangeSubmit} className="space-y-3">
              <input type="password" name="current_password" value={passwordForm.current_password} onChange={handlePasswordChangeInput} placeholder="Current password" className="w-full p-2 border border-slate-100 rounded-lg" />
              <input type="password" name="new_password" value={passwordForm.new_password} onChange={handlePasswordChangeInput} placeholder="New password" className="w-full p-2 border border-slate-100 rounded-lg" />
              <input type="password" name="confirm_password" value={passwordForm.confirm_password} onChange={handlePasswordChangeInput} placeholder="Confirm new password" className="w-full p-2 border border-slate-100 rounded-lg" />
              {passwordMessage ? <div className="text-sm text-slate-600">{passwordMessage}</div> : null}
              <button type="submit" className="w-full py-2 rounded-lg bg-[#7C3AED] text-white">Update Password</button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
