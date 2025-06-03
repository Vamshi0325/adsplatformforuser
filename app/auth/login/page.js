"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { Eye, EyeOff, Clock, Loader2, ArrowLeft } from "lucide-react";
import { authHandlers } from "@/services/api-handlers";
import AuthFormWrapper from "@/components/auth-form-wrapper";

export default function LoginPage() {
  const { login } = useAuth();

  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password states
  const [currentStep, setCurrentStep] = useState("auth"); // auth, forgot-password-email, forgot-password, reset-password
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef([]);
  const [timer, setTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordUpdated, setPasswordUpdated] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval;
    if (
      (currentStep === "forgot-password" || currentStep === "reset-password") &&
      timer > 0
    ) {
      interval = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, timer]);

  // Format mm:ss for timer display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Login form submit
  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await login(email, password);
      if (!result) {
        setError("Invalid credentials");
      }
    } catch (err) {
      console.error("Error logging in:", err);
      const message =
        err?.response?.data?.message || err?.message || "Failed to log in";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  // Handle forgot-password-email submit (send OTP)
  const handleForgotPasswordEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await authHandlers.sendOTP(email);
      if (res && res.status === 200) {
        const expiresAtTime = new Date(res.data.expiresAt).getTime();
        const now = Date.now();
        let secondsRemaining = Math.floor((expiresAtTime - now) / 1000);
        if (secondsRemaining < 0) secondsRemaining = 0;
        setCurrentStep("forgot-password");
        setTimer(secondsRemaining);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        setSuccess(res.data.message);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      setError(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // OTP input handlers
  const handleOTPChange = (index, value) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return; // digits only max 1 char
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pasteData)) return; // only accept exactly 6 digits

    const newOtp = pasteData.split("");
    setOtp(newOtp);

    // Focus last input after paste
    otpRefs.current[5]?.focus();
  };

  // Verify OTP for forgot-password
  const handleVerifyOTP = async () => {
    const otpStr = otp.join("");
    if (otpStr.length !== 6) {
      setError("Please enter complete OTP");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await authHandlers.verifyOTP(email, otpStr);
      if (res && res.status === 200 && res.data.token) {
        setSuccess(res.data.message);
        setResetToken(res.data.token);
        setCurrentStep("reset-password");
      } else {
        setError("Invalid OTP");
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      setError("Failed to verify OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (!canResend) return;
    setIsLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await authHandlers.sendOTP(email);
      if (res && res.status === 200) {
        const expiresAtTime = new Date(res.data.expiresAt).getTime();
        const now = Date.now();
        let secondsRemaining = Math.floor((expiresAtTime - now) / 1000);
        if (secondsRemaining < 0) secondsRemaining = 0;
        setTimer(secondsRemaining);
        setCanResend(false);
        setOtp(["", "", "", "", "", ""]);
        setSuccess(res.data.message);
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 100);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to resend OTP");
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      setError(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password submit
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setIsLoading(true);
    setError("");
    setSuccess("");
    setPasswordUpdated(false);
    try {
      const res = await authHandlers.resetPassword(resetToken, newPassword);
      if (res.status === 200) {
        setSuccess(res.data.message);
        setPasswordUpdated(true);
        setTimeout(() => {
          setCurrentStep("auth");
          setEmail("");
          setPassword("");
          setNewPassword("");
          setConfirmPassword("");
          setOtp(["", "", "", "", "", ""]);
          setResetToken("");
          setSuccess("");
          setError("");
          setPasswordUpdated(false);
        }, 1500);
      }
    } catch (error) {
      console.error("Error resetting password:", error);
      setError("Failed to update password");
      setPasswordUpdated(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    if (field === "newPassword") setShowNewPassword((v) => !v);
    if (field === "confirmPassword") setShowConfirmPassword((v) => !v);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-r from-purple-500 to-indigo-600">
      <AuthFormWrapper>
        {currentStep === "auth" && (
          <>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-5">
              Login
            </h2>
            {error && <p className="error-message">{error}</p>}
            <form onSubmit={handleSubmit} noValidate>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="submit-button"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="text-center">
              Forgot password?{" "}
              <button
                onClick={() => {
                  setCurrentStep("forgot-password-email");
                  setError("");
                  setSuccess("");
                }}
                className="link-button"
                type="button"
              >
                Reset here
              </button>
            </p>

            <p className="text-center">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="link-button">
                Sign Up
              </Link>
            </p>
          </>
        )}

        {/* Forgot password email input step */}
        {currentStep === "forgot-password-email" && (
          <>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-5">
              Forgot Password
            </h2>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <form onSubmit={handleForgotPasswordEmailSubmit} noValidate>
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className="submit-button"
              >
                {isLoading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
            <button
              onClick={() => setCurrentStep("auth")}
              disabled={isLoading}
              className="link-button"
              type="button"
              style={{ marginTop: "10px" }}
            >
              Back to Login
            </button>
          </>
        )}

        {/* Forgot password OTP input step */}
        {currentStep === "forgot-password" && (
          <>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-5">
              Verify OTP
            </h2>
            <p className="text-center">
              We sent a 6-digit OTP to <br />
              <strong>{email}</strong>
            </p>
            {error && <p className="error-message">{error}</p>}
            {success && (
              <p className="success-message text-center">{success}</p>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              {otp.map((digit, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(i, e.target.value)}
                  onKeyDown={(e) => handleOTPKeyDown(i, e)}
                  onPaste={handlePaste}
                  ref={(el) => (otpRefs.current[i] = el)}
                  className="otp-input"
                  disabled={isLoading}
                  inputMode="numeric"
                  style={{
                    width: "40px",
                    height: "40px",
                    textAlign: "center",
                    fontSize: "18px",
                    borderRadius: "5px",
                    border: "1px solid #ccc",
                  }}
                />
              ))}
            </div>

            <div
              style={{
                textAlign: "center",
                marginBottom: "20px",
                color: "#ddd",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Clock />
              <span>
                {timer > 0
                  ? `Resend OTP in ${formatTime(timer)}`
                  : "You can resend now"}
              </span>
            </div>

            {/* Buttons in a single row */}
            <div
              style={{ display: "flex", gap: "10px", justifyContent: "center" }}
            >
              <button
                onClick={handleVerifyOTP}
                disabled={isLoading || otp.join("").length !== 6}
                className="submit-button"
                style={{
                  width: "45%", // Adjust button width to not take full space
                  marginBottom: "10px",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="inline animate-spin mr-2" />
                    Verifying...
                  </>
                ) : (
                  "Verify OTP"
                )}
              </button>

              <button
                onClick={handleResendOTP}
                disabled={isLoading || !canResend}
                className="submit-button"
                style={{
                  width: "45%", // Adjust button width to not take full space
                  backgroundColor: "transparent",
                  color: "#2d79f3",
                  border: "1.5px solid #2d79f3",
                  marginBottom: "10px",
                  cursor: isLoading || !canResend ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="inline animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  "Resend OTP"
                )}
              </button>
            </div>

            {/* Back to Login button */}
            <button
              onClick={() => setCurrentStep("auth")}
              disabled={isLoading}
              className="link-button"
              type="button"
              style={{ width: "100%" }} // Full width to make the button span the row
            >
              Back to Login
            </button>
          </>
        )}

        {/* Reset password step */}
        {currentStep === "reset-password" && (
          <>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-5">
              Reset Password
            </h2>
            <p style={{ textAlign: "center", marginBottom: "20px" }}>
              Create a new password for <br />
              <strong>{email}</strong>
            </p>
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
            <form onSubmit={handleResetPassword} noValidate>
              <label htmlFor="new-password">New Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  style={{
                    width: "100%",
                    paddingRight: "40px",
                    height: "50px",
                    borderRadius: "10px",
                    border: "1.5px solid #333",
                    backgroundColor: "#2b2b2b",
                    color: "#f1f1f1",
                    fontSize: "16px",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("newPassword")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#ccc",
                  }}
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <label htmlFor="confirm-password" style={{ marginTop: "15px" }}>
                Confirm Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                  style={{
                    width: "100%",
                    paddingRight: "40px",
                    height: "50px",
                    borderRadius: "10px",
                    border: "1.5px solid #333",
                    backgroundColor: "#2b2b2b",
                    color: "#f1f1f1",
                    fontSize: "16px",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility("confirmPassword")}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#ccc",
                  }}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || passwordUpdated}
                className="submit-button"
                style={{ marginTop: "20px" }}
              >
                {isLoading || passwordUpdated ? (
                  <>
                    <Loader2 className="inline animate-spin mr-2" />
                    {passwordUpdated ? "Redirecting..." : "Updating..."}
                  </>
                ) : (
                  "Update Password"
                )}
              </button>
            </form>

            <button
              onClick={() => setCurrentStep("auth")}
              disabled={isLoading}
              className="link-button"
              type="button"
              style={{ marginTop: "15px" }}
            >
              Back to Login
            </button>
          </>
        )}
      </AuthFormWrapper>
    </div>
  );
}
