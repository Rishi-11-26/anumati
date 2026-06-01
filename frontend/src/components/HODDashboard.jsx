import React, { useEffect, useState } from 'react'

const Card = ({children}) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">{children}</div>
)

export default function HODDashboard({ user }){
  const [pending, setPending] = useState([])
  const [notifCount, setNotifCount] = useState(0)
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [passwordMessage, setPasswordMessage] = useState('')
  useEffect(()=>{
    fetch('/api/hod/pending', { credentials:'include' })
      .then(r=>r.json()).then(d=>{
        const list = d.pending || []
        setPending(list)
        setNotifCount(list.length)
      })
  }, [])

  function handlePasswordChangeInput(event){
    const { name, value } = event.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
  }

  async function handlePasswordChangeSubmit(event){
    event.preventDefault()
    setPasswordMessage('')
    const res = await fetch('/api/change_password', {
      method:'POST',
      credentials:'include',
      headers:{'Content-Type':'application/json'},
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

  function act(leave_id, action){
    fetch('/api/hod/action', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ leave_id, action, remarks: action==='reject'? 'Rejected by HOD' : '' })})
      .then(()=> setPending(p => p.filter(x=>x.leave_id!==leave_id)))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">{user?.department} — HOD Queue</h3>
              <p className="text-sm text-slate-500">Pending recommendations</p>
            </div>
            <div className="text-sm text-slate-600">Notifications: <span className="font-semibold text-[#7C3AED]">{notifCount}</span></div>
          </div>

          {pending.length? (
            <div className="space-y-4">
              {pending.map(l => (
                <div key={l.leave_id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium">{l.leave_type} — {l.start_date} to {l.end_date} ({l.total_days} days)</div>
                      <div className="text-xs text-slate-500">From: {l.faculty_name} ({l.faculty_id})</div>
                      <div className="mt-2 text-sm text-slate-700">{l.reason}</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={()=>act(l.leave_id, 'recommend')} className="w-40 py-2 rounded-lg bg-[#7C3AED] text-white">Recommend</button>
                      <button onClick={()=>act(l.leave_id, 'reject')} className="w-40 py-2 rounded-lg border border-red-300 text-red-600">Reject</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No pending applications in your department.</div>
          )}
        </Card>
      </div>

      <div>
        <Card>
          <h4 className="text-sm font-semibold">HOD Profile</h4>
          <div className="mt-3 text-sm text-slate-600">{user?.name}</div>
          <div className="mt-2 text-sm text-slate-500">Department: {user?.department}</div>

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
