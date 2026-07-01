'use client';
import { useMemo } from 'react';

function spiralPath(cx, cy, turns, maxR, step) {
  const pts = [];
  const total = turns * 2 * Math.PI;
  for (let t = 0; t <= total; t += step) {
    const r = (t / total) * maxR;
    pts.push([cx + r * Math.cos(t), cy + r * Math.sin(t)]);
  }
  return pts
    .map((p, i) => (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ' ' + p[1].toFixed(2))
    .join(' ');
}

function Lollipop() {
  const sp = useMemo(() => spiralPath(40, 38, 3.25, 19, 0.18), []);
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <line x1="63" y1="84" x2="46" y2="46" stroke="#FFFFFF" strokeWidth="5.5" strokeLinecap="round" opacity="0.95" />
      <line x1="63" y1="84" x2="46" y2="46" stroke="#F4D9DD" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <circle cx="40" cy="38" r="23" fill="#FFFFFF" />
      <circle cx="40" cy="38" r="23" fill="none" stroke="rgba(214,40,60,.18)" strokeWidth="1.5" />
      <g className="loader-spiral">
        <path d={sp} fill="none" stroke="#F37D8A" strokeWidth="5.4" strokeLinecap="round" />
      </g>
      <circle cx="31" cy="29" r="4.5" fill="rgba(255,255,255,.85)" />
    </svg>
  );
}

function GummyBear() {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="loader-bear" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F0596A" />
          <stop offset="1" stopColor="#D7263D" />
        </linearGradient>
      </defs>
      <g fill="url(#loader-bear)">
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
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id="loader-heart" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBA7C0" />
          <stop offset="1" stopColor="#F06A92" />
        </linearGradient>
      </defs>
      <path
        d="M50 82 C 20 60, 11 41, 24 28 C 34 18, 47 22, 50 35 C 53 22, 66 18, 76 28 C 89 41, 80 60, 50 82 Z"
        fill="url(#loader-heart)"
      />
      <path
        d="M37 33 C 31 36, 28 44, 31 51"
        fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="5" strokeLinecap="round"
      />
      <circle cx="42" cy="33" r="3.4" fill="rgba(255,255,255,.85)" />
    </svg>
  );
}

const TILES = [
  { cls: 'loader-tile loader-coral', motif: <Lollipop />, delay: 0 },
  { cls: 'loader-tile loader-stripes', motif: null,        delay: 1 },
  { cls: 'loader-tile loader-coral', motif: <GummyBear />, delay: 2 },
  { cls: 'loader-tile loader-pink',  motif: <Heart />,     delay: 3 },
];

const STYLES = `
  .loader-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: clamp(8px, 2vmin, 16px);
  }
  .loader-tile {
    position: relative;
    aspect-ratio: 1 / 1;
    border-radius: 26%;
    overflow: hidden;
    will-change: transform;
    transform: translateZ(0);
    animation: loaderPulse 1.6s cubic-bezier(.34, 1.4, .5, 1) infinite;
    animation-delay: calc(var(--i) * 0.136s);
    box-shadow:
      0 6px 14px -6px rgba(224, 65, 79, .45),
      inset 0 2px 3px rgba(255, 255, 255, .55),
      inset 0 -6px 12px rgba(150, 20, 35, .18);
  }
  .loader-tile .loader-sheen {
    position: absolute;
    left: 8%; top: 6%;
    width: 84%; height: 46%;
    border-radius: 50%;
    background: linear-gradient(180deg, rgba(255,255,255,.45), rgba(255,255,255,0));
    filter: blur(2px);
    pointer-events: none;
  }
  .loader-tile svg {
    position: absolute; inset: 0;
    width: 100%; height: 100%; display: block;
  }
  .loader-coral {
    background: linear-gradient(150deg, #EE6B76 0%, #E0414F 100%);
  }
  .loader-pink {
    background: linear-gradient(150deg, #F7AEB5 0%, #EE8A95 100%);
  }
  .loader-stripes {
    background:
      repeating-linear-gradient(48deg, #F2929C 0 11%, #F8B7BE 11% 22%),
      linear-gradient(150deg, #F7AEB5, #EE8A95);
  }
  .loader-spiral {
    transform-origin: 40px 38px;
    animation: loaderSpin 7s linear infinite;
  }
  @keyframes loaderPulse {
    0%, 52%, 100% { transform: translateY(0) scale(1); }
    24% { transform: translateY(-9px) scale(1.16); }
  }
  @keyframes loaderSpin {
    to { transform: rotate(360deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .loader-tile { animation: none; }
    .loader-spiral { animation: none; }
  }
`;

const sizes = {
  sm: '80px',
  md: '140px',
  lg: '200px',
};

export default function Loader({ size = 'md', label = 'Cargando...' }) {
  return (
    <>
      <style>{STYLES}</style>
      <div role="status" aria-label={label} className="flex flex-col items-center justify-center gap-4">
        <div className="loader-grid" style={{ width: sizes[size] }}>
          {TILES.map((tile, i) => (
            <div key={i} className={tile.cls} style={{ '--i': tile.delay }}>
              <span className="loader-sheen" />
              {tile.motif}
            </div>
          ))}
        </div>
        <span className="sr-only">{label}</span>
      </div>
    </>
  );
}
