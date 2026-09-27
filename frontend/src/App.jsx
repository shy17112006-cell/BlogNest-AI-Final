import { useEffect, useState, useCallback } from "react";
import { api } from "./api";

const roles = ["admin", "editor", "author", "reader"];

const initialAuth = {
  name: "",
  email: "",
  password: "",
};

const initialForm = {
  title: "",
  content: "",
  category: "",
  tags: "",
  status: "Draft",
  scheduledAt: "",
  photo: "",
  media: "",
};

const initialAI = {
  topic: "",
  category: "",
};

/*
 * BlogNest AI
 * Complete frontend application.
 *
 * Important:
 * - API responses are normalized so both arrays and
 *   { blogs: [...] } / { comments: [...] } responses work.
 * - Comments are actually connected to the backend.
 * - Role checks are safe when user is null.
 */

function toArray(value, keys = []) {
  if (Array.isArray(value)) return value;

  if (value && typeof value === "object") {
    for (const key of keys) {
      if (Array.isArray(value[key])) return value[key];
    }

    if (Array.isArray(value.data)) return value.data;
    if (value.data && Array.isArray(value.data.items)) {
      return value.data.items;
    }
  }

  return [];
}

function getBlogArray(data) {
  return toArray(data, ["blogs", "posts", "results"]);
}

function getCommentArray(data) {
  return toArray(data, ["comments", "results"]);
}

function getCategoryArray(data) {
  return toArray(data, ["categories", "results"]);
}

function getUserArray(data) {
  return toArray(data, ["users", "results"]);
}

