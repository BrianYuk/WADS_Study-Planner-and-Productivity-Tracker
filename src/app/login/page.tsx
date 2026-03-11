'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Enter a valid email address.'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid email or password.'); return }
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
        .page{min-height:100vh;display:flex;position:relative;}
        .left{flex:1;display:flex;flex-direction:column;justify-content:center;padding:60px;position:relative;z-index:1;}
        .logo{display:flex;align-items:center;gap:10px;text-decoration:none;margin-bottom:50px;}
        .logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;}
        .logo-text{font-size:16px;font-weight:800;color:#f1f5f9;}
        .logo-text span{color:#f59e0b;}
        .left h1{font-size:clamp(28px,3.5vw,48px);font-weight:900;line-height:1.1;letter-spacing:-0.03em;margin-bottom:14px;}
        .left h1 em{color:#f59e0b;font-style:normal;}
        .left p{font-size:15px;color:#64748b;line-height:1.65;max-width:380px;margin-bottom:36px;}
        .pill{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:12px 15px;max-width:350px;margin-bottom:10px;}
        .pill-ic{font-size:20px;width:28px;text-align:center;}
        .pill-t{font-size:13px;color:#94a3b8;}
        .pill-t strong{color:#f1f5f9;display:block;font-size:14px;margin-bottom:1px;}
        .right{width:460px;flex-shrink:0;display:flex;align-items:center;justify-content:center;padding:40px;position:relative;z-index:1;}
        .card{width:100%;background:rgba(13,16,26,.92);border:1px solid rgba(255,255,255,.1);border-radius:22px;padding:36px;backdrop-filter:blur(20px);box-shadow:0 32px 80px rgba(0,0,0,.6);}
        .card-title{font-size:22px;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;}
        .card-sub{font-size:13px;color:#64748b;margin-bottom:24px;}
        .card-sub a{color:#f59e0b;font-weight:600;text-decoration:none;}
        .err{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:10px;padding:10px 14px;font-size:13px;color:#fca5a5;margin-bottom:14px;display:flex;align-items:center;gap:8px;}
        .f-group{margin-bottom:16px;}
        .f-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#475569;margin-bottom:7px;}
        .f-wrap{position:relative;}
        .f-icon{position:absolute;left:13px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none;opacity:.4;}
        .f-input{width:100%;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.09);border-radius:11px;padding:13px 40px;color:#f1f5f9;font-family:'DM Sans',sans-serif;font-size:16px;outline:none;transition:border-color .2s,box-shadow .2s;}
        .f-input::placeholder{color:#2d3748;}
        .f-input:focus{border-color:#f59e0b;box-shadow:0 0 0 3px rgba(245,158,11,.1);}
        .f-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#475569;cursor:pointer;font-size:16px;padding:6px;}
        .forgot{display:block;text-align:right;font-size:12px;color:#475569;cursor:pointer;margin-top:5px;}
        .submit{width:100%;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;border-radius:12px;padding:14px;color:#000;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-top:6px;transition:all .2s;}
        .submit:disabled{opacity:.6;cursor:not-allowed;}
        .submit:not(:disabled):hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(245,158,11,.35);}
        .divider{display:flex;align-items:center;gap:10px;margin:20px 0;color:#334155;font-size:12px;}
        .divider::before,.divider::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.07);}
        .demo{width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:11px;padding:12px;color:#94a3b8;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;}
        .demo:hover{background:rgba(255,255,255,.08);color:#f1f5f9;}
        .bottom{text-align:center;font-size:13px;color:#475569;margin-top:16px;}
        .bottom a{color:#f59e0b;font-weight:600;text-decoration:none;}
        .spin{width:16px;height:16px;border:2px solid rgba(0,0,0,.3);border-top-color:#000;border-radius:50%;animation:spin .7s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @media(max-width:640px){.left{display:none;}.right{width:100%;padding:24px 16px;min-height:100vh;align-items:flex-start;padding-top:80px;}.page{flex-direction:column;}}
      `}</style>
      <div className="blob blob1"/><div className="blob blob2"/><div className="bg-grid"/>
      <div style={{position:'fixed',top:16,left:16,zIndex:100}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:8,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:9,padding:'7px 13px',fontSize:13,fontWeight:600,color:'#94a3b8',textDecoration:'none'}}>← Back</Link>
      </div>
      <div className="page">
        <div className="left">
          <Link href="/" className="logo"><div className="logo-icon">⚡</div><div className="logo-text">Kira<span>Flow</span></div></Link>
          <h1>Study smarter,<br/>not <em>harder.</em></h1>
          <p>AI-powered task prioritization, burnout detection, and smart scheduling — built for students who want to make every session count.</p>
          {[{ic:'🤖',t:'AI Task Prioritization',d:'GPT-4 ranks by urgency & importance'},{ic:'🔥',t:'Burnout Detection',d:'Get alerted before you hit the wall'},{ic:'📊',t:'Analytics',d:'Track focus, streaks & patterns'}].map(p=>(
            <div key={p.t} className="pill"><div className="pill-ic">{p.ic}</div><div className="pill-t"><strong>{p.t}</strong>{p.d}</div></div>
          ))}
        </div>
        <div className="right">
          <div className="card">
            <div className="card-title">Welcome back 👋</div>
            <div className="card-sub">No account? <Link href="/register">Sign up free</Link></div>
            {error && <div className="err"><span>⚠️</span><span>{error}</span></div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="f-group">
                <label className="f-label">Email Address</label>
                <div className="f-wrap"><span className="f-icon">✉️</span><input className="f-input" type="email" placeholder="you@student.binus.ac.id" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email"/></div>
              </div>
              <div className="f-group">
                <label className="f-label">Password</label>
                <div className="f-wrap"><span className="f-icon">🔒</span><input className="f-input" type={showPwd?'text':'password'} placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/><button type="button" className="f-eye" onClick={()=>setShowPwd(!showPwd)}>{showPwd?'🙈':'👁️'}</button></div>
                <span className="forgot">Forgot password?</span>
              </div>
              <button type="submit" className="submit" disabled={loading}>{loading?<><div className="spin"/>Signing in...</>:'Sign In →'}</button>
            </form>
            <div className="divider">or</div>
            <button className="demo" onClick={()=>{setEmail('demo@kiraflow.app');setPassword('Demo1234!')}}>🎮 Fill Demo Credentials</button>
            <div className="bottom">New here? <Link href="/register">Create a free account</Link></div>
          </div>
        </div>
      </div>
    </>
  )
}
