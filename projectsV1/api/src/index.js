import { Hono } from "hono";
import { handle } from "./endpoints/taskList";
const app = new Hono();

app.get("/employees", handle);

export default app;
