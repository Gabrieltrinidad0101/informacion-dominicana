import express from "express";
import { 
  requireAuth, 
  clerkMiddleware, 
} from "@clerk/express";
import path,{dirname} from "path"
import { fileURLToPath } from 'url';
import dotenv from "dotenv"

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({
    path: path.join(__dirname,".env")
})

const app = express();
app.use(express.json());

app.use(clerkMiddleware());

app.get("/verify",requireAuth(), async (req, res) => {
  res.status(200).send("OK");
});

app.listen(3000, () => console.log("Server running on port 3000"));