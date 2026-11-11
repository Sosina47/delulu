import { useEffect, useState } from 'react';

interface HealthData {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Health check failed with status ${res.status}`);
        }
        return res.json();
      })
      .then((data: HealthData) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setHealthError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col justify-between p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Header with Police Precinct Branding */}
      <header className="border-b-4 border-police-charcoal pb-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl" role="img" aria-label="police badge">
                🚨
              </span>
              <h1 className="text-2xl sm:text-4xl text-police-charcoal uppercase tracking-tight">
                DELULU POLICE
              </h1>
            </div>
            <p className="font-typewriter text-xs sm:text-sm text-police-muted mt-1 uppercase tracking-wider">
              Department of Questionable Assumptions • Division of Reality Forensics
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="stamp-badge text-police-stamp border-police-stamp -rotate-2 text-xs">
              CONFIDENTIAL
            </span>
            <span className="stamp-badge text-police-charcoal border-police-charcoal text-xs">
              PRECINCT #101
            </span>
          </div>
        </div>
      </header>

      {/* Main Container / Case File Folder */}
      <main className="flex-1">
        <div className="bg-police-paper border-2 border-police-charcoal rounded-folder shadow-card p-6 sm:p-8">
          {/* File Tab */}
          <div className="flex items-center justify-between border-b-2 border-dashed border-police-charcoal pb-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="font-stamp text-xs uppercase bg-police-gold/20 text-police-charcoal px-2 py-1 rounded border border-police-gold">
                STATUS: SLICE 0 FOUNDATION ACTIVE
              </span>
              <span className="font-typewriter text-xs text-police-muted">
                DOCKET ID: SLICE-00-INIT
              </span>
            </div>
            <div className="text-xs font-typewriter text-police-charcoal">
              SYS-VER: 0.1.0
            </div>
          </div>

          {/* Foundation Overview */}
          <section className="space-y-4">
            <h2 className="text-xl sm:text-2xl text-police-charcoal uppercase">
              Project Foundation Initialized
            </h2>
            <p className="font-typewriter text-sm sm:text-base text-police-charcoal leading-relaxed">
              The Delulu Police application runtime, design tokens, typed domain boundaries, and
              serverless API routing have been established and verified.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {/* Architecture Checklist Card */}
              <div className="bg-police-cream border border-police-charcoal p-4 rounded shadow-folder">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2 font-stamp text-police-stamp">
                  Precinct Specs
                </h3>
                <ul className="text-xs font-typewriter space-y-1.5 text-police-charcoal">
                  <li>✔ React 18 + Vite + TypeScript</li>
                  <li>✔ Tailwind CSS Design System</li>
                  <li>✔ Delulu Scoring & Verdict Engine</li>
                  <li>✔ Zod Schemas & Validation</li>
                  <li>✔ Local API Middleware & Serverless Ready</li>
                </ul>
              </div>

              {/* API Connectivity Diagnostics Card */}
              <div className="bg-police-cream border border-police-charcoal p-4 rounded shadow-folder">
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2 font-stamp text-police-stamp">
                  Radio / API Diagnostics
                </h3>
                {loading && (
                  <p className="text-xs font-typewriter text-police-muted animate-pulse">
                    Pinging dispatch radio at /api/health...
                  </p>
                )}
                {health && (
                  <div className="text-xs font-typewriter space-y-1">
                    <p className="text-police-green font-bold">● DISPATCH ONLINE</p>
                    <p>Endpoint: /api/health</p>
                    <p>Service: {health.service}</p>
                    <p>Timestamp: {new Date(health.timestamp).toLocaleTimeString()}</p>
                  </div>
                )}
                {healthError && (
                  <div className="text-xs font-typewriter text-police-red space-y-1">
                    <p className="font-bold">✖ DISPATCH OFFLINE</p>
                    <p>{healthError}</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-police-charcoal/30 pt-4 text-center font-typewriter text-xs text-police-muted">
        DELULU POLICE PRECINCT • OFFICIAL RECORD • SLICE 0 FOUNDATION
      </footer>
    </div>
  );
}
