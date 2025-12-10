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
  AlertTriangle,
  X,
} from "lucide-react";
import BackgroundNetwork from "../components/BackgroundNetwork";
import "./AccountPage.css";
import { useAuth } from "../context/AuthContext";
import { changeUsernameRequest, changePasswordRequest, deleteAccountRequest, fetchCurrentUser, toggleSubscriptionRequest, storeAccessToken } from "../api/auth";

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
  const [showEmail, setShowEmail] = useState(true);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form state
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: ""
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Delete account state
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteInputError, setDeleteInputError] = useState("");

  // Subscription state
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState("");
  const [subscriptionError, setSubscriptionError] = useState("");




  useEffect(() => {
    if (location.hash === "#billing") {
      setActiveTab("billing");
    }
  }, [location.hash]);


  

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.username || "",
        email: user.email || "",
      }));
    }
  }, [user]);


  

  if (loadingUser) {
    return <div>Loading your account…</div>;
  }

  if (!isAuthenticated || !user) {
    return <div>Please log in first.</div>;
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setSaving(true);

    try {
      const result = await changeUsernameRequest({ username: formData.name });
      setSuccessMessage("Profile updated successfully!");

      // Refresh user data to update context
      const updatedUser = await fetchCurrentUser();
      // The AuthContext will automatically update through its periodic check

      // Update local form data
      setFormData((prev) => ({
        ...prev,
        name: result.user.username || updatedUser.username
      }));

    } catch (error) {
      setErrorMessage(error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(true);
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText("");
    setDeleteInputError("");
  };

  const handleDeleteConfirm = async () => {
    // Validate confirmation text
    if (deleteConfirmText.toLowerCase() !== "delete") {
      setDeleteInputError('Please type "DELETE" to confirm');
      return;
    }

    setDeleting(true);
    setDeleteInputError("");

    try {
      await deleteAccountRequest();

      // Logout and clear tokens
      logout();

      // Navigate to login
      navigate("/login");

    } catch (error) {
      setDeleteInputError(`Failed to delete account: ${error.message}`);
      setDeleting(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError("Please fill in all password fields");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }

    setPasswordSaving(true);

    try {
      await changePasswordRequest({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword
      });

      setPasswordSuccess("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: ""
      });
    } catch (error) {
      setPasswordError(error.message || "Failed to change password");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleToggleSubscription = async () => {
    setSubscriptionError("");
    setSubscriptionSuccess("");
    setSubscriptionLoading(true);

    try {
      const result = await toggleSubscriptionRequest();

      // Store the new token
      storeAccessToken(result.token);

      // Update success message based on new role
      const newRole = result.user.role;
      if (newRole === "subscriber") {
        setSubscriptionSuccess("Successfully subscribed to Premium! You now have access to network graphs and advanced features.");
      } else {
        setSubscriptionSuccess("Successfully unsubscribed. You've been moved back to the Basic plan.");
      }

      // Refresh user data to update context
      await fetchCurrentUser();

    } catch (error) {
      setSubscriptionError(error.message || "Failed to toggle subscription");
    } finally {
      setSubscriptionLoading(false);
    }
  };


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

              <button className="account-delete" onClick={handleDeleteAccount} disabled={deleting}>
                <Trash2 size={20} />
                {deleting ? "Deleting..." : "Delete Account"}
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

                    {successMessage && (
                      <div style={{ color: "green", marginBottom: "16px", padding: "12px", backgroundColor: "#d4edda", borderRadius: "4px" }}>
                        {successMessage}
                      </div>
                    )}
                    {errorMessage && (
                      <div style={{ color: "red", marginBottom: "16px", padding: "12px", backgroundColor: "#f8d7da", borderRadius: "4px" }}>
                        {errorMessage}
                      </div>
                    )}

                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
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
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
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
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
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
                          value={passwordForm.confirmNewPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
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

                    {passwordSuccess && (
                      <div style={{ color: "green", marginBottom: "16px", padding: "12px", backgroundColor: "#d4edda", borderRadius: "4px" }}>
                        {passwordSuccess}
                      </div>
                    )}
                    {passwordError && (
                      <div style={{ color: "red", marginBottom: "16px", padding: "12px", backgroundColor: "#f8d7da", borderRadius: "4px" }}>
                        {passwordError}
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handlePasswordChange}
                      disabled={passwordSaving}
                    >
                      {passwordSaving ? "Updating..." : "Update Password"}
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
                      <div className={`plan-badge ${user.role === "subscriber" ? "premium" : "free"}`}>
                        {user.role === "subscriber" ? "Premium" : user.role === "admin" ? "Admin" : "Basic"}
                      </div>
                      <p>
                        {user.role === "subscriber"
                          ? "Premium access with network graphs and advanced features"
                          : user.role === "admin"
                          ? "Full administrative access"
                          : "Basic search and company details"}
                      </p>

                      {subscriptionSuccess && (
                        <div style={{ color: "green", marginTop: "16px", padding: "12px", backgroundColor: "#d4edda", borderRadius: "4px" }}>
                          {subscriptionSuccess}
                        </div>
                      )}
                      {subscriptionError && (
                        <div style={{ color: "red", marginTop: "16px", padding: "12px", backgroundColor: "#f8d7da", borderRadius: "4px" }}>
                          {subscriptionError}
                        </div>
                      )}

                      {user.role !== "admin" && (
                        <button
                          className="btn btn-primary"
                          style={{ marginTop: "16px" }}
                          onClick={handleToggleSubscription}
                          disabled={subscriptionLoading}
                        >
                          {subscriptionLoading
                            ? "Processing..."
                            : user.role === "subscriber"
                            ? "Unsubscribe from Premium"
                            : "Upgrade to Premium"}
                        </button>
                      )}

                      {user.role === "admin" && (
                        <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#fff3cd", borderRadius: "4px", color: "#856404" }}>
                          Admin accounts cannot change subscription status.
                        </div>
                      )}
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

          <button className="account-delete" onClick={handleDeleteAccount} disabled={deleting}>
            <Trash2 size={20} />
            {deleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="delete-modal-overlay" onClick={handleDeleteModalClose}>
            <div className="delete-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="delete-modal-header">
                <div className="delete-modal-icon">
                  <AlertTriangle />
                </div>
                <h3>Delete Account</h3>
                <p>This action cannot be undone</p>
              </div>

              <div className="delete-modal-body">
                <div className="delete-modal-warning">
                  <div className="delete-modal-warning-title">
                    <AlertTriangle size={20} />
                    You will permanently lose:
                  </div>
                  <ul>
                    <li>Your account profile and all personal data</li>
                    <li>Access to all company searches and saved information</li>
                    <li>Your search history</li>
                    <li>This action is irreversible</li>
                  </ul>
                </div>

                <div className="delete-modal-confirmation">
                  <p>To confirm deletion, please type <strong>DELETE</strong> below:</p>
                  <div className="delete-modal-input-wrapper">
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className={deleteInputError ? "error" : ""}
                      disabled={deleting}
                    />
                  </div>
                  {deleteInputError && (
                    <div className="delete-modal-input-error">
                      {deleteInputError}
                    </div>
                  )}
                </div>

                <div className="delete-modal-actions">
                  <button
                    className="delete-modal-cancel"
                    onClick={handleDeleteModalClose}
                    disabled={deleting}
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    className="delete-modal-confirm"
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                  >
                    {deleting ? (
                      <>
                        <span className="delete-modal-loading"></span>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 size={18} />
                        Delete Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
