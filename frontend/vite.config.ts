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
              const updateData = JSON.parse(body);
              const { token, id } = updateData;
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
                current[idx] = { ...current[idx], ...updateData };
                fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf-8');
              }
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, order: idx >= 0 ? current[idx] : null }));
              return;
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e.message }));
              return;
            }
          });
          return;
        }

        if (url === '/api/restaurants' && req.method === 'GET') {
          try {
            const filePath = path.resolve(__dirname, './src/data/restaurants.json');
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

        if (url === '/api/restaurants/update' && req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: any) => { body += chunk; });
          req.on('end', () => {
            try {
              const updatedRestaurant = JSON.parse(body);
              const filePath = path.resolve(__dirname, './src/data/restaurants.json');
              let current: any[] = [];
              if (fs.existsSync(filePath)) {
                try {
                  current = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                } catch {
                  current = [];
                }
              }
              const idx = current.findIndex(
                (r: any) => r.id === updatedRestaurant.id || (updatedRestaurant.slug && r.slug === updatedRestaurant.slug)
              );
              if (idx >= 0) {
                current[idx] = { ...current[idx], ...updatedRestaurant };
              } else {
                current.push(updatedRestaurant);
              }
              fs.writeFileSync(filePath, JSON.stringify(current, null, 2), 'utf-8');
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, restaurant: current[idx >= 0 ? idx : current.length - 1] }));
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
