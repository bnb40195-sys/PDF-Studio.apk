/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { DocumentScanner } from './components/scanner/DocumentScanner';
import { PdfStudio } from './components/pdf/PdfStudio';
import { SettingsView } from './components/settings/SettingsView';
import { HelpCenter } from './components/help/HelpCenter';
import { ToastContainer } from './components/ui/ToastContainer';

const MainLayout: React.FC = () => {
  const { activeTab, setActiveTab, currentTheme, t } = useApp();
  const [triggerCameraCounter, setTriggerCameraCounter] = useState(0);

  // Map sub-tabs to PdfStudio
  const isPdfTab = activeTab === 'pdf-studio' || activeTab === 'viewer' || activeTab === 'images-to-pdf' || activeTab === 'creator' || activeTab === 'ai-creator';
  const initialPdfSubTab = activeTab === 'images-to-pdf' 
    ? 'images-to-pdf' 
    : activeTab === 'creator' 
    ? 'creator' 
    : activeTab === 'ai-creator' 
    ? 'ai-creator' 
    : 'viewer';

  return (
    <div className={`min-h-screen flex flex-col ${currentTheme.bgClass} ${currentTheme.patternClass} transition-colors duration-300 font-sans`}>
      {/* Top Bar */}
      <Header onTriggerScan={() => setTriggerCameraCounter(c => c + 1)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full pb-16">
        {activeTab === 'scanner' && <DocumentScanner key={triggerCameraCounter} />}
        {isPdfTab && <PdfStudio initialSubTab={initialPdfSubTab} />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'help' && <HelpCenter />}
      </main>



      {/* Toast Feedback Messages */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
