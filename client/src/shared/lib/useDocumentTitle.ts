import { useEffect } from 'react';

export function useDocumentTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | VoltNest` : 'VoltNest — Charging gear for every day';
  }, [title]);
}
