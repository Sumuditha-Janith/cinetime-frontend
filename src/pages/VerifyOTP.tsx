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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">📧 Verify Email</h1>
          <p className="text-gray-400">
            Enter the 6-digit OTP sent to <br />
            <span className="font-semibold text-blue-300">{email}</span>
          </p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 ${message.includes("success") ? "bg-green-900" : "bg-red-900"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">OTP Code</label>
            <input
              type="text"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-full p-4 text-2xl text-center tracking-widest bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={handleResend}
            disabled={resendDisabled}
            className="text-blue-400 hover:underline disabled:opacity-50"
          >
            {resendDisabled ? `Resend OTP in ${countdown}s` : "Resend OTP"}
          </button>
        </div>

        <p className="text-center mt-6 text-gray-400">
          Go back to{" "}
          <Link to="/register" className="text-blue-400 hover:underline">
            Register
          </Link>{" "}
          or{" "}
          <Link to="/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}