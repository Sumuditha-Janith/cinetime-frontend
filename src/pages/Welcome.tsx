import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white flex flex-col justify-center items-center p-8">
      <div className="max-w-4xl text-center">
        <div className="mb-10">
          <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            🎬 CINETIME
          </h1>
          <p className="text-2xl text-gray-300 mb-2">
            Your Personal Movie & TV Show Tracker
          </p>
          <p className="text-gray-500 text-lg">
            Track, Discover, and Engage with Cinema Like Never Before
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <div className="text-3xl mb-4">🔐</div>
            <h3 className="text-xl font-bold mb-2">Secure Auth</h3>
            <p className="text-gray-400">
              Dual‑factor registration with email OTP and JWT protection.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <div className="text-3xl mb-4">🎥</div>
            <h3 className="text-xl font-bold mb-2">Live TMDB Data</h3>
            <p className="text-gray-400">
              Real‑time movie metadata, posters, ratings, and watchlists.
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-bold mb-2">AI‑Powered Insights</h3>
            <p className="text-gray-400">
              Gemini AI generates summaries, trivia, and personalized content.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            to="/login"
            className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-lg transition duration-300 transform hover:scale-105"
          >
            Login to Dashboard
          </Link>
          <Link
            to="/register"
            className="px-10 py-4 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-2xl text-lg transition duration-300 transform hover:scale-105"
          >
            Create Free Account
          </Link>
        </div>

        <p className="mt-12 text-gray-500 text-sm">
          Built with MERN + TypeScript • TailwindCSS • Redux • JWT • TMDB API • Gemini AI
        </p>
      </div>
    </div>
  );
}