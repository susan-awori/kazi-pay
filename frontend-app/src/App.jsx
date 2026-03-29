import { useState, useEffect, useCallback } from "react";
import {
  auth,
  jobs,
  worker as workerApi,
  escrow as escrowApi,
  wallet as walletApi,
  notifications as notifApi,
  setTokens,
  clearTokens,
} from "./api";

// ─── Nav links ────────────────────────────────────────────────────────────────
const navLinks = [
  { label: "About", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Trust", href: "#trust" },
  { label: "Contact", href: "#footer" },
];

const sectors = [
  "Plumbers",
  "Electricians",
  "Boda riders",
  "Repair crews",
  "Movers",
  "Home services",
];

const featureCards = [
  {
    icon: "shield",
    title: "Escrow comes first",
    text: "Money is secured at the beginning via M-Pesa STK Push, so the worker never gambles on whether payment will arrive.",
  },
  {
    icon: "layers",
    title: "Job flow stays visible",
    text: "Clients and workers both track status from payment-locked → active work → mark-complete → final payout release.",
  },
  {
    icon: "spark",
    title: "Release stays intentional",
    text: "Funds move only when the client confirms — with dispute resolution available for both sides if something goes wrong.",
  },
];

const trustCards = [
  {
    size: "large",
    eyebrow: "Client confidence",
    title: "You can commit funds without losing control of the outcome.",
    text: "KaziPay separates paying from overpaying. The client locks the amount via M-Pesa, work moves forward, and the final release waits for their confirmation.",
  },
  {
    size: "large",
    eyebrow: "Worker confidence",
    title: "A funded job feels completely different from a verbal promise.",
    text: "Workers accept bids with certainty because escrow is already held — no chasing clients for payment after the job is done.",
  },
  {
    size: "small",
    eyebrow: "Clear states",
    title: "Posted → Funded → Active → Completed.",
    text: "The system always answers where the money is and what happens next. No ambiguity.",
  },
  {
    size: "small",
    eyebrow: "Fast release",
    title: "Completion should feel immediate.",
    text: "Once the client approves, the payout moves straight to the worker's KaziPay wallet — ready to withdraw to M-Pesa.",
  },
  {
    size: "small",
    eyebrow: "USSD & SMS ready",
    title: "Modern without excluding real conditions.",
    text: "The full flow works via USSD (*384*500#) for workers and clients with basic phones or patchy internet.",
  },
];

const footerColumns = [
  {
    title: "Explore",
    links: [
      { label: "About", href: "#about" },
      { label: "Features", href: "#features" },
      { label: "Operations", href: "#showcase" },
      { label: "Trust", href: "#trust" },
    ],
  },
  {
    title: "Platform",
    links: [
      { label: "Escrow-first jobs", href: "#features" },
      { label: "Release reviews", href: "#showcase" },
      { label: "Client approval flow", href: "#trust" },
      { label: "Back to top", href: "#top" },
    ],
  },
];

// ─── Tiny UI primitives ───────────────────────────────────────────────────────
function AuroraBackdrop() {
  return (
    <div aria-hidden="true" className="aurora">
      <div className="aurora__layer aurora__layer--one" />
      <div className="aurora__layer aurora__layer--two" />
      <div className="aurora__layer aurora__layer--three" />
      <div className="aurora__grid" />
      <div className="aurora__veil" />
    </div>
  );
}

function LogoMark() {
  return (
    <a href="#top" className="flex items-center gap-3">
      <div className="brand-chip">
        <span />
      </div>
      <div>
        <p className="text-base font-extrabold tracking-[-0.04em] text-white">
          KaziPay
        </p>
        <p className="text-[11px] font-extralight uppercase tracking-[0.28em] text-white/60">
          Escrow for gig work
        </p>
      </div>
    </a>
  );
}

function LogoMarkDark() {
  return (
    <div className="flex items-center gap-3">
      <div className="brand-chip">
        <span />
      </div>
      <div>
        <p className="text-base font-extrabold tracking-[-0.04em] text-[var(--ink)]">
          KaziPay
        </p>
        <p className="text-[11px] font-extralight uppercase tracking-[0.28em] text-[var(--muted)]">
          Escrow for gig work
        </p>
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M6.5 12.5 10 16l7.5-8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function FeatureIcon({ type }) {
  if (type === "chart") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path d="M4 18.5h16M7 15l3-3 2.5 2.5L17 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        <path d="M7 18.5v-3.5m5.5 3.5v-4m4.5 4V9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      </svg>
    );
  }
  if (type === "shield") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path d="M12 3.5 6 6v5.7c0 4 2.5 7 6 8.8 3.5-1.8 6-4.8 6-8.8V6l-6-2.5Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (type === "layers") {
    return (
      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
        <path d="m12 5 8 4.5L12 14 4 9.5 12 5Zm0 7.5 8 4.5L12 21 4 17l8-4.5Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24">
      <path d="M12 3v6m0 6v6M3 12h6m6 0h6m-3.5-5.5L15 9m-6 6-2.5 2.5m0-11L9 9m6 6 2.5 2.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </svg>
  );
}

function PrimaryButton({ href, onClick, children, secondary = false, type = "button", disabled = false }) {
  const cls = secondary
    ? "glass-button w-full sm:w-auto"
    : "emerald-button w-full sm:w-auto";

  if (href) {
    return <a href={href} className={cls}>{children}</a>;
  }
  return (
    <button type={type} onClick={onClick} className={cls} disabled={disabled}>
      {children}
    </button>
  );
}

function ShowcaseBadge({ tone = "neutral", children }) {
  return <span className={`showcase-badge showcase-badge--${tone}`}>{children}</span>;
}

function StatusBadge({ status }) {
  const map = {
    open: { tone: "positive", label: "Open" },
    in_progress: { tone: "warning", label: "In Progress" },
    completed_by_worker: { tone: "warning", label: "Awaiting Release" },
    completed: { tone: "positive", label: "Completed" },
    cancelled: { tone: "neutral", label: "Cancelled" },
    pending: { tone: "neutral", label: "Pending Payment" },
    held: { tone: "warning", label: "Funds Held" },
    released: { tone: "positive", label: "Released" },
    refunded: { tone: "neutral", label: "Refunded" },
    disputed: { tone: "warning", label: "Disputed" },
  };
  const { tone, label } = map[status] || { tone: "neutral", label: status };
  return <ShowcaseBadge tone={tone}>{label}</ShowcaseBadge>;
}

function Spinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--emerald)] border-t-transparent" />
    </div>
  );
}

