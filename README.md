# BlogNest AI — Complete Project

AI-powered Content Management System based on the supplied BlogNest specification.

## Implemented requirements
- Node.js + Express REST API and MongoDB/Mongoose
- JWT authentication and bcrypt password hashing
- Role-based access: Admin, Editor, Author, Reader
- Blog CRUD and ownership checks
- Blog lifecycle: Draft, Pending Approval, Scheduled, Published
- Automatic scheduled-to-published processing
- Categories and tags
- Advanced text/category/tag search
- Comments and moderation states: pending, approved, spam
- Likes and view metrics
- Media metadata fields
- Admin user/role management
- Editorial review and publishing
- Analytics summary
- Input validation/sanitization, Helmet, rate limiting and centralized errors
- Gemini AI blog generation and summarization
- AI FAQ, WeatherWise (uses supplied weather data; not live weather retrieval), and FitTrack guidance
- React/Vite frontend with role-aware navigation

## Structure
- `backend/` — Express/Mongoose/Gemini API
- `frontend/` — React/Vite web application

## Backend setup
1. `cd backend`
2. `npm install`
3. Copy `.env.example` to `.env` and set MongoDB, JWT, Gemini and bootstrap admin values.
4. `npm run dev`

## Frontend setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`

## Bootstrap admin
Set `BOOTSTRAP_ADMIN_EMAIL` to the email you will use for the administrator. A registration using that exact email is assigned the admin role. Alternatively run `npm run seed:admin` with `BOOTSTRAP_ADMIN_EMAIL` and optional `BOOTSTRAP_ADMIN_PASSWORD`.

Never commit `.env` or API keys.
