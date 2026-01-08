import { Link } from "react-router-dom";

export default function Welcome() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col justify-center items-center p-8 animate-fade-in">
      <div className="max-w-4xl text-center">
        <div className="mb-10">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-rose-600 rounded-xl flex items-center justify-center shadow-lg">
              <img 
                src="https://img.icons8.com/external-those-icons-fill-those-icons/24/external-TV-smart-devices-those-icons-fill-those-icons.png" 
                alt="CINETIME Logo" 
                className="w-8 h-8 object-contain invert" 
              />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-rose-600 to-rose-500 bg-clip-text text-transparent">
              CINETIME
            </span>
          </h1>
          <p className="text-2xl text-slate-400 mb-2">
            Your Personal Movie & TV Show Tracker
          </p>
          <p className="text-slate-500 text-lg">
            Track, Discover, and Engage with Cinema Like Never Before
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            to="/login"
            className="px-10 py-4 bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold rounded-2xl text-lg transition duration-300 transform hover:scale-105"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-50 font-bold rounded-2xl text-lg transition duration-300 transform hover:scale-105 border border-slate-700"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}