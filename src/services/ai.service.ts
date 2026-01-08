import api from "./api";

export interface AIRecommendation {
    title: string;
    type: "movie" | "tv";
    reason: string;
    year?: string;
    keywords: string[];
}

export interface AIRecommendationResponse {
    message: string;
    data: AIRecommendation[];
}

export const aiChat = async (message: string): Promise<AIRecommendationResponse> => {
    try {
        const response = await api.post("/ai/chat", { message });
        return response.data;
    } catch (error: any) {
        console.error("AI Chat Error:", error);
        throw error;
    }
};

export const aiSearchMedia = async (keywords: string[], type: "movie" | "tv" | "all" = "all") => {
    try {
        const response = await api.post("/ai/search", { keywords, type });
        return response.data;
    } catch (error: any) {
        console.error("AI Search Error:", error);
        throw error;
    }
};