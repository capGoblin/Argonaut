import express, { Request, Response } from "express";
import { handleRequest } from "./controller";
import { init } from "./controller/lib/axios";

const app = express();
app.use(express.json());

app.post("*", async (req: Request, res: Response) => {
  console.log(req.body);
  res.send(await handleRequest(req));
});

app.get("*", async (req: Request, res: Response) => {
  res.send(await handleRequest(req));
});

const port = process.env.PORT || 5000;

app.listen(port, async () => {
  console.log(`Server is running on port ${port}`);
  await init();
});
