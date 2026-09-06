import { useEffect } from 'react';
import { useApp } from '../../context/AppContext';

/**
 * SettingsModal
 * Compatibility bridge that directs all settings invocations to the full SettingsPage
 * matching the Legal Docs layout.
 */
export default function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen, setActiveSection } = useApp();

  useEffect(() => {
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      setActiveSection('settings');
    }
  }, [isSettingsOpen, setIsSettingsOpen, setActiveSection]);

  return null;
}
