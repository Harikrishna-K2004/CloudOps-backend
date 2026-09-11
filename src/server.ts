import express from "express";
import cors from "cors";

import { env } from "./config/env";
import { supabase } from "./config/supabase";

import authRouter from "./api/auth";
import modelsRouter from "./api/models";
import modelTokensRouter from "./api/modelTokens";
import toolSecretsRouter from "./api/toolSecrets";
import chatsRouter from "./api/chats";
import aiRouter from "./api/ai";

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
  }),
);

app.use(express.json());

app.get("/health", async (_req, res) => {
  const { error } = await supabase
    .from("users")
    .select("id")
    .limit(1);

  if (error) {
    return res.status(500).json({
      status: "error",
      supabase: false,
    });
  }

  return res.json({
    status: "ok",
    supabase: true,
  });
});

app.use("/api/auth", authRouter);
app.use("/api/models", modelsRouter);
app.use("/api/model-tokens", modelTokensRouter);
app.use("/api/tool-secrets", toolSecretsRouter);
app.use("/api/chats", chatsRouter);
app.use("/api", aiRouter);

app.listen(env.port, () => {
  console.log(
    `CloudOps API running on http://localhost:${env.port}`,
  );
});