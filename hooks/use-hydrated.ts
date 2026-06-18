"use client";

import { useEffect, useState } from "react";

/**
 * Returns `true` once the component has mounted on the client.
 * Use this to avoid hydration mismatches when rendering
 * anything that depends on browser-only state (e.g. `useTheme`).
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return hydrated;
}