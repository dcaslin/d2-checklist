import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

function loadApiKey(): string {
    // First try: BUNGIE_API_KEY env var (used in CI)
    if (process.env.BUNGIE_API_KEY) {
        return process.env.BUNGIE_API_KEY;
    }

    // Second try: read from keys.ts (local dev)
    try {
        // ts-node can require .ts files directly
        const keysPath = path.join(PROJECT_ROOT, 'src/environments/keys.ts');
        const keys = require(keysPath);
        const key = keys.bungieDev?.apiKey;
        if (key && key !== '[your key]') {
            return key;
        }
    } catch {
        // keys.ts may not exist (CI uses placeholder)
    }

    throw new Error(
        'No Bungie API key found. Either:\n' +
        '  - Set BUNGIE_API_KEY environment variable, or\n' +
        '  - Configure src/environments/keys.ts with your API key'
    );
}

export const API_KEY = loadApiKey();
export { PROJECT_ROOT };
