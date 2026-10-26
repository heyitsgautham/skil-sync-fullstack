import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: { port: 3000 },
    preview: { port: 3000 },
    build: { outDir: 'build' },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/setupTests.js'],
        // Full pages re-render on every keystroke, which is slow on two-core CI runners.
        testTimeout: 15000,
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{js,jsx}'],
            exclude: ['src/testUtils/**', 'src/**/__mocks__/**', 'src/**/*.test.{js,jsx}', 'src/index.jsx'],
            reporter: ['text', 'lcov'],
            thresholds: { statements: 78, branches: 72, functions: 70, lines: 80 },
        },
    },
});
