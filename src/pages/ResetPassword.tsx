import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { verifyResetToken, resetPassword } from "../services/password.service";
import { validatePassword } from "../services/auth.service";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [valid, setValid] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError("Invalid reset link");
        setVerifying(false);
        return;
      }

      try {
        const res = await verifyResetToken(token);
        setEmail(res.email);
        setValid(true);
      } catch (err: any) {
        setError(err.response?.data?.message || "Invalid or expired reset link");
        setValid(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const validateForm = (): boolean => {
    const errors: string[] = [];

    if (!password) {
      errors.push("Password is required");
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        errors.push(passwordValidation.message);
      }
    }

    if (!confirmPassword) {
      errors.push("Please confirm your password");
    } else if (password !== confirmPassword) {
      errors.push("Passwords do not match");
    }

    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!validateForm()) {
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      setMessage(res.message);
      
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 text-center">
          <div className="w-16 h-16 border-4 border-rose-500 border-dashed rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-xl font-bold mb-2 text-slate-50">Verifying Reset Link</h2>
          <p className="text-slate-400">Please wait while we verify your reset link...</p>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-3 rounded-2xl bg-rose-600 mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-slate-50">Invalid Reset Link</h1>
            <p className="text-slate-400">{error}</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-xl">
              <p className="text-slate-300 text-center">
                This password reset link is invalid or has expired.
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <Link
                to="/forgot-password"
                className="w-full bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-4 rounded-lg transition duration-200 text-center"
              >
                Request New Reset Link
              </Link>
              <Link
                to="/login"
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-50 font-medium py-3 px-4 rounded-lg transition duration-200 text-center"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-2xl bg-rose-600 mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-50">Reset Password</h1>
          <p className="text-slate-400">
            Reset password for <span className="text-rose-300">{email}</span>
          </p>
        </div>

        {/* Success Message */}
        {message && (
          <div className="bg-green-900/30 border border-green-500/30 text-green-300 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-xl mr-3">✅</span>
              <div>
                <p className="font-medium">{message}</p>
                <p className="text-sm text-green-400 mt-1">
                  Redirecting to login page...
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-rose-900/30 border border-rose-500/30 text-rose-300 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <span className="text-xl mr-3">⚠️</span>
              <p className="font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Reset Form */}
        {!message && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordErrors([]);
                }}
                className={`w-full p-3 bg-slate-700 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50 ${
                  passwordErrors.length ? "border-rose-500" : "border-slate-600"
                }`}
                placeholder="••••••••"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-slate-500">
                Must be at least 6 characters with one uppercase letter and one number
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setPasswordErrors([]);
                }}
                className={`w-full p-3 bg-slate-700 border rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50 ${
                  passwordErrors.length ? "border-rose-500" : "border-slate-600"
                }`}
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            {/* Password Errors */}
            {passwordErrors.length > 0 && (
              <div className="bg-rose-900/20 border border-rose-500/20 rounded-lg p-3">
                <ul className="space-y-1">
                  {passwordErrors.map((error, index) => (
                    <li key={index} className="text-sm text-rose-400 flex items-center">
                      <span className="mr-2">•</span>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-slate-50 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Resetting Password...
                </span>
              ) : "Reset Password"}
            </button>
          </form>
        )}

        {/* Back to Login */}
        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-rose-400 hover:text-rose-300 hover:underline inline-flex items-center"
          >
            <span className="mr-2">←</span>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}