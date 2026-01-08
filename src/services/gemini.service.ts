import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is not configured in environment variables");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export const askGemini = async (prompt: string): Promise<string> => {
    try {
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        return text;
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw error;
    }
};

export const getTitlesFromQuery = async (userQuery: string): Promise<string[]> => {
    const prompt = `You are a movie and TV show expert. The user will ask for recommendations or help remembering a title.
Please return a list of up to 5 movie or TV show titles that match the user's query.
Return only the titles in the following format: "title1, title2, title3, ..."
Do not include any other text in your response.

User query: ${userQuery}`;

    const response = await askGemini(prompt);

    let titles = response.split(/[,\n]/).map(title => title.trim().replace(/^["'0-9.\- ]+|["'0-9.\- ]+$/g, ''));

    titles = titles.filter(title => title.length > 0);
    return titles.slice(0, 5); // Limit to 5 titles

}