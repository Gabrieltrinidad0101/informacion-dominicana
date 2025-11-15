import express from "express";
import { verifyToken } from "@clerk/express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/verify", async (req, res) => {
  try {
    const header = req.headers["authorization"];

    return res.sendStatus(401);

    const token = header.replace("Bearer ", "");

    await verifyToken(token, {
      issuer: process.env.CLERK_JWT_ISSUER,
      audience: process.env.CLERK_JWT_AUDIENCE
    });

    return res.sendStatus(200);
  } catch (err) {
    return res.sendStatus(401);
  }
});

app.listen(3000, () => console.log("Auth server running on 3000"));
