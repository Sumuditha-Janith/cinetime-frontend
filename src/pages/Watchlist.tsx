import { useState, useEffect, useRef } from "react";
import { getWatchlist, getWatchlistStats, updateWatchStatus, removeFromWatchlist } from "../services/media.service";
import MovieCard from "../components/MovieCard";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/authContext";

interface WatchlistItem {
  _id: string;
  tmdbId: number;
  title: string;
  type: "movie" | "tv";
  posterPath: string;
  releaseDate: string;
  watchStatus: "planned" | "watching" | "completed";
  rating?: number;
  watchTimeMinutes: number;
  vote_average?: number;
  vote_count?: number;
  overview?: string;
  backdrop_path?: string;
}

interface WatchlistStats {
  totalItems: number;
  totalWatchTime: number;
  totalWatchTimeFormatted: string;
  
  movieStats: {
    total: number;
    completed: number;
    watchTime: number;
    watchTimeFormatted: string;
  };
  
  tvStats: {
    total: number;
    completed: number;
    watchTime: number;
    watchTimeFormatted: string;
  };
  
  byStatus: Array<{
    status: string;
    count: number;
    time: number;
  }>;
  
  byType: Array<{
    type: string;
    count: number;
  }>;
  
  plannedCount: number;
  watchingCount: number;
  completedCount: number;
}

