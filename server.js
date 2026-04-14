import { randomUUID } from "crypto";
import express, { Router, static as staticMiddleware, urlencoded } from "express";
import { join } from "path";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 3000;
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const sessions = new Map();
const SESSION_COOKIE = "ucaat_session";
const publicDir = join(__dirname, "public");

// Admin routes

const adminRouter = Router();

adminRouter.use(requireAuth);

adminRouter.get("/", (_, res) => {
  res.sendFile(join(publicDir, "admin.html"));
});

adminRouter.get("/session", (req, res) => {
  res.json({
    authenticated: true,
    username: req.session.username,
    createdAt: req.session.createdAt,
  });
});

// App routes

app.use(staticMiddleware(publicDir));
app.use(urlencoded({ extended: false }));

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "password") {
    const sid = createSession(username);
    res.setHeader(
      "Set-Cookie",
      `${SESSION_COOKIE}=${encodeURIComponent(sid)}; HttpOnly; Path=/; SameSite=Lax`
    );
    return res.redirect("/admin");
  }

  res.redirect("/?error=invalid");
});

app.post("/logout", (req, res) => {
  destroySession(req);
  res.setHeader(
    "Set-Cookie",
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
  );
  res.redirect("/?logged_out=1");
});

app.use("/admin", adminRouter);

app.listen(port, () => {
  console.log(`Hello UCAAT!\nServer is running at http://localhost:${port}`);
});

// Helper functions

function parseCookies(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const [key, ...rest] = part.split("=");
      acc[key] = decodeURIComponent(rest.join("="));
      return acc;
    }, {});
}

function getSession(req) {
  const sid = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  return sid ? sessions.get(sid) || null : null;
}

function createSession(username) {
  const sid = randomUUID();
  sessions.set(sid, { username, createdAt: Date.now() });
  return sid;
}

function destroySession(req) {
  const sid = parseCookies(req.headers.cookie)[SESSION_COOKIE];
  if (sid) sessions.delete(sid);
}

function requireAuth(req, res, next) {
  const session = getSession(req);
  if (!session) {
    return res.redirect("/?error=auth");
  }
  req.session = session;
  next();
}
