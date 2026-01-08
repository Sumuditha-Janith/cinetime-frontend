import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { aiSearchMedia } from "../services/ai.service";
import MovieCard from "../components/MovieCard";
import Navbar from "../components/Navbar";

interface SearchResult {
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
}

export default function AISearchResults() {
    const location = useLocation();
    const navigate = useNavigate();
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeType, setActiveType] = useState<"all" | "movie" | "tv">("all");

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const query = params.get("query") || "";
        const keywords = query.split(" ");
        
        fetchAIResults(keywords);
    }, [location]);

    const fetchAIResults = async (keywords: string[]) => {
        try {
            setLoading(true);
            const response = await aiSearchMedia(keywords, activeType === "all" ? "all" : activeType);
            setResults(response.data || []);
        } catch (error) {
            console.error("AI Search Error:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredResults = results.filter(result => {
        if (activeType === "all") return true;
        return result.type === activeType;
    });

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50">
            <Navbar />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="text-slate-400 hover:text-white mb-4 flex items-center"
                    >
                        ← Back
                    </button>
                    
                    <h1 className="text-3xl font-bold mb-2">🤖 AI Search Results</h1>
                    <p className="text-slate-400">Powered by Gemini AI</p>
                </div>
                
                <div className="mb-6 flex space-x-2">
                    <button
                        onClick={() => setActiveType("all")}
                        className={`px-4 py-2 rounded-lg ${activeType === "all" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400"}`}
                    >
                        All ({results.length})
                    </button>
                    <button
                        onClick={() => setActiveType("movie")}
                        className={`px-4 py-2 rounded-lg ${activeType === "movie" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400"}`}
                    >
                        🎬 Movies
                    </button>
                    <button
                        onClick={() => setActiveType("tv")}
                        className={`px-4 py-2 rounded-lg ${activeType === "tv" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400"}`}
                    >
                        📺 TV Shows
                    </button>
                </div>
                
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-slate-800 rounded-xl p-4 animate-pulse">
                                <div className="w-full h-48 bg-slate-700 rounded-lg mb-4"></div>
                                <div className="h-4 bg-slate-700 rounded mb-2"></div>
                                <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                            </div>
                        ))}
                    </div>
                ) : filteredResults.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredResults.map((item) => (
                            <MovieCard
                                key={`${item.id}-${item.type}`}
                                media={{
                                    id: item.id,
                                    title: item.title,
                                    overview: item.overview || "",
                                    poster_path: item.poster_path || "",
                                    backdrop_path: item.backdrop_path,
                                    release_date: item.release_date || "",
                                    vote_average: item.vote_average || 0,
                                    vote_count: item.vote_count || 0,
                                    type: item.type,
                                    genre_ids: item.genre_ids || []
                                }}
                                showActions={true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🤖</div>
                        <h3 className="text-2xl font-bold mb-2">No AI results found</h3>
                        <p className="text-slate-400 mb-6">Try describing your request differently</p>
                        <button
                            onClick={() => navigate("/home")}
                            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-lg"
                        >
                            Go Home
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}