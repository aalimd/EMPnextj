'use client';

import { useEffect, useState } from 'react';
import ExplorerCaseView from '@/components/explorer/ExplorerCaseView';
import { getExplorerCases, readExplorerProgress } from '@/lib/ecg/api';

export default function ExplorerPage(): JSX.Element {
  const [caseId, setCaseId] = useState('normal');

  useEffect(() => {
    try {
      const p = readExplorerProgress();
      if (getExplorerCases().some((c) => c.id === p.last)) setCaseId(p.last);
    } catch {
      /* default stands */
    }
  }, []);

  return <ExplorerCaseView caseId={caseId} key={`explorer-index-${caseId}`} />;
}