function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{msg}</p>
  );
}

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function AuthModal({ defaultTab = "login", onClose, onAuth }) {
  const [tab, setTab] = useState(defaultTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [loginForm, setLoginForm] = useState({ phone_number: "", password: "" });
  const [regForm, setRegForm] = useState({
    username: "",
    email: "",
    phone_number: "",
    password1: "",
    password2: "",
    role: "client",
    national_id: "",
  });

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await auth.login(loginForm);
      setTokens(data.access, data.refresh);
      localStorage.setItem("kazi_user", JSON.stringify(data.user));
      onAuth(data.user, data.access, data.refresh);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = { ...regForm };
      if (!payload.national_id) delete payload.national_id;
      const data = await auth.register(payload);
      setTokens(data.access, data.refresh);
      localStorage.setItem("kazi_user", JSON.stringify(data.user));
      onAuth(data.user, data.access, data.refresh);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex border-b border-gray-100">
          {["login", "register"].map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); }}
              className={`flex-1 py-4 text-sm font-medium capitalize transition ${
                tab === t
                  ? "text-[var(--emerald)] border-b-2 border-[var(--emerald)]"
                  : "text-[var(--muted)]"
              }`}
            >
              {t === "login" ? "Log In" : "Register"}
            </button>
          ))}
          <button
            onClick={onClose}
            className="px-5 text-[var(--muted)] hover:text-[var(--ink)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {tab === "login" ? (
            <form onSubmit={handleLogin} className="grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                  Phone number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 254712345678"
                  value={loginForm.phone_number}
                  onChange={(e) => setLoginForm({ ...loginForm, phone_number: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                  Password
                </label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                />
              </div>
              <ErrorMsg msg={error} />
              <button
                type="submit"
                disabled={loading}
                className="emerald-button w-full justify-center"
              >
                {loading ? "Logging in…" : "Log In"}
              </button>
              <p className="text-center text-sm text-[var(--muted)]">
                No account?{" "}
                <button type="button" onClick={() => { setTab("register"); setError(""); }} className="text-[var(--emerald)] font-medium">
                  Register
                </button>
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Username</label>
                  <input
                    type="text"
                    value={regForm.username}
                    onChange={(e) => setRegForm({ ...regForm, username: e.target.value })}
                    required
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Role</label>
                  <select
                    value={regForm.role}
                    onChange={(e) => setRegForm({ ...regForm, role: e.target.value })}
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                  >
                    <option value="client">Client (hire)</option>
                    <option value="worker">Worker (earn)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Email</label>
                <input
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Phone number</label>
                <input
                  type="tel"
                  placeholder="e.g. 254712345678"
                  value={regForm.phone_number}
                  onChange={(e) => setRegForm({ ...regForm, phone_number: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Password</label>
                <input
                  type="password"
                  value={regForm.password1}
                  onChange={(e) => setRegForm({ ...regForm, password1: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Confirm Password</label>
                <input
                  type="password"
                  value={regForm.password2}
                  onChange={(e) => setRegForm({ ...regForm, password2: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">
                  National ID <span className="text-[var(--muted)]">(optional)</span>
                </label>
                <input
                  type="text"
                  value={regForm.national_id}
                  onChange={(e) => setRegForm({ ...regForm, national_id: e.target.value })}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                />
              </div>
              <ErrorMsg msg={error} />
              <button
                type="submit"
                disabled={loading}
                className="emerald-button w-full justify-center"
              >
                {loading ? "Creating account…" : "Create Account"}
              </button>
              <p className="text-center text-sm text-[var(--muted)]">
                Already have an account?{" "}
                <button type="button" onClick={() => { setTab("login"); setError(""); }} className="text-[var(--emerald)] font-medium">
                  Log In
                </button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Notification Bell ────────────────────────────────────────────────────────
function NotificationBell() {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    notifApi.list().then(setNotifs).catch(() => {});
  }, []);

  const unread = notifs.filter((n) => !n.is_read).length;

  async function markRead(id) {
    await notifApi.markRead(id).catch(() => {});
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-[var(--muted)] hover:text-[var(--ink)]"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--emerald)] text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-gray-100 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-[var(--ink)]">Notifications</p>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifs.length === 0 ? (
              <p className="p-4 text-sm text-[var(--muted)]">No notifications yet.</p>
            ) : (
              notifs.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markRead(n.id)}
                  className={`cursor-pointer border-b border-gray-50 px-4 py-3 text-sm transition hover:bg-gray-50 ${
                    !n.is_read ? "bg-green-50" : ""
                  }`}
                >
                  <p className="text-[var(--ink)]">{n.message}</p>
                  <p className="mt-0.5 text-xs text-[var(--muted)]">
                    {new Date(n.created_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dashboard Nav ────────────────────────────────────────────────────────────
function DashboardNav({ user, onLogout }) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between py-4">
        <LogoMarkDark />
        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-[var(--muted)] sm:block">
            {user.username} ·{" "}
            <span className="capitalize text-[var(--emerald)]">{user.role}</span>
          </span>
          <NotificationBell />
          <button
            onClick={onLogout}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Log out
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Client Dashboard ─────────────────────────────────────────────────────────
function ClientDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("jobs");
  const [jobList, setJobList] = useState([]);
  const [escrows, setEscrows] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingEscrows, setLoadingEscrows] = useState(false);

  const [newJob, setNewJob] = useState({ title: "", description: "", price: "" });
  const [postingJob, setPostingJob] = useState(false);
  const [jobError, setJobError] = useState("");

  const [expandedJob, setExpandedJob] = useState(null);
  const [acceptingBid, setAcceptingBid] = useState(null);
  const [actionError, setActionError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const [disputeId, setDisputeId] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const data = await jobs.list();
      setJobList(Array.isArray(data) ? data : data.results || []);
    } catch {
      // ignore
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  const fetchEscrows = useCallback(async () => {
    setLoadingEscrows(true);
    try {
      const data = await escrowApi.list();
      setEscrows(Array.isArray(data) ? data : data.results || []);
    } catch {
      // ignore
    } finally {
      setLoadingEscrows(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (tab === "escrow") fetchEscrows();
  }, [tab, fetchEscrows]);

  async function handlePostJob(e) {
    e.preventDefault();
    setJobError("");
    setPostingJob(true);
    try {
      await jobs.create(newJob);
      setNewJob({ title: "", description: "", price: "" });
      await fetchJobs();
      setTab("jobs");
    } catch (err) {
      setJobError(err.message);
    } finally {
      setPostingJob(false);
    }
  }

  async function handleAcceptBid(jobId, bidId) {
    setAcceptingBid(bidId);
    setActionError("");
    setActionMsg("");
    try {
      await jobs.acceptBid(jobId, bidId);
      setActionMsg("Bid accepted! Escrow initiated — check your M-Pesa for STK Push.");
      await fetchJobs();
      setExpandedJob(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setAcceptingBid(null);
    }
  }

  async function handleRelease(escrowId) {
    setActionError("");
    setActionMsg("");
    try {
      await escrowApi.release(escrowId);
      setActionMsg("Funds released to worker successfully.");
      await fetchEscrows();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleDispute(e) {
    e.preventDefault();
    setActionError("");
    setActionMsg("");
    try {
      await escrowApi.dispute(disputeId, disputeReason);
      setActionMsg("Dispute raised. Admin will contact both parties.");
      setDisputeId(null);
      setDisputeReason("");
      await fetchEscrows();
    } catch (err) {
      setActionError(err.message);
    }
  }

  const tabs = [
    { id: "jobs", label: "My Jobs" },
    { id: "post", label: "Post a Job" },
    { id: "escrow", label: "Escrow" },
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <DashboardNav user={user} onLogout={onLogout} />

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-[-0.04em] text-[var(--ink)]">
            Welcome, {user.username}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Post jobs, review bids, and manage escrow.</p>
        </div>

        {(actionMsg || actionError) && (
          <div className={`mb-6 rounded-xl px-5 py-4 text-sm ${actionMsg ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
            {actionMsg || actionError}
            <button
              onClick={() => { setActionMsg(""); setActionError(""); }}
              className="ml-3 font-medium underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 rounded-xl bg-white p-1 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-[var(--emerald)] text-white shadow"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* My Jobs */}
        {tab === "jobs" && (
          <div className="grid gap-4">
            {loadingJobs ? (
              <Spinner />
            ) : jobList.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <p className="text-[var(--muted)]">No jobs yet.</p>
                <button
                  onClick={() => setTab("post")}
                  className="emerald-button mt-4"
                >
                  Post your first job
                </button>
              </div>
            ) : (
              jobList.map((job) => (
                <article key={job.id} className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-[var(--ink)]">{job.title}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{job.description}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--emerald)]">
                        KES {job.price}
                      </span>
                      <StatusBadge status={job.status} />
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--muted)]">
                    <span>{job.bid_count || 0} bid(s)</span>
                    {job.assigned_worker_name && (
                      <span>Worker: <strong className="text-[var(--ink)]">{job.assigned_worker_name}</strong></span>
                    )}
                    {job.status === "open" && job.bid_count > 0 && (
                      <button
                        onClick={() =>
                          setExpandedJob(expandedJob === job.id ? null : job.id)
                        }
                        className="ml-auto rounded-full border border-[var(--emerald)] px-4 py-1.5 text-xs font-medium text-[var(--emerald)] hover:bg-green-50"
                      >
                        {expandedJob === job.id ? "Hide bids" : "View bids"}
                      </button>
                    )}
                  </div>

                  {expandedJob === job.id && job.bids && job.bids.length > 0 && (
                    <div className="mt-5 grid gap-3 border-t border-gray-100 pt-5">
                      {job.bids.map((bid) => (
                        <div key={bid.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-gray-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-[var(--ink)]">
                              {bid.worker_name}
                            </p>
                            <p className="mt-0.5 text-xs text-[var(--muted)]">{bid.proposal}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-[var(--emerald)]">
                              KES {bid.amount}
                            </span>
                            {!bid.is_accepted && (
                              <button
                                onClick={() => handleAcceptBid(job.id, bid.id)}
                                disabled={acceptingBid === bid.id}
                                className="rounded-full bg-[var(--emerald)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--emerald-deep)] disabled:opacity-60"
                              >
                                {acceptingBid === bid.id ? "Accepting…" : "Accept"}
                              </button>
                            )}
                            {bid.is_accepted && (
                              <span className="rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                                Accepted
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        )}

        {/* Post a Job */}
        {tab === "post" && (
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-lg font-bold tracking-[-0.03em] text-[var(--ink)]">
              Post a New Job
            </h2>
            <form onSubmit={handlePostJob} className="grid gap-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Job title</label>
                <input
                  type="text"
                  placeholder="e.g. Fix leaking kitchen pipe"
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Description</label>
                <textarea
                  rows={4}
                  placeholder="Describe the job in detail…"
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  required
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Budget (KES)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={newJob.price}
                  onChange={(e) => setNewJob({ ...newJob, price: e.target.value })}
                  required
                  min="1"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                />
              </div>
              <ErrorMsg msg={jobError} />
              <button
                type="submit"
                disabled={postingJob}
                className="emerald-button w-full justify-center"
              >
                {postingJob ? "Posting…" : "Post Job"}
              </button>
            </form>
          </div>
        )}

        {/* Escrow */}
        {tab === "escrow" && (
          <div className="grid gap-4">
            {loadingEscrows ? (
              <Spinner />
            ) : escrows.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <p className="text-[var(--muted)]">No escrow transactions yet. Accept a bid to initiate one.</p>
              </div>
            ) : (
              escrows.map((esc) => (
                <article key={esc.id} className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-[var(--ink)]">{esc.job_title}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Worker: {esc.worker_name} · Ref: {esc.transaction_ref || "Pending payment"}
                      </p>
                    </div>
                    <StatusBadge status={esc.status} />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-4 rounded-xl bg-gray-50 px-5 py-4 text-sm">
                    <div>
                      <p className="text-xs text-[var(--muted)]">Total</p>
                      <p className="font-semibold text-[var(--ink)]">KES {esc.total_amount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--muted)]">Platform fee</p>
                      <p className="font-semibold text-[var(--ink)]">KES {esc.platform_fee}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--muted)]">Worker payout</p>
                      <p className="font-semibold text-[var(--emerald)]">KES {esc.worker_payout}</p>
                    </div>
                  </div>

                  {(esc.status === "held" || esc.status === "completed_by_worker") && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => handleRelease(esc.id)}
                        className="rounded-full bg-[var(--emerald)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--emerald-deep)]"
                      >
                        Release Funds
                      </button>
                      <button
                        onClick={() => setDisputeId(esc.id)}
                        className="rounded-full border border-red-200 px-5 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        Raise Dispute
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}

            {/* Dispute modal */}
            {disputeId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60" onClick={() => setDisputeId(null)} />
                <form
                  onSubmit={handleDispute}
                  className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                >
                  <h3 className="mb-4 text-lg font-bold text-[var(--ink)]">Raise a Dispute</h3>
                  <textarea
                    rows={4}
                    placeholder="Describe the issue…"
                    value={disputeReason}
                    onChange={(e) => setDisputeReason(e.target.value)}
                    required
                    className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                  />
                  <div className="mt-4 flex gap-3">
                    <button type="submit" className="emerald-button flex-1 justify-center">
                      Submit Dispute
                    </button>
                    <button
                      type="button"
                      onClick={() => setDisputeId(null)}
                      className="glass-button flex-1 justify-center"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Worker Dashboard ─────────────────────────────────────────────────────────
function WorkerDashboard({ user, onLogout }) {
  const [tab, setTab] = useState("browse");
  const [openJobs, setOpenJobs] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [bidForm, setBidForm] = useState({ jobId: null, amount: "", proposal: "" });
  const [placingBid, setPlacingBid] = useState(false);
  const [bidError, setBidError] = useState("");

  const [withdrawAmt, setWithdrawAmt] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");

  const fetchOpenJobs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await workerApi.browseJobs();
      setOpenJobs(Array.isArray(data) ? data : data.results || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyBids = useCallback(async () => {
    setLoading(true);
    try {
      const data = await workerApi.myBids();
      setMyBids(Array.isArray(data) ? data : data.results || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    try {
      const data = await walletApi.get();
      const list = Array.isArray(data) ? data : data.results || [data];
      setWalletData(list[0] || null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "browse") fetchOpenJobs();
    else if (tab === "bids") fetchMyBids();
    else if (tab === "wallet") fetchWallet();
  }, [tab, fetchOpenJobs, fetchMyBids, fetchWallet]);

  async function handlePlaceBid(e) {
    e.preventDefault();
    setBidError("");
    setPlacingBid(true);
    try {
      await workerApi.placeBid({
        job: bidForm.jobId,
        amount: bidForm.amount,
        proposal: bidForm.proposal,
      });
      setActionMsg("Bid placed successfully!");
      setBidForm({ jobId: null, amount: "", proposal: "" });
      await fetchOpenJobs();
    } catch (err) {
      setBidError(err.message);
    } finally {
      setPlacingBid(false);
    }
  }

  async function handleMarkComplete(bidId) {
    setActionError("");
    setActionMsg("");
    try {
      await workerApi.markComplete(bidId);
      setActionMsg("Job marked as complete. Waiting for client to release funds.");
      await fetchMyBids();
    } catch (err) {
      setActionError(err.message);
    }
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    setActionError("");
    setActionMsg("");
    setWithdrawing(true);
    try {
      await walletApi.withdraw(withdrawAmt);
      setActionMsg(`Withdrawal of KES ${withdrawAmt} initiated to your M-Pesa.`);
      setWithdrawAmt("");
      await fetchWallet();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setWithdrawing(false);
    }
  }

  const tabs = [
    { id: "browse", label: "Browse Jobs" },
    { id: "bids", label: "My Bids" },
    { id: "wallet", label: "Wallet" },
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)]">
      <DashboardNav user={user} onLogout={onLogout} />

      <div className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-[-0.04em] text-[var(--ink)]">
            Welcome, {user.username}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Find jobs, place bids, and manage your earnings.</p>
        </div>

        {(actionMsg || actionError) && (
          <div className={`mb-6 rounded-xl px-5 py-4 text-sm ${actionMsg ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
            {actionMsg || actionError}
            <button
              onClick={() => { setActionMsg(""); setActionError(""); }}
              className="ml-3 font-medium underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 rounded-xl bg-white p-1 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition ${
                tab === t.id
                  ? "bg-[var(--emerald)] text-white shadow"
                  : "text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Browse Jobs */}
        {tab === "browse" && (
          <div className="grid gap-4">
            {loading ? (
              <Spinner />
            ) : openJobs.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <p className="text-[var(--muted)]">No open jobs right now. Check back soon.</p>
              </div>
            ) : (
              openJobs.map((job) => (
                <article key={job.id} className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-[var(--ink)]">{job.title}</h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{job.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--emerald)]">
                        KES {job.price}
                      </span>
                      <StatusBadge status={job.status} />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-[var(--muted)]">
                      Client: {job.client} · {job.bid_count || 0} bid(s)
                    </span>
                    {bidForm.jobId !== job.id && (
                      <button
                        onClick={() => setBidForm({ jobId: job.id, amount: "", proposal: "" })}
                        className="rounded-full border border-[var(--emerald)] px-4 py-1.5 text-xs font-medium text-[var(--emerald)] hover:bg-green-50"
                      >
                        Place Bid
                      </button>
                    )}
                  </div>

                  {bidForm.jobId === job.id && (
                    <form
                      onSubmit={handlePlaceBid}
                      className="mt-5 grid gap-4 border-t border-gray-100 pt-5"
                    >
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Your bid (KES)</label>
                          <input
                            type="number"
                            min="1"
                            value={bidForm.amount}
                            onChange={(e) => setBidForm({ ...bidForm, amount: e.target.value })}
                            required
                            className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-[var(--ink)]">Proposal</label>
                        <textarea
                          rows={3}
                          value={bidForm.proposal}
                          onChange={(e) => setBidForm({ ...bidForm, proposal: e.target.value })}
                          required
                          placeholder="Why are you the right person for this job?"
                          className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                        />
                      </div>
                      <ErrorMsg msg={bidError} />
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={placingBid}
                          className="emerald-button"
                        >
                          {placingBid ? "Submitting…" : "Submit Bid"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setBidForm({ jobId: null, amount: "", proposal: "" })}
                          className="glass-button"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </article>
              ))
            )}
          </div>
        )}

        {/* My Bids */}
        {tab === "bids" && (
          <div className="grid gap-4">
            {loading ? (
              <Spinner />
            ) : myBids.length === 0 ? (
              <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                <p className="text-[var(--muted)]">You haven't placed any bids yet.</p>
                <button onClick={() => setTab("browse")} className="emerald-button mt-4">
                  Browse open jobs
                </button>
              </div>
            ) : (
              myBids.map((bid) => (
                <article key={bid.id} className="rounded-2xl bg-white p-6 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-[var(--ink)]">
                        Job #{bid.job}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--muted)]">{bid.proposal}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--emerald)]">
                        KES {bid.amount}
                      </span>
                      <ShowcaseBadge tone={bid.is_accepted ? "positive" : "neutral"}>
                        {bid.is_accepted ? "Accepted" : "Pending"}
                      </ShowcaseBadge>
                    </div>
                  </div>

                  {bid.is_accepted && (
                    <div className="mt-4">
                      <button
                        onClick={() => handleMarkComplete(bid.id)}
                        className="rounded-full bg-[var(--emerald)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--emerald-deep)]"
                      >
                        Mark Job Complete
                      </button>
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        )}

        {/* Wallet */}
        {tab === "wallet" && (
          <div className="grid gap-6">
            {loading ? (
              <Spinner />
            ) : (
              <>
                <div className="rounded-2xl bg-[var(--emerald)] p-8 text-white shadow-sm">
                  <p className="text-sm font-medium text-white/80">Wallet Balance</p>
                  <p className="mt-2 text-4xl font-extrabold tracking-[-0.04em]">
                    KES {walletData?.balance ?? "0.00"}
                  </p>
                  <p className="mt-1 text-xs text-white/60">
                    Last updated:{" "}
                    {walletData?.last_updated
                      ? new Date(walletData.last_updated).toLocaleString()
                      : "—"}
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold text-[var(--ink)]">Withdraw to M-Pesa</h3>
                  <form onSubmit={handleWithdraw} className="flex gap-3">
                    <input
                      type="number"
                      min="1"
                      placeholder="Amount (KES)"
                      value={withdrawAmt}
                      onChange={(e) => setWithdrawAmt(e.target.value)}
                      required
                      className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[var(--emerald)]"
                    />
                    <button
                      type="submit"
                      disabled={withdrawing}
                      className="emerald-button shrink-0"
                    >
                      {withdrawing ? "Processing…" : "Withdraw"}
                    </button>
                  </form>
                </div>

                {walletData?.transactions && walletData.transactions.length > 0 && (
                  <div className="rounded-2xl bg-white p-6 shadow-sm">
                    <h3 className="mb-4 font-semibold text-[var(--ink)]">Transaction History</h3>
                    <div className="grid gap-3">
                      {walletData.transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-[var(--ink)]">{tx.description}</p>
                            <p className="mt-0.5 text-xs text-[var(--muted)]">
                              {tx.transaction_type} · {new Date(tx.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`text-sm font-semibold ${
                              tx.transaction_type === "withdrawal"
                                ? "text-red-600"
                                : "text-[var(--emerald)]"
                            }`}
                          >
                            {tx.transaction_type === "withdrawal" ? "−" : "+"}KES {tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Landing Page ─────────────────────────────────────────────────────────────
function LandingPage({ onLoginClick, onGetStartedClick }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div id="top" className="min-h-screen bg-white text-[var(--ink)]">
      <section className="hero-shell">
        <AuroraBackdrop />

        <header className="relative z-20 px-4 pt-5 sm:px-6 sm:pt-8 lg:px-8">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 rounded-[1.4rem] border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl sm:rounded-full sm:px-6 sm:py-3.5">
            <LogoMark />

            <nav className="hidden items-center gap-8 lg:flex">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="text-sm font-extralight text-white/70 transition hover:text-white">
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <button onClick={onLoginClick} className="glass-button">Log in</button>
              <button onClick={onGetStartedClick} className="emerald-button">Get Started</button>
            </div>

            <button
              type="button"
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-white lg:hidden"
              onClick={() => setMenuOpen((c) => !c)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              Menu
            </button>
          </div>

          {menuOpen && (
            <div className="mx-auto mt-3 grid max-w-[1280px] gap-3 rounded-[1.5rem] border border-white/10 bg-[rgba(5,13,10,0.82)] p-4 backdrop-blur-xl lg:hidden">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className="rounded-full border border-white/10 px-4 py-3 text-sm font-medium text-white/80">
                  {link.label}
                </a>
              ))}
              <div className="mt-1 grid gap-3 pt-2">
                <button onClick={onGetStartedClick} className="emerald-button w-full">Get Started</button>
                <button onClick={onLoginClick} className="glass-button w-full">Log In</button>
              </div>
            </div>
          )}
        </header>

        <div className="relative z-20 mx-auto flex min-h-[560px] max-w-[940px] flex-col items-center justify-center px-4 pb-16 pt-20 text-center sm:px-6 sm:pb-20 sm:pt-24 lg:min-h-[700px] lg:pb-24 lg:pt-28">
          <span className="hero-pill reveal" style={{ "--delay": "0.05s" }}>
            M-Pesa escrow · Sandbox live · Shortcode 174379
          </span>

          <h1
            className="reveal mt-6 text-[clamp(2.7rem,10vw,6rem)] font-extrabold leading-[0.95] tracking-[-0.07em] text-white sm:mt-7"
            style={{ "--delay": "0.12s" }}
          >
            Secure the money before
            <br />
            the work begins.
          </h1>

          <p
            className="reveal mt-6 max-w-[660px] text-[0.98rem] font-light leading-7 text-white/90 sm:mt-7 sm:text-lg sm:leading-8"
            style={{ "--delay": "0.2s" }}
          >
            KaziPay locks funds in escrow via M-Pesa STK Push before work starts.
            Workers bid on jobs, clients approve releases, and disputes get resolved fairly — all from the web or USSD.
          </p>

          <div
            className="reveal mt-10 flex w-full max-w-[420px] flex-col gap-4 sm:mt-11 sm:max-w-none sm:flex-row sm:justify-center"
            style={{ "--delay": "0.28s" }}
          >
            <button onClick={onGetStartedClick} className="emerald-button w-full sm:w-auto">
              Get Started Free
            </button>
            <a href="#trust" className="glass-button w-full sm:w-auto">
              See why it works
            </a>
          </div>

          <div
            className="reveal mt-10 flex flex-wrap items-center justify-center gap-x-5 gap-y-4 sm:mt-12 sm:gap-x-8"
            style={{ "--delay": "0.36s" }}
          >
            {[
              "STK Push escrow",
              "Bidding system",
              "Dispute resolution",
              "B2C payouts",
              "USSD *384*500#",
            ].map((point) => (
              <div key={point} className="inline-flex items-center gap-2 text-sm text-white/85">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-white/10 text-[var(--emerald)]">
                  <CheckIcon />
                </span>
                <span className="font-extralight">{point}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-20 border-t border-white/10 px-6 pb-12">
          <div className="mx-auto max-w-[1021px] pt-10 text-center">
            <p className="text-sm font-extralight text-white/80">
              Built for the way real jobs already move across Kenya
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {sectors.map((sector) => (
                <span key={sector} className="sector-pill">{sector}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="max-w-[695px]">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[var(--emerald)]">
              About KaziPay
            </p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.06em] text-[var(--ink)]">
              A calmer way to handle trust in Kenya&apos;s gig economy.
            </h2>
            <p className="mt-6 max-w-[695px] text-base font-extralight leading-8 text-[var(--muted)]">
              KaziPay is designed for the tension that sits between hiring and paying.
              Clients post jobs with a budget, workers bid and get accepted, M-Pesa STK Push
              locks the funds into escrow, and the payout only releases when both sides confirm the work is done.
            </p>
          </div>

          <div id="features" className="mt-14 grid gap-6 sm:mt-16 lg:grid-cols-3">
            {featureCards.map((card, index) => (
              <article
                key={card.title}
                className="feature-card-light reveal"
                style={{ "--delay": `${0.08 * (index + 1)}s` }}
              >
                <div className="feature-icon">
                  <FeatureIcon type={card.icon} />
                </div>
                <div className="mt-10 sm:mt-16">
                  <h3 className="text-[1.38rem] font-bold tracking-[-0.04em] text-[var(--ink)] sm:text-[1.55rem]">
                    {card.title}
                  </h3>
                  <p className="mt-4 text-sm font-extralight leading-8 text-[var(--muted)]">
                    {card.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section id="showcase" className="bg-white px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[var(--emerald)]">
              How it works
            </p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,4.4rem)] font-extrabold leading-[1.02] tracking-[-0.06em] text-[var(--ink)]">
              From job post to payout in four steps.
            </h2>
            <p className="mt-6 text-base font-extralight leading-8 text-[var(--muted)]">
              The entire flow — job posting, bidding, escrow lock, and payout release — runs over the KaziPay API backed by Safaricom Daraja.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:mt-16 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Client posts a job", desc: "Title, description, and a budget. Visible to all workers on the platform." },
              { step: "02", title: "Workers bid", desc: "Interested workers submit their rate and a proposal. Client reviews and accepts the best fit." },
              { step: "03", title: "M-Pesa escrow locked", desc: "Client gets an STK Push. Entering their PIN locks funds in escrow — work can begin." },
              { step: "04", title: "Worker paid on completion", desc: "Worker marks complete, client releases. Funds land in the worker's KaziPay wallet for M-Pesa withdrawal." },
            ].map((item) => (
              <article key={item.step} className="feature-card-light reveal" style={{ "--delay": "0.08s" }}>
                <span className="text-4xl font-extrabold tracking-[-0.06em] text-[var(--emerald)] opacity-40">
                  {item.step}
                </span>
                <div className="mt-6">
                  <h3 className="text-[1.2rem] font-bold tracking-[-0.04em] text-[var(--ink)]">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm font-extralight leading-7 text-[var(--muted)]">
                    {item.desc}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="bg-[var(--paper)] px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="mx-auto max-w-[695px] text-center">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-[var(--emerald)]">
              Trust signals
            </p>
            <h2 className="mt-5 text-[clamp(2.4rem,5vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.06em] text-[var(--ink)]">
              What the product makes obvious at a glance.
            </h2>
            <p className="mt-6 text-base font-extralight leading-8 text-[var(--muted)]">
              The experience immediately answers the questions that matter most to both sides: Is the money real? Who is in control? What happens next?
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:mt-16 lg:grid-cols-6">
            {trustCards.map((card, index) => (
              <article
                key={card.title}
                className={`trust-card reveal ${card.size === "large" ? "lg:col-span-3" : "lg:col-span-2"}`}
                style={{ "--delay": `${0.08 * (index + 1)}s` }}
              >
                <p className="text-sm font-medium tracking-[-0.02em] text-black/35">{card.eyebrow}</p>
                <div className="mt-10 sm:mt-12">
                  <h3 className="max-w-[560px] text-[1.6rem] font-bold leading-[1.12] tracking-[-0.04em] text-[var(--ink)]">
                    {card.title}
                  </h3>
                  <p className="mt-4 max-w-[560px] text-sm font-extralight leading-8 text-[var(--muted)]">
                    {card.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="footer-shell px-4 pt-20 sm:px-6 sm:pt-24 lg:px-8">
        <div aria-hidden="true" className="footer-backdrop" />

        <div className="relative z-10 mx-auto max-w-[1280px]">
          <div className="footer-cta mx-auto max-w-[910px] text-center">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/70">
              Ready to launch safer jobs?
            </p>
            <h2 className="mt-5 text-[clamp(2.8rem,6vw,5.6rem)] font-extrabold leading-[0.96] tracking-[-0.07em] text-white">
              Fund the work first.
              <br />
              Release it with confidence.
            </h2>
            <p className="mx-auto mt-6 max-w-[660px] text-base font-light leading-8 text-white">
              KaziPay keeps clients and workers aligned with upfront M-Pesa escrow,
              clean status tracking, and a release flow that feels fair to both sides.
            </p>

            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <button onClick={onGetStartedClick} className="emerald-button w-full sm:w-auto">
                Get Started
              </button>
              <a href="#about" className="glass-button w-full sm:w-auto">
                Learn more
              </a>
            </div>
          </div>

          <div className="footer-divider mt-16 sm:mt-20" />

          <div className="grid gap-10 py-12 sm:gap-14 sm:py-14 md:grid-cols-2 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)_minmax(0,0.85fr)]">
            <div className="max-w-[320px] md:col-span-2 lg:col-span-1">
              <LogoMark />
              <p className="mt-5 text-sm font-light leading-7 text-white/90">
                Escrow-first M-Pesa payments for real work across Kenya&apos;s everyday service economy.
              </p>
            </div>

            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="footer-link-title">{column.title}</p>
                <div className="mt-5 grid gap-4">
                  {column.links.map((link) => (
                    <a key={link.label} href={link.href} className="footer-link">
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="footer-divider" />

          <div className="flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-light text-white/90">
              2026 KaziPay. Escrow-first payments for real work.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {["in", "ig", "tg"].map((s) => (
                <span key={s} className="footer-social-pill">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [authUser, setAuthUser] = useState(() => {
    try {
      const stored = localStorage.getItem("kazi_user");
      const access = localStorage.getItem("kazi_access");
      return stored && access ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [modalTab, setModalTab] = useState(null); // null = closed, "login" | "register"

  function handleAuth(user) {
    setAuthUser(user);
    setModalTab(null);
  }

  function handleLogout() {
    auth.logout().catch(() => {});
    clearTokens();
    localStorage.removeItem("kazi_user");
    setAuthUser(null);
  }

  if (authUser?.role === "client") {
    return <ClientDashboard user={authUser} onLogout={handleLogout} />;
  }

  if (authUser?.role === "worker") {
    return <WorkerDashboard user={authUser} onLogout={handleLogout} />;
  }

  return (
    <>
      <LandingPage
        onLoginClick={() => setModalTab("login")}
        onGetStartedClick={() => setModalTab("register")}
      />
      {modalTab && (
        <AuthModal
          defaultTab={modalTab}
          onClose={() => setModalTab(null)}
          onAuth={handleAuth}
        />
      )}
    </>
  );
}
