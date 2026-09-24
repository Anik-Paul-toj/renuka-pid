"use client";

import React, { createContext, useContext } from "react";
import { MasterclassData, masterclassData as defaultData } from "@/data/content";

const LandingContentContext = createContext<MasterclassData>(defaultData);

export function LandingContentProvider({
  content,
  children,
}: {
  content?: MasterclassData;
  children: React.ReactNode;
}) {
  return (
    <LandingContentContext.Provider value={content || defaultData}>
      {children}
    </LandingContentContext.Provider>
  );
}

export function useLandingContent(): MasterclassData {
  return useContext(LandingContentContext) || defaultData;
}
