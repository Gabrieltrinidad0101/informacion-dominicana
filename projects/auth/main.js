import express from "express";
import { 
  ClerkExpressRequireAuth, 
  ClerkExpressWithAuth, 
  clerkClient 
} from "@clerk/express";

const app = express();
app.use(express.json());

app.use(ClerkExpressWithAuth());

app.get("/verify",ClerkExpressRequireAuth(), async (req, res) => {
  res.status(200).send("OK");
});

app.listen(3000, () => console.log("Server running on port 3000"));