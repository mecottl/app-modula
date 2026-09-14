"use client";

import { useEffect } from "react";
import { useSidebarContext, type DevelopmentNavTab } from "./sidebar-context";

export function DevelopmentNavAnnouncer({
  id,
  name,
  tabs,
}: {
  id: string;
  name: string;
  tabs: DevelopmentNavTab[];
}) {
  const { setDevelopmentNav } = useSidebarContext();

  useEffect(() => {
    setDevelopmentNav({ id, name, tabs });
    return () => setDevelopmentNav(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tabs es un literal estático definido en el layout, no cambia entre renders
  }, [id, name]);

  return null;
}
