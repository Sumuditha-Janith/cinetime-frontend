import { useState, useEffect } from "react";
import { getTrending, getPopularMovies, searchMedia } from "../services/media.service";
import MovieCard from "../components/MovieCard";
import SearchBar from "../components/SearchBar";
import Navbar from "../components/Navbar";

interface MediaItem {
    id: number;
    title: string;
    overview: string;
    poster_path: string;
    backdrop_path?: string;
    release_date: string;
    vote_average: number;
    vote_count?: number;
    type: "movie" | "tv";
    genre_ids?: number[];
    media_type?: "movie" | "tv";
}

export default function Home() {
    const [trending, setTrending] = useState<MediaItem[]>([]);
    const [popular, setPopular] = useState<MediaItem[]>([]);
    const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState({
        trending: true,
        popular: true,
        search: false,
    });
    const [activeTab, setActiveTab] = useState<"trending" | "popular" | "search">("trending");

    useEffect(() => {
        fetchTrending();
        fetchPopular();
    }, []);

    const fetchTrending = async () => {
        try {
            const response = await getTrending(1, "week");
            console.log("Trending response:", response);

            // Transform the data to ensure it has both type and media_type
            const formattedData = response.data.map((item: any) => ({
                id: item.id,
                title: item.title || item.name || "Unknown",
                overview: item.overview || "",
                poster_path: item.poster_path || "",
                backdrop_path: item.backdrop_path,
                release_date: item.release_date || item.first_air_date || "",
                vote_average: item.vote_average || 0,
                vote_count: item.vote_count || 0,
                type: item.type || item.media_type || (item.title ? "movie" : "tv"),
                media_type: item.media_type || item.type || (item.title ? "movie" : "tv"),
                genre_ids: item.genre_ids || []
            }));

            setTrending(formattedData);
        } catch (error) {
            console.error("Failed to fetch trending:", error);
        } finally {
            setLoading(prev => ({ ...prev, trending: false }));
        }
    };

    const fetchPopular = async () => {
        try {
            const response = await getPopularMovies(1);
            console.log("Popular response:", response);

            // Transform the data to ensure it has both type and media_type
            const formattedData = response.data.map((item: any) => ({
                id: item.id,
                title: item.title || item.name || "Unknown",
                overview: item.overview || "",
                poster_path: item.poster_path || "",
                backdrop_path: item.backdrop_path,
                release_date: item.release_date || item.first_air_date || "",
                vote_average: item.vote_average || 0,
                vote_count: item.vote_count || 0,
                type: "movie", // Popular movies endpoint only returns movies
                media_type: "movie",
                genre_ids: item.genre_ids || []
            }));

            setPopular(formattedData);
        } catch (error) {
            console.error("Failed to fetch popular:", error);
        } finally {
            setLoading(prev => ({ ...prev, popular: false }));
        }
    };

    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (!query.trim()) {
            setSearchResults([]);
            setActiveTab("trending");
            return;
        }

        setLoading(prev => ({ ...prev, search: true }));
        setActiveTab("search");

        try {
            const response = await searchMedia(query, 1);
            console.log("Search response:", response);

            // Transform the data to ensure it has both type and media_type
            const formattedData = response.data.map((item: any) => ({
                id: item.id,
                title: item.title || "Unknown",
                overview: item.overview || "",
                poster_path: item.poster_path || "",
                backdrop_path: item.backdrop_path,
                release_date: item.release_date || "",
                vote_average: item.vote_average || 0,
                vote_count: item.vote_count || 0,
                type: item.type || (item.title ? "movie" : "tv"),
                media_type: item.media_type || item.type || (item.title ? "movie" : "tv"),
                genre_ids: item.genre_ids || []
            }));

            setSearchResults(formattedData);
        } catch (error) {
            console.error("Search error:", error);
            setSearchResults([]);
        } finally {
            setLoading(prev => ({ ...prev, search: false }));
        }
    };

    const getActiveContent = () => {
        switch (activeTab) {
            case "trending":
                return trending;
            case "popular":
                return popular;
            case "search":
                return searchResults;
            default:
                return [];
        }
    };

    const getActiveTitle = () => {
        switch (activeTab) {
            case "trending":
                return "🔥 Trending This Week";
            case "popular":
                return "🎬 Popular Movies";
            case "search":
                return `🔍 Search Results for "${searchQuery}"`;
            default:
                return "";
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4">Discover Movies & TV Shows</h1>
                    <p className="text-slate-400">
                        Explore trending content, popular movies, and search from thousands of titles
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <SearchBar />
                </div>

                {/* Tab Navigation */}
                <div className="mb-8">
                    <div className="flex space-x-1 border-b border-slate-700">
                        <button
                            onClick={() => setActiveTab("trending")}
                            className={`px-4 py-3 font-medium text-sm transition ${activeTab === "trending"
                                ? "text-rose-400 border-b-2 border-rose-400"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                        >
                            🔥 Trending
                        </button>
                        <button
                            onClick={() => setActiveTab("popular")}
                            className={`px-4 py-3 font-medium text-sm transition ${activeTab === "popular"
                                ? "text-rose-400 border-b-2 border-rose-400"
                                : "text-slate-400 hover:text-slate-300"
                            }`}
                        >
                            🎬 Popular
                        </button>
                        {searchQuery && (
                            <button
                                onClick={() => setActiveTab("search")}
                                className={`px-4 py-3 font-medium text-sm transition ${activeTab === "search"
                                    ? "text-rose-400 border-b-2 border-rose-400"
                                    : "text-slate-400 hover:text-slate-300"
                                }`}
                            >
                                🔍 Search
                            </button>
                        )}
                    </div>
                </div>

                {/* Debug Info */}
                <div className="mb-4 p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-sm text-slate-400">
                        Active Tab: {activeTab} | Trending: {trending.length} | Popular: {popular.length} | Search: {searchResults.length}
                    </p>
                    {trending.length > 0 && (
                        <div className="mt-2 text-xs text-slate-500">
                            Sample trending item: {trending[0]?.title} (Type: {trending[0]?.type}, Media Type: {trending[0]?.media_type})
                        </div>
                    )}
                </div>

                {/* Content Section */}
                <div>
                    {/* Section Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">{getActiveTitle()}</h2>
                        <span className="text-sm text-slate-400">
              {getActiveContent().length} titles
            </span>
                    </div>

                    {/* Loading State */}
                    {(loading.trending && activeTab === "trending") ||
                    (loading.popular && activeTab === "popular") ||
                    (loading.search && activeTab === "search") ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {Array.from({ length: 8 }).map((_, index) => (
                                <div key={index} className="bg-slate-800 rounded-2xl p-4 animate-pulse">
                                    <div className="w-full h-48 bg-slate-700 rounded-xl mb-4"></div>
                                    <div className="h-4 bg-slate-700 rounded mb-2"></div>
                                    <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            {/* Movie Grid */}
                            {getActiveContent().length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {getActiveContent().slice(0, 20).map((media) => {
                                        console.log("Rendering media:", {
                                            id: media.id,
                                            title: media.title,
                                            type: media.type,
                                            media_type: media.media_type
                                        });

                                        return (
                                            <MovieCard
                                                key={`${media.id}-${media.type}`}
                                                media={{
                                                    id: media.id,
                                                    title: media.title,
                                                    overview: media.overview || "",
                                                    poster_path: media.poster_path || "",
                                                    backdrop_path: media.backdrop_path,
                                                    release_date: media.release_date || "",
                                                    vote_average: media.vote_average || 0,
                                                    vote_count: media.vote_count || 0,
                                                    type: media.type,
                                                    media_type: media.media_type, // This should now work
                                                    genre_ids: media.genre_ids || []
                                                }}
                                                showActions={true}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                /* Empty State */
                                <div className="text-center py-12">
                                    <div className="text-6xl mb-4">🎬</div>
                                    <h3 className="text-xl font-bold mb-2">No content found</h3>
                                    <p className="text-slate-400">
                                        {activeTab === "search"
                                            ? "Try a different search term"
                                            : "Unable to load content at the moment"}
                                    </p>
                                </div>
                            )}

                            {/* View More Button */}
                            {getActiveContent().length > 0 && (
                                <div className="text-center mt-8">
                                    <button className="bg-slate-800 hover:bg-slate-700 text-slate-50 font-medium py-3 px-6 rounded-lg transition duration-200 border border-slate-700">
                                        Load More
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}