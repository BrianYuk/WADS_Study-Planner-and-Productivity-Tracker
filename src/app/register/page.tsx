'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({name:'',email:'',password:'',confirm:''})
  const [terms, setTerms] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showCfm, setShowCfm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string,string>>({})
  const pwd = form.password
  const strength = [pwd.length>=8,/[A-Z]/.test(pwd),/[0-9]/.test(pwd),/[^A-Za-z0-9]/.test(pwd)].filter(Boolean).length
  const strColors = ['','#ef4444','#f59e0b','#3b82f6','#10b981']
  const strLabels = ['','Weak','Fair','Good','Strong']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setFieldErrors({})
    const errs: Record<string,string> = {}
    if (!form.name||form.name.length<2) errs.name='Name must be at least 2 characters.'
    if (!form.email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email='Enter a valid email address.'
    if (!pwd||pwd.length<8) errs.password='Password must be at least 8 characters.'
    else if(!/(?=.*[A-Z])(?=.*[0-9])/.test(pwd)) errs.password='Must include uppercase and number.'
    if (pwd!==form.confirm) errs.confirm='Passwords do not match.'
    if (!terms) { setError('Please accept the Terms of Service.'); return }
    if (Object.keys(errs).length) { setFieldErrors(errs); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:form.name,email:form.email,password:pwd})})
      const data = await res.json()
      if (!res.ok) { setError(data.error||'Registration failed.'); return }
      router.push('/dashboard')
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#090b12;color:#f1f5f9;font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent;}
        .blob{position:fixed;border-radius:50%;filter:blur(80px);opacity:.07;pointer-events:none;z-index:0;}
        .blob1{width:500px;height:500px;background:#f59e0b;top:-150px;left:-150px;}
        .blob2{width:400px;height:400px;background:#6366f1;bottom:-100px;right:-100px;}
        .bg-grid{position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0;}
        .page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:80px 20px 40px;position:relative;z-index:1;}
        .card{width:100%;max-width:490px;background:rgba(13,16,26,.92);border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:36px 32px;backdrop-filter:blur(20px);box-shadow:0 40px 100px rgba(0,0,0,.7);}
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none;margin-bottom:20px;}
        .logo-icon{width:32px;height:32px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:15px;}
        .logo-text{font-size:14px;font-weight:800;color:#f1f5f9;}
        .logo-text span{color:#f59e0b;}
        .title{font-size:22px;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;}
        .sub{font-size:13px;color:#64748b;margin-bottom:22px;}
        .sub a{color:#f59e0b;font-weight:600;text-decoration:none;}
        .err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:10px;padding:10px 14px;font-size:13px;color:#fca5a5;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
        .row2{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
        .f-group{margin-bottom:14px;}
        .f-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#475569;margin-bottom:6px;}
        .f-wrap{position:relative;}
        .f-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none;opacity:.4;}
        .f-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:11px;padding:12px 40px;color:#f1f5f9;font-family:'DM Sans',sans-serif;font-size:16px;outline:none;transition:border-color .2s,box-shadow .2s;}
        .f-input::placeholder{color:#2d3748;}
        .f-input:focus{border-color:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,.1);}
        .f-input.err-f{border-color:#ef4444;}
        .f-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#475569;cursor:pointer;font-size:16px;padding:6px;}
        .ferr{font-size:11px;color:#fca5a5;margin-top:4px;}
        .fok{font-size:11px;color:#6ee7b7;margin-top:4px;}
        .str-tracks{display:flex;gap:4px;margin:6px 0 3px;}
        .str-track{flex:1;height:3px;border-radius:100px;background:rgba(255,255,255,.07);}
        .str-fill{height:100%;border-radius:100px;transition:width .3s;}
        .reqs{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px;}
        .req{font-size:10px;padding:2px 8px;border-radius:100px;}
        .req.met{background:rgba(16,185,129,.15);color:#6ee7b7;}
        .req.unmet{background:rgba(255,255,255,.05);color:#334155;}
        .terms-row{display:flex;align-items:flex-start;gap:10px;margin:14px 0;}
        .terms-row input{accent-color:#f59e0b;margin-top:2px;cursor:pointer;min-width:16px;}
        .terms-txt{font-size:12px;color:#64748b;line-height:1.5;}
        .terms-txt a{color:#f59e0b;text-decoration:none;}
        .submit{width:100%;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:12px;padding:14px;color:#000;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;}
        .submit:disabled{opacity:.6;cursor:not-allowed;}
        .submit:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(245,158,11,.35);}
        .bottom{text-align:center;font-size:13px;color:#475569;margin-top:14px;}
        .bottom a{color:#f59e0b;font-weight:600;text-decoration:none;}
        .spin{width:16px;height:16px;border:2px solid rgba(0,0,0,.3);border-top-color:#000;border-radius:50%;animation:spin .7s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @media(max-width:540px){.page{padding:60px 16px 24px;}.card{padding:24px 18px;border-radius:18px;}.row2{grid-template-columns:1fr;}}
      `}</style>
      <div className="blob blob1"/><div className="blob blob2"/><div className="bg-grid"/>
      <div style={{position:'fixed',top:16,left:16,zIndex:100}}>
        <Link href="/login" style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:9,padding:'7px 13px',fontSize:13,fontWeight:600,color:'#94a3b8',textDecoration:'none'}}>← Sign in</Link>
      </div>
      <div className="page">
        <div className="card">
          <Link href="/" className="logo"><div className="logo-icon">⚡</div><div className="logo-text">Kira<span>Flow</span></div></Link>
          <div className="title">Create your account</div>
          <div className="sub">Already have one? <Link href="/login">Sign in</Link></div>
          {error && <div className="err"><span>⚠️</span><span>{error}</span></div>}
          <form onSubmit={handleSubmit} noValidate>
            <div className="row2">
              <div className="f-group">
                <label className="f-label">Full Name</label>
                <div className="f-wrap"><span className="f-icon">👤</span><input className={`f-input${fieldErrors.name?' err-f':''}`} type="text" placeholder="Aditya Pratama" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} autoComplete="name"/></div>
                {fieldErrors.name && <div className="ferr">⚠ {fieldErrors.name}</div>}
              </div>
              <div className="f-group">
                <label className="f-label">Email</label>
                <div className="f-wrap"><span className="f-icon">✉️</span><input className={`f-input${fieldErrors.email?' err-f':''}`} type="email" placeholder="you@binus.ac.id" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} autoComplete="email"/></div>
                {fieldErrors.email && <div className="ferr">⚠ {fieldErrors.email}</div>}
              </div>
            </div>
            <div className="f-group">
              <label className="f-label">Password</label>
              <div className="f-wrap"><span className="f-icon">🔒</span><input className={`f-input${fieldErrors.password?' err-f':''}`} type={showPwd?'text':'password'} placeholder="Min. 8 characters" value={pwd} onChange={e=>setForm({...form,password:e.target.value})} autoComplete="new-password"/><button type="button" className="f-eye" onClick={()=>setShowPwd(!showPwd)}>{showPwd?'🙈':'👁️'}</button></div>
              {pwd && (<><div className="str-tracks">{[1,2,3,4].map(i=><div key={i} className="str-track"><div className="str-fill" style={{width:strength>=i?'100%':'0%',background:strColors[strength]}}/></div>)}</div><div style={{fontSize:11,fontWeight:600,color:strColors[strength]}}>{strLabels[strength]}</div><div className="reqs"><span className={`req ${pwd.length>=8?'met':'unmet'}`}>✓ 8+ chars</span><span className={`req ${/[A-Z]/.test(pwd)?'met':'unmet'}`}>✓ Uppercase</span><span className={`req ${/[0-9]/.test(pwd)?'met':'unmet'}`}>✓ Number</span></div></>)}
              {fieldErrors.password && <div className="ferr">⚠ {fieldErrors.password}</div>}
            </div>
            <div className="f-group">
              <label className="f-label">Confirm Password</label>
              <div className="f-wrap"><span className="f-icon">🔐</span><input className={`f-input${fieldErrors.confirm?' err-f':''}`} type={showCfm?'text':'password'} placeholder="Repeat your password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} autoComplete="new-password"/><button type="button" className="f-eye" onClick={()=>setShowCfm(!showCfm)}>{showCfm?'🙈':'👁️'}</button></div>
              {form.confirm && pwd===form.confirm && <div className="fok">✓ Passwords match</div>}
              {fieldErrors.confirm && <div className="ferr">⚠ {fieldErrors.confirm}</div>}
            </div>
            <div className="terms-row"><input type="checkbox" id="terms" checked={terms} onChange={e=>setTerms(e.target.checked)}/><label htmlFor="terms" className="terms-txt">I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.</label></div>
            <button type="submit" className="submit" disabled={loading}>{loading?<><div className="spin"/>Creating account...</>:'Create Account →'}</button>
          </form>
          <div className="bottom">Already have an account? <Link href="/login">Sign in</Link></div>
        </div>
      </div>
    </>
  )
}
