import { useState, useRef, useEffect } from "react";
import { aiChat, aiSearchMedia } from "../services/ai.service";
import { useNavigate } from "react-router-dom";

interface ChatMessage {
    id: string;
    type: "user" | "ai";
    content: string;
    timestamp: Date;
    recommendations?: Array<{
        title: string;
        type: "movie" | "tv";
        reason: string;
        year?: string;
        keywords: string[];
    }>;
}

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
    media_type?: "movie" | "tv";
    genre_ids?: number[];
}

export default function AIChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: "1",
            type: "ai",
            content: "Hello! I'm your movie & TV show assistant. I can help you find movies/shows, recommend similar content, or identify shows from descriptions! 🎬",
            timestamp: new Date()
        }
    ]);
    const [inputMessage, setInputMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [showingResults, setShowingResults] = useState(false);
    const [activeResultType, setActiveResultType] = useState<"movie" | "tv" | "all">("all");
    
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || loading) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: "user",
            content: inputMessage,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage("");
        setLoading(true);

        try {
            // Step 1: Get AI recommendations
            const aiResponse = await aiChat(inputMessage);
            const recommendations = aiResponse.data || [];

            const aiMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: "ai",
                content: recommendations.length > 0 
                    ? "I found some recommendations based on your query! 🎯"
                    : "I couldn't find specific recommendations. Could you describe it differently?",
                timestamp: new Date(),
                recommendations
            };

            setMessages(prev => [...prev, aiMessage]);

            // Step 2: If we have recommendations, search for them
            if (recommendations.length > 0) {
                // Collect all keywords from recommendations
                const allKeywords = recommendations.flatMap(rec => rec.keywords || []);
                
                if (allKeywords.length > 0) {
                    const searchResponse = await aiSearchMedia(allKeywords, "all");
                    setSearchResults(searchResponse.data || []);
                    setShowingResults(true);
                }
            }
        } catch (error: any) {
            console.error("AI Chat Error:", error);
            
            const errorMessage: ChatMessage = {
                id: (Date.now() + 1).toString(),
                type: "ai",
                content: "Sorry, I encountered an error. Please try again!",
                timestamp: new Date()
            };
            
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleViewDetails = (result: SearchResult) => {
        navigate(`/media/${result.type}/${result.id}`);
        setIsOpen(false);
    };

    const handleSearchRecommendation = async (keywords: string[], type: "movie" | "tv" | "all") => {
        setLoading(true);
        try {
            const searchResponse = await aiSearchMedia(keywords, type);
            setSearchResults(searchResponse.data || []);
            setShowingResults(true);
            setActiveResultType(type);
        } catch (error) {
            console.error("Search Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredResults = searchResults.filter(result => {
        if (activeResultType === "all") return true;
        return result.type === activeResultType;
    });

    return (
        <>
            {/* Floating Chat Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-110 group"
                style={{ width: "70px", height: "70px" }}
            >
                <div className="flex items-center justify-center">
                    <div className="text-2xl">🤖</div>
                    {!isOpen && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-xs">AI</span>
                        </div>
                    )}
                </div>
                <div className="absolute -top-10 right-0 bg-slate-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    AI Movie Assistant
                </div>
            </button>

            {/* Chat Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
                    {/* Backdrop */}
                    <div 
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Chat Container */}
                    <div className="relative w-full max-w-4xl h-[80vh] sm:h-[600px] bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-rose-600 to-purple-600 rounded-full flex items-center justify-center">
                                    <span className="text-xl">🤖</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-white">AI Movie Assistant</h3>
                                    <p className="text-xs text-slate-400">Powered by Gemini AI</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Chat Body */}
                        <div className="flex-1 overflow-hidden flex">
                            {/* Messages Panel */}
                            <div className={`${showingResults ? "w-full md:w-2/3" : "w-full"} flex flex-col h-full`}>
                                {/* Messages Container */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-2xl p-4 ${
                                                    msg.type === "user"
                                                        ? "bg-rose-600 text-white"
                                                        : "bg-slate-800 text-slate-100"
                                                }`}
                                            >
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <span className="text-xs opacity-75">
                                                        {msg.timestamp.toLocaleTimeString([], { 
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                                
                                                {/* Show recommendations if available */}
                                                {msg.recommendations && msg.recommendations.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t border-white/20">
                                                        <p className="text-sm font-medium mb-2">💡 Try searching for:</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {msg.recommendations.map((rec, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => handleSearchRecommendation(rec.keywords, rec.type)}
                                                                    className="text-xs bg-slate-900/50 hover:bg-slate-800 px-3 py-1 rounded-full transition"
                                                                >
                                                                    {rec.title} ({rec.type === "movie" ? "🎬" : "📺"})
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    
                                    {loading && (
                                        <div className="flex justify-start">
                                            <div className="bg-slate-800 text-slate-100 max-w-[80%] rounded-2xl p-4">
                                                <div className="flex items-center space-x-2">
                                                    <div className="flex space-x-1">
                                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                                                    </div>
                                                    <span className="text-sm">Thinking...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Input Area */}
                                <div className="p-4 border-t border-slate-700">
                                    <div className="flex space-x-2">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={inputMessage}
                                            onChange={(e) => setInputMessage(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            placeholder="Ask about movies/TV shows, find similar content, or describe something you can't remember..."
                                            disabled={loading}
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent disabled:opacity-50"
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={loading || !inputMessage.trim()}
                                            className="bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-700 hover:to-purple-700 text-white px-6 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                                        >
                                            Send
                                        </button>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <button
                                            onClick={() => setInputMessage("Find movies similar to Fight Club")}
                                            className="text-xs text-slate-400 hover:text-rose-400"
                                        >
                                            Find similar
                                        </button>
                                        <span className="text-slate-600">•</span>
                                        <button
                                            onClick={() => setInputMessage("I remember a show about a boy with alien watch powers")}
                                            className="text-xs text-slate-400 hover:text-rose-400"
                                        >
                                            Identify show
                                        </button>
                                        <span className="text-slate-600">•</span>
                                        <button
                                            onClick={() => setInputMessage("Recommend good sci-fi movies from 90s")}
                                            className="text-xs text-slate-400 hover:text-rose-400"
                                        >
                                            90s sci-fi
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Results Panel (only show on larger screens when we have results) */}
                            {showingResults && (
                                <div className="hidden md:flex md:w-1/3 border-l border-slate-700 flex-col">
                                    <div className="p-4 border-b border-slate-700">
                                        <div className="flex justify-between items-center">
                                            <h4 className="font-bold text-white">🎯 Results</h4>
                                            <button
                                                onClick={() => setShowingResults(false)}
                                                className="text-slate-400 hover:text-white"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="flex space-x-1 mt-2">
                                            <button
                                                onClick={() => setActiveResultType("all")}
                                                className={`text-xs px-2 py-1 rounded ${activeResultType === "all" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400"}`}
                                            >
                                                All ({searchResults.length})
                                            </button>
                                            <button
                                                onClick={() => setActiveResultType("movie")}
                                                className={`text-xs px-2 py-1 rounded ${activeResultType === "movie" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400"}`}
                                            >
                                                Movies
                                            </button>
                                            <button
                                                onClick={() => setActiveResultType("tv")}
                                                className={`text-xs px-2 py-1 rounded ${activeResultType === "tv" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400"}`}
                                            >
                                                TV Shows
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto p-2">
                                        {filteredResults.length > 0 ? (
                                            <div className="space-y-3">
                                                {filteredResults.map((result) => (
                                                    <div
                                                        key={`${result.id}-${result.type}`}
                                                        className="bg-slate-800/50 hover:bg-slate-800 rounded-xl p-3 border border-slate-700 cursor-pointer transition group"
                                                        onClick={() => handleViewDetails(result)}
                                                    >
                                                        <div className="flex items-start space-x-3">
                                                            {result.poster_path ? (
                                                                <img
                                                                    src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                                                                    alt={result.title}
                                                                    className="w-12 h-16 object-cover rounded"
                                                                />
                                                            ) : (
                                                                <div className="w-12 h-16 bg-slate-700 rounded flex items-center justify-center">
                                                                    <span className="text-lg">
                                                                        {result.type === "movie" ? "🎬" : "📺"}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <h5 className="font-medium text-white truncate group-hover:text-rose-400">
                                                                    {result.title}
                                                                </h5>
                                                                <div className="flex items-center space-x-2 mt-1">
                                                                    <span className="text-xs px-1.5 py-0.5 bg-slate-700 rounded">
                                                                        {result.type === "movie" ? "Movie" : "TV Show"}
                                                                    </span>
                                                                    {result.release_date && (
                                                                        <span className="text-xs text-slate-400">
                                                                            {new Date(result.release_date).getFullYear()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                                                                    {result.overview || "No description"}
                                                                </p>
                                                                <div className="mt-2 flex justify-between items-center">
                                                                    <span className="text-xs text-rose-400">
                                                                        ⭐ {result.vote_average.toFixed(1)}
                                                                    </span>
                                                                    <button className="text-xs text-slate-400 hover:text-rose-400">
                                                                        View →
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <div className="text-4xl mb-2">🔍</div>
                                                <p className="text-slate-400 text-sm">No results found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Results Modal */}
            {showingResults && (
                <div className="md:hidden fixed inset-0 z-[60] bg-slate-900">
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-lg text-white">AI Results</h3>
                            <button
                                onClick={() => setShowingResults(false)}
                                className="text-white p-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="flex space-x-2 p-4 border-b border-slate-700 overflow-x-auto">
                            <button
                                onClick={() => setActiveResultType("all")}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeResultType === "all" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400"}`}
                            >
                                All ({searchResults.length})
                            </button>
                            <button
                                onClick={() => setActiveResultType("movie")}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeResultType === "movie" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400"}`}
                            >
                                Movies
                            </button>
                            <button
                                onClick={() => setActiveResultType("tv")}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap ${activeResultType === "tv" ? "bg-rose-600 text-white" : "bg-slate-800 text-slate-400"}`}
                            >
                                TV Shows
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="grid grid-cols-1 gap-4">
                                {filteredResults.map((result) => (
                                    <div
                                        key={`${result.id}-${result.type}`}
                                        className="bg-slate-800 rounded-xl p-4 border border-slate-700"
                                        onClick={() => handleViewDetails(result)}
                                    >
                                        <div className="flex items-start space-x-4">
                                            {result.poster_path ? (
                                                <img
                                                    src={`https://image.tmdb.org/t/p/w154${result.poster_path}`}
                                                    alt={result.title}
                                                    className="w-20 h-28 object-cover rounded"
                                                />
                                            ) : (
                                                <div className="w-20 h-28 bg-slate-700 rounded flex items-center justify-center">
                                                    <span className="text-2xl">
                                                        {result.type === "movie" ? "🎬" : "📺"}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <h5 className="font-bold text-white">{result.title}</h5>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <span className="text-xs px-2 py-1 bg-slate-700 rounded">
                                                        {result.type === "movie" ? "Movie" : "TV Show"}
                                                    </span>
                                                    {result.release_date && (
                                                        <span className="text-xs text-slate-400">
                                                            {new Date(result.release_date).getFullYear()}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-rose-400">
                                                        ⭐ {result.vote_average.toFixed(1)}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-300 mt-2 line-clamp-2">
                                                    {result.overview || "No description available"}
                                                </p>
                                                <button className="mt-3 w-full bg-rose-600 hover:bg-rose-700 text-white py-2 rounded-lg text-sm font-medium">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}