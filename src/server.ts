import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express, { type Express } from "express";
import path from "path";
import routes from "./routes";
import corsOptions from "./config/corOrigins";
import { responseFormatter } from "./lib/responseFormatter";
import { errorHandler } from "./middleware/errorHandler";
import { configureCloudinary } from "./config/cloudinary";

// Initialize environment variables
dotenv.config();
// Create Express application
const app: Express = express();
// Define the port
const PORT = process.env.PORT || 8000;

configureCloudinary();

// app.use(logger);
app.use(cors(corsOptions));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));
app.use(cookieParser());
app.use(responseFormatter);

// Serve static files from the "uploads" directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/v1", routes);

// Handle 404 errors
app.all("*", (req, res) => {
  // Log the 404 error
  console.error(`404 Not Found: ${req.originalUrl}`);

  res.status(404);
  if (req.accepts("html")) {
    res.sendFile(path.join(__dirname, "views", "404.html"));
  } else if (req.accepts("json")) {
    res.json({ message: "404 Not Found" });
  } else {
    res.type("txt").send("404 Not Found");
  }
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// To test on mobile
// app.listen(PORT as number, "0.0.0.0", () => {
//   console.log("Server running on http://0.0.0.0:8000");
// });
