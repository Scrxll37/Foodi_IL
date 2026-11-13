# Foodi — Food Delivery Platform (Agadir)

Full-stack food delivery application featuring 4 integrated interfaces:
- **Customer Web App**: Browse restaurants, custom menus, checkout with dynamic km-based fees, live order tracking with moving courier map.
- **Driver Dashboard**: Online toggle, 25-second sequential dispatch offers, GPS navigation, and earnings.
- **Restaurant Dashboard**: Real-time kitchen orders, menu management, opening schedules, and printed receipts.
- **Admin Dashboard**: Courier dossier validation (Moroccan CIN, permis, carte grise), restaurant validation, and platform tarification settings.

---

## 📁 Project Structure

```text
myapp/
├── frontend/    # React 18 + TypeScript + Vite customer/driver/restaurant/admin app
└── backend/     # Laravel 13 + MySQL backend API with Eloquent & sequential dispatch
```

---

## 🚀 Getting Started

### 1. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The frontend will run at `http://localhost:5173`.

### 2. Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan serve
```
The API will run at `http://127.0.0.1:8000`.

Database schema: import `food_delivery_schema.sql` into MySQL `food_delivery_db`.
Optional demo data: `php artisan db:seed --class=FoodiComprehensiveSeeder`.
