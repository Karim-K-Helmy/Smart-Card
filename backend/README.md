# LineStart Backend

Complete Express + MongoDB backend for the smart card platform.

## Main features
- STAR and PRO users
- Personal and business profiles
- Social links
- Products inside PRO profile
- Card plans
- Card orders
- Vodafone Cash / manual payment methods
- Payment receipt upload and admin review
- QR generation and card activation
- Admin dashboard and admin action logs
- Multer -> Sharp -> Cloudinary image pipeline

## Run locally
```bash
npm install
cp .env.example .env
npm run seed:admin
npm run dev
```

## Main API groups
- `/api/users`
- `/api/categories`
- `/api/cards`
- `/api/payments`
- `/api/admin`
- `/api/messages`

## Important notes
- Images are uploaded to Cloudinary.
- Users can register as `STAR` or `PRO`.
- Only `PRO` users can manage products.
- Public profile opens using the user slug.
- Admin approves receipts, then a card with QR is generated automatically.

## Seed first admin
Set these env values, then run:
```bash
npm run seed:admin
```

## SQL reference
A matching SQL schema is included in `database-schema.sql`.
