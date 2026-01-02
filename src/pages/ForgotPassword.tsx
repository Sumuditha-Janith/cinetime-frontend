import { useState } from "react";
import type { FormEvent } from "react";
import { requestPasswordReset } from "../services/password.service";
import { validateEmail } from "../services/auth.service";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await requestPasswordReset(email);
      setMessage(res.message);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-2xl bg-rose-600 mb-4">
            <span className="text-3xl">🔐</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-50">Forgot Password?</h1>
          <p className="text-slate-400">
            {submitted 
              ? "Check your email for reset instructions" 
              : "Enter your email to reset your password"}
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
                  Check your spam folder if you don't see it in your inbox.
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

        {/* Reset Form (only show if not submitted) */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-slate-50 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending Reset Link...
                </span>
              ) : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-xl">
              <p className="text-slate-300">
                We've sent password reset instructions to:
              </p>
              <p className="font-medium text-rose-300 mt-1">{email}</p>
            </div>
            
            <div className="pt-4 border-t border-slate-700">
              <p className="text-slate-400 text-sm mb-4">
                Didn't receive the email?
              </p>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setMessage("");
                }}
                className="w-full bg-slate-700 hover:bg-slate-600 text-slate-50 font-medium py-3 px-4 rounded-lg transition duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

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