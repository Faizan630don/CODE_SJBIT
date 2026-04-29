import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ScanResult, AppMode, Finding } from '../types';

interface AppContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  scanResult: ScanResult | null;
  setScanResult: (result: ScanResult | null) => void;
  selectedFinding: Finding | null;
  setSelectedFinding: (finding: Finding | null) => void;
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  uploadedImageUrl: string | null;
  setUploadedImageUrl: (url: string | null) => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setMode] = useState<AppMode>('patient');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  return (
    <AppContext.Provider value={{
      mode, setMode,
      scanResult, setScanResult,
      selectedFinding, setSelectedFinding,
      uploadedFile, setUploadedFile,
      uploadedImageUrl, setUploadedImageUrl,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
