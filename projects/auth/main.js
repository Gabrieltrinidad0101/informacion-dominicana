import express from "express";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import path,{dirname} from "path"
import cookieParser from "cookie-parser";
import { fileURLToPath } from 'url';
import dotenv from "dotenv"
import axios from "axios";

async function clerkAuth(sessionToken) {
  if (!sessionToken) return null;

  try {
    const res = await axios.post(
      `https://valued-swan-46.clerk.accounts.dev/v1/sessions/verify`,
      { sessionToken },
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    );

    return res.data; // sesión válida → datos del usuario
  } catch (err) {
    return null; // inválido
  }
}


const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({
    path: path.join(__dirname,".env"),
    override: true
})

const app = express();
app.use(clerkMiddleware());
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => res.status(401).json({ error: "Unauthorized" }));


app.get("/verify", async (req, res) => {
  const sessionToken = req.cookies["__session"]; // Clerk cookie
  const auth = await clerkAuth(sessionToken);

  console.log(auth);
  if (!auth) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  res.status(200).end();
});


app.listen(3000, () => console.log("Auth server running on 3000"));