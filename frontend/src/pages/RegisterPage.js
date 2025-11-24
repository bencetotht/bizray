import React, { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import BackgroundNetwork from "../components/BackgroundNetwork";
import "./RegisterPage.css";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // const navigate = useNavigate();

  const calculatePasswordStrength = (password) => {
    if (!password) return { strength: 0, label: "", color: "" };
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (password.length >= 8) strength++;
    if (/[a-zA-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    
    const hasMinLength = password.length >= 8;
    const hasLowercase = /[a-z]/.test(password);
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[^a-zA-Z\d]/.test(password);
    const isStrong = hasMinLength && hasLowercase && hasUppercase && hasNumber && hasSpecial;
    
    if (strength <= 1) return { strength: 1, label: "Weak", color: "#ef4444" };
    if (strength === 2) return { strength: 2, label: "Fair", color: "#f59e0b" };
    if (strength === 3) return { strength: 3, label: "Good", color: "#3b82f6" };
    if (isStrong) return { strength: 4, label: "Strong", color: "#22c55e" };
    return { strength: 3, label: "Good", color: "#3b82f6" };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    if (fieldErrors[name]) {
      setFieldErrors({
        ...fieldErrors,
        [name]: "",
      });
    }
    
    if (e.target.validity.valueMissing) {
      e.target.setCustomValidity("Please fill in this field.");
    } else if (e.target.validity.typeMismatch && e.target.type === "email") {
      e.target.setCustomValidity("Please enter a valid email address.");
    } else if (e.target.validity.tooShort && e.target.type === "password") {
      e.target.setCustomValidity("Password must be at least 8 characters long.");
    } else {
      e.target.setCustomValidity("");
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let error = "";
    
    if (!value || value.trim() === "") {
      error = "Please fill in this field.";
    } else if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      error = "Please enter a valid email address.";
    } else if (name === "password" && value.length < 8) {
      error = "Password must be at least 8 characters long.";
    } else if (name === "confirmPassword" && value !== formData.password) {
      error = "Passwords do not match.";
    }
    
    if (error) {
      setFieldErrors({
        ...fieldErrors,
        [name]: error,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    //TODO: Implement actual registration logic
    console.log("Registration attempt:", formData);
    //navigate("/account");
  };

  return (
    <section className="auth-page">
      <div className="auth-bg">
        <BackgroundNetwork />
        <div className="auth-overlay" />
      </div>

      <div className="container">
        <div className="auth-card-wrapper">
          <div className="auth-card">
            <header className="auth-header">
              <div className="auth-icon">
                <UserPlus size={32} />
              </div>
              <h1>Create Account</h1>
              <p className="auth-subtitle">
                Sign up to get started with BizRay
              </p>
            </header>

            <form className="auth-form" onSubmit={handleSubmit}>
              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="name">
                  <User size={18} />
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Write your full name here"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={fieldErrors.name ? "input-error" : ""}
                />
                {fieldErrors.name && (
                  <span className="field-error">
                    {fieldErrors.name}
                  </span>
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
                  placeholder="Write your email here"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  required
                  className={fieldErrors.email ? "input-error" : ""}
                />
                {fieldErrors.email && (
                  <span className="field-error">
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <Lock size={18} />
                  Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    minLength={8}
                    className={fieldErrors.password ? "input-error" : ""}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formData.password && (
                  <div className="password-strength">
                    <div className="password-strength-bars">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`password-strength-bar ${
                            level <= passwordStrength.strength ? "filled" : ""
                          }`}
                          style={{
                            backgroundColor:
                              level <= passwordStrength.strength
                                ? passwordStrength.color
                                : "#e2e8f0",
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="password-strength-label"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
                {fieldErrors.password && (
                  <span className="field-error">
                    {fieldErrors.password}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">
                  <Lock size={18} />
                  Confirm Password
                </label>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                    className={fieldErrors.confirmPassword ? "input-error" : ""}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <span className="field-error">
                    {fieldErrors.confirmPassword}
                  </span>
                )}
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" required />
                  <span>I agree to the <Link to="/terms" className="inline-link">Terms of Service</Link> and <Link to="/privacy" className="inline-link">Privacy Policy</Link></span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary btn-full">
                Create Account
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="auth-footer">
              <p>
                Already have an account?{" "}
                <Link to="/login" className="auth-link">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

