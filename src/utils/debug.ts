export const debug = {
    log: (component: string, message: string, data?: any) => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.log(`[${timestamp}] [${component}] ${message}`, data || '');
    },
    error: (component: string, message: string, error?: any) => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.error(`[${timestamp}] [${component}] ❌ ${message}`, error || '');
    },
    warn: (component: string, message: string, data?: any) => {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        console.warn(`[${timestamp}] [${component}] ⚠️ ${message}`, data || '');
    }
};