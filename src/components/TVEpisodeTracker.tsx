import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/authContext";
import TMDBService from "../services/tmdb.service";

interface TVEpisode {
  _id: string;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle: string;
  airDate: string;
  overview?: string;
  runtime: number;
  stillPath?: string;
  watchStatus: "unwatched" | "watched" | "skipped";
  rating?: number;
  watchedAt?: string;
}

interface TVShowDetails {
  _id: string;
  tmdbId: number;
  title: string;
  posterPath: string;
  backdrop_path?: string;
  seasonCount?: number;
  episodeCount?: number;
  totalEpisodesWatched?: number;
  totalWatchTime?: number;
  watchStatus: "planned" | "watching" | "completed";
}

// Define the props interface
interface TVEpisodeTrackerProps {
  tvShow: TVShowDetails;
  onEpisodeStatusChange?: () => void | Promise<void>;
}

export default function TVEpisodeTracker({ tvShow, onEpisodeStatusChange }: TVEpisodeTrackerProps) {
  const { user } = useAuth();
  const [episodes, setEpisodes] = useState<TVEpisode[]>([]);
  const [seasons, setSeasons] = useState<number[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [fetchingFromTMDB, setFetchingFromTMDB] = useState(false);
  const [progress, setProgress] = useState({
    watched: 0,
    total: 0,
    percentage: 0
  });

  // Auto-load episodes when component mounts or when TV show status changes to "watching"
  useEffect(() => {
    if (tvShow.tmdbId) {
      if (tvShow.watchStatus === "watching") {
        fetchEpisodes(selectedSeason);
      } else {
        // If not watching, still try to load any existing episodes
        fetchEpisodes(selectedSeason);
      }
    }
  }, [tvShow.tmdbId, tvShow.watchStatus, selectedSeason]);

  const fetchEpisodes = async (season: number) => {
    try {
      setLoading(true);
      console.log(`📺 Fetching episodes for season ${season} of ${tvShow.title}`);
      
      const response = await api.get(`/media/tv/${tvShow.tmdbId}/episodes?season=${season}`);
      
      if (response.data.data.episodesBySeason) {
        const seasonEpisodes = response.data.data.episodesBySeason[season] || [];
        
        if (seasonEpisodes.length === 0 && tvShow.watchStatus === "watching") {
          // No episodes in database but show is "watching" - fetch from TMDB
          console.log(`🔄 No episodes found, fetching from TMDB...`);
          await fetchEpisodesFromTMDB(season);
          return;
        }
        
        setEpisodes(seasonEpisodes);
        
        // Update progress
        const watchedEpisodes = seasonEpisodes.filter((ep: TVEpisode) => ep.watchStatus === "watched").length;
        setProgress({
          watched: watchedEpisodes,
          total: seasonEpisodes.length,
          percentage: seasonEpisodes.length > 0 ? (watchedEpisodes / seasonEpisodes.length) * 100 : 0
        });
        
        // Fetch seasons if not loaded
        if (seasons.length === 0) {
          fetchSeasons();
        }
        
        console.log(`✅ Loaded ${seasonEpisodes.length} episodes for season ${season}`);
      } else {
        // No episode data structure - try TMDB
        console.log(`🔄 No episode data structure found, trying TMDB...`);
        if (tvShow.watchStatus === "watching") {
          await fetchEpisodesFromTMDB(season);
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch episodes:", error);
      
      // If 404 or no episodes, try TMDB
      if ((error.response?.status === 404 || error.response?.status === 400) && tvShow.watchStatus === "watching") {
        console.log(`🔄 Database returned 404, fetching from TMDB...`);
        await fetchEpisodesFromTMDB(season);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchEpisodesFromTMDB = async (season: number) => {
    try {
      setFetchingFromTMDB(true);
      console.log(`🌐 Fetching episodes from TMDB API for season ${season}...`);
      
      const response = await api.post(`/media/tv/${tvShow.tmdbId}/season/${season}/fetch`);
      
      if (response.status === 200) {
        console.log(`✅ Successfully fetched episodes from TMDB:`, response.data);
        
        // Wait a moment and then refetch from our database
        setTimeout(() => {
          console.log(`🔄 Refetching episodes from database after TMDB fetch...`);
          fetchEpisodes(season);
        }, 1500);
      }
    } catch (error: any) {
      console.error("Failed to fetch episodes from TMDB:", error);
      if (error.response?.data?.message) {
        console.error("TMDB error message:", error.response.data.message);
      }
    } finally {
      setFetchingFromTMDB(false);
    }
  };

  const fetchSeasons = async () => {
    try {
      // Create array of season numbers, default to 1 if undefined
      const totalSeasons = tvShow.seasonCount || 1;
      const seasonsArray = Array.from(
        { length: totalSeasons }, 
        (_, i) => i + 1
      );
      setSeasons(seasonsArray);
      console.log(`📋 Loaded ${seasonsArray.length} seasons`);
    } catch (error) {
      console.error("Failed to fetch seasons:", error);
    }
  };

  const loadEpisodesManually = async () => {
    console.log(`🔄 Manually loading episodes for season ${selectedSeason}...`);
    await fetchEpisodes(selectedSeason);
  };

  const handleEpisodeStatusUpdate = async (episodeId: string, newStatus: "unwatched" | "watched" | "skipped") => {
    try {
      console.log(`🔄 Updating episode ${episodeId} to ${newStatus}`);
      const response = await api.put(`/media/episodes/${episodeId}/status`, {
        watchStatus: newStatus
      });
      
      if (response.status === 200) {
        // Update local state
        setEpisodes(prevEpisodes =>
          prevEpisodes.map(ep =>
            ep._id === episodeId
              ? { ...ep, 
                  watchStatus: newStatus, 
                  watchedAt: newStatus === "watched" ? new Date().toISOString() : undefined 
                }
              : ep
          )
        );
        
        // Call the callback to refresh stats if provided
        if (onEpisodeStatusChange) {
          const result = onEpisodeStatusChange();
          if (result && typeof result.then === 'function') {
            await result;
          }
        }
        
        // Update progress
        const updatedEpisodes = episodes.map(ep =>
          ep._id === episodeId ? { ...ep, watchStatus: newStatus } : ep
        );
        const watchedEpisodes = updatedEpisodes.filter(ep => ep.watchStatus === "watched").length;
        setProgress({
          watched: watchedEpisodes,
          total: updatedEpisodes.length,
          percentage: updatedEpisodes.length > 0 ? (watchedEpisodes / updatedEpisodes.length) * 100 : 0
        });
        
        console.log(`✅ Episode status updated to ${newStatus}`);
      }
    } catch (error) {
      console.error("Failed to update episode status:", error);
    }
  };

  const markSeasonAsWatched = async () => {
    try {
      console.log(`✅ Marking all episodes in season ${selectedSeason} as watched`);
      const promises = episodes.map(episode => 
        handleEpisodeStatusUpdate(episode._id, "watched")
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to mark season as watched:", error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "watched": return "bg-green-600 text-green-100";
      case "unwatched": return "bg-slate-600 text-slate-300";
      case "skipped": return "bg-yellow-600 text-yellow-100";
      default: return "bg-slate-600 text-slate-300";
    }
  };

  if (loading || fetchingFromTMDB) {
    return (
      <div className="p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">
            {fetchingFromTMDB ? "Fetching episodes from TMDB..." : "Loading episodes..."}
          </p>
          {fetchingFromTMDB && (
            <p className="text-slate-500 text-sm mt-2">
              This may take a moment as we fetch episode data
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-50">Episode Tracker</h3>
          <p className="text-slate-400 text-sm">
            Season {selectedSeason} • {episodes.length} episodes
            {tvShow.watchStatus === "watching" && (
              <span className="ml-2 text-rose-400">👀 Watching</span>
            )}
          </p>
        </div>
        
        {/* Progress Bar */}
        <div className="w-48">
          <div className="flex justify-between text-sm text-slate-400 mb-1">
            <span>{progress.watched} / {progress.total} watched</span>
            <span>{Math.round(progress.percentage)}%</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Season Selector */}
      <div className="mb-4">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {seasons.map(season => (
            <button
              key={season}
              onClick={() => setSelectedSeason(season)}
              className={`px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap ${
                selectedSeason === season
                  ? "bg-rose-600 text-slate-50"
                  : "bg-slate-700 text-slate-300 hover:bg-slate-600"
              }`}
            >
              Season {season}
            </button>
          ))}
        </div>
      </div>

      {/* Load Episodes Button (if no episodes) */}
      {episodes.length === 0 && (
        <div className="mb-4">
          <button
            onClick={loadEpisodesManually}
            disabled={loading}
            className="w-full bg-rose-600 hover:bg-rose-700 text-slate-50 py-2 px-4 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-50 border-t-transparent rounded-full animate-spin mr-2"></div>
                Loading...
              </>
            ) : (
              <>
                <span className="mr-2">📥</span>
                Load Episodes
              </>
            )}
          </button>
          <p className="text-xs text-slate-500 mt-2 text-center">
            {tvShow.watchStatus === "watching" 
              ? "Episodes will load automatically when marked as 'watching'"
              : "Mark this show as 'watching' to automatically load episodes"}
          </p>
        </div>
      )}

      {/* Mark Season Button (only show if we have episodes) */}
      {episodes.length > 0 && (
        <div className="mb-4">
          <button
            onClick={markSeasonAsWatched}
            disabled={progress.watched === progress.total}
            className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition ${
              progress.watched === progress.total
                ? "bg-green-700 text-green-100 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-slate-50"
            }`}
          >
            {progress.watched === progress.total 
              ? "✅ All Episodes Watched" 
              : `Mark All Episodes in Season ${selectedSeason} as Watched`}
          </button>
        </div>
      )}

      {/* Episodes List */}
      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {episodes.map(episode => (
          <div
            key={episode._id}
            className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 hover:border-slate-600 transition"
          >
            <div className="flex items-start space-x-3">
              {/* Episode Number */}
              <div className="flex-shrink-0 w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                <span className="font-bold text-slate-50">E{episode.episodeNumber}</span>
              </div>
              
              {/* Episode Info */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-slate-50 truncate">
                    {episode.episodeTitle}
                  </h4>
                  <span className="text-xs text-slate-500 ml-2">
                    {formatDate(episode.airDate)}
                  </span>
                </div>
                
                <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                  {episode.overview || "No description available"}
                </p>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-slate-500">
                    {episode.runtime} min
                  </span>
                  
                  {/* Status Buttons */}
                  <div className="flex space-x-1">
                    {(["unwatched", "watched", "skipped"] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => handleEpisodeStatusUpdate(episode._id, status)}
                        className={`px-2 py-1 rounded text-xs font-medium transition ${
                          episode.watchStatus === status
                            ? getStatusColor(status)
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        }`}
                      >
                        {status === "watched" && "✓"}
                        {status === "unwatched" && "○"}
                        {status === "skipped" && "⏭️"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {episodes.length === 0 && !loading && (
          <div className="text-center py-6">
            <div className="text-4xl mb-2">📺</div>
            <h4 className="text-lg font-medium text-slate-50 mb-2">No Episodes Loaded</h4>
            <p className="text-slate-400 mb-4">
              {tvShow.watchStatus === "watching" 
                ? "Click 'Load Episodes' to fetch episode data"
                : "Mark this show as '👀 Watching' to load episodes"}
            </p>
            
            {tvShow.watchStatus !== "watching" && (
              <div className="bg-slate-800/50 rounded-lg p-4 mt-4">
                <p className="text-sm text-slate-300 mb-2">
                  <span className="text-rose-400 font-medium">Tip:</span> Change status to "👀 Watching" to automatically load episodes
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 pt-4 border-t border-slate-700">
          <details className="text-xs">
            <summary className="text-slate-400 cursor-pointer">Debug Info</summary>
            <div className="mt-2 p-2 bg-slate-900 rounded text-slate-400">
              <p>Show ID: {tvShow.tmdbId}</p>
              <p>Status: {tvShow.watchStatus}</p>
              <p>Episodes loaded: {episodes.length}</p>
              <p>Seasons: {seasons.length}</p>
              <button 
                onClick={() => console.log('Episodes:', episodes)}
                className="mt-2 text-xs text-rose-400 hover:text-rose-300"
              >
                Log Episodes to Console
              </button>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}