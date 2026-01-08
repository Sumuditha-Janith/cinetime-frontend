import api from "./api";

export interface WatchlistItem {
    _id: string;
    tmdbId: number;
    title: string;
    type: "movie" | "tv";
    posterPath: string;
    releaseDate: string;
    watchStatus: "planned" | "watching" | "completed";
    rating?: number;
    watchTimeMinutes: number;
    createdAt: string;
    updatedAt: string;
}

export interface WatchlistResponse {
    data: WatchlistItem[];
    stats: {
        totalWatchTime: number;
        totalItems: number;
    };
    pagination: {
        page: number;
        totalPages: number;
        total: number;
    };
}

export interface WatchlistStats {
    totalItems: number;
    totalWatchTime: number;
    totalWatchTimeFormatted: string;
    byStatus: Array<{
        status: string;
        count: number;
        time: number;
    }>;
    byType: Array<{
        type: string;
        count: number;
    }>;
}

export interface EpisodeItem {
    _id: string;
    tmdbId: number;
    seasonNumber: number;
    episodeNumber: number;
    episodeTitle: string;
    airDate: string;
    overview?: string;
    runtime: number;
    stillPath?: string;
    watchStatus: "unwatched" | "watched" | "skipped";
    watchedAt?: string;
    rating?: number;
}

export interface EpisodeStatistics {
    summary: {
        totalTVShows: number;
        totalEpisodes: number;
        watchedEpisodes: number;
        skippedEpisodes: number;
        totalWatched: number;
        totalWatchTime: number;
        completionPercentage: number;
    };
    byTVShow: Array<{
        tmdbId: number;
        title: string;
        totalEpisodes: number;
        watchedEpisodes: number;
        skippedEpisodes: number;
        totalWatched: number;
        watchTime: number;
        completionPercentage: number;
    }>;
    recentWatched: EpisodeItem[];
}

export const searchMedia = async (query: string, page: number = 1) => {
    const res = await api.get(`/media/search`, {
        params: { query, page }
    });
    return res.data;
};

export const getMediaDetails = async (tmdbId: number, type: "movie" | "tv") => {
    if (!tmdbId || !type) {
        throw new Error("TMDB ID and type are required");
    }

    if (type !== "movie" && type !== "tv") {
        throw new Error("Invalid media type. Must be 'movie' or 'tv'");
    }

    console.log(`API: Fetching ${type} details for ID: ${tmdbId}`);

    try {
        const res = await api.get(`/media/details/${type}/${tmdbId}`);
        return res.data;
    } catch (error: any) {
        console.error(`Failed to fetch ${type} details for ID ${tmdbId}:`, error);
        throw error;
    }
};

export const addToWatchlist = async (data: {
    tmdbId: number;
    title: string;
    type: "movie" | "tv";
    posterPath?: string;
    releaseDate?: string;
}) => {
    const res = await api.post("/media/watchlist", data);
    return res.data;
};

export const addTVShowToWatchlist = async (data: {
    tmdbId: number;
    title: string;
    type: "tv";
    posterPath?: string;
    backdrop_path?: string;
    releaseDate?: string;
}) => {
    const res = await api.post("/media/watchlist/tv", data);
    return res.data;
};

export const getWatchlist = async (page: number = 1, status?: string) => {
    const url = status
        ? `/media/watchlist?page=${page}&status=${status}`
        : `/media/watchlist?page=${page}`;
    const res = await api.get(url);
    return res.data;
};

export const updateWatchStatus = async (mediaId: string, data: {
    watchStatus?: "planned" | "watching" | "completed";
    rating?: number;
}) => {
    const res = await api.put(`/media/watchlist/${mediaId}/status`, data);
    return res.data;
};

export const removeFromWatchlist = async (mediaId: string) => {
    const res = await api.delete(`/media/watchlist/${mediaId}`);
    return res.data;
};

export const getWatchlistStats = async () => {
    const res = await api.get("/media/watchlist/stats");
    return res.data;
};

export const getTrending = async (page: number = 1, timeWindow: "day" | "week" = "week") => {
    const res = await api.get(`/media/trending?page=${page}&timeWindow=${timeWindow}`);
    return res.data;
};

export const getPopularMovies = async (page: number = 1) => {
    const res = await api.get(`/media/popular?page=${page}`);
    return res.data;
};

export const getTVShowEpisodes = async (tmdbId: number, season?: number) => {
    const url = season
        ? `/media/tv/${tmdbId}/episodes?season=${season}`
        : `/media/tv/${tmdbId}/episodes`;
    const res = await api.get(url);
    return res.data;
};

// Update episode status
export const updateEpisodeStatus = async (episodeId: string, data: {
    watchStatus?: "unwatched" | "watched" | "skipped";
    rating?: number;
}) => {
    const res = await api.put(`/media/episodes/${episodeId}/status`, data);
    return res.data;
};

// Get episode statistics
export const getEpisodeStatistics = async () => {
    const res = await api.get("/media/episodes/stats");
    return res.data;
};

// Mark multiple episodes as watched
export const markEpisodesAsWatched = async (episodeIds: string[]) => {
    const promises = episodeIds.map(id =>
        updateEpisodeStatus(id, { watchStatus: "watched" })
    );
    return Promise.all(promises);
};

export const generateMediaReport = async (period: string = 'all'): Promise<Blob> => {
    try {
        const response = await api.get(`/media/report?period=${period}`, {
            responseType: 'blob'
        });
        return response.data;
    } catch (error: any) {
        console.error('Failed to generate report:', error);
        throw error;
    }
};