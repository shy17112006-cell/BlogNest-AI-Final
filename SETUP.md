# BlogNest AI — Setup

## 1. Backend
```powershell
cd backend
npm install
Copy-Item .env.example .env
notepad .env
npm run dev
```
Set your MongoDB URI, JWT secret, Gemini key, and bootstrap admin email/password in `backend/.env`.

## 2. Frontend
Open a second terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`.

## 3. Admin account
Register using the exact `BOOTSTRAP_ADMIN_EMAIL` to create the initial admin account, or run `npm run seed:admin` after configuring the admin variables.

## 4. Roles
- Admin: users, roles, analytics, moderation, publishing, categories
- Editor: editorial review, publishing, moderation, categories, analytics
- Author: create/manage own content and submit drafts for approval
- Reader: consume published content and add comments

## 5. Security
Never commit `.env`. API keys and database credentials belong only in the local backend environment.
