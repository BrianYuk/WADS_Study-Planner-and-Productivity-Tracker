import Link from 'next/link'

export default function LandingPage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        body{background:#090b12;color:#f1f5f9;font-family:'DM Sans',sans-serif;-webkit-tap-highlight-color:transparent;overflow-x:hidden;}
        .blob{position:fixed;border-radius:50%;filter:blur(90px);opacity:.08;pointer-events:none;z-index:0;}
        .blob1{width:600px;height:600px;background:#f59e0b;top:-200px;left:-200px;}
        .blob2{width:500px;height:500px;background:#6366f1;bottom:-150px;right:-150px;}
        .bg-grid{position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;z-index:0;}
        nav{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:0 60px;height:66px;background:rgba(9,11,18,.88);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.08);}
        .nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;}
        .logo-icon{width:36px;height:36px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;}
        .logo-text{font-size:16px;font-weight:800;color:#f1f5f9;}
        .logo-text span{color:#f59e0b;}
        .nav-links{display:flex;gap:8px;}
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 16px;border-radius:9px;font-size:13px;font-weight:600;text-decoration:none;transition:all .18s;white-space:nowrap;}
        .btn-ghost{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);color:#94a3b8;}
        .btn-ghost:hover{background:rgba(255,255,255,.09);color:#f1f5f9;}
        .btn-amber{background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;}
        .btn-cta{background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;padding:14px 32px;border-radius:13px;font-size:16px;font-weight:700;}
        .btn-cta:hover{transform:translateY(-2px);box-shadow:0 8px 32px rgba(245,158,11,.4);}
        .btn-outline{background:transparent;border:1px solid rgba(245,158,11,.4);color:#f59e0b;padding:14px 28px;border-radius:13px;font-size:16px;font-weight:700;}
        .hero{padding:110px 60px 80px;text-align:center;position:relative;z-index:1;}
        .hero-badge{display:inline-flex;align-items:center;gap:6px;background:rgba(245,158,11,.1);border:1px solid rgba(245,158,11,.25);border-radius:100px;padding:5px 14px;font-size:11px;font-weight:700;color:#f59e0b;letter-spacing:.05em;text-transform:uppercase;margin-bottom:24px;}
        .hero-h1{font-size:clamp(36px,6vw,72px);font-weight:900;line-height:1.05;letter-spacing:-0.04em;margin-bottom:20px;}
        .grd{background:linear-gradient(135deg,#f59e0b,#fbbf24);-webkit-background-clip:text;-webkit-text-fill-color:transparent;}
        .hero-p{font-size:17px;color:#64748b;line-height:1.65;max-width:500px;margin:0 auto 40px;}
        .hero-btns{display:flex;gap:12px;justify-content:center;margin-bottom:60px;flex-wrap:wrap;}
        .stats-row{display:flex;gap:48px;justify-content:center;flex-wrap:wrap;}
        .stat-n{font-size:26px;font-weight:900;font-family:'DM Mono',monospace;}
        .stat-n span{color:#f59e0b;}
        .stat-l{font-size:11px;color:#475569;margin-top:2px;}
        .feats{padding:80px 60px;position:relative;z-index:1;}
        .feats-title{font-size:clamp(28px,4vw,42px);font-weight:800;letter-spacing:-0.03em;text-align:center;margin-bottom:50px;}
        .feats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;max-width:1050px;margin:0 auto;}
        .feat-c{background:rgba(15,18,28,.7);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:26px;transition:all .25s;}
        .feat-c:hover{border-color:rgba(245,158,11,.28);transform:translateY(-4px);}
        .feat-em{font-size:28px;margin-bottom:14px;display:block;}
        .feat-h{font-size:16px;font-weight:700;margin-bottom:7px;}
        .feat-p{font-size:13px;color:#64748b;line-height:1.6;}
        .tag{display:inline-flex;align-items:center;gap:4px;margin-top:12px;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;}
        .tag-ai{background:rgba(99,102,241,.15);color:#a78bfa;}
        .tag-core{background:rgba(16,185,129,.12);color:#6ee7b7;}
        .tag-sec{background:rgba(239,68,68,.12);color:#fca5a5;}
        .ai-sect{background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(245,158,11,.05));border-top:1px solid rgba(255,255,255,.07);border-bottom:1px solid rgba(255,255,255,.07);padding:80px 60px;position:relative;z-index:1;}
        .ai-inner{max-width:950px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;}
        .ai-t h2{font-size:clamp(26px,3.5vw,40px);font-weight:800;letter-spacing:-0.03em;margin-bottom:14px;}
        .ai-t p{font-size:14px;color:#64748b;line-height:1.7;margin-bottom:22px;}
        .ai-row{display:flex;align-items:flex-start;gap:10px;margin-bottom:12px;}
        .ai-dot{width:7px;height:7px;border-radius:50%;background:#f59e0b;margin-top:6px;flex-shrink:0;}
        .ai-txt{font-size:13px;color:#94a3b8;}
        .ai-txt strong{color:#f1f5f9;display:block;}
        .ai-preview{background:rgba(13,16,26,.9);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:22px;}
        .ap-hdr{display:flex;align-items:center;gap:8px;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.07);}
        .ap-dot{width:9px;height:9px;border-radius:50%;}
        .ap-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.04);}
        .ap-rank{font-family:'DM Mono',monospace;font-size:11px;color:#f59e0b;font-weight:700;width:22px;}
        .ap-name{flex:1;font-size:13px;font-weight:600;}
        .ap-score{font-family:'DM Mono',monospace;font-size:11px;padding:2px 8px;border-radius:6px;font-weight:600;}
        .land-cta{text-align:center;padding:100px 20px;position:relative;z-index:1;}
        .land-cta h2{font-size:clamp(30px,5vw,54px);font-weight:900;letter-spacing:-0.03em;margin-bottom:14px;}
        .land-cta p{font-size:16px;color:#64748b;margin-bottom:38px;}
        footer{border-top:1px solid rgba(255,255,255,.07);padding:24px 60px;display:flex;justify-content:space-between;position:relative;z-index:1;}
        footer span{font-size:12px;color:#2d3748;}
        @media(max-width:900px){nav{padding:0 20px;}.hero{padding:80px 20px 60px;}.feats{padding:60px 20px;}.feats-grid{grid-template-columns:1fr 1fr;}.ai-sect{padding:60px 20px;}.ai-inner{grid-template-columns:1fr;}.ai-preview{display:none;}footer{padding:20px;flex-direction:column;gap:6px;align-items:center;}}
        @media(max-width:600px){nav{padding:0 16px;height:58px;}.hero{padding:70px 16px 48px;}.hero-p{font-size:15px;}.hero-btns{flex-direction:column;align-items:center;}.btn-cta,.btn-outline{width:100%;max-width:300px;}.feats{padding:48px 16px;}.feats-grid{grid-template-columns:1fr;}.land-cta{padding:60px 16px;}}
      `}</style>
      <div className="blob blob1"/><div className="blob blob2"/><div className="bg-grid"/>
      <nav>
        <Link href="/" className="nav-logo"><div className="logo-icon">⚡</div><div className="logo-text">Kira<span>Flow</span></div></Link>
        <div className="nav-links">
          <Link href="/login" className="btn btn-ghost">Sign In</Link>
          <Link href="/register" className="btn btn-amber">Get Started →</Link>
        </div>
      </nav>
      <div className="hero">
        <div className="hero-badge">✨ AI-Powered · Built for Students</div>
        <h1 className="hero-h1">Your AI study partner.<br/><span className="grd">Plan. Focus. Achieve.</span></h1>
        <p className="hero-p">Smart task prioritization, burnout detection, and adaptive scheduling — study smarter and stress less.</p>
        <div className="hero-btns">
          <Link href="/register" className="btn btn-cta">Start for free →</Link>
          <Link href="/login" className="btn btn-outline">Sign in</Link>
        </div>
        <div className="stats-row">
          <div><div className="stat-n">3<span>+</span></div><div className="stat-l">AI features</div></div>
          <div><div className="stat-n">100<span>%</span></div><div className="stat-l">Free to use</div></div>
          <div><div className="stat-n">24<span>/7</span></div><div className="stat-l">Available</div></div>
        </div>
      </div>
      <div className="feats">
        <div className="feats-title">Built for academic success</div>
        <div className="feats-grid">
          {[{em:'🤖',h:'AI Task Prioritization',p:'GPT-4 scores tasks by urgency, importance, and effort.',tag:'tag-ai',tl:'🤖 AI'},{em:'🔥',h:'Burnout Detection',p:'AI monitors 7-day patterns and alerts you early.',tag:'tag-ai',tl:'🤖 AI'},{em:'📅',h:'Smart Scheduling',p:'AI generates optimized weekly plans for you.',tag:'tag-ai',tl:'🤖 AI'},{em:'⏱',h:'Study Timer',p:'Pomodoro, deep work, and break modes built in.',tag:'tag-core',tl:'✅ Core'},{em:'📊',h:'Analytics',p:'Track hours, focus, streaks and subject breakdowns.',tag:'tag-core',tl:'✅ Core'},{em:'🔒',h:'Secure by Design',p:'JWT auth, rate limiting, and input sanitization.',tag:'tag-sec',tl:'🔒 Security'}].map(f=>(
            <div key={f.h} className="feat-c"><span className="feat-em">{f.em}</span><div className="feat-h">{f.h}</div><div className="feat-p">{f.p}</div><span className={`tag ${f.tag}`}>{f.tl}</span></div>
          ))}
        </div>
      </div>
      <div className="ai-sect">
        <div className="ai-inner">
          <div className="ai-t">
            <div style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.1em',color:'#f59e0b',marginBottom:10}}>AI Intelligence</div>
            <h2>Let AI handle the hard decisions</h2>
            <p>Stop wasting energy deciding what to study next. Our AI ranks your task list in seconds with clear reasoning.</p>
            {[{title:'Urgency + Importance scoring',desc:'Weighs due dates, priority tags, and effort.'},{title:'Burnout risk monitoring',desc:'Tracks 7-day patterns: hours, focus, completion.'},{title:'Schedule optimization',desc:'Applies spaced repetition and cognitive load balancing.'}].map(f=>(
              <div key={f.title} className="ai-row"><div className="ai-dot"/><div className="ai-txt"><strong>{f.title}</strong>{f.desc}</div></div>
            ))}
          </div>
          <div className="ai-preview">
            <div className="ap-hdr"><div className="ap-dot" style={{background:'#ef4444'}}/><div className="ap-dot" style={{background:'#f59e0b'}}/><div className="ap-dot" style={{background:'#10b981'}}/><span style={{fontSize:12,fontWeight:700,color:'#94a3b8',marginLeft:4}}>🤖 AI Priority Queue</span></div>
            {[{rank:'#1',name:'Data Structures',score:'0.94',bg:'rgba(239,68,68,.15)',color:'#fca5a5'},{rank:'#2',name:'Calculus PS',score:'0.81',bg:'rgba(245,158,11,.15)',color:'#f59e0b'},{rank:'#3',name:'Essay Draft',score:'0.58',bg:'rgba(99,102,241,.15)',color:'#a78bfa'},{rank:'#4',name:'Physics Lab',score:'0.41',bg:'rgba(16,185,129,.15)',color:'#6ee7b7'}].map(t=>(
              <div key={t.rank} className="ap-row" style={{borderBottom:t.rank==='#4'?'none':undefined}}><div className="ap-rank">{t.rank}</div><div className="ap-name">{t.name}</div><div className="ap-score" style={{background:t.bg,color:t.color}}>{t.score}</div></div>
            ))}
            <div style={{marginTop:12,fontSize:11,color:'#334155',fontFamily:"'DM Mono',monospace"}}>✓ GPT-4o-mini · 1.2s</div>
          </div>
        </div>
      </div>
      <div className="land-cta">
        <h2>Ready to study smarter?</h2>
        <p>Join now — it&apos;s completely free.</p>
        <Link href="/register" className="btn btn-cta" style={{display:'inline-flex'}}>Create free account →</Link>
      </div>
      <footer><span>© 2026 Kira Flow · BINUS University International · COMP6703001</span><span>Built with Next.js · PostgreSQL · OpenAI</span></footer>
    </>
  )
}
