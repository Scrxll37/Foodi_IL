# Foodi Backend API

RESTful API powering the Foodi food delivery platform in Agadir.

## Features

- **Authentication**: Customer registration and login with secure password hashing.
- **Restaurants & Menus**: Multi-branch restaurant catalog, menu categories, dishes, options and pricing.
- **Budget Meals**: Curated meal selections under 50 MAD with featured dishes.
- **Customer Addresses**: Geospatial customer delivery addresses in Agadir.
- **Order Management**: Order placement, subtotal & delivery fee calculation, status tracking tokens.
- **Notifications**: System and order status notifications stored in database.

## Requirements

- PHP 8.2+
- MySQL 8.0+
- Composer

## Installation

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

## API Endpoints

- `GET /api/health` - API health and metrics
- `GET /api/settings/tarifs` - Platform delivery tariffs
- `GET /api/cuisines` - Cuisine types
- `GET /api/meals/budget` - Budget meals (< 50 MAD)
- `GET /api/restaurants` - Restaurant catalog
- `GET /api/restaurants/{idOrSlug}` - Restaurant detail with categories and items
- `GET /api/customer/addresses` - Customer saved addresses
- `POST /api/customer/addresses` - Save customer delivery address
- `GET /api/orders` - Order history
- `POST /api/orders` - Create order
- `GET /api/orders/track/{token}` - Live order tracking
- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - Customer registration
- `GET /api/notifications` - Customer notifications
- `POST /api/notifications/read` - Mark notification as read
