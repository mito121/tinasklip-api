const express = require("express");
const router = express();
const bcrypt = require("bcrypt");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

let loggedUser = null;

/* Get user */
router.get("/user", authenticateToken, async (req, res) => {
  if (loggedUser !== null) return res.status(200).json({ user: loggedUser });
  return res.sendStatus(401);
});

/* Login */
router.post("/login", async (req, res) => {
  User.findOne({ username: req.body.username }, async (err, user) => {
    if (err) return res.sendStatus(402);

    if (user == null) return res.sendStatus(401);

    if (await bcrypt.compare(req.body.password, user.password)) {
      const thisUser = (loggedUser = {
        id: user.id,
        username: user.username,
      });

      const accessToken = generateAccessToken(thisUser);

      return res.status(200).json({ token: accessToken });
    } else {
      return res.sendStatus(401);
    }
  });
});

/* Create new user */
router.post("/register", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const hashedPassword = await bcrypt.hash(password, 6);

    const user = new User({
      username: username,
      password: hashedPassword,
    });

    const newUser = await user.save();
    return res.status(201).json({ user: newUser });
  } catch (e) {
    console.log("error:", e);
    return res.status(401).json({ error: e });
  }
});

router.delete("/logout", authenticateToken, async (req, res) => {
  loggedUser = null;
  return res.sendStatus(200);
});

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1w" });
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

module.exports = router;
