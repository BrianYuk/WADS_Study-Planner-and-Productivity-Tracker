'use client'

import { useEffect, useState } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import { swaggerSpec } from '@/lib/swagger'

export default function ApiDocsPage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <>
      <style>{`
        /* ── Page shell ── */
        body { margin: 0; background: #0f1117; font-family: 'Inter', sans-serif; }

        /* ── Top bar ── */
        .kf-header {
          display: flex; align-items: center; gap: 12px;
          padding: 14px 32px;
          background: rgba(9,11,18,.92);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255,255,255,.08);
          position: sticky; top: 0; z-index: 100;
        }
        .kf-logo-icon {
          width: 34px; height: 34px;
          background: linear-gradient(135deg,#f59e0b,#d97706);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 16px;
        }
        .kf-logo-text { font-size: 16px; font-weight: 800; color: #f1f5f9; }
        .kf-logo-text span { color: #f59e0b; }
        .kf-badge {
          margin-left: 4px;
          background: rgba(245,158,11,.15); border: 1px solid rgba(245,158,11,.3);
          color: #f59e0b; font-size: 11px; font-weight: 700;
          padding: 2px 8px; border-radius: 100px; letter-spacing: .04em;
        }
        .kf-oas-badge {
          margin-left: 4px;
          background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.3);
          color: #818cf8; font-size: 11px; font-weight: 700;
          padding: 2px 8px; border-radius: 100px;
        }
        .kf-desc {
          margin-left: auto; font-size: 12px; color: #64748b;
        }

        /* ── Swagger wrapper ── */
        .swagger-wrap {
          max-width: 1100px; margin: 0 auto; padding: 24px 24px 80px;
        }

        /* ── Override Swagger UI styles to match dark theme ── */
        .swagger-ui { background: transparent !important; }
        .swagger-ui .info { margin: 20px 0 !important; }
        .swagger-ui .info .title { color: #f1f5f9 !important; font-size: 28px !important; font-weight: 800 !important; }
        .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info .description { color: #94a3b8 !important; }

        .swagger-ui .scheme-container { background: #161b27 !important; box-shadow: none !important; padding: 16px 20px !important; border-radius: 10px !important; border: 1px solid rgba(255,255,255,.07) !important; }

        .swagger-ui .opblock-tag { color: #f1f5f9 !important; border-bottom: 1px solid rgba(255,255,255,.08) !important; font-size: 15px !important; }
        .swagger-ui .opblock-tag:hover { background: rgba(255,255,255,.04) !important; }

        .swagger-ui .opblock { border-radius: 8px !important; margin: 6px 0 !important; border: none !important; }
        .swagger-ui .opblock .opblock-summary { border-radius: 8px !important; }
        .swagger-ui .opblock .opblock-summary-description { color: #94a3b8 !important; font-style: italic !important; }
        .swagger-ui .opblock.opblock-get { background: rgba(97,175,254,.07) !important; border-left: 3px solid #61AFFE !important; }
        .swagger-ui .opblock.opblock-post { background: rgba(73,204,144,.07) !important; border-left: 3px solid #49CC90 !important; }
        .swagger-ui .opblock.opblock-put { background: rgba(252,161,48,.07) !important; border-left: 3px solid #FCA130 !important; }
        .swagger-ui .opblock.opblock-patch { background: rgba(80,227,194,.07) !important; border-left: 3px solid #50E3C2 !important; }
        .swagger-ui .opblock.opblock-delete { background: rgba(249,62,62,.07) !important; border-left: 3px solid #F93E3E !important; }

        .swagger-ui .opblock-body { background: #161b27 !important; border-radius: 0 0 8px 8px !important; }
        .swagger-ui .opblock-section-header { background: rgba(255,255,255,.04) !important; }
        .swagger-ui .opblock-section-header h4 { color: #cbd5e1 !important; }

        .swagger-ui textarea, .swagger-ui input[type=text], .swagger-ui input[type=email], .swagger-ui input[type=password] {
          background: #0f1117 !important; color: #f1f5f9 !important; border: 1px solid rgba(255,255,255,.12) !important; border-radius: 6px !important;
        }
        .swagger-ui select { background: #0f1117 !important; color: #f1f5f9 !important; border: 1px solid rgba(255,255,255,.12) !important; }
        .swagger-ui .btn { border-radius: 6px !important; }
        .swagger-ui .btn.execute { background: linear-gradient(135deg,#f59e0b,#d97706) !important; color: #000 !important; border: none !important; font-weight: 700 !important; }
        .swagger-ui .btn.authorize { background: rgba(245,158,11,.1) !important; color: #f59e0b !important; border: 1px solid #f59e0b !important; }

        .swagger-ui table tbody tr td { color: #94a3b8 !important; border-color: rgba(255,255,255,.07) !important; }
        .swagger-ui table thead tr th { color: #cbd5e1 !important; border-color: rgba(255,255,255,.1) !important; }
        .swagger-ui .response-col_status { color: #f1f5f9 !important; }
        .swagger-ui .response-col_description { color: #94a3b8 !important; }

        .swagger-ui .microlight, .swagger-ui .highlight-code { background: #0a0d14 !important; border-radius: 6px !important; }
        .swagger-ui .microlight span, .swagger-ui pre.microlight { color: #90EE90 !important; }

        .swagger-ui .model-box { background: #161b27 !important; border-radius: 8px !important; }
        .swagger-ui .model { color: #94a3b8 !important; }
        .swagger-ui section.models { background: #161b27 !important; border: 1px solid rgba(255,255,255,.07) !important; border-radius: 10px !important; }
        .swagger-ui section.models h4 { color: #f1f5f9 !important; }
        .swagger-ui .model-title { color: #f1f5f9 !important; }

        .swagger-ui .topbar { display: none !important; }
      `}</style>

      <div className="kf-header">
        <div className="kf-logo-icon">⚡</div>
        <div className="kf-logo-text">Kira<span>Flow</span></div>
        <span className="kf-badge">1.0.0</span>
        <span className="kf-oas-badge">OAS 3.0</span>
        <span className="kf-desc">API documentation for Kira Flow — AI-Powered Study Companion</span>
      </div>

      <div className="swagger-wrap">
        {mounted && (
          <SwaggerUI
            spec={swaggerSpec}
            docExpansion="list"
            defaultModelsExpandDepth={1}
            displayRequestDuration={true}
            tryItOutEnabled={true}
          />
        )}
      </div>
    </>
  )
}
