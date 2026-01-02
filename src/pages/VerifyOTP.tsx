import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { verifyOTP } from "../services/auth.service";
import { useNavigate, useLocation, Link } from "react-router-dom";

export default function VerifyOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!email) {
      navigate("/register");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendDisabled && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setResendDisabled(false);
    }
  }, [resendDisabled, countdown]);

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setMessage("OTP must be 6 digits");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOTP(email, otp);
      setMessage(res.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setMessage("Resending OTP...");
    setResendDisabled(true);
    setCountdown(60);
    setTimeout(() => setMessage("OTP resent to your email."), 1000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8 animate-slide-up">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block p-3 rounded-2xl bg-rose-600 mb-4">
            <span className="text-3xl">📧</span>
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-50">Verify Email</h1>
          <p className="text-slate-400">
            Enter the 6-digit OTP sent to <br />
            <span className="font-semibold text-rose-300">{email}</span>
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`p-3 rounded-lg mb-4 ${message.includes("success") 
            ? "bg-green-900/30 border border-green-500/30 text-green-300" 
            : "bg-rose-900/30 border border-rose-500/30 text-rose-300"}`}>
            {message}
          </div>
        )}

        {/* OTP Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2 text-slate-300">OTP Code</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full p-4 text-2xl text-center tracking-widest bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent text-slate-50"
              placeholder="000000"
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
                Verifying...
              </span>
            ) : "Verify OTP"}
          </button>
        </form>

        {/* Resend OTP */}
        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            disabled={resendDisabled}
            className="text-rose-400 hover:text-rose-300 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resendDisabled ? `Resend OTP in ${countdown}s` : "Resend OTP"}
          </button>
        </div>

        {/* Navigation Links */}
        <p className="text-center mt-6 text-slate-400">
          Go back to{" "}
          <Link to="/register" className="text-rose-400 hover:text-rose-300 hover:underline">
            Register
          </Link>{" "}
          or{" "}
          <Link to="/login" className="text-rose-400 hover:text-rose-300 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}