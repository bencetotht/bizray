import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Mail,
  Settings,
  LogOut,
  Shield,
  CreditCard,
  Bell,
  Key,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import BackgroundNetwork from "../components/BackgroundNetwork";
import "./AccountPage.css";
import { useAuth } from "../context/AuthContext";

export default function AccountPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthenticated, loadingUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    phone: "",
  });

  const [errors, setErrors] = useState({});
  const [showEmail, setShowEmail] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // -------------------------
  // 1) Handle URL hash → billing tab
  // -------------------------
  useEffect(() => {
    if (location.hash === "#billing") {
      setActiveTab("billing");
    }
  }, [location.hash]);

  // -------------------------
  // 2) Once user is loaded, prefill form
  // -------------------------
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.username || "",
        email: user.email || "",
      }));
    }
  }, [user]);

  // -------------------------
  // 3) Early returns – BEFORE using user.username
  // -------------------------
  if (loadingUser) {
    return <div>Loading your account…</div>;
  }

  if (!isAuthenticated || !user) {
    // you can also do: navigate("/login"); return null;
    return <div>Please log in first.</div>;
  }

  // Now it's safe – user is definitely defined
  console.log("USAAAA", user.username);

  // -------------------------
  // 4) Handlers
  // -------------------------
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    if (e.target.validity.valueMissing) {
      e.target.setCustomValidity("Please fill in this field.");
    } else {
      e.target.setCustomValidity("");
    }
  };

  const validateField = (name, value) => {
    let error = "";

    if (!value || value.trim() === "") {
      if (name === "name") {
        error = "Please fill in this field.";
      } else if (name === "email") {
        error = "Please enter a valid email address.";
      }
    } else if (
      name === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      error = "Please enter a valid email address.";
    }

    return error;
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);

    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: send formData to backend
    console.log("Saving profile:", formData);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteAccount = () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      console.log("Deleting account…");
      // TODO: call delete endpoint, then navigate
    }
  };

  // -------------------------
  // 5) Render
  // -------------------------
  return (
    <section className="account-page">
      <div className="account-bg">
        <BackgroundNetwork />
        <div className="account-overlay" />
      </div>

      <div className="container">
        <div className="account-wrapper">
          {/* SIDEBAR */}
          <aside className="account-sidebar">
            <div className="account-user-info">
              <div className="account-avatar">
                {formData.name
                  ? formData.name.charAt(0).toUpperCase()
                  : user.username.charAt(0).toUpperCase()}
              </div>
              <h3>{formData.name || user.username}</h3>
              <p>{showEmail ? formData.email || user.email : "Email hidden"}</p>
            </div>

            <nav className="account-nav">
              <button
                className={`account-nav-item ${
                  activeTab === "profile" ? "active" : ""
                }`}
                onClick={() => setActiveTab("profile")}
              >
                <User size={20} />
                Profile
              </button>
              <button
                className={`account-nav-item ${
                  activeTab === "security" ? "active" : ""
                }`}
                onClick={() => setActiveTab("security")}
              >
                <Shield size={20} />
                Security
              </button>
              <button
                className={`account-nav-item ${
                  activeTab === "billing" ? "active" : ""
                }`}
                onClick={() => setActiveTab("billing")}
              >
                <CreditCard size={20} />
                Billing
              </button>
              <button
                className={`account-nav-item ${
                  activeTab === "notifications" ? "active" : ""
                }`}
                onClick={() => setActiveTab("notifications")}
              >
                <Bell size={20} />
                Notifications
              </button>
              <button
                className={`account-nav-item ${
                  activeTab === "settings" ? "active" : ""
                }`}
                onClick={() => setActiveTab("settings")}
              >
                <Settings size={20} />
                Settings
              </button>
            </nav>

            <div className="account-actions">
              <button className="account-logout" onClick={handleLogout}>
                <LogOut size={20} />
                Sign Out
              </button>

              <button className="account-delete" onClick={handleDeleteAccount}>
                <Trash2 size={20} />
                Delete Account
              </button>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="account-content">
            <div className="account-card">
              {activeTab === "profile" && (
                <div className="account-section">
                  <header className="account-section-header">
                    <h2>Profile Information</h2>
                    <p>Update your personal information</p>
                  </header>

                  <form className="account-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="name">
                        <User size={18} />
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        className={errors.name ? "input-error" : ""}
                      />
                      {errors.name && (
                        <span className="field-error">{errors.name}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">
                        <Mail size={18} />
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                        className={errors.email ? "input-error" : ""}
                      />
                      {errors.email && (
                        <span className="field-error">{errors.email}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="company">
                        <User size={18} />
                        Company (Optional)
                      </label>
                      <input
                        type="text"
                        id="company"
                        name="company"
                        placeholder="Your company name"
                        value={formData.company}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">
                        <User size={18} />
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        placeholder="+1 (555) 000-0000"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary">
                      Save Changes
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "security" && (
                <div className="account-section">
                  <header className="account-section-header">
                    <h2>Security Settings</h2>
                    <p>Manage your password and security preferences</p>
                  </header>

                  <div className="account-form">
                    <div className="form-group">
                      <label htmlFor="currentPassword">
                        <Key size={18} />
                        Current Password
                      </label>
                      <div className="password-input-wrapper">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          id="currentPassword"
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowCurrentPassword(!showCurrentPassword)
                          }
                          aria-label={
                            showCurrentPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showCurrentPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="newPassword">
                        <Key size={18} />
                        New Password
                      </label>
                      <div className="password-input-wrapper">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="newPassword"
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowNewPassword(!showNewPassword)
                          }
                          aria-label={
                            showNewPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showNewPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="confirmNewPassword">
                        <Key size={18} />
                        Confirm New Password
                      </label>
                      <div className="password-input-wrapper">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmNewPassword"
                          placeholder="Re-enter new password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    <button type="button" className="btn btn-primary">
                      Update Password
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="account-section">
                  <header className="account-section-header">
                    <h2>Billing & Subscription</h2>
                    <p>Manage your subscription and payment methods</p>
                  </header>

                  <div className="billing-info">
                    <div className="billing-card">
                      <h3>Current Plan</h3>
                      <div className="plan-badge free">Free</div>
                      <p>Basic search and company details</p>
                      <button
                        className="btn btn-primary"
                        style={{ marginTop: "16px" }}
                      >
                        Upgrade to Pro
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="account-section">
                  <header className="account-section-header">
                    <h2>Notification Preferences</h2>
                    <p>Choose how you want to be notified</p>
                  </header>

                  <div className="account-form">
                    <label className="checkbox-label">
                      <input type="checkbox" defaultChecked />
                      <span>Email Notifications</span>
                    </label>
                    <label className="checkbox-label">
                      <input type="checkbox" />
                      <span>Marketing Notifications</span>
                    </label>

                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ marginTop: "16px" }}
                    >
                      Save Preferences
                    </button>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="account-section">
                  <header className="account-section-header">
                    <h2>Account Settings</h2>
                    <p>Manage your account preferences</p>
                  </header>

                  <div className="account-form">
                    <div className="form-group">
                      <label>Language</label>
                      <select className="form-select">
                        <option>English</option>
                        <option>Deutsch</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Theme</label>
                      <select className="form-select">
                        <option>Light</option>
                        <option>Dark</option>
                        <option>Auto (System)</option>
                      </select>
                    </div>

                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={showEmail}
                        onChange={(e) => setShowEmail(e.target.checked)}
                      />
                      <span>Show email in profile</span>
                    </label>

                    <button type="button" className="btn btn-primary">
                      Save Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Mobile action buttons */}
        <div className="account-mobile-actions">
          <button className="account-logout" onClick={handleLogout}>
            <LogOut size={20} />
            Sign Out
          </button>

          <button className="account-delete" onClick={handleDeleteAccount}>
            <Trash2 size={20} />
            Delete Account
          </button>
        </div>
      </div>
    </section>
  );
}
