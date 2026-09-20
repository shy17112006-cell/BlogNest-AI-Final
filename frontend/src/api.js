const API =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/*
 * =========================================================
 * HTTP REQUEST HELPER
 * =========================================================
 */

async function request(
  path,
  {
    method = "GET",
    body = undefined,
    token = undefined,
  } = {}
) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API}${path}`, {
      method,
      headers,
      body:
        body !== undefined
          ? JSON.stringify(body)
          : undefined,
    });
  } catch (error) {
    console.error("Network request failed:", error);

    throw new Error(
      "Unable to connect to the BlogNest server. " +
        "Make sure the backend is running."
    );
  }

  /*
   * Try to parse JSON.
   * Some successful responses may not contain JSON,
   * so don't allow JSON parsing itself to crash the app.
   */
  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  /*
   * Convert backend errors into readable frontend errors.
   */
  if (!response.ok) {
    const message =
      data?.message ||
      data?.error ||
      `Request failed with HTTP ${response.status}.`;

    throw new Error(message);
  }

  return data;
}

/*
 * =========================================================
 * AUTHENTICATION
 * =========================================================
 */

export const api = {
  register: (data) =>
    request("/auth/register", {
      method: "POST",
      body: data,
    }),

  login: (data) =>
    request("/auth/login", {
      method: "POST",
      body: data,
    }),

  profile: (token) =>
    request("/auth/profile", {
      method: "GET",
      token,
    }),

  users: (token) =>
    request("/auth/users", {
      method: "GET",
      token,
    }),

  role: (token, userId, role) =>
    request(`/auth/users/${userId}/role`, {
      method: "PATCH",
      token,
      body: {
        role,
      },
    }),
};

/*
 * =========================================================
 * BLOGS
 * =========================================================
 */

api.blogs = (token, query = "") =>
  request(`/blogs${query}`, {
    method: "GET",
    token,
  });

api.create = (token, blog) =>
  request("/blogs", {
    method: "POST",
    token,
    body: blog,
  });

api.update = (token, id, blog) =>
  request(`/blogs/${id}`, {
    method: "PUT",
    token,
    body: blog,
  });

api.del = (token, id) =>
  request(`/blogs/${id}`, {
    method: "DELETE",
    token,
  });

api.status = (token, id, status) =>
  request(`/blogs/${id}/status`, {
    method: "PATCH",
    token,
    body: {
      status,
    },
  });

api.like = (token, id) =>
  request(`/blogs/${id}/like`, {
    method: "POST",
    token,
  });

/*
 * =========================================================
 * COMMENTS
 * =========================================================
 */

api.comments = (token, blogId) =>
  request(`/comments/blog/${blogId}`, {
    method: "GET",
    token,
  });

api.comment = (token, blogId, message) =>
  request(`/comments/blog/${blogId}`, {
    method: "POST",
    token,
    body: {
      message,
    },
  });

api.moderate = (
  token,
  commentId,
  status
) =>
  request(`/comments/${commentId}/moderate`, {
    method: "PATCH",
    token,
    body: {
      status,
    },
  });

/*
 * =========================================================
 * CATEGORIES
 * =========================================================
 */

api.categories = () =>
  request("/categories", {
    method: "GET",
  });

api.addCategory = (
  token,
  category
) =>
  request("/categories", {
    method: "POST",
    token,
    body: category,
  });

/*
 * =========================================================
 * ANALYTICS
 * =========================================================
 */

api.analytics = (token) =>
  request("/analytics/summary", {
    method: "GET",
    token,
  });

/*
 * =========================================================
 * AI FEATURES
 * =========================================================
 */

api.generate = (token, data) =>
  request("/ai/generate-blog", {
    method: "POST",
    token,
    body: data,
  });

api.summary = (data) =>
  request("/ai/summarize", {
    method: "POST",
    body: data,
  });

api.faq = (token, data) =>
  request("/ai/faq", {
    method: "POST",
    token,
    body: data,
  });

api.weather = (token, data) =>
  request("/ai/weatherwise", {
    method: "POST",
    token,
    body: data,
  });

api.fit = (token, data) =>
  request("/ai/fittrack", {
    method: "POST",
    token,
    body: data,
  });