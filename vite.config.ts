import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

function ordersApiPlugin() {
  return {
    name: 'orders-api-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        const url = req.url?.split('?')[0];

        if (url === '/api/orders' && req.method === 'GET') {
          try {
            const filePath = path.resolve(__dirname, './src/data/orders.json');
            if (!fs.existsSync(filePath)) {
              fs.writeFileSync(filePath, '[]', 'utf-8');
            }
            const data = fs.readFileSync(filePath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
            return;
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
            return;
          }
        }

        if (url === '/api/orders' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const newOrder = JSON.parse(body);
              const filePath = path.resolve(__dirname, './src/data/orders.json');
              let current: any[] = [];
              if (fs.existsSync(filePath)) {
                try {
                  current = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                } catch {
                  current = [];
                }
              }
              const existingIdx = current.findIndex(
                (o: any) => o.id === newOrder.id || (newOrder.token && o.token === newOrder.token)
              );
              if (existingIdx >= 0) {
                current[existingIdx] = { ...current[existingIdx], ...newOrder };
              } else {
                current = [newOrder, ...current];
              }
              fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, order: newOrder }));
              return;
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
              return;
            }
          });
          return;
        }

        if (url === '/api/orders/update' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const { token, id, status, statusLabel, courierLat, courierLng } = JSON.parse(body);
              const filePath = path.resolve(__dirname, './src/data/orders.json');
              let current: any[] = [];
              if (fs.existsSync(filePath)) {
                try {
                  current = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                } catch {
                  current = [];
                }
              }
              const idx = current.findIndex(
                (o: any) => (token && o.token === token) || (id && o.id === id)
              );
              if (idx >= 0) {
                if (status) current[idx].status = status;
                if (statusLabel) current[idx].statusLabel = statusLabel;
                if (courierLat !== undefined) current[idx].courierLat = courierLat;
                if (courierLng !== undefined) current[idx].courierLng = courierLng;
                fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf-8');
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true }));
              return;
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
              return;
            }
          });
          return;
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), ordersApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
