'use client'

import React from 'react'
import { Plus, X } from 'lucide-react'
import { SceneTheme } from './StageCanvas'

interface TemplatesModalProps {
  isOpen: boolean
  onClose: () => void
  currentTheme: SceneTheme
  onSelectTheme: (theme: SceneTheme) => void
  onOpenCustomModal: () => void
}

export default function TemplatesModal({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
  onOpenCustomModal,
}: TemplatesModalProps) {
  if (!isOpen) return null

  const templates: Array<{
    id: SceneTheme
    title: string
    desc: string
    previewBg: string
  }> = [
    {
      id: 'blank',
      title: 'Blank Canvas',
      desc: 'Clean white/cream coordinate grid',
      previewBg: '#FFFAF3',
    },
    {
      id: 'beach',
      title: 'Sunny Beach',
      desc: 'Ocean waves, sandy shore & palm horizon',
      previewBg: 'linear-gradient(#70BFD1 0%, #BFE7F0 48%, #1D7C9E 48%, #2086AA 60%, #E8C197 60%, #F5D7B3 100%)',
    },
    {
      id: 'countryside',
      title: 'Countryside Scenery',
      desc: 'Pastoral sky gradient, rolling green hills & path',
      previewBg: 'linear-gradient(#CCE1E4 0%, #DCEBEC 54%, #96BD8D 54%, #73A272 85%, #E6C89F 85%)',
    },
    {
      id: 'midnight',
      title: 'Midnight Highway',
      desc: 'Dark indigo starry sky, city silhouette & flat road',
      previewBg: 'linear-gradient(#121624 0%, #1E2638 64%, #22252E 64%)',
    },
  ]

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="utility-modal templates-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <span className="kicker">SCENE TEMPLATES</span>
            <h2>Choose a starting point</h2>
            <p>Selecting a template starts with a clean stage and 0 timeline layers.</p>
          </div>
          <button onClick={onClose} aria-label="Close templates">
            <X size={20} />
          </button>
        </div>

        <div
          className="template-grid"
          style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', padding: '20px 24px' }}
        >
          {templates.map(t => {
            const isSelected = currentTheme === t.id
            return (
              <button
                key={t.id}
                className={isSelected ? 'selected-template' : ''}
                onClick={() => {
                  onSelectTheme(t.id)
                  onClose()
                }}
                style={{ textAlign: 'left', cursor: 'pointer' }}
              >
                <span
                  className="template-art"
                  style={{
                    background: t.previewBg,
                    border: '1px solid #DED3C5',
                    borderRadius: '7px',
                    height: '85px',
                    display: 'block',
                  }}
                />
                <strong style={{ display: 'block', marginTop: '8px' }}>{t.title}</strong>
                <small style={{ color: '#8F857D' }}>{t.desc}</small>
              </button>
            )
          })}

          {/* 5. + Create Custom Background Button */}
          <button
            onClick={() => {
              onClose()
              onOpenCustomModal()
            }}
            style={{
              textAlign: 'left',
              cursor: 'pointer',
              border: '2px dashed var(--coral)',
              background: '#FFF8F6',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '16px',
              borderRadius: '10px',
              gridColumn: 'span 2',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#FCECE9',
                color: 'var(--coral)',
                display: 'grid',
                placeItems: 'center',
                marginBottom: '6px',
              }}
            >
              <Plus size={18} />
            </div>
            <strong style={{ color: 'var(--coral)', fontSize: '13px' }}>
              + Create Custom Background
            </strong>
            <small style={{ color: '#978C82' }}>
              Pick custom sky &amp; ground colors, horizon wave/hill style
            </small>
          </button>
        </div>
      </div>
    </div>
  )
}
