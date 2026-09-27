import { useEffect, useState, useCallback, useRef } from "react";
import { api } from "./api";

const initialAuth = { name: "", email: "", password: "", role: "reader" };
const initialForm = {
  title: "", content: "", category: "", tags: "",
  status: "Draft", scheduledAt: "", photo: "", media: "",
};
const initialAI = { topic: "", category: "" };

function toArray(value, keys = []) {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    for (const key of keys) {
      if (Array.isArray(value[key])) return value[key];
    }
    if (Array.isArray(value.data)) return value.data;
    if (value.data && Array.isArray(value.data.items)) return value.data.items;
  }
  return [];
}
function getBlogArray(data) { return toArray(data, ["blogs", "posts", "results"]); }
function getCommentArray(data) { return toArray(data, ["comments", "results"]); }
function getCategoryArray(data) { return toArray(data, ["categories", "results"]); }
function getUserArray(data) { return toArray(data, ["users", "results"]); }
function statusSlug(status) {
  return String(status || "published").toLowerCase().replace(/\s+/g, "-");
}
function formatDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── SVG Icons ─────────────────────────────────────────── */
const Icons = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  write: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  myblogs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
  search: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  ai: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  review: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  categories: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>,
  analytics: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  heart: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  heartOutline: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>,
  comment: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
};

const NAV_LABELS = {
  home: "Home", write: "Write", myblogs: "My Blogs", search: "Explore",
  ai: "AI Studio", review: "Review", categories: "Categories",
  analytics: "Analytics", users: "Users",
};

