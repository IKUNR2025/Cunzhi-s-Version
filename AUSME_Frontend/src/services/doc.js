import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE;

export const documentationService = {

    getDocumentationData: async () => {
        try {
            const response = await axios.get(`${API_BASE}/docs/data/`);

            return {
                stats: response.data.stats || { experts: 0, papers: 0, keywords: 0 },
                faqs: response.data.faqs || []
            };
        } catch (error) {
            console.error("Backend Connection Error:", error);

            // Return empty structure so the frontend UI doesn't break
            return {
                stats: { experts: 0, papers: 0, keywords: 0 },
                faqs: []
            };
        }
    }
};