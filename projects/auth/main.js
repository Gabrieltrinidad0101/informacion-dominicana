import express from "express";
import { clerkMiddleware, requireAuth } from "@clerk/express";
import path,{dirname} from "path"
import { fileURLToPath } from 'url';
import dotenv from "dotenv"

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({
    path: path.join(__dirname,".env"),
    override: true
})

const app = express();
app.use(clerkMiddleware());
app.use(express.json());

app.get("/", (req, res) => res.status(401).end());


app.get("/verify", (req, res, next) => {
  requireAuth({ signInUrl: null })(req, res, () => {
    return res.send("OK"); 
  });
}, (err, req, res, next) => {
  return res.status(401).json({ error: "Unauthorized" });
});


app.listen(3000, () => console.log("Auth server running on 3000"));