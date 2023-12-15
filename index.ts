require("dotenv").config();

import { connectToMongoDB } from "./database";
import express, { ErrorRequestHandler } from "express";
import beepRouter from "./routes/beeps";

connectToMongoDB();

const app = express();

app.use("/beeps", beepRouter);

// 404 Middleware
app.use((req, res, next) => {
  res
    .status(404)
    .send("404 Not Found: The requested resource was not found on the server.");
});

// 500 Middleware
app.use(((err, req, res, next) => {
  console.error(err.stack); // Log the error stack for debugging
  res
    .status(500)
    .send("500 Internal Server Error: Something went wrong on the server.");
}) as ErrorRequestHandler);

const PORT = process.env.LISTEN_PORT || 3000;
app.listen(PORT, () => console.log(`Server up and running on port ${PORT}`));