/* ── Main App ───────────────────────────────────────────── */
export default function App() {
  const [token, setToken] = useState(localStorage.getItem("bn_token") || "");
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(Boolean(localStorage.getItem("bn_token")));

  const [mode, setMode] = useState("login");
  const [auth, setAuth] = useState(initialAuth);
  const [tab, setTab] = useState("home");

  const [blogs, setBlogs] = useState([]);
  const [myBlogs, setMyBlogs] = useState([]);
  const [myBlogsLoading, setMyBlogsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);

  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  const [form, setForm] = useState(initialForm);
  const [ai, setAi] = useState(initialAI);
  const [editingId, setEditingId] = useState(null);

  const [sum, setSum] = useState("");
  const [summary, setSummary] = useState("");
  const [faq, setFaq] = useState("");
  const [answer, setAnswer] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  function clearMessages() { setMessage(""); setError(""); }
  function flash(text) {
    setMessage(text); setError("");
    window.setTimeout(() => setMessage(""), 3500);
  }
  function flashError(text) {
    setError(text); setMessage("");
    window.setTimeout(() => setError(""), 4000);
  }

  function logout() {
    localStorage.removeItem("bn_token");
    setToken(""); setUser(null); setLoadingUser(false);
    setBlogs([]); setMyBlogs([]); setCategories([]); setUsers([]); setStats(null);
    setTab("home"); clearMessages(); setProfileOpen(false);
  }

  async function loadBlogs(currentToken = token, query = "") {
    try {
      const data = await api.blogs(currentToken, query);
      setBlogs(getBlogArray(data));
      return getBlogArray(data);
    } catch (err) {
      console.error(err); setBlogs([]); return [];
    }
  }

  async function loadMyBlogs(currentToken = token) {
    setMyBlogsLoading(true);
    try {
      const data = await api.myBlogs(currentToken);
      const list = getBlogArray(data);
      setMyBlogs(list);
      return list;
    } catch (err) {
      console.error("loadMyBlogs failed:", err);
      return [];
    } finally {
      setMyBlogsLoading(false);
    }
  }

  async function loadCategories() {
    try {
      const data = await api.categories();
      const list = getCategoryArray(data);
      setCategories(list); return list;
    } catch { setCategories([]); return []; }
  }

  async function loadUsers(currentToken = token) {
    try {
      const data = await api.users(currentToken);
      const list = getUserArray(data);
      setUsers(list); return list;
    } catch { setUsers([]); return []; }
  }

  async function loadStats(currentToken = token) {
    try {
      const data = await api.analytics(currentToken);
      setStats(data?.data || data || null);
    } catch { setStats(null); }
  }

  useEffect(() => {
    let cancelled = false;
    async function loadUser() {
      if (!token) { setUser(null); setLoadingUser(false); return; }
      setLoadingUser(true);
      try {
        const response = await api.profile(token);
        const currentUser = response?.user || response?.data?.user;
        if (!currentUser) throw new Error("Unable to read the logged-in user.");
        if (cancelled) return;
        setUser(currentUser);
        const promises = [loadBlogs(token), loadCategories()];
        if (currentUser.role === "admin") promises.push(loadUsers(token));
        if (["admin", "editor"].includes(currentUser.role)) promises.push(loadStats(token));
        if (["admin", "author"].includes(currentUser.role)) promises.push(loadMyBlogs(token));
        await Promise.all(promises);
      } catch (err) {
        if (cancelled) return;
        console.error(err); logout();
        setError(err?.message || "Your session has expired. Please log in again.");
      } finally {
        if (!cancelled) setLoadingUser(false);
      }
    }
    loadUser();
    return () => { cancelled = true; };
  }, [token]);

  // Refresh My Blogs every time the user opens that tab
  useEffect(() => {
    if (tab === "myblogs" && token && user) {
      loadMyBlogs(token);
    }
  }, [tab]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function submitAuth(event) {
    event.preventDefault(); clearMessages();
    try {
      let response;
      if (mode === "login") {
        response = await api.login({ email: auth.email.trim(), password: auth.password });
      } else {
        response = await api.register({ name: auth.name.trim(), email: auth.email.trim(), password: auth.password, role: auth.role });
      }
      const receivedToken = response?.token || response?.data?.token || response?.accessToken;
      if (receivedToken) {
        localStorage.setItem("bn_token", receivedToken);
        setUser(null); setLoadingUser(true); setToken(receivedToken); setAuth(initialAuth);
        return;
      }
      setMode("login");
      setAuth({ ...initialAuth, email: auth.email });
      flash("Registration successful. Please log in.");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Authentication failed. Please check your details.");
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
    setTab("write"); clearMessages();
  }

  async function deletePost(blogId) {
    if (!window.confirm("Delete this post? This action cannot be undone.")) return;
    clearMessages();
    try {
      await api.del(token, blogId);
      await Promise.all([loadBlogs(token), loadMyBlogs(token)]);
      flash("Post deleted successfully.");
    } catch (err) { flashError(err?.message || "Unable to delete the post."); }
  }

  async function savePost(event) {
    event.preventDefault(); clearMessages();
    try {
      const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
      const payload = { ...form, tags, scheduledAt: form.scheduledAt || undefined, photo: form.photo || undefined, media: form.media || undefined };
      if (editingId) {
        await api.update(token, editingId, payload);
      } else {
        await api.create(token, payload);
      }
      setForm(initialForm); setEditingId(null);
      await Promise.all([loadBlogs(token), loadMyBlogs(token)]);
      flash(editingId ? "Post updated successfully." : "Post saved successfully.");
      setTab("home");
    } catch (err) {
      console.error(err); flashError(err?.message || "Unable to save the post.");
    }
  }

  async function generateBlog() {
    clearMessages();
    if (!ai.topic.trim()) { flashError("Please enter a topic."); return; }
    try {
      const response = await api.generate(token, { topic: ai.topic.trim(), category: ai.category.trim() });
      const blog = response?.blog || response?.data || response;
      if (!blog || typeof blog !== "object") throw new Error("AI did not return a blog.");
      setForm({
        title: blog.title || "", content: blog.content || blog.message || "",
        category: blog.category || ai.category || "",
        tags: Array.isArray(blog.tags) ? blog.tags.join(", ") : "",
        status: blog.status || "Draft",
        scheduledAt: blog.scheduledAt ? new Date(blog.scheduledAt).toISOString().slice(0, 16) : "",
        photo: blog.photo || "", media: typeof blog.media === "string" ? blog.media : (blog.media?.path || ""),
      });
      flash("AI draft generated. Review it in Write tab."); setTab("write");
    } catch (err) { console.error(err); flashError(err?.message || "Unable to generate the blog."); }
  }

  async function summarize() {
    clearMessages();
    if (!sum.trim()) { flashError("Please enter content to summarize."); return; }
    try {
      const response = await api.summary({ content: sum.trim() });
      setSummary(response?.summary || response?.data?.summary || response?.result || "No summary returned.");
    } catch (err) { flashError(err?.message || "Unable to summarize."); }
  }

  async function askFAQ() {
    clearMessages();
    if (!faq.trim()) { flashError("Please enter a question."); return; }
    try {
      const response = await api.faq(token, { question: faq.trim() });
      setAnswer(response?.answer || response?.data?.answer || response?.result || "No answer returned.");
    } catch (err) { flashError(err?.message || "Unable to answer."); }
  }

  async function searchBlogs() {
    clearMessages();
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (cat) params.set("category", cat);
      const qs = params.toString();
      await loadBlogs(token, qs ? `?${qs}` : "");
    } catch (err) { flashError(err?.message || "Unable to search."); }
  }

  async function changeUserRole(userId, newRole) {
    clearMessages();
    try {
      await api.role(token, userId, newRole);
      await loadUsers(token);
      flash("User role updated.");
    } catch (err) { flashError(err?.message || "Unable to update role."); }
  }

  async function deleteUser(userId, userName) {
    if (!window.confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
    clearMessages();
    try {
      await api.deleteUser(token, userId);
      await loadUsers(token);
      flash("User deleted successfully.");
    } catch (err) { flashError(err?.message || "Unable to delete user."); }
  }

  async function addCategory(event) {
    event.preventDefault(); clearMessages();
    const name = event.target.name.value.trim();
    if (!name) { flashError("Please enter a category name."); return; }
    try {
      await api.addCategory(token, { name });
      event.target.reset();
      await loadCategories();
      flash("Category added.");
    } catch (err) { flashError(err?.message || "Unable to add category."); }
  }

  async function removeCategory(categoryId) {
    if (!window.confirm("Remove this category?")) return;
    clearMessages();
    try {
      const base = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      const response = await fetch(`${base}/categories/${categoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || "Category deletion failed.");
      }
      await loadCategories();
      flash("Category removed.");
    } catch (err) { flashError(err?.message || "Unable to remove category."); }
  }

  /* ── Loading screen ─────────────────────────────────── */
  if (loadingUser) {
    return (
      <div className="splash">
        <div className="splash-inner">
          <div className="splash-logo">BN</div>
          <div className="splash-ring" />
          <p className="splash-text">Opening BlogNest AI…</p>
        </div>
      </div>
    );
  }

  /* ── Auth page ──────────────────────────────────────── */
  if (!token || !user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          {/* Left decorative panel */}
          <div className="auth-panel">
            <div className="auth-panel-logo">BN</div>
            <h1 className="auth-panel-title">BlogNest <span>AI</span></h1>
            <p className="auth-panel-sub">
              Draft, review &amp; publish with your team — backed by Gemini.
            </p>
            <div className="auth-dots">
              <span /><span /><span />
            </div>
          </div>

          {/* Right form panel */}
          <div className="auth-form-panel">
            <div className="auth-tabs">
              <button className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); clearMessages(); }}>Sign In</button>
              <button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); clearMessages(); }}>Create Account</button>
            </div>

            <h2 className="auth-heading">{mode === "login" ? "Welcome back" : "Join BlogNest"}</h2>
            <p className="auth-sub">{mode === "login" ? "Sign in to your workspace" : "Create your free account"}</p>

            <form className="auth-form" onSubmit={submitAuth}>
              {mode === "register" && (
                <div className="field-group">
                  <label>Full Name</label>
                  <input type="text" placeholder="Your name" required value={auth.name}
                    onChange={e => setAuth({ ...auth, name: e.target.value })} />
                </div>
              )}
              <div className="field-group">
                <label>Email Address</label>
                <input type="email" placeholder="you@example.com" required value={auth.email}
                  onChange={e => setAuth({ ...auth, email: e.target.value })} />
              </div>
              <div className="field-group">
                <label>Password</label>
                <input type="password" placeholder="Min. 6 characters" required value={auth.password}
                  onChange={e => setAuth({ ...auth, password: e.target.value })} />
              </div>

              {mode === "register" && (
                <div className="field-group">
                  <label>I want to join as</label>
                  <div className="role-picker">
                    <label className={`role-option ${auth.role === "reader" ? "selected" : ""}`}>
                      <input type="radio" name="role" value="reader" checked={auth.role === "reader"}
                        onChange={() => setAuth({ ...auth, role: "reader" })} />
                      <span className="role-icon">📖</span>
                      <span className="role-label">Reader</span>
                      <span className="role-desc">Browse &amp; comment on blogs</span>
                    </label>
                    <label className={`role-option ${auth.role === "author" ? "selected" : ""}`}>
                      <input type="radio" name="role" value="author" checked={auth.role === "author"}
                        onChange={() => setAuth({ ...auth, role: "author" })} />
                      <span className="role-icon">✍️</span>
                      <span className="role-label">Author</span>
                      <span className="role-desc">Write &amp; publish blogs</span>
                    </label>
                  </div>
                  <p className="role-note">💡 Editor &amp; Admin roles are granted by the administrator.</p>
                </div>
              )}

              {error && <p className="auth-error">{error}</p>}
              {message && <p className="auth-success">{message}</p>}

              <button type="submit" className="btn-primary btn-full">
                {mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /* ── Build nav items ────────────────────────────────── */
  const nav = ["home"];
  if (["admin", "author"].includes(user.role)) nav.push("write", "myblogs");
  nav.push("search");
  if (["admin", "editor", "author"].includes(user.role)) nav.push("ai");
  if (["admin", "editor"].includes(user.role)) nav.push("review", "categories", "analytics");
  if (user.role === "admin") nav.push("users");

  /* ── Logged-in app ──────────────────────────────────── */
  return (
    <>
      {/* Header */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-logo">BN</div>
          <span className="topbar-brand">BlogNest <strong>AI</strong></span>
        </div>

        <div className="topbar-right">
          {/* Profile icon button */}
          <div className="profile-wrap" ref={profileRef}>
            <button className="profile-btn" onClick={() => setProfileOpen(p => !p)} aria-label="Open profile">
              <span className="profile-avatar">{(user.name || "U").charAt(0).toUpperCase()}</span>
            </button>

            {profileOpen && (
              <div className="profile-dropdown">
                <div className="profile-header">
                  <div className="profile-avatar-lg">{(user.name || "U").charAt(0).toUpperCase()}</div>
                  <div className="profile-info">
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                  </div>
                </div>
                <div className="profile-role-badge">{user.role}</div>
                <div className="profile-divider" />
                <div className="profile-stats">
                  <div className="profile-stat">
                    <b>{myBlogs.length}</b>
                    <small>My Posts</small>
                  </div>
                  <div className="profile-stat">
                    <b>{myBlogs.reduce((acc, b) => acc + (b.likes || 0), 0)}</b>
                    <small>Total Likes</small>
                  </div>
                  <div className="profile-stat">
                    <b>{myBlogs.reduce((acc, b) => acc + (b.views || 0), 0)}</b>
                    <small>Total Views</small>
                  </div>
                </div>
                <div className="profile-divider" />
                <button className="profile-logout" onClick={logout}>
                  <span className="profile-logout-icon">{Icons.logout}</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="app-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <nav className="sidebar-nav">
            {nav.map(item => (
              <button
                key={item}
                className={`sidebar-btn${tab === item ? " active" : ""}`}
                onClick={() => { setTab(item); clearMessages(); }}
              >
                <span className="sidebar-icon">{Icons[item]}</span>
                <span className="sidebar-label">{NAV_LABELS[item]}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="main-content">
          {/* Toast notifications */}
          {(message || error) && (
            <div className={`toast ${error ? "toast-error" : "toast-success"}`}>
              <span>{error || message}</span>
              <button onClick={clearMessages}>{Icons.close}</button>
            </div>
          )}

          {/* HOME */}
          {tab === "home" && (
            <div className="page-home">
              <div className="hero-banner">
                <div className="hero-text">
                  <p className="hero-eyebrow">Signed in as <strong>{user.role}</strong></p>
                  <h2 className="hero-title">Publish with <span>purpose.</span></h2>
                  <p className="hero-desc">Track drafts, collaborate with your team, and draft with Gemini AI — all from one workspace.</p>
                </div>
                <div className="hero-decoration">
                  <div className="hero-deco-circle c1" />
                  <div className="hero-deco-circle c2" />
                  <div className="hero-deco-circle c3" />
                </div>
              </div>

              {["admin", "editor"].includes(user.role) && stats && (
                <div className="metrics-row">
                  <Metric n={stats.publishedPosts ?? blogs.length} t="Published" icon="🚀" />
                  <Metric n={stats.comments ?? "—"} t="Comments" icon="💬" />
                  <Metric n={stats.totalViews ?? "—"} t="Total Views" icon="👁" />
                  <Metric n={users.length || "—"} t="Members" icon="👥" />
                </div>
              )}

              <div className="section-header">
                <h3>Latest Posts</h3>
              </div>

              <PostList
                blogs={blogs}
                token={token}
                user={user}
                reload={() => loadBlogs(token)}
                canEdit={false}
                canDelete={false}
                canModerate={["admin", "editor"].includes(user.role)}
                onEdit={editPost}
                onDelete={deletePost}
                viewMode="feed"
              />
            </div>
          )}

          {/* WRITE */}
          {tab === "write" && (
            <div className="page-panel">
              <div className="page-panel-header">
                <h2>{editingId ? "Edit Post" : "Write a New Post"}</h2>
                {editingId && (
                  <button className="btn-ghost" onClick={() => { setEditingId(null); setForm(initialForm); }}>
                    Cancel Edit
                  </button>
                )}
              </div>

              <form className="write-form" onSubmit={savePost}>
                <input className="write-title-input" placeholder="Post title…" required
                  value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />

                <div className="form-row">
                  <div className="field-group">
                    <label>Category</label>
                    <input placeholder="e.g. Technology" value={form.category}
                      onChange={e => setForm({ ...form, category: e.target.value })} />
                  </div>
                  <div className="field-group">
                    <label>Tags (comma-separated)</label>
                    <input placeholder="e.g. react, webdev, tips" value={form.tags}
                      onChange={e => setForm({ ...form, tags: e.target.value })} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="field-group">
                    <label>Status</label>
                    <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="Draft">Draft</option>
                      <option value="Pending Approval">Submit for Review</option>
                      <option value="Scheduled">Scheduled</option>
                      {["admin", "editor"].includes(user.role) && <option value="Published">Publish Now</option>}
                    </select>
                  </div>
                  {form.status === "Scheduled" && (
                    <div className="field-group">
                      <label>Schedule Date &amp; Time</label>
                      <input type="datetime-local" value={form.scheduledAt}
                        onChange={e => setForm({ ...form, scheduledAt: e.target.value })} />
                    </div>
                  )}
                </div>

                <div className="field-group">
                  <label>Cover Photo URL</label>
                  <input placeholder="https://…" value={form.photo}
                    onChange={e => setForm({ ...form, photo: e.target.value })} />
                </div>

                <div className="field-group">
                  <label>Content</label>
                  <textarea rows="18" placeholder="Write your blog content here…" required
                    value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    {editingId ? "Update Post" : "Save Post"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* MY BLOGS */}
          {tab === "myblogs" && (
            <div className="page-myblogs">
              <div className="page-panel-header">
                <h2>My Blogs</h2>
                <button className="btn-primary" onClick={() => { setTab("write"); setEditingId(null); setForm(initialForm); }}>
                  + New Post
                </button>
              </div>

              {myBlogsLoading ? (
                <div className="myblogs-loading">
                  <span className="spin" />
                  <span>Loading your posts…</span>
                </div>
              ) : myBlogs.length === 0 ? (
                <EmptyState
                  icon={Icons.write}
                  title="No posts yet"
                  desc="Start writing your first blog post!"
                  action={() => setTab("write")}
                  actionLabel="Write Now"
                />
              ) : (
                <PostList
                  blogs={myBlogs}
                  token={token}
                  user={user}
                  reload={async () => { await Promise.all([loadBlogs(token), loadMyBlogs(token)]); }}
                  canEdit={true}
                  canDelete={true}
                  canModerate={["admin", "editor"].includes(user.role)}
                  onEdit={editPost}
                  onDelete={deletePost}
                  viewMode="myblogs"
                />
              )}
            </div>
          )}

          {/* SEARCH / EXPLORE */}
          {tab === "search" && (
            <div className="page-panel">
              <div className="page-panel-header">
                <h2>Explore Posts</h2>
              </div>
              <div className="search-bar">
                <div className="search-input-wrap">
                  <span className="search-icon">{Icons.search}</span>
                  <input placeholder="Search by keyword…" value={q}
                    onChange={e => setQ(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && searchBlogs()} />
                </div>
                <select value={cat} onChange={e => setCat(e.target.value)}>
                  <option value="">All categories</option>
                  {categories.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
                <button className="btn-primary" onClick={searchBlogs}>Search</button>
              </div>

              <PostList
                blogs={blogs}
                token={token}
                user={user}
                reload={() => loadBlogs(token)}
                canEdit={false}
                canDelete={false}
                canModerate={["admin", "editor"].includes(user.role)}
                onEdit={editPost}
                onDelete={deletePost}
                viewMode="feed"
              />
            </div>
          )}

          {/* AI STUDIO */}
          {tab === "ai" && (
            <div className="page-ai">
              <div className="page-panel-header">
                <h2>AI Studio</h2>
              </div>

              <div className="ai-grid">
                {["admin", "author"].includes(user.role) && (
                  <div className="ai-card">
                    <div className="ai-card-icon">⚡</div>
                    <h3>Blog Generator</h3>
                    <p>Give a topic and let Gemini AI draft a complete blog post for you.</p>
                    <div className="field-group">
                      <label>Topic</label>
                      <input placeholder="e.g. Future of AI in healthcare" value={ai.topic}
                        onChange={e => setAi({ ...ai, topic: e.target.value })} />
                    </div>
                    <div className="field-group">
                      <label>Category (optional)</label>
                      <input placeholder="e.g. Technology" value={ai.category}
                        onChange={e => setAi({ ...ai, category: e.target.value })} />
                    </div>
                    <button className="btn-primary" onClick={generateBlog}>Generate Blog</button>
                  </div>
                )}

                <div className="ai-card">
                  <div className="ai-card-icon">📝</div>
                  <h3>AI Summarizer</h3>
                  <p>Paste any content to get a concise AI-generated summary.</p>
                  <div className="field-group">
                    <label>Content to Summarize</label>
                    <textarea rows="5" placeholder="Paste content here…" value={sum}
                      onChange={e => setSum(e.target.value)} />
                  </div>
                  <button className="btn-secondary" onClick={summarize}>Summarize</button>
                  {summary && <div className="ai-result"><p>{summary}</p></div>}
                </div>

                <div className="ai-card">
                  <div className="ai-card-icon">💡</div>
                  <h3>AI FAQ</h3>
                  <p>Ask any question and get an AI-powered answer.</p>
                  <div className="field-group">
                    <label>Your Question</label>
                    <textarea rows="4" placeholder="Ask anything…" value={faq}
                      onChange={e => setFaq(e.target.value)} />
                  </div>
                  <button className="btn-secondary" onClick={askFAQ}>Get Answer</button>
                  {answer && <div className="ai-result"><p>{answer}</p></div>}
                </div>
              </div>
            </div>
          )}

          {/* REVIEW */}
          {tab === "review" && (
            <div className="page-panel">
              <div className="page-panel-header"><h2>Editorial Review</h2></div>
              <ReviewPanel blogs={blogs} token={token} reload={() => loadBlogs(token)} flash={flash} flashError={flashError} />
            </div>
          )}

          {/* USERS */}
          {tab === "users" && user.role === "admin" && (
            <div className="page-panel">
              <div className="page-panel-header"><h2>User Management</h2></div>
              <p className="page-desc">Assign editor or admin roles to registered users. Readers and authors register on their own.</p>
              {users.length === 0 ? (
                <p className="empty-text">No users found.</p>
              ) : (
                <div className="user-list">
                  {users.map(u => (
                    <div className="user-row" key={u._id}>
                      <div className="user-row-avatar">{(u.name || "U").charAt(0).toUpperCase()}</div>
                      <div className="user-row-info">
                        <strong>{u.name}</strong>
                        <span>{u.email}</span>
                      </div>
                      <select className="role-select" value={u.role}
                        onChange={e => changeUserRole(u._id, e.target.value)}>
                        <option value="reader">reader</option>
                        <option value="author">author</option>
                        <option value="editor">editor</option>
                        <option value="admin">admin</option>
                      </select>
                      <button
                        className="user-delete-btn"
                        title="Delete user"
                        disabled={u._id === (user?.id || user?._id)}
                        onClick={() => deleteUser(u._id, u.name)}
                      >
                        {Icons.trash}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CATEGORIES */}
          {tab === "categories" && (
            <div className="page-panel">
              <div className="page-panel-header"><h2>Categories</h2></div>
              <form className="add-category-form" onSubmit={addCategory}>
                <input name="name" placeholder="New category name…" required />
                <button type="submit" className="btn-primary">Add</button>
              </form>
              {categories.length === 0 ? (
                <p className="empty-text">No categories yet.</p>
              ) : (
                <div className="category-list">
                  {categories.map(c => (
                    <div className="category-row" key={c._id}>
                      <span>{c.name}</span>
                      <button className="btn-danger-sm" onClick={() => removeCategory(c._id)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ANALYTICS */}
          {tab === "analytics" && (
            <div className="page-panel">
              <div className="page-panel-header"><h2>Analytics</h2></div>
              {!stats ? (
                <p className="empty-text">No analytics data available.</p>
              ) : (
                <div className="metrics-row">
                  {Object.entries(stats).map(([key, value]) => (
                    <Metric key={key} n={value} t={key} />
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

/* ── Metric card ────────────────────────────────────────── */
function Metric({ n, t, icon }) {
  return (
    <div className="metric-card">
      {icon && <div className="metric-icon">{icon}</div>}
      <b className="metric-value">{n ?? "—"}</b>
      <small className="metric-label">{t}</small>
    </div>
  );
}

/* ── Empty state ────────────────────────────────────────── */
function EmptyState({ icon, title, desc, action, actionLabel }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action && <button className="btn-primary" onClick={action}>{actionLabel}</button>}
    </div>
  );
}

/* ── Inline comments component ──────────────────────────── */
function InlineComments({ blogId, token, user, canModerate, authorMode = false }) {
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
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [blogId, token]);

  useEffect(() => { load(); }, [load]);

  async function submitComment(e) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true); setLocalError("");
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
      setComments(prev => prev.map(c => c._id === commentId ? { ...c, status } : c));
    } catch (err) {
      console.error(err);
    }
  }

  // Only show approved comments to regular feed viewers
  // In author mode, show all comments for their own blog
  const visibleComments = authorMode
    ? comments
    : comments.filter(c => c.status === "approved");

  return (
    <div className="comments-panel">
      {/* Comment form — shown to readers and authors (not the blog's own author in authorMode) */}
      {token && !authorMode && (
        <form className="comment-form" onSubmit={submitComment}>
          <textarea placeholder="Share your thoughts…" value={newComment}
            onChange={e => setNewComment(e.target.value)} rows="3" />
          {localError && <p className="comment-error">{localError}</p>}
          <div className="comment-form-footer">
            <span className="comment-form-hint">Comments are reviewed before appearing publicly.</span>
            <button type="submit" className="btn-primary btn-sm" disabled={submitting}>
              {submitting ? "Posting…" : "Post Comment"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="comment-loading"><span className="spin" /> Loading comments…</div>
      ) : visibleComments.length === 0 ? (
        <p className="comment-empty">
          {authorMode ? "No comments on this post yet." : "No approved comments yet — be the first!"}
        </p>
      ) : (
        <div className="comment-list">
          {visibleComments.map(c => (
            <div className="comment-item" key={c._id}>
              <div className="comment-avatar">{(c.userName || "U").charAt(0).toUpperCase()}</div>
              <div className="comment-body">
                <div className="comment-meta">
                  <strong>{c.userName || c.user?.name || "User"}</strong>
                  <span className={`comment-badge badge-${c.status || "pending"}`}>{c.status || "pending"}</span>
                  <span className="comment-date">{formatDate(c.createdAt)}</span>
                </div>
                <p className="comment-text">{c.message || c.text || ""}</p>
                {(canModerate || authorMode) && (
                  <div className="comment-actions">
                    {c.status !== "approved" && (
                      <button className="btn-approve" onClick={() => moderate(c._id, "approved")}>✓ Approve</button>
                    )}
                    {c.status !== "spam" && (
                      <button className="btn-spam" onClick={() => moderate(c._id, "spam")}>✗ Spam</button>
                    )}
                    {c.status !== "pending" && (
                      <button className="btn-ghost-sm" onClick={() => moderate(c._id, "pending")}>Pending</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Post list ──────────────────────────────────────────── */
function PostList({ blogs, token, user, reload, canEdit, canDelete, canModerate, onEdit, onDelete, viewMode = "feed" }) {
  const [openComments, setOpenComments] = useState({});
  const [likedBlogs, setLikedBlogs] = useState({});

  function toggleComments(id) {
    setOpenComments(prev => ({ ...prev, [id]: !prev[id] }));
  }

  async function handleLike(blogId) {
    try {
      const res = await api.like(token, blogId);
      setLikedBlogs(prev => ({ ...prev, [blogId]: res?.hasLiked }));
      await reload();
    } catch (err) {
      console.error(err);
    }
  }

  if (!Array.isArray(blogs) || blogs.length === 0) {
    return (
      <EmptyState
        icon={Icons.myblogs}
        title="No posts yet"
        desc="Nothing to show here. Check back soon!"
      />
    );
  }

  return (
    <div className={`post-grid ${viewMode === "myblogs" ? "post-grid-list" : ""}`}>
      {blogs.map(blog => {
        const isLiked = likedBlogs[blog._id] !== undefined
          ? likedBlogs[blog._id]
          : (blog.likedBy || []).map(id => String(id)).includes(String(user?.id || user?._id));
        const isOwner = blog.author?._id === (user?.id || user?._id) || blog.author === (user?.id || user?._id);
        const showEdit = canEdit && (isOwner || ["admin", "editor"].includes(user?.role));
        const showDelete = canDelete && (isOwner || user?.role === "admin");

        return (
          <article className={`post-card status-${statusSlug(blog.status)}`} key={blog._id}>
            {blog.photo && (
              <div className="post-cover">
                <img src={blog.photo} alt={blog.title} loading="lazy" />
              </div>
            )}

            <div className="post-body">
              <div className="post-meta-row">
                <span className={`status-stamp stamp-${statusSlug(blog.status)}`}>
                  {blog.status || "Published"}
                </span>
                <span className="meta-cat">{blog.category || "Uncategorized"}</span>
                {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                  <span className="meta-tags">{blog.tags.slice(0, 2).map(t => `#${t}`).join(" ")}</span>
                )}
              </div>

              <h3 className="post-title">{blog.title || "Untitled"}</h3>

              <p className="post-excerpt">
                {(blog.content || "").slice(0, 180)}
                {(blog.content || "").length > 180 ? "…" : ""}
              </p>

              <div className="post-footer-row">
                <span className="post-author">
                  <span className="post-author-avatar">{(blog.authorName || "A").charAt(0)}</span>
                  {blog.authorName || "Unknown"}
                  <span className="post-date">{formatDate(blog.createdAt)}</span>
                </span>

                <div className="post-actions">
                  <button
                    className={`action-btn like-btn${isLiked ? " liked" : ""}`}
                    onClick={() => handleLike(blog._id)}
                    title={isLiked ? "Unlike" : "Like"}
                  >
                    {isLiked ? Icons.heart : Icons.heartOutline}
                    <span>{blog.likes || 0}</span>
                  </button>

                  <button
                    className={`action-btn comment-btn${openComments[blog._id] ? " open" : ""}`}
                    onClick={() => toggleComments(blog._id)}
                    title="Comments"
                  >
                    {Icons.comment}
                    <span>{openComments[blog._id] ? "Hide" : "Comment"}</span>
                  </button>

                  {showEdit && (
                    <button className="action-btn edit-btn" onClick={() => onEdit(blog)} title="Edit">
                      {Icons.edit}
                    </button>
                  )}
                  {showDelete && (
                    <button className="action-btn delete-btn" onClick={() => onDelete(blog._id)} title="Delete">
                      {Icons.trash}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {openComments[blog._id] && (
              <div className="post-comments-section">
                <InlineComments
                  blogId={blog._id}
                  token={token}
                  user={user}
                  canModerate={canModerate}
                  authorMode={viewMode === "myblogs"}
                />
              </div>
            )}
          </article>
        );
      })}
    </div>
  );
}

