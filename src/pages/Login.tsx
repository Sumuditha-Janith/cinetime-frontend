import { useState } from "react";
import type { FormEvent } from "react";
import { login, getMyDetails } from "../services/auth.service";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/authContext";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await login(email, password);
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem("refreshToken", res.data.refreshToken);

      const userDetails = await getMyDetails();
      setUser(userDetails.data);

      setMessage("Login successful! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">🎬 Welcome Back</h1>
          <p className="text-gray-400">Sign in to your CINETIME account</p>
        </div>

        {message && (
          <div className={`p-3 rounded-lg mb-4 ${message.includes("success") ? "bg-green-900" : "bg-red-900"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-400">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-400 hover:underline">
              Register here
            </Link>
          </p>
          <p className="mt-2">
            Forgot password?{" "}
            <Link to="/forgot-password" className="text-blue-400 hover:underline">
              Reset it
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}