export default function Watchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [stats, setStats] = useState<WatchlistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (user) {
      fetchWatchlist();
      fetchStats();
    }
  }, [user, activeFilter]);

  // Auto-refresh stats every 10 seconds
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      console.log("⏰ Auto-refreshing stats...");
      forceRefreshStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [user]);

  const fetchTMDBDetails = async (tmdbId: number, type: "movie" | "tv"): Promise<any> => {
    try {
      const apiKey = import.meta.env.VITE_TMDB_API_KEY;
      if (!apiKey) {
        console.error("TMDB API key is missing");
        return null;
      }

      const response = await fetch(
        `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${apiKey}&language=en-US`
      );
      
      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch TMDB details for ${type} ID ${tmdbId}:`, error);
      return null;
    }
  };

  const fetchWatchlist = async () => {
    try {
      console.log("📋 Fetching watchlist...");
      const status = activeFilter === "all" ? undefined : activeFilter;
      const response = await getWatchlist(1, status);
      console.log("✅ Watchlist response:", response.data.length, "items");
      
      const enrichedItems = await Promise.all(
        response.data.map(async (item: WatchlistItem) => {
          try {
            const tmdbData = await fetchTMDBDetails(item.tmdbId, item.type);
            
            if (tmdbData) {
              return {
                ...item,
                vote_average: tmdbData.vote_average || 0,
                vote_count: tmdbData.vote_count || 0,
                overview: tmdbData.overview || "No description available",
                backdrop_path: tmdbData.backdrop_path || "",
              };
            }
          } catch (error) {
            console.error(`Error fetching TMDB data for ${item.title}:`, error);
          }
          
          return {
            ...item,
            vote_average: 0,
            vote_count: 0,
            overview: "No description available",
            backdrop_path: "",
          };
        })
      );
      
      setWatchlist(enrichedItems);
    } catch (error) {
      console.error("❌ Failed to fetch watchlist:", error);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log("📊 Fetching stats...");
      const response = await getWatchlistStats();
      console.log("✅ Stats response:", response.data);
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error("❌ Failed to fetch stats:", error);
      console.error("Error details:", error.response?.data);
    }
  };

  const forceRefreshStats = async () => {
    console.log("🔄 Force refreshing stats...");
    setRefreshingStats(true);
    try {
      await Promise.all([fetchStats(), fetchWatchlist()]);
      console.log("✅ Stats and watchlist refreshed");
    } catch (error) {
      console.error("❌ Failed to refresh stats:", error);
    } finally {
      setRefreshingStats(false);
    }
  };

  // Handler for status updates from MovieCard
  const handleStatusUpdate = async (mediaId: string, newStatus: "planned" | "watching" | "completed") => {
    console.log("🎬 Status update requested for:", mediaId, "->", newStatus);
    
    // Optimistic update: Update local state immediately
    setWatchlist(prev => 
      prev.map(item => 
        item._id === mediaId 
          ? { ...item, watchStatus: newStatus }
          : item
      )
    );
    
    try {
      const response = await updateWatchStatus(mediaId, { watchStatus: newStatus });
      console.log("✅ Status update successful:", response);
      
      // Refresh stats from server to get accurate calculations
      await fetchStats();
    } catch (error: any) {
      console.error("❌ Status update failed:", error);
      
      // Revert optimistic update on error
      setWatchlist(prev => 
        prev.map(item => 
          item._id === mediaId 
            ? { ...item, watchStatus: item.watchStatus } // Revert
            : item
        )
      );
    }
  };

  const handleRemove = async (mediaId: string) => {
    console.log("🗑️ Removing item:", mediaId);
    try {
      await removeFromWatchlist(mediaId);
      await forceRefreshStats();
    } catch (error) {
      console.error("Failed to remove:", error);
    }
  };

  const formatTime = (minutes: number): string => {
    if (!minutes) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get status count with fallback
  const getStatusCount = (status: string): number => {
    if (!stats) return 0;
    const statusData = stats.byStatus.find(s => s.status === status);
    return statusData?.count || 0;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please login to view your watchlist</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Refresh Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">🎯 My Watchlist</h1>
            <p className="text-slate-400">
              Track your movies and TV shows across different statuses
            </p>
            {lastUpdated && (
              <p className="text-xs text-slate-500 mt-1">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={forceRefreshStats}
              disabled={refreshingStats}
              className="flex items-center bg-rose-600 hover:bg-rose-700 text-slate-50 px-4 py-2 rounded-lg transition"
            >
              {refreshingStats ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-50 border-t-transparent rounded-full animate-spin mr-2"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {/* Movie Stats */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="text-3xl">🎬</div>
                <span className={`text-sm font-bold ${
                  stats.movieStats.completed > 0 ? "text-green-400" : "text-slate-400"
                }`}>
                  {stats.movieStats.completed}/{stats.movieStats.total}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-1">Movies</p>
              <p className="text-2xl font-bold">{stats.movieStats.total}</p>
              <div className="mt-2 pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-500">Watch Time</p>
                <p className="text-sm font-medium text-slate-300">{stats.movieStats.watchTimeFormatted}</p>
              </div>
            </div>
            
            {/* TV Show Stats */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <div className="text-3xl">📺</div>
                <span className={`text-sm font-bold ${
                  stats.tvStats.completed > 0 ? "text-green-400" : "text-slate-400"
                }`}>
                  {stats.tvStats.completed}/{stats.tvStats.total}
                </span>
              </div>
              <p className="text-slate-400 text-sm mb-1">TV Shows</p>
              <p className="text-2xl font-bold">{stats.tvStats.total}</p>
              <div className="mt-2 pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-500">Watch Time</p>
                <p className="text-sm font-medium text-slate-300">{stats.tvStats.watchTimeFormatted}</p>
              </div>
            </div>
            
            {/* Total Watch Time */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="text-3xl mb-3">⏱️</div>
              <p className="text-slate-400 text-sm">Total Watch Time</p>
              <p className="text-2xl font-bold">{stats.totalWatchTimeFormatted}</p>
              <div className="mt-2 pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  Movies: {stats.movieStats.watchTimeFormatted}
                </p>
                <p className="text-xs text-slate-500">
                  TV: {stats.tvStats.watchTimeFormatted}
                </p>
              </div>
            </div>
            
            {/* Planned */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="text-3xl mb-3">📋</div>
              <p className="text-slate-400 text-sm">Planned</p>
              <p className="text-2xl font-bold">{stats.plannedCount}</p>
              <div className="mt-2 pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  Time: {stats.byStatus.find(s => s.status === "planned")?.time ? 
                    formatTime(stats.byStatus.find(s => s.status === "planned")?.time || 0) : "0h 0m"}
                </p>
              </div>
            </div>
            
            {/* Completed */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="text-3xl mb-3">✅</div>
              <p className="text-slate-400 text-sm">Completed</p>
              <p className="text-2xl font-bold">{stats.completedCount}</p>
              <div className="mt-2 pt-2 border-t border-slate-700">
                <p className="text-xs text-slate-500">
                  Movies: {stats.movieStats.completed} | TV: {stats.tvStats.completed}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Debug Info - Remove in production */}
        <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-400">
            Debug: {watchlist.length} items loaded | 
            Auto-refresh every 10s | 
            Check browser console for details
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 border-b border-slate-700">
            <button
              onClick={() => setActiveFilter("all")}
              className={`px-4 py-3 font-medium text-sm transition ${
                activeFilter === "all"
                  ? "text-rose-400 border-b-2 border-rose-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              All ({stats?.totalItems || 0})
            </button>
            <button
              onClick={() => setActiveFilter("planned")}
              className={`px-4 py-3 font-medium text-sm transition ${
                activeFilter === "planned"
                  ? "text-rose-400 border-b-2 border-rose-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Planned ({stats?.plannedCount || 0})
            </button>
            <button
              onClick={() => setActiveFilter("watching")}
              className={`px-4 py-3 font-medium text-sm transition ${
                activeFilter === "watching"
                  ? "text-rose-400 border-b-2 border-rose-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Watching ({stats?.watchingCount || 0})
            </button>
            <button
              onClick={() => setActiveFilter("completed")}
              className={`px-4 py-3 font-medium text-sm transition ${
                activeFilter === "completed"
                  ? "text-rose-400 border-b-2 border-rose-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Completed ({stats?.completedCount || 0})
            </button>
          </div>
        </div>

        {/* Watchlist Content */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="bg-slate-800 rounded-2xl p-4 animate-pulse">
                <div className="w-full h-48 bg-slate-700 rounded-xl mb-4"></div>
                <div className="h-4 bg-slate-700 rounded mb-2"></div>
                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : watchlist.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {watchlist.map((item) => (
                <MovieCard
                  key={item._id}
                  media={{
                    id: item.tmdbId,
                    title: item.title,
                    overview: item.overview || "No description available",
                    poster_path: item.posterPath,
                    backdrop_path: item.backdrop_path || "",
                    release_date: item.releaseDate,
                    vote_average: item.vote_average || 0,
                    vote_count: item.vote_count || 0,
                    type: item.type,
                  }}
                  isInWatchlist={true}
                  watchlistId={item._id}
                  watchStatus={item.watchStatus}
                  onStatusChange={() => handleStatusUpdate(item._id, "completed")}
                  showActions={true}
                />
              ))}
            </div>

            {watchlist.length === 0 && activeFilter !== "all" && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">
                  {activeFilter === "planned" ? "📋" :
                   activeFilter === "watching" ? "👀" :
                   activeFilter === "completed" ? "✅" : "🎬"}
                </div>
                <h3 className="text-xl font-bold mb-2">No {activeFilter} items</h3>
                <p className="text-slate-400 mb-4">
                  You don't have any {activeFilter} items in your watchlist.
                </p>
                <button
                  onClick={() => setActiveFilter("all")}
                  className="bg-rose-600 hover:bg-rose-700 text-slate-50 font-medium py-2 px-4 rounded-lg transition"
                >
                  View All Items
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="inline-block p-6 bg-slate-800 rounded-2xl mb-6">
              <span className="text-6xl">🎬</span>
            </div>
            <h3 className="text-2xl font-bold mb-2">Your watchlist is empty</h3>
            <p className="text-slate-400 mb-6 max-w-md mx-auto">
              Start building your watchlist by searching for movies and TV shows you want to watch
            </p>
            <a
              href="/movies"
              className="inline-block bg-rose-600 hover:bg-rose-700 text-slate-50 font-bold py-3 px-6 rounded-lg transition duration-200"
            >
              Discover Movies
            </a>
          </div>
        )}

        {/* Watchlist Tips */}
        <div className="mt-12 p-6 bg-slate-800 rounded-2xl border border-slate-700">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <span className="mr-3">💡</span> Watchlist Tips
          </h3>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center">
              <span className="text-rose-400 mr-2">•</span>
              Click "Completed" to update stats instantly
            </li>
            <li className="flex items-center">
              <span className="text-rose-400 mr-2">•</span>
              Use "Refresh Now" button if stats don't update
            </li>
            <li className="flex items-center">
              <span className="text-rose-400 mr-2">•</span>
              Stats auto-refresh every 10 seconds
            </li>
            <li className="flex items-center">
              <span className="text-rose-400 mr-2">•</span>
              Check browser console for debugging info
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}