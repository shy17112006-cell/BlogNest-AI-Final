# API Testing Checklist

Base URL: `http://localhost:5000`

## Auth
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/profile`
- GET `/api/auth/users` (Admin)
- PATCH `/api/auth/users/:id/role` (Admin)

## Blogs
- POST `/api/blogs`
- GET `/api/blogs?q=ai&category=Technology&tag=cloud`
- GET `/api/blogs/:id`
- PUT `/api/blogs/:id`
- DELETE `/api/blogs/:id`
- POST `/api/blogs/:id/like`
- PATCH `/api/blogs/:id/status` (Editor/Admin)

## Comments
- POST `/api/comments/blog/:blogId`
- GET `/api/comments/blog/:blogId`
- PATCH `/api/comments/:id/moderate`
- DELETE `/api/comments/:id`

## Categories
- GET `/api/categories`
- POST `/api/categories` (Editor/Admin)
- DELETE `/api/categories/:id` (Editor/Admin)

## Analytics
- GET `/api/analytics/summary` (Editor/Admin)

## AI
- POST `/api/ai/generate-blog`
- POST `/api/ai/summarize`
- POST `/api/ai/faq`
- POST `/api/ai/weatherwise`
- POST `/api/ai/fittrack`
