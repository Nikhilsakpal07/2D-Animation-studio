'use client'

import React, { useState } from 'react'
import { Sparkles, X, ChevronRight } from 'lucide-react'
import {
  ddaLine,
  bresenhamLine,
  midpointCircle,
  midpointEllipse,
  cubicBezier,
  translationMatrix,
  rotationMatrix,
  scalingMatrix,
  shearMatrix,
  multiplyMatrices,
  formatMatrixRow
} from '@/lib/cg-engine'

interface AlgorithmsDocsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AlgorithmsDocsModal({
  isOpen,
  onClose,
}: AlgorithmsDocsModalProps) {
  const [activeTab, setActiveTab] = useState<'dda' | 'bresenham' | 'circle' | 'matrix' | 'keyframes'>('bresenham')

  if (!isOpen) return null

  // Interactive demo calculations
  const bresPts = bresenhamLine(0, 0, 8, 4)
  const ddaPts = ddaLine(0, 0, 8, 4)
  const circlePts = midpointCircle(0, 0, 5)
  const demoMatrix = multiplyMatrices(translationMatrix(120, 80), rotationMatrix(45))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="utility-modal"
        onClick={e => e.stopPropagation()}
        style={{ width: 'min(820px, 94vw)', maxHeight: '88vh' }}
      >
        <div className="modal-head">
          <div>
            <span className="kicker">DOCUMENTATION &amp; CG FOUNDATIONS</span>
            <h2>Computer Graphics Algorithms</h2>
            <p>Mathematics and rasterization logic powering this 2D studio.</p>
          </div>
          <button onClick={onClose} aria-label="Close docs">
            <X size={20} />
          </button>
        </div>

        {/* Algorithm Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--stone)', background: '#F7F3EB', padding: '0 20px', gap: '8px' }}>
          {[
            { id: 'bresenham', label: "Bresenham's Line" },
            { id: 'dda', label: 'DDA Line' },
            { id: 'circle', label: 'Midpoint Circle & Ellipse' },
            { id: 'matrix', label: '3×3 Homogeneous Matrix' },
            { id: 'keyframes', label: 'Keyframe Interpolation' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: '10px 12px',
                background: 'transparent',
                color: activeTab === t.id ? 'var(--coral)' : '#7C726A',
                fontWeight: activeTab === t.id ? 700 : 500,
                borderBottom: activeTab === t.id ? '2px solid var(--coral)' : '2px solid transparent',
                fontSize: '11px',
                cursor: 'pointer',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '22px 26px', overflowY: 'auto', maxHeight: '55vh' }}>
          {activeTab === 'bresenham' && (
            <div>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', margin: '0 0 8px' }}>
                Bresenham&apos;s Integer Line Algorithm
              </h3>
              <p style={{ fontSize: '12px', color: '#6A6159', lineHeight: 1.6 }}>
                Developed by Jack Elton Bresenham in 1962, this algorithm plots a straight line between two grid points using exclusively integer arithmetic (addition, subtraction, and bit shifts), avoiding slow floating-point divisions.
              </p>

              <div style={{ background: '#EFEAE0', padding: '12px 16px', borderRadius: '8px', margin: '14px 0', fontFamily: 'monospace', fontSize: '11px', color: '#4D443D' }}>
                dx = |x₁ - x₀|, dy = |y₁ - y₀|<br />
                error = dx - dy<br />
                if (2 × error &gt; -dy) &#123; error -= dy; x += sx; &#125;<br />
                if (2 × error &lt; dx) &#123; error += dx; y += sy; &#125;
              </div>

              <div style={{ background: '#302E35', color: '#F3E9DA', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '10px' }}>
                <span style={{ color: '#F5B941' }}>// Live computed points from (0,0) to (8,4):</span>
                <br />
                {JSON.stringify(bresPts)}
              </div>
            </div>
          )}

          {activeTab === 'dda' && (
            <div>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', margin: '0 0 8px' }}>
                Digital Differential Analyzer (DDA)
              </h3>
              <p style={{ fontSize: '12px', color: '#6A6159', lineHeight: 1.6 }}>
                The DDA algorithm calculates pixel positions by sampling along the axis of greatest motion at unit intervals. It calculates differential values Δx and Δy and adds increments in each loop iteration.
              </p>

              <div style={{ background: '#EFEAE0', padding: '12px 16px', borderRadius: '8px', margin: '14px 0', fontFamily: 'monospace', fontSize: '11px', color: '#4D443D' }}>
                steps = max(|x₁ - x₀|, |y₁ - y₀|)<br />
                xIncrement = (x₁ - x₀) / steps<br />
                yIncrement = (y₁ - y₀) / steps<br />
                x += xIncrement; y += yIncrement; plot(round(x), round(y))
              </div>

              <div style={{ background: '#302E35', color: '#F3E9DA', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '10px' }}>
                <span style={{ color: '#86AEB7' }}>// Live computed DDA points from (0,0) to (8,4):</span>
                <br />
                {JSON.stringify(ddaPts)}
              </div>
            </div>
          )}

          {activeTab === 'circle' && (
            <div>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', margin: '0 0 8px' }}>
                Midpoint Circle &amp; Ellipse Algorithms
              </h3>
              <p style={{ fontSize: '12px', color: '#6A6159', lineHeight: 1.6 }}>
                Uses 8-way symmetry for circles and 4-way symmetry for ellipses. By evaluating whether the midpoint between two candidate pixels falls inside or outside the circle boundary equation x² + y² - r² = 0, the next pixel is chosen with minimal arithmetic.
              </p>

              <div style={{ background: '#EFEAE0', padding: '12px 16px', borderRadius: '8px', margin: '14px 0', fontFamily: 'monospace', fontSize: '11px', color: '#4D443D' }}>
                Initial decision parameter: p₀ = 1 - r<br />
                if pₖ &lt; 0: pₖ₊₁ = pₖ + 2xₖ₊₁ + 1<br />
                else: pₖ₊₁ = pₖ + 2xₖ₊₁ + 1 - 2yₖ₊₁
              </div>

              <div style={{ background: '#302E35', color: '#F3E9DA', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '10px' }}>
                <span style={{ color: '#6A9B72' }}>// Live 8-way symmetric points for r=5:</span>
                <br />
                {JSON.stringify(circlePts.slice(0, 8))}... ({circlePts.length} unique coordinates)
              </div>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', margin: '0 0 8px' }}>
                3×3 Homogeneous 2D Transformation Matrices
              </h3>
              <p style={{ fontSize: '12px', color: '#6A6159', lineHeight: 1.6 }}>
                In 2D computer graphics, homogeneous coordinates represent points as 3D column vectors [x, y, 1]ᵀ. This allows Translation, Rotation, Scaling, and Shearing to be expressed as 3×3 matrix multiplications.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', margin: '14px 0' }}>
                <div style={{ background: '#EFEAE0', padding: '10px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '10px' }}>
                  <strong>Translation T(tx, ty):</strong><br />
                  [ 1   0   tx ]<br />
                  [ 0   1   ty ]<br />
                  [ 0   0    1 ]
                </div>
                <div style={{ background: '#EFEAE0', padding: '10px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '10px' }}>
                  <strong>Rotation R(θ):</strong><br />
                  [ cos θ  -sin θ   0 ]<br />
                  [ sin θ   cos θ   0 ]<br />
                  [   0       0     1 ]
                </div>
                <div style={{ background: '#EFEAE0', padding: '10px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '10px' }}>
                  <strong>Scaling S(sx, sy):</strong><br />
                  [ sx   0   0 ]<br />
                  [  0  sy   0 ]<br />
                  [  0   0   1 ]
                </div>
                <div style={{ background: '#EFEAE0', padding: '10px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '10px' }}>
                  <strong>Shear Sh(kx, ky):</strong><br />
                  [  1  kx   0 ]<br />
                  [ ky   1   0 ]<br />
                  [  0   0   1 ]
                </div>
              </div>

              <div style={{ background: '#302E35', color: '#F3E9DA', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '11px' }}>
                <span style={{ color: '#D95D4E' }}>// Live Composite Matrix = T(120, 80) × R(45°):</span>
                <br />
                {formatMatrixRow(demoMatrix[0])}<br />
                {formatMatrixRow(demoMatrix[1])}<br />
                {formatMatrixRow(demoMatrix[2])}
              </div>
            </div>
          )}

          {activeTab === 'keyframes' && (
            <div>
              <h3 style={{ fontFamily: 'Georgia, serif', fontSize: '18px', margin: '0 0 8px' }}>
                24 FPS Keyframe Interpolation &amp; Tweening
              </h3>
              <p style={{ fontSize: '12px', color: '#6A6159', lineHeight: 1.6 }}>
                Animation between diamond keyframes (◆) is evaluated at 24 frames per second. At any frame f between keyframe A and keyframe B, normalized time t = (f - f_A) / (f_B - f_A).
              </p>

              <div style={{ background: '#EFEAE0', padding: '12px 16px', borderRadius: '8px', margin: '14px 0', fontFamily: 'monospace', fontSize: '11px', color: '#4D443D' }}>
                Linear: value = val_A + (val_B - val_A) × t<br />
                Smoothstep Cubic: t_smooth = 3t² - 2t³<br />
                Shortest Angular Distance for Rotation: Δθ = (θ_B - θ_A) % 360
              </div>

              <p style={{ fontSize: '11px', color: '#776D65', margin: 0 }}>
                Every object property (X, Y, Width, Height, Rotation, Scale X, Scale Y, Skew) is smoothly tweened in real time during playback.
              </p>
            </div>
          )}
        </div>

        <div className="modal-foot">
          <button className="coral-button" onClick={onClose}>
            Close Reference
          </button>
        </div>
      </div>
    </div>
  )
}