/* ── Review panel ───────────────────────────────────────── */
function ReviewPanel({ blogs, token, reload, flash, flashError }) {
  const pending = (blogs || []).filter(b => b.status !== "Published");

  async function publish(blogId) {
    try {
      await api.status(token, blogId, "Published");
      await reload();
      flash("Post published successfully.");
    } catch (err) {
      flashError(err?.message || "Failed to publish.");
    }
  }

  async function reject(blogId) {
    try {
      await api.status(token, blogId, "Draft");
      await reload();
      flash("Post returned to draft.");
    } catch (err) {
      flashError(err?.message || "Failed to reject.");
    }
  }

  if (pending.length === 0) {
    return (
      <EmptyState icon={Icons.review} title="All clear!" desc="No posts are waiting for review." />
    );
  }

  return (
    <div className="review-list">
      {pending.map(blog => (
        <div className="review-row" key={blog._id}>
          <div className="review-info">
            <h4>{blog.title || blog.name || "Untitled"}</h4>
            <div className="review-meta">
              <span className={`status-stamp stamp-${statusSlug(blog.status)}`}>{blog.status}</span>
              <span>by {blog.authorName || "Unknown"}</span>
              <span>{formatDate(blog.createdAt)}</span>
            </div>
            <p className="review-excerpt">{(blog.content || "").slice(0, 120)}…</p>
          </div>
          <div className="review-actions">
            <button className="btn-publish" onClick={() => publish(blog._id)}>Publish</button>
            <button className="btn-ghost" onClick={() => reject(blog._id)}>Reject</button>
          </div>
        </div>
      ))}
    </div>
  );
}
