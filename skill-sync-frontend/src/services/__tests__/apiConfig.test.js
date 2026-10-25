import fs from 'fs';
import path from 'path';

const loadConfig = async () => {
    vi.resetModules();
    return import('../apiConfig');
};

describe('API_BASE_URL', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    test('defaults to the local backend with the /api prefix', async () => {
        vi.stubEnv('VITE_API_BASE_URL', '');
        expect((await loadConfig()).API_BASE_URL).toBe('http://localhost:8000/api');
    });

    test('uses VITE_API_BASE_URL when it is set', async () => {
        vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api');
        expect((await loadConfig()).API_BASE_URL).toBe('https://api.example.com/api');
    });
});

describe('source files', () => {
    const srcDir = path.resolve(__dirname, '../..');
    const sourceFiles = (dir) =>
        fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
            return /\.(js|jsx)$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name) ? [full] : [];
        });

    test('only apiConfig.js names the backend host', () => {
        const offenders = sourceFiles(srcDir)
            .filter((file) => !file.endsWith(path.join('services', 'apiConfig.js')))
            .filter((file) => fs.readFileSync(file, 'utf8').includes('localhost:8000'))
            .map((file) => path.relative(srcDir, file));
        expect(offenders).toEqual([]);
    });
});
