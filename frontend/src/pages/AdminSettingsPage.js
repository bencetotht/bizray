import React, { useState } from "react";
import { Save, RefreshCw, Globe } from "lucide-react";
import "./AdminSettingsPage.css";

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState(() => {
    // Load from localStorage or use defaults
    const savedSiteName = localStorage.getItem("admin_siteName");
    const savedLanguage = localStorage.getItem("admin_defaultLanguage");
    const savedTimezone = localStorage.getItem("admin_timezone");
    
    return {
      siteName: savedSiteName || "BizRay",
      defaultLanguage: savedLanguage || "en",
      timezone: savedTimezone || "UTC"
    };
  });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  const handleChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus(null);
    
    // Save to localStorage (frontend-only settings)
    localStorage.setItem("admin_siteName", settings.siteName);
    localStorage.setItem("admin_defaultLanguage", settings.defaultLanguage);
    localStorage.setItem("admin_timezone", settings.timezone);
    
    // Simulate save
    setTimeout(() => {
      setSaveStatus({ type: "success", message: "Settings saved successfully!" });
      setSaving(false);
      setTimeout(() => setSaveStatus(null), 3000);
    }, 500);
  };

  return (
    <div className="admin-settings-page">
      <div className="admin-settings-header">
        <div>
          <h1>Settings & Configuration</h1>
          <p>Manage system settings and preferences</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <RefreshCw size={18} className="spinning" /> : <Save size={18} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {saveStatus && (
        <div className={`save-status ${saveStatus.type}`}>
          {saveStatus.message}
        </div>
      )}

      <div className="settings-sections">
        {/* General Settings */}
        <div className="settings-section">
          <div className="settings-section-header">
            <Globe size={20} />
            <h2>General Settings</h2>
          </div>
          <div className="settings-content">
            <div className="setting-item">
              <div className="setting-info">
                <label>Site Name</label>
                <p>Display name of the application</p>
              </div>
              <input
                type="text"
                className="setting-input"
                value={settings.siteName}
                onChange={(e) => handleChange("siteName", e.target.value)}
              />
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <label>Default Language</label>
                <p>Default language for the application</p>
              </div>
              <select
                className="setting-select"
                value={settings.defaultLanguage}
                onChange={(e) => handleChange("defaultLanguage", e.target.value)}
              >
                <option value="en">English</option>
                <option value="de">Deutsch</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

