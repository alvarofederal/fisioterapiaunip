// src/components/version-display.tsx
"use client"

import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  hash: string;
  branch: string;
  buildDate: string;
  fullVersion: string;
}

export function VersionDisplay() {
  const [version, setVersion] = useState<VersionInfo | null>(null);

  useEffect(() => {
    fetch('/version.json')
      .then(res => res.json())
      .then(data => setVersion(data))
      .catch(() => {
        // Fallback para desenvolvimento
        setVersion({
          version: '0',
          hash: 'dev',
          branch: 'local',
          buildDate: new Date().toISOString(),
          fullVersion: '0.dev'
        });
      });
  }, []);

  if (!version) return null;

  return (
    <div 
      className="text-[10px] text-gray-400 font-mono cursor-help hover:text-gray-600 transition-colors"
      title={process.env.NEXT_PUBLIC_APP_VERSION} >
      v{process.env.NEXT_PUBLIC_APP_VERSION}
    </div>
  );
}