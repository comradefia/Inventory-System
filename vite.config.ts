import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: '/',
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'serve-zip-endpoint',
        configureServer(server) {
          server.middlewares.use('/api/download-zip', (req, res) => {
            try {
              const zipPath = path.resolve(process.cwd(), 'ready_to_upload.zip');
              if (fs.existsSync(zipPath)) {
                const zipBuffer = fs.readFileSync(zipPath);
                res.writeHead(200, {
                  'Content-Type': 'application/zip',
                  'Content-Disposition': 'attachment; filename=stockyard-hosting-bundle.zip',
                  'Content-Length': zipBuffer.length
                });
                res.end(zipBuffer);
              } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('The hosting ZIP bundle has not been compiled yet.');
              }
            } catch (err: any) {
              console.error(err);
              res.writeHead(500, { 'Content-Type': 'text/plain' });
              res.end('Failed to retrieve ZIP archive: ' + err.message);
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
