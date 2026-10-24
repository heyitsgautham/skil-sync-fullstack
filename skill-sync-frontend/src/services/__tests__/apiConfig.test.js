import fs from 'fs';
import path from 'path';

const loadConfig = () => {
    let config;
    jest.isolateModules(() => {
        config = require('../apiConfig');
    });
    return config;
};

describe('API_BASE_URL', () => {
    const original = process.env.REACT_APP_API_BASE_URL;

    afterEach(() => {
        if (original === undefined) {
            delete process.env.REACT_APP_API_BASE_URL;
        } else {
            process.env.REACT_APP_API_BASE_URL = original;
        }
    });

    test('defaults to the local backend with the /api prefix', () => {
        delete process.env.REACT_APP_API_BASE_URL;
        expect(loadConfig().API_BASE_URL).toBe('http://localhost:8000/api');
    });

    test('uses REACT_APP_API_BASE_URL when it is set', () => {
        process.env.REACT_APP_API_BASE_URL = 'https://api.example.com/api';
        expect(loadConfig().API_BASE_URL).toBe('https://api.example.com/api');
    });
});

describe('source files', () => {
    const srcDir = path.resolve(__dirname, '../..');
    const sourceFiles = (dir) =>
        fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) return entry.name === '__tests__' ? [] : sourceFiles(full);
            return /\.(js|jsx)$/.test(entry.name) && !/\.test\.js$/.test(entry.name) ? [full] : [];
        });

    test('only apiConfig.js names the backend host', () => {
        const offenders = sourceFiles(srcDir)
            .filter((file) => !file.endsWith(path.join('services', 'apiConfig.js')))
            .filter((file) => fs.readFileSync(file, 'utf8').includes('localhost:8000'))
            .map((file) => path.relative(srcDir, file));
        expect(offenders).toEqual([]);
    });
});
