import React, { useEffect, useState } from 'react'

const Card = ({children}) => (
  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">{children}</div>
)

export default function AdminPanel(){
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({
    faculty_id: '',
    name: '',
    phone_number: '',
    password: '',
    department: 'H&S',
    role: 'faculty',
    cl_balance: '',
    ml_balance: '',
  })
  const [bulkInput, setBulkInput] = useState('')
  const [bulkError, setBulkError] = useState('')

  useEffect(()=>{
    fetch('/api/admin/users', { credentials:'include' })
      .then(r=>r.json()).then(d=> setUsers(d.users || []))
  }, [])

  function handleChange(event){
    const { name, value } = event.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event){
    event.preventDefault()
    fetch('/api/admin/create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    }).then(async res => {
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        return alert(data.error || 'Unable to create user')
      }
      const created = await res.json().catch(() => ({}))
      setUsers(prev => [...prev, { ...form, is_active: true }])
      setForm({
        faculty_id: '',
        name: '',
        phone_number: '',
        password: '',
        department: 'H&S',
        role: 'faculty',
        cl_balance: '',
        ml_balance: '',
      })
      return created
    })
  }

  function parseBulkInput(input) {
    const trimmed = input.trim()
    if (!trimmed) return []
    if (trimmed.startsWith('[')) {
      return JSON.parse(trimmed)
    }

    const rows = trimmed.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    if (!rows.length) return []

    const header = rows[0].split(',').map(cell => cell.trim().toLowerCase())
    const expectedOrder = ['faculty_id','name','phone_number','password','department','role','cl_balance','ml_balance']
    const hasHeader = expectedOrder.every(key => header.includes(key))
    const records = []

    if (hasHeader) {
      const fieldNames = header
      rows.slice(1).forEach((row, index) => {
        const values = row.split(',').map(value => value.trim())
        const record = {}
        fieldNames.forEach((field, colIndex) => {
          record[field] = values[colIndex] || ''
        })
        records.push(record)
      })
    } else {
      rows.forEach((row, rowIndex) => {
        const values = row.split(',').map(value => value.trim())
        if (values.length < expectedOrder.length) {
          throw new Error(`Row ${rowIndex + 1} must have ${expectedOrder.length} values`) 
        }
        const record = {}
        expectedOrder.forEach((field, colIndex) => {
          record[field] = values[colIndex] || ''
        })
        records.push(record)
      })
    }

    return records.map(r => ({
      faculty_id: r.faculty_id,
      name: r.name,
      phone_number: r.phone_number,
      password: r.password,
      department: r.department,
      role: r.role,
      cl_balance: r.cl_balance || 0,
      ml_balance: r.ml_balance || 0,
    }))
  }

  async function handleBulkSubmit(event) {
    event.preventDefault()
    setBulkError('')
    let usersToCreate
    try {
      usersToCreate = parseBulkInput(bulkInput)
      if (!usersToCreate.length) {
        setBulkError('No valid staff records found in bulk input.')
        return
      }
    } catch (error) {
      setBulkError(error.message)
      return
    }

    const res = await fetch('/api/admin/create_bulk', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: usersToCreate }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setBulkError(data.error || 'Unable to import users')
      return
    }

    const data = await res.json().catch(() => ({}))
    setUsers(prev => [...prev, ...(data.created || usersToCreate)])
    setBulkInput('')
  }

  function toggle(id){
    fetch('/api/admin/toggle_active', { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ faculty_id: id })})
      .then(()=> setUsers(u => u.map(x=> x.faculty_id===id? {...x, is_active: !x.is_active} : x)))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">HR / Admin Panel</h3>
              <p className="text-sm text-slate-500">Manage faculty records and term resets</p>
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Create / Onboard Faculty</h4>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input value={form.faculty_id} onChange={handleChange} name="faculty_id" placeholder="FAC-CSE-102" className="p-2 border border-slate-100 rounded-lg" />
              <input value={form.name} onChange={handleChange} name="name" placeholder="Full name" className="p-2 border border-slate-100 rounded-lg" />
              <input value={form.phone_number} onChange={handleChange} name="phone_number" placeholder="Phone" className="p-2 border border-slate-100 rounded-lg" />
              <input value={form.password} onChange={handleChange} name="password" placeholder="Password" type="password" className="p-2 border border-slate-100 rounded-lg" />
              <select value={form.department} onChange={handleChange} name="department" className="p-2 border border-slate-100 rounded-lg">
                <option value="H&S">H&S</option>
                <option value="CSE">CSE</option>
                <option value="CSM">CSM</option>
              </select>
              <select value={form.role} onChange={handleChange} name="role" className="p-2 border border-slate-100 rounded-lg">
                <option value="faculty">faculty</option>
                <option value="hod">hod</option>
                <option value="principal">principal</option>
                <option value="admin">admin</option>
              </select>
              <input value={form.cl_balance} onChange={handleChange} name="cl_balance" placeholder="CL balance" className="p-2 border border-slate-100 rounded-lg" />
              <input value={form.ml_balance} onChange={handleChange} name="ml_balance" placeholder="ML balance" className="p-2 border border-slate-100 rounded-lg" />
              <div className="flex items-center gap-2"><button type="submit" className="py-2 px-4 bg-[#7C3AED] text-white rounded-lg">Create</button></div>
            </form>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium mb-2">Bulk Onboard Staff</h4>
            <p className="text-xs text-slate-500 mb-2">Paste CSV rows or a JSON array. CSV header may be included or rows may use this exact order:</p>
            <pre className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg mb-3 overflow-x-auto">faculty_id,name,phone_number,password,department,role,cl_balance,ml_balance</pre>
            <form onSubmit={handleBulkSubmit} className="space-y-3">
              <textarea
                value={bulkInput}
                onChange={e => setBulkInput(e.target.value)}
                placeholder="FAC-CSE-102,John Doe,9000000123,password,CSE,faculty,12,6"
                className="w-full p-3 border border-slate-100 rounded-lg min-h-[180px]"
              />
              {bulkError ? <div className="text-sm text-red-600">{bulkError}</div> : null}
              <button type="submit" className="py-2 px-4 bg-[#7C3AED] text-white rounded-lg">Import Staff</button>
            </form>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Faculty Directory</h4>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.faculty_id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{u.name} — {u.faculty_id}</div>
                    <div className="text-xs text-slate-500">{u.department} • {u.role} • {u.is_active? 'Active' : 'Inactive'}</div>
                  </div>
                  <div>
                    <button onClick={()=>toggle(u.faculty_id)} className="py-1 px-3 rounded-lg border">Toggle Active</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div>
        <Card>
          <h4 className="text-sm font-semibold">Global Term Reset</h4>
          <form className="space-y-2 mt-3">
            <input name="default_cl" placeholder="Default CL (12)" className="w-full p-2 border border-slate-100 rounded-lg" />
            <input name="default_ml" placeholder="Default ML (6)" className="w-full p-2 border border-slate-100 rounded-lg" />
            <button className="w-full py-2 rounded-lg bg-[#7C3AED] text-white">Reset Balances</button>
          </form>
        </Card>
      </div>
    </div>
  )
}
