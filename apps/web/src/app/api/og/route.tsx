import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get('name') || 'Someone';
  const score = parseInt(searchParams.get('score') || '0', 10);
  const code = searchParams.get('code') || '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
          fontFamily: 'Inter, system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            right: '-10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(244,63,94,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            left: '-10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(244,63,94,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              background: 'linear-gradient(135deg, #FB7185, #E11D48)',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'white', fontSize: '28px' }}>♥</span>
          </div>
          <span style={{ color: 'white', fontSize: '32px', fontWeight: 800 }}>
            Cupid<span style={{ color: '#F43F5E' }}>Me</span>
          </span>
        </div>

        {/* Profile silhouettes */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            marginBottom: '24px',
          }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FB7185, #F43F5E)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid rgba(255,255,255,0.2)',
            }}
          >
            <span style={{ color: 'white', fontSize: '36px', fontWeight: 800 }}>
              {name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span style={{ color: '#F43F5E', fontSize: '32px' }}>⚔️</span>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid rgba(255,255,255,0.2)',
            }}
          >
            <span style={{ color: 'white', fontSize: '36px', fontWeight: 800 }}>?</span>
          </div>
        </div>

        {/* Score */}
        {score > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ color: '#F43F5E', fontSize: '72px', fontWeight: 900, lineHeight: 1 }}>
              {score}%
            </span>
            <span style={{ color: '#94A3B8', fontSize: '20px', fontWeight: 600, marginTop: '4px' }}>
              Chemistry Score
            </span>
          </div>
        ) : (
          <span style={{ color: 'white', fontSize: '36px', fontWeight: 800 }}>
            Cupid Duel Challenge
          </span>
        )}

        {/* CTA */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '32px',
            padding: '14px 32px',
            background: 'linear-gradient(135deg, #F43F5E, #E11D48)',
            borderRadius: '16px',
          }}
        >
          <span style={{ color: 'white', fontSize: '20px', fontWeight: 700 }}>
            Challenge Me →
          </span>
        </div>

        {/* Tagline */}
        <span style={{ color: '#64748B', fontSize: '14px', marginTop: '24px' }}>
          cupidme.org — Where Love Is Earned
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
