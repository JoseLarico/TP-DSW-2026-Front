'use client';
import { useMemo } from 'react';

function spiralPath(cx, cy, turns, maxR, step) {
  const pts = [];
  const total = turns * 2 * Math.PI;
  for (let t = 0; t <= total; t += step) {
    const r = (t / total) * maxR;
    pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return pts.map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ');
}

function Lollipop() {
  const sp = useMemo(() => spiralPath(40, 38, 3.25, 19, 0.18), []);
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
      <line x1="63" y1="84" x2="46" y2="46" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" opacity="0.95" />
      <line x1="63" y1="84" x2="46" y2="46" stroke="#F4D9DD" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <circle cx="40" cy="38" r="23" fill="#FFFFFF" />
      <circle cx="40" cy="38" r="23" fill="none" stroke="rgba(214,40,60,.18)" strokeWidth="1.5" />
      <path d={sp} fill="none" stroke="#F37D8A" strokeWidth="5.4" strokeLinecap="round" />
      <circle cx="31" cy="29" r="4.5" fill="rgba(255,255,255,.85)" />
    </svg>
  );
}

function GummyBear() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="logo-bear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0596A" />
          <stop offset="1" stopColor="#D7263D" />
        </linearGradient>
      </defs>
      <g fill="url(#logo-bear)">
        <circle cx="34" cy="27" r="9" />
        <circle cx="66" cy="27" r="9" />
        <circle cx="50" cy="38" r="17" />
        <ellipse cx="50" cy="68" rx="21" ry="22" />
        <circle cx="25" cy="58" r="10" />
        <circle cx="75" cy="58" r="10" />
        <circle cx="38" cy="87" r="10" />
        <circle cx="62" cy="87" r="10" />
      </g>
      <ellipse cx="50" cy="70" rx="11" ry="13" fill="rgba(255,255,255,.22)" />
      <circle cx="43" cy="36" r="3.2" fill="rgba(80,0,12,.55)" />
      <circle cx="57" cy="36" r="3.2" fill="rgba(80,0,12,.55)" />
      <circle cx="50" cy="44" r="2.6" fill="rgba(80,0,12,.45)" />
      <ellipse cx="40" cy="24" rx="6" ry="4" fill="rgba(255,255,255,.4)" />
    </svg>
  );
}

function Heart() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}>
      <defs>
        <linearGradient id="logo-heart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBA7C0" />
          <stop offset="1" stopColor="#F06A92" />
        </linearGradient>
      </defs>
      <path
        d="M50 82 C 20 60, 11 41, 24 28 C 34 18, 47 22, 50 35 C 53 22, 66 18, 76 28 C 89 41, 80 60, 50 82 Z"
        fill="url(#logo-heart)"
      />
      <path d="M37 33 C 31 36, 28 44, 31 51" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="5" strokeLinecap="round" />
      <circle cx="42" cy="33" r="3.4" fill="rgba(255,255,255,.85)" />
    </svg>
  );
}

const TILE_SHADOW = '0 5px 12px -6px rgba(224,65,79,.42), inset 0 2px 3px rgba(255,255,255,.55), inset 0 -6px 12px rgba(150,20,35,.18)';

const TILES = [
  { bg: 'linear-gradient(150deg,#EE6B76 0%,#E0414F 100%)',   motif: <Lollipop /> },
  { bg: 'repeating-linear-gradient(48deg,#F2929C 0 11%,#F8B7BE 11% 22%),linear-gradient(150deg,#F7AEB5,#EE8A95)', motif: null },
  { bg: 'linear-gradient(150deg,#EE6B76 0%,#E0414F 100%)',   motif: <GummyBear /> },
  { bg: 'linear-gradient(150deg,#F7AEB5 0%,#EE8A95 100%)',   motif: <Heart /> },
];

export default function Logo({ height = 40 }) {
  const tileGap = Math.round(height * 0.07);
  const wordGap = Math.round(height * 0.16);
  const fontSize = Math.round(height / (2 * 0.98)); // 2 lines × line-height 0.98 = grid height

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${wordGap}px` }} aria-label="Sweet Medical">
      {/* 2×2 tile grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: `${tileGap}px`,
        width: `${height}px`,
        height: `${height}px`,
        flexShrink: 0,
      }}>
        {TILES.map((tile, i) => (
          <div key={i} style={{
            position: 'relative',
            aspectRatio: '1/1',
            borderRadius: '26%',
            overflow: 'hidden',
            background: tile.bg,
            boxShadow: TILE_SHADOW,
          }}>
            {/* sheen */}
            <span style={{
              position: 'absolute', left: '8%', top: '6%',
              width: '84%', height: '46%',
              borderRadius: '50%',
              background: 'linear-gradient(180deg,rgba(255,255,255,.45),rgba(255,255,255,0))',
              filter: 'blur(2px)',
              pointerEvents: 'none',
            }} />
            {tile.motif}
          </div>
        ))}
      </div>

      {/* Wordmark */}
      <div style={{
        fontFamily: "'Quicksand', sans-serif",
        fontWeight: 700,
        color: '#4A3D42',
        lineHeight: 0.98,
        letterSpacing: '0.06em',
        fontSize: `${fontSize}px`,
        textTransform: 'uppercase',
        userSelect: 'none',
      }}>
        <div>Sweet</div>
        <div>Medical</div>
      </div>
    </div>
  );
}