function statusSlug(status) {
  return String(status || "published")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/* ---- SVG nav icons ---- */
const NAV_ICONS = {
  home: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  create: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  search: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  comments: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  ai: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  review: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  categories: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  analytics: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  users: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
};

export default function App() {
  const [token, setToken] = useState(
    localStorage.getItem("bn_token") || ""
  );

  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(
    Boolean(localStorage.getItem("bn_token"))
  );

  const [mode, setMode] = useState("login");
  const [auth, setAuth] = useState(initialAuth);
  const [tab, setTab] = useState("home");

  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const [form, setForm] = useState(initialForm);
  const [ai, setAi] = useState(initialAI);

  const [sum, setSum] = useState("");
  const [summary, setSummary] = useState("");

  const [faq, setFaq] = useState("");
  const [answer, setAnswer] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function clearMessages() {
    setMessage("");
    setError("");
  }

  function flash(text) {
    setMessage(text);
    setError("");

    window.setTimeout(() => {
      setMessage("");
    }, 3000);
  }

  function logout() {
    localStorage.removeItem("bn_token");
    setToken("");
    setUser(null);
    setLoadingUser(false);
    setBlogs([]);
    setCategories([]);
    setUsers([]);
    setStats(null);
    setTab("home");
    clearMessages();
  }

  async function loadBlogs(currentToken = token, query = "") {
    try {
      const data = await api.blogs(currentToken, query);
      setBlogs(getBlogArray(data));
      return getBlogArray(data);
    } catch (err) {
      console.error("Loading blogs failed:", err);
      setBlogs([]);
      setError(err?.message || "Unable to load blogs.");
      return [];
    }
  }

  async function loadCategories() {
    try {
      const data = await api.categories();
      const list = getCategoryArray(data);
      setCategories(list);
      return list;
    } catch (err) {
      console.error("Loading categories failed:", err);
      setCategories([]);
      return [];
    }
  }

  async function loadUsers(currentToken = token) {
    try {
      const data = await api.users(currentToken);
      const list = getUserArray(data);
      setUsers(list);
      return list;
    } catch (err) {
      console.error("Loading users failed:", err);
      setUsers([]);
      setError(err?.message || "Unable to load users.");
      return [];
    }
  }

  async function loadStats(currentToken = token) {
    try {
      const data = await api.analytics(currentToken);
      setStats(data?.data || data || null);
    } catch (err) {
      console.error("Loading analytics failed:", err);
      setStats(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadUser() {
      if (!token) {
        setUser(null);
        setLoadingUser(false);
        return;
      }

      setLoadingUser(true);
      setError("");

      try {
        const response = await api.profile(token);
        const currentUser = response?.user || response?.data?.user;

        if (!currentUser) {
          throw new Error("Unable to read the logged-in user.");
        }

        if (cancelled) return;

        setUser(currentUser);

        await Promise.all([
          loadBlogs(token),
          loadCategories(),
          currentUser.role === "admin"
            ? loadUsers(token)
            : Promise.resolve(),
          ["admin", "editor"].includes(currentUser.role)
            ? loadStats(token)
            : Promise.resolve(),
        ]);
      } catch (err) {
        if (cancelled) return;

        console.error("Profile loading failed:", err);
        logout();
        setError(
          err?.message ||
            "Your session has expired. Please log in again."
        );
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    }

    loadUser();

    return () => {
      cancelled = true;
    };
  }, [token]);

  async function submitAuth(event) {
    event.preventDefault();
    clearMessages();

    try {
      let response;

      if (mode === "login") {
        response = await api.login({
          email: auth.email.trim(),
          password: auth.password,
        });
      } else {
        response = await api.register({
          name: auth.name.trim(),
          email: auth.email.trim(),
          password: auth.password,
        });
      }

      const receivedToken =
        response?.token ||
        response?.data?.token ||
        response?.accessToken;

      if (receivedToken) {
        localStorage.setItem("bn_token", receivedToken);
        setUser(null);
        setLoadingUser(true);
        setToken(receivedToken);
        setAuth(initialAuth);
        return;
      }

      setMode("login");
      setAuth({
        ...initialAuth,
        email: auth.email,
      });

      flash("Registration successful. Please log in.");
    } catch (err) {
      console.error("Authentication failed:", err);
      setError(
        err?.message ||
          "Authentication failed. Please check your details."
      );
    }
  }


  async function editPost(blog) {
    setEditingId(blog?._id || null);
    setForm({
      title: blog?.title || "",
      content: blog?.content || "",
      category: blog?.category || "",
      tags: Array.isArray(blog?.tags) ? blog.tags.join(", ") : (blog?.tags || ""),
      status: blog?.status || "Draft",
      scheduledAt: blog?.scheduledAt ? new Date(blog.scheduledAt).toISOString().slice(0, 16) : "",
      photo: blog?.photo || "",
      media: typeof blog?.media === "string" ? blog.media : (blog?.media?.path || ""),
    });
    setTab("create");
    clearMessages();
  }

  async function deletePost(blogId) {
    if (!window.confirm("Delete this post? This action cannot be undone.")) return;
    clearMessages();
    try {
      await api.del(token, blogId);
      await loadBlogs(token);
      flash("Post deleted successfully.");
    } catch (err) {
      setError(err?.message || "Unable to delete the post.");
    }
  }

  async function changePostStatus(blogId, status) {
    clearMessages();
    try {
      await api.status(token, blogId, status);
      await loadBlogs(token);
      flash(`Post moved to ${status}.`);
    } catch (err) {
      setError(err?.message || "Unable to update post status.");
    }
  }


  async function removeCategory(categoryId) {
    if (!window.confirm("Remove this category?")) return;
    clearMessages();
    try {
      if (typeof api.delCategory === "function") {
        await api.delCategory(token, categoryId);
      } else {
        const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
        const response = await fetch(`${base}/categories/${categoryId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || "Category deletion failed.");
        }
      }
      await loadCategories();
      flash("Category removed successfully.");
    } catch (err) {
      setError(err?.message || "Unable to remove category.");
    }
  }

  async function savePost(event) {
    event.preventDefault();
    clearMessages();

    try {
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      const payload = {
        ...form,
        tags,
        scheduledAt: form.scheduledAt || undefined,
        photo: form.photo || undefined,
        media: form.media || undefined,
      };

      if (editingId) {
        await api.update(token, editingId, payload);
      } else {
        await api.create(token, payload);
      }

      setForm(initialForm);
      setEditingId(null);
      await loadBlogs(token);
      flash(editingId ? "Post updated successfully." : "Post saved successfully.");
      setTab("home");
    } catch (err) {
      console.error("Saving post failed:", err);
      setError(err?.message || "Unable to save the post.");
    }
  }

  async function generateBlog() {
    clearMessages();

    if (!ai.topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    try {
      const response = await api.generate(token, {
        topic: ai.topic.trim(),
        category: ai.category.trim(),
      });

      const blog = response?.blog || response?.data || response;

      if (!blog || typeof blog !== "object") {
        throw new Error("AI did not return a blog.");
      }

      setForm({
        title: blog.title || "",
        content: blog.content || blog.message || "",
        category: blog.category || ai.category || "",
        tags: Array.isArray(blog.tags)
          ? blog.tags.join(", ")
          : "",
        status: blog.status || "Draft",
        scheduledAt: blog.scheduledAt ? new Date(blog.scheduledAt).toISOString().slice(0, 16) : "",
        photo: blog.photo || "",
        media: typeof blog.media === "string" ? blog.media : (blog.media?.path || ""),
      });

      flash("AI draft generated successfully.");
      setTab("create");
    } catch (err) {
      console.error("AI generation failed:", err);
      setError(err?.message || "Unable to generate the blog.");
    }
  }

  async function summarize() {
    clearMessages();

    if (!sum.trim()) {
      setError("Please enter content to summarize.");
      return;
    }

    try {
      const response = await api.summary({
        content: sum.trim(),
      });

      setSummary(
        response?.summary ||
          response?.data?.summary ||
          response?.result ||
          "No summary returned."
      );
    } catch (err) {
      console.error("Summarization failed:", err);
      setError(
        err?.message || "Unable to summarize the content."
      );
    }
  }

  async function askFAQ() {
    clearMessages();

    if (!faq.trim()) {
      setError("Please enter a question.");
      return;
    }

    try {
      const response = await api.faq(token, {
        question: faq.trim(),
      });

      setAnswer(
        response?.answer ||
          response?.data?.answer ||
          response?.result ||
          "No answer returned."
      );
    } catch (err) {
      console.error("FAQ request failed:", err);
      setError(
        err?.message || "Unable to answer the question."
      );
    }
  }

  async function searchBlogs() {
    clearMessages();

    try {
      const params = new URLSearchParams();

      if (q.trim()) params.set("q", q.trim());
      if (cat) params.set("category", cat);

      const queryString = params.toString();
      await loadBlogs(
        token,
        queryString ? `?${queryString}` : ""
      );
    } catch (err) {
      console.error("Search failed:", err);
      setError(err?.message || "Unable to search blogs.");
    }
  }

  async function changeUserRole(userId, newRole) {
    clearMessages();

    try {
      await api.role(token, userId, newRole);
      await loadUsers(token);
      flash("User role updated successfully.");
    } catch (err) {
      console.error("Role update failed:", err);
      setError(
        err?.message || "Unable to update the user role."
      );
    }
  }

  async function addCategory(event) {
    event.preventDefault();
    clearMessages();

    const name = event.target.name.value.trim();

    if (!name) {
      setError("Please enter a category name.");
      return;
    }

    try {
      await api.addCategory(token, { name });
      event.target.reset();
      await loadCategories();
      flash("Category added successfully.");
    } catch (err) {
      console.error("Category creation failed:", err);
      setError(err?.message || "Unable to add category.");
    }
  }

  if (loadingUser) {
    return (
      <div className="loading-screen">
        <div className="loading-box">
          <div className="loading-ring" />
          <div className="brand" style={{ margin: 0 }}>BN</div>
          <h3>BlogNest AI</h3>
          <p>Opening your workspace&hellip;</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="auth">
        <div className="authbox">
          <div className="brand">BN</div>
          <p className="eyebrow">A publishing workspace with a memory for roles</p>

          <h1>
            BlogNest <span>AI</span>
          </h1>

          <p>
            Draft, review and publish with your team,
            backed by Gemini for first drafts and summaries.
          </p>

          <div className="tabs">
            <button
              type="button"
              className={mode === "login" ? "on" : ""}
              onClick={() => {
                setMode("login");
                clearMessages();
              }}
            >
              Login
            </button>

            <button
              type="button"
              className={mode === "register" ? "on" : ""}
              onClick={() => {
                setMode("register");
                clearMessages();
              }}
            >
              Register
            </button>
          </div>

          <form onSubmit={submitAuth}>
            {mode === "register" && (
              <input
                type="text"
                placeholder="Name"
                required
                value={auth.name}
                onChange={(event) =>
                  setAuth({
                    ...auth,
                    name: event.target.value,
                  })
                }
              />
            )}

            <input
              type="email"
              placeholder="Email"
              required
              value={auth.email}
              onChange={(event) =>
                setAuth({
                  ...auth,
                  email: event.target.value,
                })
              }
            />

            <input
              type="password"
              placeholder="Password"
              required
              value={auth.password}
              onChange={(event) =>
                setAuth({
                  ...auth,
                  password: event.target.value,
                })
              }
            />

            <button type="submit" className="primary">
              {mode === "login" ? "Login" : "Create account"}
            </button>
          </form>

          {error && <p className="error">{error}</p>}
          {message && <p className="result">{message}</p>}
        </div>
      </div>
    );
  }

  const nav = ["home", "search", "comments"];

  if (["admin", "editor", "author"].includes(user.role)) nav.push("ai");

  if (["admin", "author"].includes(user.role)) {
    nav.splice(1, 0, "create");
  }

  if (["admin", "editor"].includes(user.role)) {
    nav.push("review", "categories", "analytics");
  }

  if (user.role === "admin") {
    nav.push("users");
  }

  return (
    <>
      <header>
        <div className="logo">
          <div className="logo-mark">BN</div>
          <b>BlogNest AI</b>
        </div>

        <div className="header-right">
          <div className="user-chip">
            <div className="user-avatar">
              {(user.name || "U").charAt(0).toUpperCase()}
            </div>
            <span className="user-name">{user.name}</span>
            <span className="user-role">{user.role}</span>
          </div>

          <button type="button" className="ghost" onClick={logout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Logout
          </button>
        </div>
      </header>

      <div className="layout">
        <aside>
          {nav.map((item) => (
            <button
              type="button"
              className={tab === item ? "active" : ""}
              onClick={() => {
                setTab(item);
                clearMessages();
              }}
              key={item}
            >
              <span className="nav-icon">{NAV_ICONS[item]}</span>
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </aside>

        <main>
          {(message || error) && (
            <div className={`notice ${error ? "error" : ""}`}>
              {error || message}
            </div>
          )}

          {tab === "home" && (
            <>
              <div className="hero">
                <p className="eyebrow">Signed in as {user.role}</p>
                <h2>Publish with <span>purpose.</span></h2>
                <p>
                  Track drafts through review to publish, moderate comments
                  and draft with Gemini — all from one workspace.
                </p>
              </div>

              <div className="cards">
                <Metric n={blogs.length} t="Visible Posts" icon="📝" />
                <Metric n={stats?.publishedPosts ?? "—"} t="Published" icon="🚀" />
                <Metric n={stats?.comments ?? "—"} t="Comments" icon="💬" />
                <Metric n={stats?.totalViews ?? "—"} t="Total Views" icon="👁" />
              </div>

              <div className="section-head">
                <h2>Latest Posts</h2>
              </div>

              <PostList
                blogs={blogs}
                token={token}
                reload={() => loadBlogs(token)}
                canEdit={["admin", "author"].includes(user.role)}
                canDelete={["admin", "author"].includes(user.role)}
                canModerate={["admin", "editor"].includes(user.role)}
                onEdit={editPost}
                onDelete={deletePost}
                user={user}
              />
            </>
          )}

          {tab === "create" && (
            <section className="panel">
              <h2>{editingId ? "Edit Post" : "Create / Draft Post"}</h2>

              <form onSubmit={savePost}>
                <input
                  placeholder="Title"
                  required
                  value={form.title}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      title: event.target.value,
                    })
                  }
                />

                <div className="row">
                  <input
                    placeholder="Category"
                    value={form.category}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        category: event.target.value,
                      })
                    }
                  />

                  <input
                    placeholder="Tags, comma separated"
                    value={form.tags}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        tags: event.target.value,
                      })
                    }
                  />
                </div>

                <div className="row">
                  <input
                    type="datetime-local"
                    value={form.scheduledAt}
                    disabled={form.status !== "Scheduled"}
                    onChange={(event) => setForm({ ...form, scheduledAt: event.target.value })}
                    aria-label="Scheduled publication time"
                  />
                  <input
                    placeholder="Photo URL / path"
                    value={form.photo}
                    onChange={(event) => setForm({ ...form, photo: event.target.value })}
                  />
                </div>

                <input
                  placeholder="Media metadata / path"
                  value={form.media}
                  onChange={(event) => setForm({ ...form, media: event.target.value })}
                />

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value,
                    })
                  }
                >
                  <option value="Draft">Draft</option>
                  <option value="Pending Approval">
                    Pending Approval
                  </option>
                  <option value="Scheduled">Scheduled</option>

                  {["admin", "editor"].includes(user.role) && (
                    <option value="Published">Published</option>
                  )}
                </select>

                <textarea
                  rows="15"
                  placeholder="Content"
                  required
                  value={form.content}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      content: event.target.value,
                    })
                  }
                />

                <div className="button-row">
                  <button type="submit" className="primary">
                    {editingId ? "Update Post" : "Save Post"}
                  </button>
                  {editingId && <button type="button" className="ghost" onClick={() => { setEditingId(null); setForm(initialForm); }}>Cancel Edit</button>}
                </div>
              </form>
            </section>
          )}

          {tab === "search" && (
            <section className="panel">
              <h2>Advanced Search</h2>

              <div className="search-bar">
                <input
                  placeholder="Search by keyword…"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && searchBlogs()}
                />

                <select
                  value={cat}
                  onChange={(event) => setCat(event.target.value)}
                >
                  <option value="">All categories</option>

                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <button type="button" className="primary" onClick={searchBlogs}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                  Search
                </button>
              </div>

              <PostList
                blogs={blogs}
                token={token}
                reload={() => loadBlogs(token)}
                canEdit={["admin", "author"].includes(user.role)}
                canDelete={["admin", "author"].includes(user.role)}
                canModerate={["admin", "editor"].includes(user.role)}
                onEdit={editPost}
                onDelete={deletePost}
                user={user}
              />
            </section>
          )}

          {tab === "ai" && (
            <section className="grid">
              {["admin", "author"].includes(user.role) && (
              <div className="panel">
                <h2>Gemini AI Writer</h2>

                <input
                  placeholder="Topic"
                  value={ai.topic}
                  onChange={(event) =>
                    setAi({
                      ...ai,
                      topic: event.target.value,
                    })
                  }
                />

                <input
                  placeholder="Category"
                  value={ai.category}
                  onChange={(event) =>
                    setAi({
                      ...ai,
                      category: event.target.value,
                    })
                  }
                />

                <button
                  type="button"
                  className="primary"
                  onClick={generateBlog}
                >
                  Generate Blog
                </button>
              </div>
              )}

              <div className="panel">
                <h2>AI Summarizer</h2>

                <textarea
                  rows="6"
                  placeholder="Content to summarize"
                  value={sum}
                  onChange={(event) => setSum(event.target.value)}
                />

                <button
                  type="button"
                  className="secondary"
                  onClick={summarize}
                >
                  Summarize
                </button>

                {summary && (
                  <p className="result">{summary}</p>
                )}
              </div>

              <div className="panel">
                <h2>AI FAQ</h2>

                <textarea
                  rows="5"
                  placeholder="Ask a question"
                  value={faq}
                  onChange={(event) => setFaq(event.target.value)}
                />

                <button
                  type="button"
                  className="secondary"
                  onClick={askFAQ}
                >
                  Ask
                </button>

                {answer && (
                  <p className="result">{answer}</p>
                )}
              </div>

            </section>
          )}

          {tab === "review" && (
            <Review
              blogs={blogs}
              token={token}
              reload={() => loadBlogs(token)}
            />
          )}

          {tab === "users" && user.role === "admin" && (
            <section className="panel">
              <h2>User Roles</h2>

              {users.length === 0 ? (
                <p>No users found.</p>
              ) : (
                users.map((managedUser) => (
                  <div
                    className="listrow"
                    key={managedUser._id}
                  >
                    <span>
                      {managedUser.name}
                      <small>{managedUser.email}</small>
                    </span>

                    <select
                      value={managedUser.role}
                      onChange={(event) =>
                        changeUserRole(
                          managedUser._id,
                          event.target.value
                        )
                      }
                    >
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                ))
              )}
            </section>
          )}

          {tab === "categories" && (
            <section className="panel">
              <h2>Categories & Tags</h2>

              <form onSubmit={addCategory}>
                <input
                  name="name"
                  placeholder="New category"
                  required
                />

                <button type="submit" className="primary">
                  Add
                </button>
              </form>

              {categories.length === 0 ? (
                <p>No categories found.</p>
              ) : (
                categories.map((category) => (
                  <div className="listrow" key={category._id}>
                    <span>{category.name}</span>
                    <button type="button" className="ghost" onClick={() => removeCategory(category._id)}>Remove</button>
                  </div>
                ))
              )}
            </section>
          )}

          {tab === "analytics" && (
            <section className="panel">
              <h2>Analytics</h2>

              {!stats ? (
                <p>No analytics data available.</p>
              ) : (
                <div className="cards">
                  {Object.entries(stats).map(([key, value]) => (
                    <Metric
                      key={key}
                      n={value}
                      t={key}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {tab === "comments" && (
            <CommentsPanel
              blogs={blogs}
              token={token}
              user={user}
            />
          )}
        </main>
      </div>
    </>
  );
}

function Metric({ n, t, icon }) {
  return (
    <div className="metric">
      {icon && <div className="metric-icon">{icon}</div>}
      <b>{n}</b>
      <small>{t}</small>
    </div>
  );
}

/* ---- InlineComments: per-card comment panel ---- */
function InlineComments({ blogId, token, user, canModerate }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  const load = useCallback(async () => {
    if (!blogId) return;
    setLoading(true);
    try {
      const data = await api.comments(token, blogId);
      setComments(getCommentArray(data));
    } catch (err) {
      console.error("Comments load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [blogId, token]);

  useEffect(() => { load(); }, [load]);

  async function submitComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    setLocalError("");
    try {
      await api.comment(token, blogId, newComment.trim());
      setNewComment("");
      await load();
    } catch (err) {
      setLocalError(err?.message || "Unable to post comment.");
    } finally {
      setSubmitting(false);
    }
  }

  async function moderate(commentId, status) {
    try {
      await api.moderate(token, commentId, status);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, status } : c))
      );
    } catch (err) {
      console.error("Moderation failed:", err);
    }
  }

  return (
    <div className="inline-comments">
      <div className="inline-comments-inner">
        {/* New comment form */}
        {token && (
          <form className="comment-form-inline" onSubmit={submitComment}>
            <textarea
              placeholder="Write a comment…"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            {localError && <p className="error">{localError}</p>}
            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? "Posting…" : "Post Comment"}
            </button>
          </form>
        )}

        {/* Comment list */}
        {loading ? (
          <p className="comments-empty" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="loading-spin" /> Loading comments…
          </p>
        ) : comments.length === 0 ? (
          <p className="comments-empty">No comments yet — be the first!</p>
        ) : (
          <div className="comments-list">
            {comments.map((c) => (
              <article className="comment-card" key={c._id}>
                <div className="comment-header">
                  <strong>{c.userName || c.user?.name || "User"}</strong>
                  <span className={`comment-status ${c.status || "pending"}`}>
                    {c.status || "pending"}
                  </span>
                </div>
                <p>{c.message || c.text || ""}</p>

                {canModerate && (
                  <div className="comment-actions">
                    {c.status !== "approved" && (
                      <button type="button" className="secondary" onClick={() => moderate(c._id, "approved")}>
                        ✓ Approve
                      </button>
                    )}
                    {c.status !== "spam" && (
                      <button type="button" className="danger" onClick={() => moderate(c._id, "spam")}>
                        ✗ Spam
                      </button>
                    )}
                    {c.status !== "pending" && (
                      <button type="button" className="ghost" onClick={() => moderate(c._id, "pending")}>
                        Pending
                      </button>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PostList({
  blogs,
  token,
  reload,
  canEdit = false,
  canDelete = false,
  canModerate = false,
  onEdit,
  onDelete,
  user,
}) {
  const [openComments, setOpenComments] = useState({});

  function toggleComments(id) {
    setOpenComments((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  if (!Array.isArray(blogs) || blogs.length === 0) {
    return (
      <div className="posts">
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <p>No blog posts to show yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="posts">
      {blogs.map((blog) => (
        <article
          className={`post status-${statusSlug(blog.status)}`}
          key={blog._id}
        >
          <div className="post-body">
            {/* Meta: status + category */}
            <div className="meta-line">
              <span className={`stamp stamp-${statusSlug(blog.status)}`}>
                {blog.status || "Published"}
              </span>
              <span className="meta-text">
                {blog.category || "Uncategorized"}
                {Array.isArray(blog.tags) && blog.tags.length > 0
                  ? ` · ${blog.tags.slice(0, 3).join(", ")}`
                  : ""}
              </span>
            </div>

            <h3>{blog.title || blog.name || "Untitled"}</h3>

            <p className="post-excerpt">
              {(blog.content || blog.message || "").slice(0, 200)}
              {(blog.content || blog.message || "").length > 200 ? "…" : ""}
            </p>
          </div>

          {/* Footer: author + actions */}
          <div className="post-footer">
            <span className="post-author">
              {blog.authorName || "Unknown author"}
            </span>

            <div className="post-actions">
              {/* Like */}
              <button
                type="button"
                className="like-btn"
                aria-label="Like post"
                onClick={async () => {
                  try {
                    await api.like(token, blog._id);
                    await reload();
                  } catch (err) {
                    console.error("Like failed:", err);
                  }
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {blog.likes || 0}
              </button>

              {/* Comments toggle */}
              <button
                type="button"
                className={`comment-toggle-btn${openComments[blog._id] ? " open" : ""}`}
                aria-label="Toggle comments"
                onClick={() => toggleComments(blog._id)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {openComments[blog._id] ? "Hide" : "Comments"}
              </button>

              {/* Edit */}
              {canEdit && (
                <button
                  type="button"
                  className="ghost edit-btn"
                  onClick={() => onEdit(blog)}
                >
                  Edit
                </button>
              )}

              {/* Delete */}
              {canDelete && (
                <button
                  type="button"
                  className="danger delete-btn"
                  onClick={() => onDelete(blog._id)}
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Inline comment section */}
          {openComments[blog._id] && (
            <InlineComments
              blogId={blog._id}
              token={token}
              user={user}
              canModerate={canModerate}
            />
          )}
        </article>
      ))}
    </div>
  );
}

function Review({ blogs, token, reload }) {
  const pendingBlogs = (blogs || []).filter(
    (blog) => blog.status !== "Published"
  );

  return (
    <section className="panel">
      <h2>Editorial Review</h2>

      {pendingBlogs.length === 0 && (
        <p>No posts are waiting for review.</p>
      )}

      {pendingBlogs.map((blog) => (
        <div className="listrow" key={blog._id}>
          <span>
            {blog.title || blog.name}
            <small>
              <span className={`stamp stamp-${statusSlug(blog.status)}`}>
                {blog.status}
              </span>{" "}
              · {blog.authorName || "Unknown"}
            </small>
          </span>

          <button
            type="button"
            className="secondary"
            onClick={async () => {
              try {
                await api.status(
                  token,
                  blog._id,
                  "Published"
                );
                await reload();
              } catch (err) {
                console.error("Publishing failed:", err);
              }
            }}
          >
            Publish
          </button>
        </div>
      ))}
    </section>
  );
}

function CommentsPanel({ blogs, token, user }) {
  const safeBlogs = Array.isArray(blogs) ? blogs : [];

  const [selectedBlog, setSelectedBlog] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canModerate =
    user &&
    ["admin", "editor"].includes(user.role);

  async function loadComments(blogId) {
    if (!blogId) {
      setComments([]);
      setError("");
      setMessage("");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await api.comments(token, blogId);
      setComments(getCommentArray(data));
    } catch (err) {
      console.error("Loading comments failed:", err);
      setComments([]);
      setError(
        err?.message || "Unable to load comments."
      );
    } finally {
      setLoading(false);
    }
  }

  async function submitComment(event) {
    event.preventDefault();

    if (!selectedBlog) {
      setError("Please select a blog post first.");
      return;
    }

    if (!newComment.trim()) {
      setError("Please enter a comment.");
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.comment(
        token,
        selectedBlog,
        newComment.trim()
      );

      setNewComment("");
      setMessage(
        "Comment submitted successfully. It may require moderation."
      );

      await loadComments(selectedBlog);
    } catch (err) {
      console.error("Creating comment failed:", err);
      setError(
        err?.message || "Unable to submit the comment."
      );
    }
  }

  async function moderateComment(commentId, status) {
    setError("");
    setMessage("");

    try {
      const updatedComment = await api.moderate(
        token,
        commentId,
        status
      );

      setComments((currentComments) =>
        currentComments.map((comment) =>
          comment._id === commentId
            ? {
                ...comment,
                ...(updatedComment || {}),
                status
              }
            : comment
        )
      );

      setMessage(`Comment marked as ${status}.`);
    } catch (err) {
      console.error("Comment moderation failed:", err);
      setError(
        err?.message ||
          "Unable to moderate the comment."
      );
    }
  }

  return (
    <section className="panel">
      <h2>Comments</h2>

      <p>
        Select a blog post to view, add and moderate
        comments.
      </p>

      {safeBlogs.length === 0 ? (
        <div className="empty-state">
          <p>
            No blog posts are available for comments.
            Create or publish a post first.
          </p>
        </div>
      ) : (
        <>
          <div className="row">
            <select
              value={selectedBlog}
              onChange={(event) => {
                const blogId = event.target.value;
                setSelectedBlog(blogId);
                loadComments(blogId);
              }}
            >
              <option value="">
                Select a blog post
              </option>

              {safeBlogs.map((blog) => (
                <option
                  key={blog._id}
                  value={blog._id}
                >
                  {blog.title ||
                    blog.name ||
                    "Untitled post"}
                </option>
              ))}
            </select>
          </div>

          {selectedBlog && (
            <>
              <form
                onSubmit={submitComment}
                className="comment-form"
              >
                <textarea
                  rows="4"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(event) =>
                    setNewComment(event.target.value)
                  }
                />

                <button
                  type="submit"
                  className="primary"
                >
                  Add Comment
                </button>
              </form>

              {error && (
                <p className="error">{error}</p>
              )}

              {message && (
                <p className="result">{message}</p>
              )}

              {loading && (
                <p>Loading comments...</p>
              )}

              {!loading && comments.length === 0 && (
                <div className="empty-state">
                  <p>
                    No comments found for this post.
                    Add the first comment above.
                  </p>
                </div>
              )}

              {!loading && comments.length > 0 && (
                <div className="comments-list">
                  {comments.map((comment) => (
                    <article
                      className="comment-card"
                      key={comment._id}
                    >
                      <div className="comment-header">
                        <strong>
                          {comment.userName ||
                            comment.user?.name ||
                            "User"}
                        </strong>

                        <span
                          className={`comment-status ${
                            comment.status || "pending"
                          }`}
                        >
                          {comment.status || "pending"}
                        </span>
                      </div>

                      <p>
                        {comment.message ||
                          comment.text ||
                          ""}
                      </p>

                      {canModerate && (
                        <div className="comment-actions">
                          {comment.status !== "approved" && (
                            <button
                              type="button"
                              className="secondary"
                              onClick={() =>
                                moderateComment(
                                  comment._id,
                                  "approved"
                                )
                              }
                            >
                              Approve
                            </button>
                          )}

                          {comment.status !== "spam" && (
                            <button
                              type="button"
                              className="secondary"
                              onClick={() =>
                                moderateComment(
                                  comment._id,
                                  "spam"
                                )
                              }
                            >
                              Mark Spam
                            </button>
                          )}

                          {comment.status !== "pending" && (
                            <button
                              type="button"
                              className="ghost"
                              onClick={() =>
                                moderateComment(
                                  comment._id,
                                  "pending"
                                )
                              }
                            >
                              Pending
                            </button>
                          )}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
