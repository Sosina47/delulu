/// <reference types="vitest" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'http';

function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server',
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage & { body?: any; query?: Record<string, string> }, res: ServerResponse, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost');
        const endpoint = url.pathname.replace(/^\/api\//, '').replace(/\.ts$/, '');
        const handlerPath = `/api/${endpoint}.ts`;

        try {
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
          }
          const rawBody = Buffer.concat(chunks).toString('utf-8');
          if (rawBody) {
            try {
              req.body = JSON.parse(rawBody);
            } catch {
              req.body = rawBody;
            }
          }

          req.query = Object.fromEntries(url.searchParams.entries());

          const vercelRes = res as any;
          vercelRes.status = (statusCode: number) => {
            res.statusCode = statusCode;
            return vercelRes;
          };
          vercelRes.json = (data: any) => {
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'application/json');
            }
            res.end(JSON.stringify(data));
            return vercelRes;
          };

          const module = await server.ssrLoadModule(handlerPath);
          const handler = module.default;
          if (typeof handler === 'function') {
            await handler(req, vercelRes);
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: `Handler not found for ${handlerPath}` }));
          }
        } catch (err: any) {
          console.error(`[API dev middleware error for ${req.url}]:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Internal server error in dev API runner', details: err?.message }));
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiDevServerPlugin()],
  test: {
    globals: true,
    environment: 'node',
  },
});

