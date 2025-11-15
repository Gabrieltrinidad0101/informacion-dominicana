import express from "express";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import path,{dirname} from "path"
import { fileURLToPath } from 'url';
import dotenv from "dotenv"

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({
    path: path.join(__dirname,".env")
})
console.log("CLERK_PUBLISHABLE_KEY:", process.env.CLERK_PUBLISHABLE_KEY);

const app = express();
app.use(express.json());
app.use(clerkMiddleware());

app.get("/verify",requireAuth(), async (req, res) => {
  try {
    res.status(200).send("OK");
  } catch (err) {
    return res.sendStatus(401);
  }
});

app.listen(3000, () => console.log("Auth server running on 3000"));
