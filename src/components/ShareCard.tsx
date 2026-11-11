import { forwardRef } from 'react';
import type { InvestigationReport } from '../types';

const VERDICT_COLORS: Record<InvestigationReport['verdict'], { ink: string; bg: string }> = {
  INNOCENT: { ink: '#2B9348', bg: '#EAF6EC' },
  'SLIGHTLY DELULU': { ink: '#B7791F', bg: '#FDF3D9' },
  GUILTY: { ink: '#D90429', bg: '#FDE8EA' },
  'DELULU PRO MAX': { ink: '#B7094C', bg: '#FBE7F0' },
};

const ShareCard = forwardRef<HTMLDivElement, { report: InvestigationReport }>(function ShareCard(
  { report },
  ref
) {
  const colors = VERDICT_COLORS[report.verdict];

  return (
    <div
      ref={ref}
      style={{
        width: 1080,
        height: 1350,
        backgroundColor: '#FAF7EE',
        color: '#1F2421',
        fontFamily: '"Courier Prime", "Courier New", monospace',
        position: 'relative',
        overflow: 'hidden',
        padding: 64,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 24,
          border: '4px solid #1F2421',
          borderRadius: 12,
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 54,
          right: -70,
          transform: 'rotate(6deg)',
          backgroundColor: '#FEE440',
          borderTop: '3px solid rgba(31,36,33,0.25)',
          borderBottom: '3px solid rgba(31,36,33,0.25)',
          padding: '10px 120px',
          fontFamily: '"Bungee", Impact, sans-serif',
          fontSize: 18,
          letterSpacing: 8,
          color: 'rgba(31,36,33,0.65)',
        }}
      >
        CONFIDENTIAL
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              border: '4px solid #1F2421',
              backgroundColor: '#E8A838',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
            }}
          >
            🚨
          </div>
          <div>
            <div
              style={{
                fontFamily: '"Bungee", Impact, sans-serif',
                fontSize: 42,
                letterSpacing: 1,
                lineHeight: 1,
              }}
            >
              DELULU POLICE
            </div>
            <div style={{ fontSize: 16, letterSpacing: 4, textTransform: 'uppercase', color: '#717874', marginTop: 8 }}>
              Department of Questionable Assumptions
            </div>
          </div>
        </div>
        <div
          style={{
            fontFamily: '"Bungee", Impact, sans-serif',
            fontSize: 16,
            letterSpacing: 3,
            border: '3px solid #B7094C',
            color: '#B7094C',
            padding: '8px 14px',
            borderRadius: 6,
            transform: 'rotate(-3deg)',
          }}
        >
          VERDICT
        </div>
      </div>

      <div style={{ marginTop: 54, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
        <div
          style={{
            fontFamily: '"Bungee", Impact, sans-serif',
            fontSize: 250,
            lineHeight: 0.85,
            color: colors.ink,
          }}
        >
          {report.deluluScore}
        </div>
        <div style={{ paddingBottom: 22 }}>
          <div style={{ fontSize: 24, letterSpacing: 5, textTransform: 'uppercase', color: '#717874' }}>
            Delulu score
          </div>
          <div style={{ fontSize: 22, letterSpacing: 3, textTransform: 'uppercase', marginTop: 6 }}>
            out of 100
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 36,
          alignSelf: 'flex-start',
          transform: 'rotate(-3deg)',
          border: `8px solid ${colors.ink}`,
          backgroundColor: colors.bg,
          color: colors.ink,
          padding: '18px 38px',
          borderRadius: 10,
          fontFamily: '"Bungee", Impact, sans-serif',
          fontSize: 62,
          letterSpacing: 1,
          lineHeight: 1.05,
          maxWidth: 900,
        }}
      >
        {report.verdict}
      </div>

      <div
        style={{
          marginTop: 48,
          borderLeft: '10px solid #B7094C',
          backgroundColor: '#FFFDF9',
          padding: '26px 30px',
          fontSize: 34,
          lineHeight: 1.45,
          fontStyle: 'italic',
          borderRadius: 6,
          boxShadow: '6px 7px 0px 0px rgba(31,36,33,0.9)',
        }}
      >
        “{report.roastSummary}”
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <div style={{ fontSize: 18, letterSpacing: 4, textTransform: 'uppercase', color: '#717874' }}>
            Case category
          </div>
          <div style={{ fontFamily: '"Bungee", Impact, sans-serif', fontSize: 32, marginTop: 6 }}>
            {report.category}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, letterSpacing: 4, textTransform: 'uppercase', color: '#717874' }}>
            Case ID
          </div>
          <div style={{ fontSize: 26, marginTop: 6 }}>{report.caseId}</div>
          <div style={{ fontSize: 16, letterSpacing: 3, textTransform: 'uppercase', color: '#717874', marginTop: 14 }}>
            File yours at Delulu Police
          </div>
        </div>
      </div>
    </div>
  );
});

export default ShareCard;
