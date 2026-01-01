import packageJson from '../../../../package.json';

export const APP_CONFIG = {
    name: 'Coinly',
    version: packageJson.version,
    shortName: 'Coinly',
    description: 'Smart Expense Tracker',
} as const;

export const APP_NAME = APP_CONFIG.name;