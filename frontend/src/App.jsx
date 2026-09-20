import { useEffect, useState } from "react";
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

  async function savePost(event) {
    event.preventDefault();
    clearMessages();

    try {
      const tags = form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);

      await api.create(token, {
        ...form,
        tags,
      });

      setForm(initialForm);
      await loadBlogs(token);
      flash("Post saved successfully.");
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
      <div className="auth">
        <div className="authbox">
          <div className="brand">BN</div>
          <p className="eyebrow">AI CONTENT MANAGEMENT SYSTEM</p>
          <h1>
            BlogNest <span>AI</span>
          </h1>
          <p>Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="auth">
        <div className="authbox">
          <div className="brand">BN</div>
          <p className="eyebrow">AI CONTENT MANAGEMENT SYSTEM</p>

          <h1>
            BlogNest <span>AI</span>
          </h1>

          <p>
            Secure blogging with roles, workflows,
            search and Gemini AI.
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

  const nav = ["home", "search", "comments", "ai"];

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
          BN <b>BlogNest AI</b>
        </div>

        <div>
          {user.name} · {user.role}

          <button
            type="button"
            className="ghost"
            onClick={logout}
          >
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
                <p className="eyebrow">
                  {user.role.toUpperCase()} WORKSPACE
                </p>

                <h2>
                  Publish with <span>purpose.</span>
                </h2>

                <p>
                  Blog lifecycle, search, moderation,
                  analytics and AI in one CMS.
                </p>
              </div>

              <div className="cards">
                <Metric n={blogs.length} t="Visible posts" />
                <Metric
                  n={stats?.publishedPosts ?? "—"}
                  t="Published"
                />
                <Metric
                  n={stats?.comments ?? "—"}
                  t="Comments"
                />
                <Metric
                  n={stats?.totalViews ?? "—"}
                  t="Views"
                />
              </div>

              <PostList
                blogs={blogs}
                token={token}
                reload={() => loadBlogs(token)}
              />
            </>
          )}

          {tab === "create" && (
            <section className="panel">
              <h2>Create / Draft Post</h2>

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

                <button type="submit" className="primary">
                  Save Post
                </button>
              </form>
            </section>
          )}

          {tab === "search" && (
            <section className="panel">
              <h2>Advanced Search</h2>

              <div className="row">
                <input
                  placeholder="Keyword"
                  value={q}
                  onChange={(event) => setQ(event.target.value)}
                />

                <select
                  value={cat}
                  onChange={(event) => setCat(event.target.value)}
                >
                  <option value="">All categories</option>

                  {categories.map((category) => (
                    <option
                      key={category._id}
                      value={category.name}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="secondary"
                onClick={searchBlogs}
              >
                Search
              </button>

              <PostList
                blogs={blogs}
                token={token}
                reload={() => loadBlogs(token)}
              />
            </section>
          )}

          {tab === "ai" && (
            <section className="grid">
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

                <hr />

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
                  <p key={category._id}>
                    {category.name}
                  </p>
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

function Metric({ n, t }) {
  return (
    <div className="metric">
      <b>{n}</b>
      <small>{t}</small>
    </div>
  );
}

function PostList({ blogs, token, reload }) {
  if (!Array.isArray(blogs) || blogs.length === 0) {
    return (
      <div className="posts">
        <div className="panel">
          <p>No blog posts available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="posts">
      {blogs.map((blog) => (
        <article className="post" key={blog._id}>
          <small>
            {blog.status || "Published"} ·{" "}
            {blog.category || "Uncategorized"} ·{" "}
            {Array.isArray(blog.tags)
              ? blog.tags.join(", ")
              : ""}
          </small>

          <h3>{blog.title || blog.name || "Untitled"}</h3>

          <p>{blog.content || blog.message || ""}</p>

          <footer>
            <span>
              {blog.authorName || "Unknown author"}
            </span>

            <button
              type="button"
              onClick={async () => {
                try {
                  await api.like(token, blog._id);
                  await reload();
                } catch (err) {
                  console.error("Like failed:", err);
                }
              }}
            >
              ♥ {blog.likes || 0}
            </button>
          </footer>
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
              {blog.status} · {blog.authorName || "Unknown"}
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
        <div className="panel">
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
                <div className="panel">
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
