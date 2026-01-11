
/**
 * Lightweight logger wrapper to standardize application logging.
 * In a real production environment, this could be extended to send logs to a service like Sentry or LogRocket.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const LOG_PREFIX = '[XDS-ERP]';

const logger = {
    info: (message: string, ...args: any[]) => {
        console.info(`${LOG_PREFIX} ℹ️ ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
        console.warn(`${LOG_PREFIX} ⚠️ ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
        console.error(`${LOG_PREFIX} ❌ ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
        // @ts-ignore - Vite environment variable
        if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
            console.debug(`${LOG_PREFIX} 🔍 ${message}`, ...args);
        }
    }
};

export default logger;
