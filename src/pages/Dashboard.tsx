import { useAuth } from "../context/authContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-50">🎬 Dashboard</h1>
          <p className="text-slate-400 mt-2">
            Welcome back, {user?.firstname} {user?.lastname}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Profile Card */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-50">👤 Profile</h2>
            <div className="space-y-2">
              <p>
                <span className="text-slate-400">Email:</span> {user?.email}
              </p>
              <p>
                <span className="text-slate-400">Role:</span>{" "}
                <span className="text-rose-400">{user?.roles?.join(", ")}</span>
              </p>
              <p>
                <span className="text-slate-400">Status:</span>{" "}
                <span className={`px-2 py-1 rounded text-sm ${
                  user?.approved === "APPROVED"
                    ? "bg-green-900/30 text-green-300"
                    : "bg-rose-900/30 text-rose-300"
                }`}>
                  {user?.approved}
                </span>
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-50">📊 Quick Stats</h2>
            <div className="space-y-3">
              <div>
                <p className="text-slate-400">Movies Watched</p>
                <p className="text-2xl font-bold text-slate-50">0</p>
              </div>
              <div>
                <p className="text-slate-400">Watchlist</p>
                <p className="text-2xl font-bold text-slate-50">0</p>
              </div>
              <div>
                <p className="text-slate-400">Total Watch Time</p>
                <p className="text-2xl font-bold text-slate-50">0h 0m</p>
              </div>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
            <h2 className="text-xl font-bold mb-4 text-slate-50">🚀 Coming Soon</h2>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center">
                <span className="text-rose-400 mr-2">•</span>
                TMDB Movie Search
              </li>
              <li className="flex items-center">
                <span className="text-rose-400 mr-2">•</span>
                Watchlist Management
              </li>
              <li className="flex items-center">
                <span className="text-rose-400 mr-2">•</span>
                AI‑Powered Summaries
              </li>
              <li className="flex items-center">
                <span className="text-rose-400 mr-2">•</span>
                Analytics Dashboard
              </li>
              <li className="flex items-center">
                <span className="text-rose-400 mr-2">•</span>
                Social Features
              </li>
            </ul>
          </div>
        </div>

        {/* Completion Banner */}
        <div className="mt-8 p-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl border border-slate-700">
          <h2 className="text-2xl font-bold mb-4 text-slate-50">
            Phase 2 Complete ✅
          </h2>
          <p className="text-slate-300">
            You've successfully implemented the authentication system with:
            <br />
            <span className="text-rose-400">Backend</span>: User registration, OTP verification, JWT login, role‑based access.
            <br />
            <span className="text-rose-400">Frontend</span>: Welcome, Register, OTP Verification, Login, Dashboard pages.
            <br />
            <span className="text-rose-400">Security</span>: bcrypt password hashing, JWT tokens, email verification, protected routes.
          </p>
        </div>
      </div>
    </div>
  );
}