import express from "express";
import dotenv from "dotenv";
import { clerkMiddleware, requireAuth } from "@clerk/express";

dotenv.config();

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
