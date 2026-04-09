'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

type Page = 'dashboard'|'tasks'|'timer'|'calendar'|'goals'|'analytics'|'notifications'|'settings'

export default function DashboardPage() {
  const router = useRouter()
  const [page, setPage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerRemain, setTimerRemain] = useState(1500)
  const [timerTotal, setTimerTotal] = useState(1500)
  const [timerMode, setTimerMode] = useState('Pomodoro')
  const [goalFormOpen, setGoalFormOpen] = useState(false)
  const [notifRead, setNotifRead] = useState(false)
  const [settingsTab, setSettingsTab] = useState('profile')
  const timerRef = useRef<ReturnType<typeof setInterval>|null>(null)

  const titles: Record<Page,string> = {dashboard:'Dashboard',tasks:'Tasks',timer:'Study Timer',calendar:'Calendar',goals:'Goals',analytics:'Analytics',notifications:'Notifications',settings:'Settings'}
  const mainNav: {id:Page,icon:string,label:string,badge?:string}[] = [
    {id:'dashboard',icon:'🏠',label:'Dashboard'},
    {id:'tasks',icon:'✅',label:'Tasks',badge:'4'},
    {id:'timer',icon:'⏱',label:'Timer'},
    {id:'calendar',icon:'📅',label:'Calendar'},
  ]
  const moreNav: {id:Page,icon:string,label:string}[] = [
    {id:'goals',icon:'🎯',label:'Goals'},
    {id:'analytics',icon:'📊',label:'Analytics'},
    {id:'notifications',icon:'🔔',label:'Notifications'},
    {id:'settings',icon:'⚙️',label:'Settings'},
  ]

  function navTo(p: Page) { setPage(p); setSidebarOpen(false); setMoreOpen(false) }

  function formatTime(s: number) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}` }
  const dashOffset = 502 * (1 - timerRemain / timerTotal)

  function toggleTimer() {
    if (timerRunning) { if(timerRef.current) clearInterval(timerRef.current); setTimerRunning(false) }
    else {
      setTimerRunning(true)
      timerRef.current = setInterval(() => {
        setTimerRemain(r => { if (r <= 1) { clearInterval(timerRef.current!); setTimerRunning(false); return 0 } return r-1 })
      }, 1000)
    }
  }
  function resetTimer() { if(timerRef.current) clearInterval(timerRef.current); setTimerRunning(false); setTimerRemain(timerTotal) }
  function setMode(name: string, secs: number) { if(timerRef.current) clearInterval(timerRef.current); setTimerRunning(false); setTimerMode(name); setTimerTotal(secs); setTimerRemain(secs) }
  useEffect(() => () => { if(timerRef.current) clearInterval(timerRef.current) }, [])

  const calEvents: Record<number,{t:string,c:string}[]> = {
    23:[{t:'Calculus PS3',c:'#6366f1'},{t:'Study 9–11AM',c:'#10b981'}],
    24:[{t:'English Essay',c:'#8b5cf6'}],
    25:[{t:'DS Assignment',c:'#ef4444'},{t:'Study Block',c:'#10b981'}],
    26:[{t:'⭐ Today',c:'#f59e0b'},{t:'Physics Lab',c:'#3b82f6'}],
    27:[{t:'DS DUE',c:'#ef4444'}],
    28:[{t:'Free',c:'#475569'}],
    1:[{t:'Math Exam',c:'#ef4444'}],
  }

  const heatLvls = ['#ffffff09','#f59e0b28','#f59e0b55','#f59e0b88','#f59e0b']
  const heatData = [0,1,0,2,3,4,3,2,1,0,1,2,3,4,3,2,1,0,0,1,2,3,4,2,1,0,1,2]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{--bg:#090b12;--sur:#111420;--sur2:#161927;--bdr:rgba(255,255,255,.08);--bdr2:rgba(255,255,255,.12);--amb:#f59e0b;--adim:rgba(245,158,11,.12);--grn:#10b981;--red:#ef4444;--blu:#6366f1;--pur:#8b5cf6;--tx:#f1f5f9;--tx2:#94a3b8;--mut:#475569;--r:14px;--sb:228px;--tb:56px;--bn:60px;}
        body{background:var(--bg);color:var(--tx);font-family:'DM Sans',sans-serif;font-size:14px;height:100vh;overflow:hidden;-webkit-tap-highlight-color:transparent;}
        .app{display:flex;flex-direction:column;height:100vh;height:100dvh;}
        .app-inner{display:flex;flex:1;overflow:hidden;}
        /* Sidebar */
        .sidebar{width:var(--sb);flex-shrink:0;background:var(--sur);border-right:1px solid var(--bdr);display:flex;flex-direction:column;height:100%;overflow:hidden;transition:transform .28s cubic-bezier(.16,1,.3,1);z-index:200;}
        .sb-logo{display:flex;align-items:center;gap:10px;padding:14px 13px 12px;border-bottom:1px solid var(--bdr);flex-shrink:0;}
        .sb-logo-sub{font-size:10px;color:var(--mut);}
        .logo-icon{width:30px;height:30px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;}
        .logo-text{font-size:14px;font-weight:800;color:var(--tx);}
        .logo-text span{color:var(--amb);}
        .sb-nav{flex:1;overflow-y:auto;padding:8px 6px;}
        .sb-sec{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--mut);padding:9px 10px 4px;}
        .sb-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:10px;cursor:pointer;transition:all .15s;color:var(--mut);font-weight:500;font-size:13px;position:relative;user-select:none;margin-bottom:1px;border:none;background:none;width:100%;text-align:left;font-family:inherit;}
        .sb-item:hover{background:rgba(255,255,255,.05);color:var(--tx2);}
        .sb-item.active{background:var(--adim);color:var(--amb);font-weight:600;}
        .sb-item.active::before{content:'';position:absolute;left:0;top:20%;bottom:20%;width:3px;background:var(--amb);border-radius:0 3px 3px 0;}
        .sb-icon{font-size:15px;width:20px;text-align:center;flex-shrink:0;}
        .sb-badge{margin-left:auto;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;}
        .sb-badge-red{background:var(--red);color:#fff;}
        .sb-badge-amb{background:var(--amb);color:#000;}
        .sb-user{padding:11px 10px;border-top:1px solid var(--bdr);display:flex;align-items:center;gap:10px;cursor:pointer;flex-shrink:0;border:none;background:none;width:100%;font-family:inherit;}
        .sb-user:hover{background:rgba(255,255,255,.04);}
        .av{width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#000;flex-shrink:0;}
        .sb-uname{font-size:13px;font-weight:700;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .sb-urole{font-size:11px;color:var(--mut);}
        .online-dot{width:7px;height:7px;border-radius:50%;background:var(--grn);flex-shrink:0;}
        /* Overlay */
        .overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:199;backdrop-filter:blur(2px);}
        .overlay.show{display:block;}
        /* Topbar */
        .topbar{height:var(--tb);border-bottom:1px solid var(--bdr);display:flex;align-items:center;justify-content:space-between;padding:0 16px;flex-shrink:0;background:var(--sur);}
        .tb-left{display:flex;align-items:center;gap:10px;}
        .tb-title{font-size:16px;font-weight:800;letter-spacing:-0.02em;}
        .menu-btn{width:34px;height:34px;background:rgba(255,255,255,.05);border:1px solid var(--bdr2);border-radius:9px;display:none;align-items:center;justify-content:center;cursor:pointer;font-size:16px;border:1px solid var(--bdr2);}
        .tb-right{display:flex;align-items:center;gap:8px;}
        .icon-btn{position:relative;width:34px;height:34px;background:rgba(255,255,255,.05);border:1px solid var(--bdr2);border-radius:9px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;}
        .notif-dot{position:absolute;top:5px;right:5px;width:8px;height:8px;background:var(--red);border-radius:50%;border:2px solid var(--sur);}
        .tb-date{font-size:11px;font-weight:600;background:rgba(255,255,255,.05);border:1px solid var(--bdr2);border-radius:8px;padding:6px 11px;color:var(--tx2);}
        /* Content */
        .main{flex:1;display:flex;flex-direction:column;overflow:hidden;min-width:0;}
        .content{flex:1;overflow-y:auto;padding:18px 16px 90px;}
        /* Pages */
        .dp{display:none;}
        .dp.active{display:block;animation:fadeIn .2s ease;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        /* Cards */
        .card{background:var(--sur2);border:1px solid var(--bdr);border-radius:var(--r);padding:16px;}
        .card-t{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--mut);margin-bottom:12px;}
        .g2{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
        .g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
        .g4{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
        /* Stat card */
        .sc{background:var(--sur2);border:1px solid var(--bdr);border-radius:var(--r);padding:14px 16px;}
        .sc-l{font-size:10px;font-weight:600;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;}
        .sc-v{font-size:24px;font-weight:900;font-family:'DM Mono',monospace;}
        .delta{font-size:10px;margin-top:4px;display:inline-flex;align-items:center;gap:3px;padding:2px 7px;border-radius:100px;font-weight:600;}
        .up{background:rgba(16,185,129,.12);color:var(--grn);}
        .dn{background:rgba(239,68,68,.12);color:var(--red);}
        .pt{height:5px;background:rgba(255,255,255,.06);border-radius:100px;overflow:hidden;}
        .pf{height:100%;border-radius:100px;transition:width .6s ease;}
        /* Badges */
        .badge{font-size:10px;font-weight:700;padding:2px 7px;border-radius:100px;white-space:nowrap;}
        .b-cs{background:rgba(245,158,11,.12);color:var(--amb);}
        .b-math{background:rgba(99,102,241,.15);color:#a78bfa;}
        .b-eng{background:rgba(139,92,246,.15);color:#c4b5fd;}
        .b-sci{background:rgba(16,185,129,.12);color:#6ee7b7;}
        .b-urg{background:rgba(239,68,68,.15);color:#fca5a5;}
        .b-hi{background:rgba(245,158,11,.12);color:var(--amb);}
        .b-med{background:rgba(99,102,241,.12);color:#93c5fd;}
        .b-ai{background:linear-gradient(135deg,rgba(99,102,241,.15),rgba(139,92,246,.15));color:#a78bfa;border:1px solid rgba(99,102,241,.2);}
        .b-done{background:rgba(16,185,129,.12);color:#6ee7b7;}
        /* Buttons */
        .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:8px 14px;border-radius:9px;border:none;cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;transition:all .15s;white-space:nowrap;}
        .btn-amb{background:linear-gradient(135deg,var(--amb),#d97706);color:#000;}
        .btn-amb:active{opacity:.85;}
        .btn-ghost{background:rgba(255,255,255,.05);border:1px solid var(--bdr2);color:var(--tx2);}
        .btn-ghost:active{background:rgba(255,255,255,.09);}
        .btn-ai{background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;}
        .btn-red{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.25);color:#fca5a5;}
        /* AI Banner */
        .ai-banner{background:linear-gradient(135deg,rgba(30,27,75,.9),rgba(49,46,129,.6),rgba(22,25,39,.9));border:1px solid rgba(99,102,241,.25);border-radius:var(--r);padding:14px 16px;margin-bottom:16px;display:flex;align-items:center;gap:14px;}
        .ai-icon{width:40px;height:40px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;}
        .risk-pill{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;margin-top:6px;background:rgba(16,185,129,.12);color:#6ee7b7;}
        /* Task items */
        .task-item{display:flex;align-items:center;gap:10px;padding:11px 13px;background:var(--sur2);border:1px solid var(--bdr);border-radius:11px;margin-bottom:7px;cursor:pointer;transition:all .15s;}
        .task-item:active{border-color:rgba(245,158,11,.25);}
        .chk{width:18px;height:18px;border-radius:5px;border:2px solid var(--bdr2);flex-shrink:0;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;min-width:18px;}
        .chk.done{background:var(--grn);border-color:var(--grn);color:#fff;font-size:10px;}
        .ti-info{flex:1;min-width:0;}
        .ti-title{font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .ti-meta{display:flex;align-items:center;gap:5px;margin-top:3px;flex-wrap:wrap;}
        .ti-due{font-size:11px;color:var(--mut);flex-shrink:0;}
        .ti-due.urg{color:var(--red);}
        /* Bar chart */
        .bar-chart{display:flex;align-items:flex-end;gap:5px;height:80px;padding-top:6px;}
        .bw{flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;}
        .bar{width:100%;border-radius:3px 3px 0 0;min-height:3px;}
        .blbl{font-size:9px;color:var(--mut);font-family:'DM Mono',monospace;}
        /* Heatmap */
        .heatmap{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;}
        .hm-c{aspect-ratio:1;border-radius:3px;}
        /* Toggle */
        .toggle{position:relative;width:40px;height:22px;flex-shrink:0;}
        .toggle input{opacity:0;width:0;height:0;}
        .tslider{position:absolute;inset:0;background:rgba(255,255,255,.1);border-radius:100px;cursor:pointer;transition:.25s;}
        .tslider::before{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:#fff;left:3px;top:3px;transition:.25s;}
        .toggle input:checked+.tslider{background:var(--amb);}
        .toggle input:checked+.tslider::before{transform:translateX(18px);}
        /* Goal cards */
        .goal-card{background:var(--sur2);border:1px solid var(--bdr);border-radius:var(--r);padding:16px;margin-bottom:10px;cursor:pointer;}
        .goal-card:active{border-color:rgba(245,158,11,.25);}
        /* Goal form */
        .goal-form{background:var(--sur2);border:1px solid var(--bdr2);border-radius:var(--r);padding:16px;margin-bottom:16px;display:none;}
        .goal-form.open{display:block;}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px;}
        .f-label{display:block;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--mut);margin-bottom:5px;}
        .f-input{width:100%;background:var(--sur);border:1px solid var(--bdr2);border-radius:9px;padding:10px 12px;color:var(--tx);font-family:inherit;font-size:14px;outline:none;}
        .f-input:focus{border-color:var(--amb);}
        .f-select{width:100%;background:var(--sur);border:1px solid var(--bdr2);border-radius:9px;padding:10px 12px;color:var(--tx);font-family:inherit;font-size:14px;outline:none;cursor:pointer;}
        /* Notifications */
        .nf-bar{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;padding-bottom:2px;}
        .nf-bar::-webkit-scrollbar{height:0;}
        .nf{padding:6px 13px;border-radius:8px;border:1px solid var(--bdr2);background:transparent;color:var(--mut);font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;}
        .nf.active{background:var(--adim);border-color:rgba(245,158,11,.3);color:var(--amb);}
        .notif-item{display:flex;align-items:flex-start;gap:12px;padding:13px 14px;background:var(--sur2);border:1px solid var(--bdr);border-radius:12px;margin-bottom:8px;cursor:pointer;position:relative;}
        .notif-item.ur{border-left:3px solid var(--red);}
        .notif-item.ub{border-left:3px solid var(--blu);}
        .notif-item.ua{border-left:3px solid var(--amb);}
        .n-icon{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
        .n-title{font-size:13px;font-weight:700;margin-bottom:3px;}
        .n-desc{font-size:12px;color:var(--tx2);line-height:1.4;}
        .n-time{font-size:11px;color:var(--mut);margin-top:4px;}
        .n-dot{position:absolute;top:13px;right:13px;width:7px;height:7px;border-radius:50%;background:var(--amb);}
        /* Settings */
        .settings-layout{display:grid;grid-template-columns:185px 1fr;gap:16px;}
        .settings-nav{background:var(--sur2);border:1px solid var(--bdr);border-radius:var(--r);padding:8px;height:fit-content;}
        .sn-item{display:flex;align-items:center;gap:9px;padding:9px 12px;border-radius:9px;cursor:pointer;font-size:13px;font-weight:500;color:var(--mut);transition:all .15s;margin-bottom:1px;border:none;background:none;width:100%;font-family:inherit;text-align:left;}
        .sn-item.active{background:var(--adim);color:var(--amb);font-weight:600;}
        .ss{display:none;}
        .ss.active{display:block;}
        .ss-title{font-size:18px;font-weight:800;letter-spacing:-0.02em;margin-bottom:4px;}
        .ss-sub{font-size:13px;color:var(--mut);margin-bottom:18px;}
        .s-card{background:var(--sur2);border:1px solid var(--bdr);border-radius:var(--r);overflow:hidden;margin-bottom:14px;}
        .sr{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:1px solid var(--bdr);}
        .sr:last-child{border-bottom:none;}
        .sr-lbl{font-size:14px;font-weight:600;margin-bottom:2px;}
        .sr-desc{font-size:12px;color:var(--mut);}
        .swatch{width:24px;height:24px;border-radius:6px;cursor:pointer;border:2px solid transparent;transition:all .15s;}
        .swatch.sel{border-color:#fff;transform:scale(1.15);}
        .danger-box{background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:var(--r);padding:16px;}
        /* Bottom nav */
        .bottom-nav{display:none;position:fixed;bottom:0;left:0;right:0;height:calc(60px + env(safe-area-inset-bottom,0px));padding-bottom:env(safe-area-inset-bottom,0px);background:rgba(17,20,32,.96);backdrop-filter:blur(20px);border-top:1px solid var(--bdr);z-index:200;justify-content:space-around;align-items:center;}
        .bn-item{display:flex;flex-direction:column;align-items:center;gap:3px;padding:6px 10px;cursor:pointer;flex:1;min-width:0;position:relative;transition:all .15s;border-radius:10px;border:none;background:none;font-family:inherit;}
        .bn-item:active{background:rgba(255,255,255,.06);}
        .bn-item.active .bn-icon,.bn-item.active .bn-lbl{color:var(--amb);}
        .bn-item.active::before{content:'';position:absolute;top:0;left:25%;right:25%;height:2px;background:var(--amb);border-radius:0 0 3px 3px;}
        .bn-icon{font-size:20px;line-height:1;color:var(--mut);}
        .bn-lbl{font-size:10px;font-weight:600;color:var(--mut);white-space:nowrap;}
        .bn-badge{position:absolute;top:4px;right:calc(50% - 16px);background:var(--red);color:#fff;font-size:9px;font-weight:700;min-width:15px;height:15px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg);}
        /* More menu */
        .more-menu{position:fixed;bottom:calc(60px + env(safe-area-inset-bottom,0px) + 8px);left:50%;transform:translateX(-50%);background:var(--sur);border:1px solid var(--bdr2);border-radius:16px;padding:8px;min-width:200px;z-index:300;box-shadow:0 20px 60px rgba(0,0,0,.7);display:none;}
        .more-menu.show{display:block;}
        .mm-overlay{display:none;position:fixed;inset:0;z-index:299;}
        .mm-overlay.show{display:block;}
        .mm-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:14px;font-weight:500;color:var(--mut);transition:all .15s;border:none;background:none;width:100%;font-family:inherit;text-align:left;}
        .mm-item:active{background:rgba(255,255,255,.06);color:var(--tx);}
        .mm-item.active{background:var(--adim);color:var(--amb);}
        /* Toast */
        #toast{position:fixed;bottom:calc(68px + env(safe-area-inset-bottom,0px));left:50%;transform:translateX(-50%) translateY(80px);background:var(--sur2);border:1px solid var(--bdr2);border-radius:12px;padding:11px 18px;font-size:13px;font-weight:600;box-shadow:0 8px 32px rgba(0,0,0,.5);opacity:0;transition:all .3s cubic-bezier(.16,1,.3,1);z-index:9999;white-space:nowrap;max-width:calc(100vw - 32px);}
        #toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
        /* Responsive */
        @media(max-width:640px){
          .sidebar{position:fixed;left:0;top:0;bottom:0;height:100vh;transform:translateX(-100%);z-index:200;}
          .sidebar.open{transform:translateX(0);}
          .menu-btn{display:flex!important;}
          .bottom-nav{display:flex;}
          .content{padding:14px 14px calc(70px + env(safe-area-inset-bottom,0px));}
          .g2,.g3{grid-template-columns:1fr;}
          .g4{grid-template-columns:1fr 1fr;}
          .settings-layout{grid-template-columns:1fr;}
          .settings-nav{display:flex;gap:4px;overflow-x:auto;padding:6px;border-radius:10px;}
          .sn-item{flex-direction:column;gap:3px;font-size:10px;padding:7px 9px;text-align:center;flex-shrink:0;border-radius:8px;}
          .tb-date{display:none;}
          .form-grid{grid-template-columns:1fr;}
        }
        @media(max-width:380px){.g4{grid-template-columns:1fr 1fr;}.sc-v{font-size:20px;}}
        *{scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.1) transparent;}
        *::-webkit-scrollbar{width:3px;}
        *::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1);border-radius:100px;}
      `}</style>

      {/* Overlays */}
      <div className={`overlay${sidebarOpen?' show':''}`} onClick={()=>setSidebarOpen(false)}/>
      <div className={`mm-overlay${moreOpen?' show':''}`} onClick={()=>setMoreOpen(false)}/>

      {/* More menu */}
      <div className={`more-menu${moreOpen?' show':''}`}>
        {moreNav.map(item=>(
          <button key={item.id} className={`mm-item${page===item.id?' active':''}`} onClick={()=>navTo(item.id)}>
            <span style={{fontSize:18}}>{item.icon}</span>{item.label}
            {item.id==='notifications'&&!notifRead && <span style={{marginLeft:'auto',background:'var(--red)',color:'#fff',fontSize:10,fontWeight:700,padding:'1px 6px',borderRadius:100}}>3</span>}
          </button>
        ))}
        <div style={{height:1,background:'var(--bdr)',margin:'6px 0'}}/>
        <button className="mm-item" style={{color:'var(--red)'}} onClick={()=>router.push('/')}>
          <span style={{fontSize:18}}>↩</span>Logout
        </button>
      </div>

      <div className="app">
        <div className="app-inner">
          {/* Sidebar */}
          <aside className={`sidebar${sidebarOpen?' open':''}`}>
            <div className="sb-logo">
              <div className="logo-icon">⚡</div>
              <div><div className="logo-text">Kira<span>Flow</span></div><div className="sb-logo-sub">AI · v1.0</div></div>
            </div>
            <nav className="sb-nav">
              <div className="sb-sec">Main</div>
              {[...mainNav,...moreNav].map(item=>(
                <button key={item.id} className={`sb-item${page===item.id?' active':''}`} onClick={()=>navTo(item.id)}>
                  <span className="sb-icon">{item.icon}</span>{item.label}
                  {item.id==='tasks'&&<span className="sb-badge sb-badge-amb">4</span>}
                  {item.id==='notifications'&&!notifRead&&<span className="sb-badge sb-badge-red">3</span>}
                </button>
              ))}
            </nav>
            <button className="sb-user" onClick={()=>navTo('settings')}>
              <div className="av">A</div>
              <div style={{flex:1,minWidth:0}}><div className="sb-uname">Aditya Pratama</div><div className="sb-urole">Student · BINUS</div></div>
              <div className="online-dot"/>
            </button>
          </aside>

          <div className="main">
            <div className="topbar">
              <div className="tb-left">
                <button className="menu-btn" onClick={()=>setSidebarOpen(!sidebarOpen)}>☰</button>
                <div className="tb-title">{titles[page]}</div>
              </div>
              <div className="tb-right">
                <div className="tb-date">Thu 26 Feb 2026</div>
                <button className="icon-btn" onClick={()=>navTo('notifications')}>🔔{!notifRead&&<div className="notif-dot"/>}</button>
                <button className="icon-btn" onClick={()=>navTo('settings')}><div className="av" style={{width:26,height:26,fontSize:11}}>A</div></button>
                <button className="btn btn-ghost" style={{fontSize:11,color:'var(--red)',padding:'6px 10px'}} onClick={()=>router.push('/')}>↩</button>
              </div>
            </div>

            <div className="content">

              {/* ── DASHBOARD ── */}
              <div className={`dp${page==='dashboard'?' active':''}`}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:10,marginBottom:16,flexWrap:'wrap'}}>
                  <div><div style={{fontSize:12,color:'var(--mut)',marginBottom:2}}>Good morning ☀️</div><div style={{fontSize:20,fontWeight:900,letterSpacing:'-0.02em'}}>Welcome back, Aditya</div></div>
                  <div style={{display:'flex',gap:8}}><button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>navTo('timer')}>⏱ Start Session</button><button className="btn btn-amb" style={{fontSize:12}} onClick={()=>navTo('tasks')}>+ New Task</button></div>
                </div>
                <div className="ai-banner">
                  <div className="ai-icon">🤖</div>
                  <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13,marginBottom:2}}>AI Wellness Check · Today</div><div style={{fontSize:12,color:'var(--tx2)'}}>Consistent 3–4hr sessions, 78% avg focus, 2 overdue tasks. Sustainable pattern.</div><span className="risk-pill">● LOW BURNOUT RISK</span></div>
                  <div style={{textAlign:'right',flexShrink:0}}><div style={{fontSize:10,color:'var(--mut)'}}>Wellness</div><div style={{fontSize:26,fontWeight:900,fontFamily:"'DM Mono',monospace",color:'var(--grn)'}}>82</div></div>
                </div>
                <div className="g4" style={{marginBottom:14}}>
                  {[{l:'⏱ Today',v:'2h 40m',c:'var(--amb)',d:'↑ +30m',cl:'up'},{l:'✅ Done',v:'3',c:'var(--grn)',d:'↑ +1',cl:'up'},{l:'🔥 Streak',v:'7 days',c:'#f97316',d:'Best: 12d',cl:''},{l:'🎯 Goal',v:'68%',c:'var(--tx)',d:'',cl:''}].map(s=>(
                    <div key={s.l} className="sc"><div className="sc-l">{s.l}</div><div className="sc-v" style={{color:s.c}}>{s.v}</div>{s.d&&<span className={`delta ${s.cl}`}>{s.d}</span>}{s.l.includes('Goal')&&<div className="pt" style={{marginTop:7}}><div className="pf" style={{width:'68%',background:'linear-gradient(90deg,#6366f1,#f59e0b)'}}/></div>}</div>
                  ))}
                </div>
                <div className="g2">
                  <div>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}><div style={{fontSize:13,fontWeight:700}}>🤖 AI-Prioritized Tasks</div><button className="btn btn-ai" style={{padding:'5px 10px',fontSize:11}} onClick={()=>showToast('🤖 AI re-ranking tasks...')}>✨ Re-rank</button></div>
                    {[{title:'Data Structures',sub:[{c:'b-cs',l:'CS'},{c:'b-urg',l:'URGENT'},{c:'b-ai',l:'🤖 #1'}],due:'⚠ Tomorrow',urg:true},{title:'Calculus PS4',sub:[{c:'b-math',l:'Math'},{c:'b-hi',l:'HIGH'}],due:'2 days',urg:false},{title:'Essay Draft',sub:[{c:'b-eng',l:'English'},{c:'b-med',l:'MED'}],due:'5 days',urg:false}].map(t=>(
                      <div key={t.title} className="task-item" onClick={()=>navTo('tasks')}>
                        <div className="chk" onClick={e=>{e.stopPropagation();(e.currentTarget as HTMLElement).classList.toggle('done');(e.currentTarget as HTMLElement).textContent=(e.currentTarget as HTMLElement).classList.contains('done')?'✓':'';showToast('✅ Task complete!')}}/>
                        <div className="ti-info"><div className="ti-title">{t.title}</div><div className="ti-meta">{t.sub.map(b=><span key={b.l} className={`badge ${b.c}`}>{b.l}</span>)}</div></div>
                        <div className={`ti-due${t.urg?' urg':''}`}>{t.due}</div>
                      </div>
                    ))}
                    <button className="btn btn-ghost" style={{width:'100%',marginTop:8}} onClick={()=>navTo('tasks')}>View all tasks →</button>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    <div className="card"><div className="card-t">📈 Study Hours – This Week</div><div className="bar-chart">{[{h:'55%',c:'var(--amb)',l:'M'},{h:'75%',c:'var(--amb)',l:'T'},{h:'45%',c:'var(--amb)',l:'W'},{h:'88%',c:'var(--amb)',l:'T'},{h:'65%',c:'var(--blu)',l:'F'},{h:'15%',c:'rgba(255,255,255,.1)',l:'S'},{h:'10%',c:'rgba(255,255,255,.1)',l:'S'}].map(b=><div key={b.l} className="bw"><div className="bar" style={{height:b.h,background:`linear-gradient(180deg,${b.c},${b.c}aa)`}}/><div className="blbl">{b.l}</div></div>)}</div></div>
                    <div className="card">
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}><div className="card-t" style={{margin:0}}>🎯 Goals</div><button className="btn btn-ghost" style={{padding:'4px 10px',fontSize:11}} onClick={()=>navTo('goals')}>All</button></div>
                      {[{l:'Weekly 20hrs',pct:'68%',w:'68%',c:'linear-gradient(90deg,#6366f1,#f59e0b)'},{l:'15 Tasks',pct:'53%',w:'53%',c:'var(--grn)'},{l:'10-Day Streak',pct:'70%',w:'70%',c:'#f97316'}].map(g=>(
                        <div key={g.l} style={{marginBottom:8}}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:4}}><span style={{fontWeight:600}}>{g.l}</span><span style={{fontFamily:"'DM Mono',monospace",color:g.c.includes('grn')?'var(--grn)':'var(--amb)'}}>{g.pct}</span></div><div className="pt"><div className="pf" style={{width:g.w,background:g.c}}/></div></div>
                      ))}
                    </div>
                    <div className="card"><div className="card-t">🔥 Activity</div><div className="heatmap">{heatData.map((v,i)=><div key={i} className="hm-c" style={{background:heatLvls[v]}}/>)}</div></div>
                  </div>
                </div>
              </div>

              {/* ── TASKS ── */}
              <div className={`dp${page==='tasks'?' active':''}`}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14,gap:8,flexWrap:'wrap'}}>
                  <div style={{display:'flex',gap:6,overflowX:'auto'}}><button className="btn btn-amb" style={{padding:'6px 12px',fontSize:11,flexShrink:0}}>All</button><button className="btn btn-ghost" style={{padding:'6px 12px',fontSize:11,flexShrink:0}}>💻 CS</button><button className="btn btn-ghost" style={{padding:'6px 12px',fontSize:11,flexShrink:0}}>📐 Math</button></div>
                  <div style={{display:'flex',gap:8}}><button className="btn btn-ai" style={{fontSize:12}} onClick={()=>showToast('🤖 AI analyzing...')}>🤖 AI Prioritize</button><button className="btn btn-amb" style={{fontSize:12}}>+ Task</button></div>
                </div>
                <div className="g3">
                  {[{title:'TODO',color:'var(--mut)',badge:'b-med',count:'4',tasks:[{t:'Data Structures',bs:[{c:'b-cs',l:'CS'},{c:'b-urg',l:'URGENT'}],due:'⚠ Tomorrow',urg:true},{t:'Calculus PS4',bs:[{c:'b-math',l:'Math'}],due:'2 days',urg:false},{t:'Essay Draft',bs:[{c:'b-eng',l:'English'}],due:'5 days',urg:false},{t:'Physics Lab',bs:[{c:'b-sci',l:'Science'}],due:'Next week',urg:false}]},{title:'IN PROGRESS',color:'var(--amb)',badge:'b-cs',count:'2',tasks:[{t:'DB Systems',bs:[{c:'b-cs',l:'CS'}],due:'60%',urg:false},{t:'Math Project',bs:[{c:'b-math',l:'Math'}],due:'35%',urg:false}]},{title:'DONE',color:'var(--grn)',badge:'b-done',count:'3',tasks:[{t:'Read Ch.7',bs:[],due:'✅ Today',urg:false,done:true},{t:'Quiz Prep',bs:[],due:'✅ Yesterday',urg:false,done:true},{t:'Flash Cards',bs:[],due:'✅ 2 days ago',urg:false,done:true}]}].map(col=>(
                    <div key={col.title}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 11px',background:'var(--sur2)',border:'1px solid var(--bdr)',borderRadius:'10px 10px 0 0',borderBottom:'none'}}>
                        <span style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.06em',color:col.color}}>{col.title}</span>
                        <span className={`badge ${col.badge}`}>{col.count}</span>
                      </div>
                      <div style={{background:'var(--sur2)',border:'1px solid var(--bdr)',borderTop:'none',borderRadius:'0 0 10px 10px',padding:8,display:'flex',flexDirection:'column',gap:6}}>
                        {col.tasks.map(t=>(
                          <div key={t.t} className="task-item" style={{background:'var(--bg)',...((t as {done?:boolean}).done?{opacity:.55}:{})}}>
                            <div className={`chk${(t as {done?:boolean}).done?' done':''}`} onClick={e=>{e.stopPropagation();const el=e.currentTarget as HTMLElement;el.classList.toggle('done');el.textContent=el.classList.contains('done')?'✓':'';if(el.classList.contains('done'))showToast('✅ Task complete!')}}>{(t as {done?:boolean}).done?'✓':''}</div>
                            <div className="ti-info">
                              <div className="ti-title" style={(t as {done?:boolean}).done?{textDecoration:'line-through'}:{}}>{t.t}</div>
                              {t.bs.length>0&&<div className="ti-meta">{t.bs.map(b=><span key={b.l} className={`badge ${b.c}`}>{b.l}</span>)}</div>}
                              <div className={`ti-due${t.urg?' urg':''}`} style={{marginTop:3}}>{t.due}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── TIMER ── */}
              <div className={`dp${page==='timer'?' active':''}`}>
                <div className="g2" style={{alignItems:'start'}}>
                  <div className="card" style={{textAlign:'center',padding:'24px 18px'}}>
                    <div style={{display:'flex',gap:6,justifyContent:'center',marginBottom:18,flexWrap:'wrap'}}>
                      {[{n:'Pomodoro',s:1500},{n:'Deep Work',s:3000},{n:'Break',s:300}].map(m=>(
                        <button key={m.n} className={`btn ${timerMode===m.n?'btn-amb':'btn-ghost'}`} style={{fontSize:12}} onClick={()=>setMode(m.n,m.s)}>{m.n==='Pomodoro'?'🍅':m.n==='Deep Work'?'🧠':'☕'} {m.n}</button>
                      ))}
                    </div>
                    <div style={{position:'relative',width:180,height:180,margin:'0 auto 18px'}}>
                      <svg style={{transform:'rotate(-90deg)'}} width="180" height="180" viewBox="0 0 180 180">
                        <circle fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="8" cx="90" cy="90" r="80"/>
                        <circle fill="none" stroke="#f59e0b" strokeWidth="8" strokeLinecap="round" strokeDasharray="502" cx="90" cy="90" r="80" style={{strokeDashoffset:dashOffset,transition:'stroke-dashoffset 1s linear'}}/>
                      </svg>
                      <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                        <div style={{fontFamily:"'DM Mono',monospace",fontSize:38,fontWeight:700,color:'var(--amb)'}}>{formatTime(timerRemain)}</div>
                        <div style={{fontSize:10,color:'var(--mut)',textTransform:'uppercase',letterSpacing:'.1em',marginTop:2}}>{timerMode}</div>
                      </div>
                    </div>
                    <select className="f-select" style={{maxWidth:260,marginBottom:14}}><option>📋 Data Structures</option><option>📐 Calculus PS4</option><option>📖 Essay Draft</option></select>
                    <div style={{display:'flex',gap:8,justifyContent:'center'}}>
                      <button className="btn btn-ghost" onClick={resetTimer}>↺</button>
                      <button className="btn btn-amb" style={{padding:'11px 28px',fontSize:15}} onClick={toggleTimer}>{timerRunning?'⏸ Pause':'▶ Start'}</button>
                      <button className="btn btn-ghost">⏭</button>
                    </div>
                    <div style={{marginTop:12,fontSize:11,color:'var(--mut)'}}>Session 2 of 4 · 🔥 3 done today</div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    <div className="card">
                      <div className="card-t">📅 Today&apos;s Sessions</div>
                      {[{ic:'🍅',bg:'rgba(245,158,11,.12)',t:'Data Structures',time:'9:00 – 9:25 AM',dur:'25min',fc:'var(--amb)',focus:'9/10'},{ic:'🧠',bg:'rgba(99,102,241,.12)',t:'Calculus Review',time:'10:00 – 10:50 AM',dur:'50min',fc:'var(--blu)',focus:'8/10'}].map(s=>(
                        <div key={s.t} style={{display:'flex',alignItems:'center',gap:10,padding:'9px 0',borderBottom:'1px solid var(--bdr)'}}>
                          <div style={{width:32,height:32,borderRadius:8,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:15}}>{s.ic}</div>
                          <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{s.t}</div><div style={{fontSize:11,color:'var(--mut)'}}>{s.time}</div></div>
                          <div style={{textAlign:'right'}}><div style={{fontWeight:700,fontFamily:"'DM Mono',monospace",color:s.fc,fontSize:13}}>{s.dur}</div><div style={{fontSize:11,color:'var(--grn)'}}>Focus: {s.focus}</div></div>
                        </div>
                      ))}
                      <div style={{paddingTop:10,borderTop:'1px solid var(--bdr)',display:'flex',justifyContent:'space-between',fontSize:12}}><span style={{color:'var(--mut)'}}>Total today:</span><span style={{fontWeight:700,fontFamily:"'DM Mono',monospace",color:'var(--amb)'}}>2h 40m</span></div>
                    </div>
                    <div className="card">
                      <div className="card-t">⚙ Settings</div>
                      {[{l:'Auto-start next',on:true},{l:'Sound alerts',on:true},{l:'Long break after 4',on:false}].map(s=>(
                        <div key={s.l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:13}}>
                          <span style={{fontSize:13,fontWeight:500}}>{s.l}</span>
                          <label className="toggle"><input type="checkbox" defaultChecked={s.on}/><span className="tslider"/></label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CALENDAR ── */}
              <div className={`dp${page==='calendar'?' active':''}`}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,gap:8,flexWrap:'wrap'}}>
                  <div style={{display:'flex',alignItems:'center',gap:10}}><button className="btn btn-ghost" style={{padding:'7px 12px'}}>←</button><div style={{fontSize:15,fontWeight:800}}>February 2026</div><button className="btn btn-ghost" style={{padding:'7px 12px'}}>→</button></div>
                  <div style={{display:'flex',gap:8}}><button className="btn btn-ai" style={{fontSize:12}} onClick={()=>showToast('🤖 Generating schedule...')}>🤖 AI Plan</button><button className="btn btn-amb" style={{fontSize:12}}>+ Event</button></div>
                </div>
                <div className="card" style={{padding:0,overflow:'hidden'}}>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',borderBottom:'1px solid var(--bdr)'}}>
                    {['M','T','W','T','F','S','S'].map((d,i)=><div key={i} style={{padding:'10px 4px',textAlign:'center',fontSize:10,fontWeight:700,color:i===4?'var(--amb)':'var(--mut)'}}>{d}</div>)}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
                    {[23,24,25,26,27,28,1].map(d=>(
                      <div key={d} style={{minHeight:80,padding:'8px 6px',borderRight:'1px solid rgba(255,255,255,.05)',borderBottom:'1px solid rgba(255,255,255,.05)',background:d===26?'rgba(245,158,11,.05)':''}}>
                        <div style={{fontSize:12,fontWeight:d===26?800:600,color:d===26?'var(--amb)':'var(--tx)',marginBottom:4}}>{d}</div>
                        {(calEvents[d]||[]).map(ev=><div key={ev.t} style={{background:`${ev.c}22`,borderLeft:`2px solid ${ev.c}`,borderRadius:3,padding:'2px 4px',fontSize:9,marginBottom:2,color:ev.c,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ev.t}</div>)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── GOALS ── */}
              <div className={`dp${page==='goals'?' active':''}`}>
                <div style={{display:'flex',justifyContent:'flex-end',marginBottom:14}}><button className="btn btn-amb" onClick={()=>setGoalFormOpen(!goalFormOpen)}>+ New Goal</button></div>
                <div className={`goal-form${goalFormOpen?' open':''}`}>
                  <div style={{fontSize:15,fontWeight:700,marginBottom:14}}>Create New Goal</div>
                  <div className="form-grid">
                    <div><label className="f-label">Goal Title</label><input className="f-input" placeholder="e.g. Study 20 hours"/></div>
                    <div><label className="f-label">Type</label><select className="f-select"><option>Weekly</option><option>Daily</option><option>Monthly</option></select></div>
                    <div><label className="f-label">Target</label><input className="f-input" type="number" placeholder="20"/></div>
                    <div><label className="f-label">Unit</label><select className="f-select"><option>hours</option><option>tasks</option><option>days</option></select></div>
                  </div>
                  <label className="f-label">Target Date</label><input className="f-input" type="date" style={{marginBottom:12}}/>
                  <div style={{display:'flex',gap:8}}><button className="btn btn-amb" onClick={()=>{setGoalFormOpen(false);showToast('🎯 Goal created!')}}>Save</button><button className="btn btn-ghost" onClick={()=>setGoalFormOpen(false)}>Cancel</button></div>
                </div>
                <div style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.07em',color:'var(--mut)',marginBottom:10}}>Active Goals</div>
                {[{em:'📚',t:'Weekly Study: 20 hrs',sub:'Resets Monday · 3 days left',pct:'68%',w:'68%',c:'linear-gradient(90deg,#6366f1,#f59e0b)',val:'13.6/20h'},{em:'✅',t:'Complete 15 Tasks',sub:'Weekly · 3 days left',pct:'53%',w:'53%',c:'var(--grn)',val:'8/15'},{em:'🔥',t:'10-Day Streak',sub:'Ongoing · day 7',pct:'70%',w:'70%',c:'#f97316',val:'7/10d'}].map(g=>(
                  <div key={g.t} className="goal-card">
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                      <div><div style={{fontSize:14,fontWeight:700}}>{g.em} {g.t}</div><div style={{fontSize:11,color:'var(--mut)'}}>{g.sub}</div></div>
                      <div style={{fontSize:20,fontWeight:900,fontFamily:"'DM Mono',monospace",color:'var(--amb)'}}>{g.pct}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:10}}>
                      <div style={{flex:1,height:7,background:'rgba(255,255,255,.06)',borderRadius:100,overflow:'hidden'}}><div style={{height:'100%',width:g.w,background:g.c,borderRadius:100}}/></div>
                      <div style={{fontSize:11,color:'var(--mut)',fontFamily:"'DM Mono',monospace",whiteSpace:'nowrap'}}>{g.val}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── ANALYTICS ── */}
              <div className={`dp${page==='analytics'?' active':''}`}>
                <div className="g4" style={{marginBottom:14}}>
                  {[{l:'Study',v:'28h',c:'var(--amb)',d:'↑ 15%',cl:'up'},{l:'Done',v:'14',c:'var(--grn)',d:'↑ +2',cl:'up'},{l:'Focus',v:'78',c:'var(--tx)',d:'↓ 3',cl:'dn'},{l:'Sessions',v:'22',c:'var(--tx)',d:'76m avg',cl:''}].map(s=>(
                    <div key={s.l} className="sc"><div className="sc-l">{s.l}</div><div className="sc-v" style={{color:s.c}}>{s.v}</div><span className={`delta ${s.cl}`}>{s.d}</span></div>
                  ))}
                </div>
                <div className="g2" style={{marginBottom:12}}>
                  <div className="card"><div className="card-t">📊 Daily Hours</div><div className="bar-chart">{[{h:'55%',c:'var(--amb)',l:'M'},{h:'75%',c:'var(--amb)',l:'T'},{h:'40%',c:'var(--amb)',l:'W'},{h:'88%',c:'var(--amb)',l:'T'},{h:'65%',c:'var(--blu)',l:'F'},{h:'30%',c:'rgba(255,255,255,.12)',l:'S'},{h:'15%',c:'rgba(255,255,255,.12)',l:'S'}].map(b=><div key={b.l} className="bw"><div className="bar" style={{height:b.h,background:`linear-gradient(180deg,${b.c},${b.c}aa)`}}/><div className="blbl">{b.l}</div></div>)}</div></div>
                  <div className="card"><div className="card-t">🎯 Subjects</div>{[{l:'💻 CS',v:'12.5h',w:'80%',c:'var(--amb)'},{l:'📐 Math',v:'8.0h',w:'55%',c:'var(--blu)'},{l:'🔬 Science',v:'4.5h',w:'30%',c:'var(--grn)'},{l:'📖 English',v:'3.0h',w:'20%',c:'var(--pur)'}].map(s=><div key={s.l} style={{marginBottom:9}}><div style={{display:'flex',justifyContent:'space-between',fontSize:12,marginBottom:3}}><span>{s.l}</span><span style={{fontFamily:"'DM Mono',monospace"}}>{s.v}</span></div><div className="pt" style={{height:5}}><div className="pf" style={{width:s.w,background:s.c}}/></div></div>)}</div>
                </div>
                <div className="card"><div className="card-t">🤖 AI History</div><div style={{display:'flex',flexDirection:'column',gap:8}}>{[{t:'🧠 Burnout Detection',time:'Today 9:00',badge:'LOW · 18/100',desc:'Consistent pattern. Keep up the routine.'},{t:'📋 Task Prioritization',time:'Today 8:45',badge:'',desc:'Analyzed 6 tasks. DS → #1 due to tomorrow.'}].map(a=><div key={a.t} style={{background:'var(--bg)',border:'1px solid var(--bdr)',borderRadius:10,padding:'11px 13px'}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:5}}><span style={{fontWeight:600,fontSize:13}}>{a.t}</span><span style={{fontSize:11,color:'var(--mut)'}}>{a.time}</span></div>{a.badge&&<span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 10px',borderRadius:100,fontSize:10,fontWeight:700,background:'rgba(16,185,129,.12)',color:'#6ee7b7'}}>{a.badge}</span>}<p style={{fontSize:12,color:'var(--tx2)',marginTop:5}}>{a.desc}</p></div>)}</div></div>
              </div>

              {/* ── NOTIFICATIONS ── */}
              <div className={`dp${page==='notifications'?' active':''}`}>
                <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}><button className="btn btn-ghost" style={{fontSize:12}} onClick={()=>{setNotifRead(true);showToast('✓ All read')}}>✓ Mark all read</button></div>
                <div className="nf-bar">
                  {['All','Unread','🤖 AI','🔔 Reminders','🏆 Wins'].map(f=><button key={f} className={`nf${f==='All'?' active':''}`} onClick={e=>{document.querySelectorAll('.nf').forEach(b=>b.classList.remove('active'));(e.currentTarget as HTMLElement).classList.add('active')}}>{f}</button>)}
                </div>
                {[{cls:'ur',ic:'⚠️',ibg:'rgba(239,68,68,.12)',t:'Task Due Tomorrow!',d:'Data Structures due tomorrow 11:59 PM.',time:'5 min ago'},{cls:'ub',ic:'🤖',ibg:'rgba(99,102,241,.12)',t:'AI Analysis Ready',d:'Burnout risk: LOW (18/100). Keep it up!',time:'9:02 AM'},{cls:'ua',ic:'🔥',ibg:'rgba(245,158,11,.12)',t:'7-Day Streak!',d:"You've studied every day this week!",time:'8:00 AM'},{cls:'',ic:'📋',ibg:'rgba(99,102,241,.12)',t:'Tasks Re-prioritized',d:'DS (#1), Calculus (#2), Essay (#3).',time:'8:45 AM',dim:true},{cls:'',ic:'📅',ibg:'rgba(16,185,129,.12)',t:'Session Reminder',d:'Calculus block starts in 15 min.',time:'9:45 AM',dim:true}].map(n=>(
                  <div key={n.t} className={`notif-item${n.cls?' '+n.cls:''}`} style={(n as {dim?:boolean}).dim?{opacity:.65}:{}}>
                    <div className="n-icon" style={{background:n.ibg}}>{n.ic}</div>
                    <div style={{flex:1}}><div className="n-title">{n.t}</div><div className="n-desc">{n.d}</div><div className="n-time">{n.time}</div></div>
                    {!notifRead && n.cls && <div className="n-dot" style={n.cls==='ub'?{background:'var(--blu)'}:{}}/>}
                  </div>
                ))}
              </div>

              {/* ── SETTINGS ── */}
              <div className={`dp${page==='settings'?' active':''}`}>
                <div className="settings-layout">
                  <div className="settings-nav">
                    {[{id:'profile',ic:'👤',l:'Profile'},{id:'prefs',ic:'🎨',l:'Prefs'},{id:'notif',ic:'🔔',l:'Notifs'},{id:'security',ic:'🔒',l:'Security'},{id:'danger',ic:'⚠️',l:'Danger'}].map(t=>(
                      <button key={t.id} className={`sn-item${settingsTab===t.id?' active':''}`} style={t.id==='danger'?{color:'var(--red)'}:{}} onClick={()=>setSettingsTab(t.id)}>
                        <span>{t.ic}</span><span className="sn-lbl">{t.l}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    {settingsTab==='profile'&&<div className="ss active"><div className="ss-title">Profile</div><div className="ss-sub">Manage your information</div><div style={{display:'flex',alignItems:'center',gap:14,marginBottom:18}}><div style={{width:64,height:64,borderRadius:'50%',background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:800,color:'#000'}}>A</div><div><div style={{fontSize:17,fontWeight:800}}>Aditya Pratama</div><div style={{fontSize:12,color:'var(--mut)'}}>aditya@student.binus.ac.id</div><button className="btn btn-ghost" style={{marginTop:8,fontSize:12,padding:'6px 12px'}}>📷 Photo</button></div></div><div className="s-card">{[{l:'Full Name',v:'Aditya Pratama'},{l:'Email',v:'aditya@student.binus.ac.id'},{l:'Institution',v:'BINUS University'},{l:'Timezone',v:'Asia/Jakarta (UTC+7)'}].map(r=><div key={r.l} className="sr"><div><div className="sr-lbl">{r.l}</div><div className="sr-desc">{r.v}</div></div><button className="btn btn-ghost" style={{fontSize:12,padding:'6px 12px'}}>Edit</button></div>)}</div></div>}
                    {settingsTab==='prefs'&&<div className="ss active"><div className="ss-title">Preferences</div><div className="ss-sub">Customize your experience</div><div className="s-card"><div className="sr"><div><div className="sr-lbl">Daily Goal</div><div className="sr-desc">Target hours/day</div></div><select className="f-select" style={{width:110}}><option>2h</option><option selected>4h</option><option>6h</option><option>8h</option></select></div><div className="sr"><div><div className="sr-lbl">Accent Color</div><div className="sr-desc">Dashboard theme</div></div><div style={{display:'flex',gap:7}}>{['#f59e0b','#6366f1','#10b981','#ef4444','#8b5cf6'].map((c,i)=><div key={c} className={`swatch${i===0?' sel':''}`} style={{background:c}} onClick={e=>{document.querySelectorAll('.swatch').forEach(s=>s.classList.remove('sel'));(e.currentTarget as HTMLElement).classList.add('sel');showToast('🎨 Theme updated!')}}/>)}</div></div></div></div>}
                    {settingsTab==='notif'&&<div className="ss active"><div className="ss-title">Notifications</div><div className="ss-sub">What you get notified about</div><div className="s-card">{[{l:'Task Reminders',d:'Before deadlines',on:true},{l:'AI Insights',d:'Burnout & priority',on:true},{l:'Session Prompts',d:'Study reminders',on:true},{l:'Achievements',d:'Streaks & goals',on:false}].map(r=><div key={r.l} className="sr"><div><div className="sr-lbl">{r.l}</div><div className="sr-desc">{r.d}</div></div><label className="toggle"><input type="checkbox" defaultChecked={r.on}/><span className="tslider"/></label></div>)}</div></div>}
                    {settingsTab==='security'&&<div className="ss active"><div className="ss-title">Security</div><div className="ss-sub">Account security settings</div><div className="s-card"><div className="sr"><div><div className="sr-lbl">Password</div><div className="sr-desc">Changed 30 days ago</div></div><button className="btn btn-ghost" style={{fontSize:12,padding:'6px 12px'}}>Change</button></div><div className="sr"><div><div className="sr-lbl">Two-Factor Auth</div><div className="sr-desc">Extra security</div></div><label className="toggle"><input type="checkbox"/><span className="tslider"/></label></div><div className="sr"><div><div className="sr-lbl">Active Sessions</div><div className="sr-desc">1 device signed in</div></div><button className="btn btn-ghost" style={{fontSize:12,padding:'6px 12px'}}>View</button></div></div></div>}
                    {settingsTab==='danger'&&<div className="ss active"><div className="ss-title" style={{color:'var(--red)'}}>Danger Zone</div><div className="ss-sub">Irreversible — proceed carefully</div><div className="danger-box"><div style={{fontSize:13,fontWeight:700,color:'var(--red)',marginBottom:12}}>⚠️ Irreversible Actions</div><div style={{display:'flex',flexDirection:'column',gap:10}}>{[{t:'Clear All Data',d:'Delete sessions, tasks & analytics'},{t:'Delete Account',d:'Permanently remove all data'}].map(a=><div key={a.t} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:12,background:'rgba(239,68,68,.05)',border:'1px solid rgba(239,68,68,.15)',borderRadius:10,gap:12}}><div><div style={{fontSize:13,fontWeight:600}}>{a.t}</div><div style={{fontSize:12,color:'var(--mut)'}}>{a.d}</div></div><button className="btn btn-red" style={{fontSize:12}} onClick={()=>a.t.includes('Account')?router.push('/'):showToast('⚠️ This cannot be undone!')}>Delete</button></div>)}</div></div></div>}
                  </div>
                </div>
              </div>

            </div>{/* /content */}
          </div>
        </div>

        {/* Bottom Nav */}
        <nav className="bottom-nav">
          {mainNav.map(item=>(
            <button key={item.id} className={`bn-item${page===item.id?' active':''}`} onClick={()=>navTo(item.id)}>
              <div className="bn-icon">{item.icon}</div>
              <div className="bn-lbl">{item.label}</div>
              {item.badge&&<div className="bn-badge">{item.badge}</div>}
            </button>
          ))}
          <button className={`bn-item${moreNav.some(m=>m.id===page)?' active':''}`} onClick={()=>setMoreOpen(!moreOpen)}>
            <div className="bn-icon">⋯</div>
            <div className="bn-lbl">More</div>
          </button>
        </nav>
      </div>

      <div id="toast"/>

      <script dangerouslySetInnerHTML={{__html:`
        function showToast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2800);}
        let tsX=0;
        document.addEventListener('touchstart',e=>tsX=e.touches[0].clientX,{passive:true});
        document.addEventListener('touchmove',e=>{const sb=document.querySelector('.sidebar');if(sb&&sb.classList.contains('open')&&(e.touches[0].clientX-tsX)<-60){sb.classList.remove('open');document.querySelector('.overlay').classList.remove('show');}},{passive:true});
      `}}/>
    </>
  )
}

function showToast(msg: string) {
  if (typeof window === 'undefined') return
  const t = document.getElementById('toast')
  if (!t) return
  t.textContent = msg
  t.classList.add('show')
  clearTimeout((t as HTMLElement & {_t?:ReturnType<typeof setTimeout>})._t)
  ;(t as HTMLElement & {_t?:ReturnType<typeof setTimeout>})._t = setTimeout(() => t.classList.remove('show'), 2800)
}
