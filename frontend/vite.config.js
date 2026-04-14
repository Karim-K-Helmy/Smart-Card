import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Custom plugin to print the local URL clearly in the terminal
const customTerminalOutput = () => ({
  name: 'custom-terminal-output',
  configureServer(server) {
    server.httpServer?.once('listening', () => {
      setTimeout(() => {
        console.log('\n=========================================');
        console.log('  🌐 SERVER IS RUNNING');
        console.log('  👉 http://localhost:5173');
        console.log('=========================================\n');
      }, 100); 
    });
  },
});

export default defineConfig({
  plugins: [react(), customTerminalOutput()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});