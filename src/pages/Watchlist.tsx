import { useState, useEffect } from "react";
import { getWatchlist, getWatchlistStats, updateWatchStatus, removeFromWatchlist } from "../services/media.service";
import MovieCard from "../components/MovieCard";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/authContext";
import { debug } from "../utils/debug";
import api from "../services/api";

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
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    setDebugInfo(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${info}`]);
  };

  useEffect(() => {
    if (user) {
      debug.log('Watchlist', 'Component mounted or user changed', { user: user.email });
      addDebugInfo(`User logged in: ${user.email}`);
      fetchWatchlist();
      fetchStats();
    }
  }, [user, activeFilter]);

  const fetchWatchlist = async () => {
    try {
      addDebugInfo('Fetching watchlist...');
      debug.log('Watchlist', 'fetchWatchlist called', { activeFilter });
      const status = activeFilter === "all" ? undefined : activeFilter;
      const response = await getWatchlist(1, status);
      
      debug.log('Watchlist', 'Watchlist API response', { 
        items: response.data.length,
        data: response.data
      });
      addDebugInfo(`Got ${response.data.length} watchlist items`);
      
      // Calculate local stats from watchlist
      calculateLocalStats(response.data);
      
      setWatchlist(response.data);
    } catch (error: any) {
      debug.error('Watchlist', 'Failed to fetch watchlist', error);
      addDebugInfo(`Error fetching watchlist: ${error.message}`);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalStats = (items: WatchlistItem[]) => {
    if (!items.length) {
      setStats(null);
      return;
    }

    const totalItems = items.length;
    
    // Calculate completed items
    const completedItems = items.filter(item => item.watchStatus === "completed");
    const completedCount = completedItems.length;
    
    // Calculate planned items
    const plannedItems = items.filter(item => item.watchStatus === "planned");
    const plannedCount = plannedItems.length;
    
    // Calculate watching items
    const watchingItems = items.filter(item => item.watchStatus === "watching");
    const watchingCount = watchingItems.length;
    
    // Calculate watch times
    const totalWatchTime = completedItems.reduce((sum, item) => sum + (item.watchTimeMinutes || 0), 0);
    
    // Calculate movie stats
    const movies = items.filter(item => item.type === "movie");
    const completedMovies = movies.filter(item => item.watchStatus === "completed");
    const movieWatchTime = completedMovies.reduce((sum, item) => sum + (item.watchTimeMinutes || 0), 0);
    
    // Calculate TV stats
    const tvShows = items.filter(item => item.type === "tv");
    const completedTV = tvShows.filter(item => item.watchStatus === "completed");
    const tvWatchTime = completedTV.reduce((sum, item) => sum + (item.watchTimeMinutes || 0), 0);
    
    // Format times
    const formatTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    };
    
    // Build byStatus array
    const byStatus = [
      { status: "planned", count: plannedCount, time: 0 },
      { status: "watching", count: watchingCount, time: 0 },
      { status: "completed", count: completedCount, time: totalWatchTime }
    ].filter(s => s.count > 0);
    
    // Build byType array
    const byType = [
      { type: "movie", count: movies.length },
      { type: "tv", count: tvShows.length }
    ];
    
    const localStats = {
      totalItems,
      totalWatchTime,
      totalWatchTimeFormatted: formatTime(totalWatchTime),
      
      movieStats: {
        total: movies.length,
        completed: completedMovies.length,
        watchTime: movieWatchTime,
        watchTimeFormatted: formatTime(movieWatchTime)
      },
      
      tvStats: {
        total: tvShows.length,
        completed: completedTV.length,
        watchTime: tvWatchTime,
        watchTimeFormatted: formatTime(tvWatchTime)
      },
      
      byStatus,
      byType,
      
      plannedCount,
      watchingCount,
      completedCount,
    };
    
    console.log("📊 Calculated local stats:", localStats);
    setStats(localStats);
  };

  const fetchStats = async () => {
    try {
      addDebugInfo('Fetching stats from API...');
      debug.log('Watchlist', 'fetchStats called');
      const response = await getWatchlistStats();
      
      debug.log('Watchlist', 'Stats API response', response.data);
      addDebugInfo(`API Stats: ${response.data.totalItems} items, ${response.data.completedCount} completed`);
      
      setStats(response.data);
      setLastUpdated(new Date());
    } catch (error: any) {
      debug.error('Watchlist', 'Failed to fetch stats', error);
      addDebugInfo(`Error fetching stats: ${error.message}`);
      console.error("Error details:", error.response?.data);
      
      // Fall back to local calculation if API fails
      if (watchlist.length > 0) {
        addDebugInfo('Using local stats calculation');
        calculateLocalStats(watchlist);
      }
    }
  };

  const forceRefreshStats = async () => {
    addDebugInfo('Manual refresh triggered');
    debug.log('Watchlist', 'forceRefreshStats called');
    setRefreshingStats(true);
    try {
      await Promise.all([fetchStats(), fetchWatchlist()]);
      addDebugInfo('Refresh completed successfully');
      debug.log('Watchlist', 'Refresh completed');
    } catch (error) {
      debug.error('Watchlist', 'Failed to refresh', error);
      addDebugInfo('Refresh failed');
    } finally {
      setRefreshingStats(false);
    }
  };

  const testStatsEndpoint = async () => {
    try {
      addDebugInfo('Testing direct database query...');
      const response = await api.get('/media/watchlist/debug');
      console.log('🔍 Debug endpoint response:', response.data);
      
      const { totalItems, completedItems, completedWatchTime, items } = response.data.data;
      addDebugInfo(`DB Query: ${completedItems}/${totalItems} completed items`);
      
      // Log each item
      console.log('📋 Database items:');
      items.forEach((item: any) => {
        console.log(`  - ${item.title}: ${item.status} (${item.time} mins)`);
      });
      
      // Update stats based on database
      if (items.length > 0) {
        calculateLocalStats(watchlist); // Recalculate from current watchlist
        addDebugInfo('Updated stats from database');
      }
      
    } catch (error) {
      console.error('Test stats error:', error);
      addDebugInfo('Database query failed');
    }
  };

  const handleStatusUpdate = async (mediaId: string, newStatus: "planned" | "watching" | "completed") => {
    debug.log('Watchlist', 'handleStatusUpdate called', { mediaId, newStatus });
    addDebugInfo(`Updating status for ${mediaId} to ${newStatus}`);
    
    // Find the item being updated
    const itemToUpdate = watchlist.find(item => item._id === mediaId);
    if (!itemToUpdate) {
      debug.error('Watchlist', 'Item not found in watchlist', { mediaId });
      addDebugInfo(`Item ${mediaId} not found in watchlist`);
      return;
    }
    
    console.log('🔄 Status update details:', {
      title: itemToUpdate.title,
      currentStatus: itemToUpdate.watchStatus,
      newStatus,
      watchTime: itemToUpdate.watchTimeMinutes
    });

    // Optimistic update: Update local state immediately
    const updatedWatchlist = watchlist.map(item => 
      item._id === mediaId 
        ? { ...item, watchStatus: newStatus }
        : item
    );
    
    // Update local stats immediately
    calculateLocalStats(updatedWatchlist);
    setWatchlist(updatedWatchlist);
    
    try {
      // Call the API to update status
      debug.log('Watchlist', 'Calling updateWatchStatus API');
      
      const response = await updateWatchStatus(mediaId, { watchStatus: newStatus });
      console.log('✅ API Response:', response);
      addDebugInfo(`API: Status updated to ${newStatus} for "${itemToUpdate.title}"`);
      
      // Refresh from server to ensure consistency
      setTimeout(async () => {
        await fetchWatchlist(); // This will recalculate stats
        addDebugInfo('Data refreshed from server');
      }, 500);
      
    } catch (error: any) {
      debug.error('Watchlist', 'Status update failed', error);
      console.error('❌ API Error:', error.response?.data || error.message);
      addDebugInfo(`Update failed: ${error.response?.data?.message || error.message}`);
      
      // Revert on error
      await fetchWatchlist();
    }
  };

  const handleRemove = async (mediaId: string) => {
    debug.log('Watchlist', 'handleRemove called', { mediaId });
    addDebugInfo(`Removing item ${mediaId}`);
    try {
      await removeFromWatchlist(mediaId);
      await forceRefreshStats();
    } catch (error) {
      debug.error('Watchlist', 'Failed to remove', error);
      addDebugInfo('Remove failed');
    }
  };

  const formatTime = (minutes: number): string => {
    if (!minutes) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const logCurrentState = () => {
    debug.log('Watchlist', 'Manual debug trigger');
    addDebugInfo('Manual debug trigger');
    console.log('Current watchlist:', watchlist);
    console.log('Current stats:', stats);
    
    // Log detailed watchlist status
    if (watchlist.length > 0) {
      console.log('📋 Watchlist items:');
      watchlist.forEach(item => {
        console.log(`  - ${item.title}: ${item.watchStatus} (${item.watchTimeMinutes} mins)`);
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-400">Loading your watchlist...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              className="flex items-center bg-rose-600 hover:bg-rose-700 text-slate-50 px-4 py-2 rounded-lg transition disabled:opacity-50"
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

        {/* Debug Panel */}
        <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-rose-400">Debug Console</h3>
            <button 
              onClick={() => setDebugInfo([])}
              className="text-xs text-slate-400 hover:text-slate-300"
            >
              Clear
            </button>
          </div>
          <div className="h-32 overflow-y-auto bg-slate-900 rounded p-2 font-mono text-xs">
            {debugInfo.length === 0 ? (
              <p className="text-slate-500">No debug messages yet...</p>
            ) : (
              debugInfo.map((msg, idx) => (
                <div key={idx} className="text-slate-300 mb-1">{msg}</div>
              ))
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Watchlist: {watchlist.length} items | 
            Filter: {activeFilter} |
            Stats: {stats ? 'Loaded' : 'None'} |
            Completed: {stats?.completedCount || 0}
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
                <p className="text-xs text-slate-500">Completed Time</p>
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
                <p className="text-xs text-slate-500">Completed Time</p>
                <p className="text-sm font-medium text-slate-300">{stats.tvStats.watchTimeFormatted}</p>
              </div>
            </div>
            
            {/* Total Completed Time */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <div className="text-3xl mb-3">⏱️</div>
              <p className="text-slate-400 text-sm">Completed Time</p>
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
                  Items: {stats.byStatus.find(s => s.status === "planned")?.count || 0}
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
        {watchlist.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {watchlist.map((item) => (
                <div key={item._id} className="relative">
                  <MovieCard
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
                    onStatusChange={(newStatus) => {
                      debug.log('Watchlist', 'MovieCard onStatusChange triggered', {
                        itemId: item._id,
                        title: item.title,
                        newStatus
                      });
                      addDebugInfo(`Status change for "${item.title}": ${item.watchStatus} → ${newStatus}`);
                      handleStatusUpdate(item._id, newStatus);
                    }}
                    showActions={true}
                  />
                  {/* Debug overlay for each card */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {item.watchStatus}
                  </div>
                </div>
              ))}
            </div>
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

        {/* Test Controls */}
        <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-bold mb-4 text-rose-400">Test Controls</h3>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={forceRefreshStats}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 px-4 py-2 rounded-lg text-sm"
            >
              Force Refresh All Data
            </button>
            <button
              onClick={logCurrentState}
              className="bg-blue-700 hover:bg-blue-600 text-blue-100 px-4 py-2 rounded-lg text-sm"
            >
              Log Current State
            </button>
            <button
              onClick={testStatsEndpoint}
              className="bg-green-700 hover:bg-green-600 text-green-100 px-4 py-2 rounded-lg text-sm"
            >
              Test Database Query
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}