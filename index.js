if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const PORT = process.env.PORT || 3001;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");

/* CORS config */
app.use(cors());

app.use((req, res, next) => {
  console.log(`${req.method} -> ${req.originalUrl}`);

  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, x-mac"
  );
  res.header("Access-Control-Expose-Headers", "x-mac, x-host");

  next();
});

/* Connect to mongoDB from connection string */
mongoose.connect(process.env.DATABASE_URL);
const db = mongoose.connection;
db.on("error", (err) => console.error(err));
db.once("open", () => console.log("Successfully connected to database."));

app.use(express.json());

/* Services routes */
const serviceRouter = require("./routes/service");
app.use("/services", serviceRouter);

/* Images routes */
const imageRouter = require("./routes/image");
app.use("/images", imageRouter);

/* Auth routes */
const authRouter = require("./routes/auth.js");
app.use("/api/auth", authRouter);

/* --- Listening --- */
app.listen(PORT, () => {
  console.log(`listening @:${PORT}`);
});
