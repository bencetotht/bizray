import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowRight, ArrowLeft, CheckCircle } from "lucide-react";
import BackgroundNetwork from "../components/BackgroundNetwork";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  // const navigate = useNavigate();

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    setError("");
  };

  const handleBlur = (e) => {
    if (!e.target.value || e.target.value.trim() === "") {
      setError("Please enter your email address.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value)) {
      setError("Please enter a valid email address.");
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    //TODO: Implement actual password reset logic
    console.log("Password reset requested for:", email);
    setIsSubmitted(true);
    
    //TODO: implement this also
    setTimeout(() => {
      //this would be handled by the backend
    }, 1000);
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
            {!isSubmitted ? (
              <>
                <header className="auth-header">
                  <div className="auth-icon">
                    <Mail size={32} />
                  </div>
                  <h1>Reset Password</h1>
                  <p className="auth-subtitle">
                    Enter your email address and we'll send you a link to reset your password
                  </p>
                </header>

                <form className="auth-form" onSubmit={handleSubmit}>
                  {error && (
                    <div className="auth-error">
                      {error}
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="email">
                      <Mail size={18} />
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      placeholder="Write your email here"
                      value={email}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      required
                      className={error ? "input-error" : ""}
                    />
                    {error && (
                      <span className="field-error">
                        {error}
                      </span>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary btn-full">
                    Send Reset Link
                    <ArrowRight size={18} />
                  </button>
                </form>

                <div className="auth-footer">
                  <Link to="/login" className="auth-link">
                    <ArrowLeft size={16} />
                    Back to Login
                  </Link>
                </div>
              </>
            ) : (
              <div className="success-message">
                <div className="success-icon">
                  <CheckCircle size={48} />
                </div>
                <h2>Check Your Email</h2>
                <p>
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <p className="success-note">
                  Please check your inbox and click the link to reset your password. 
                  If you don't see the email, check your spam folder.
                </p>
                <div className="success-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setIsSubmitted(false)}
                  >
                    Send Another Email
                  </button>
                  <Link to="/login" className="btn btn-primary">
                    Back to Login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

