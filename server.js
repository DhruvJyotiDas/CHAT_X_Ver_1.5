const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://chatapp_db_jsim_user:YOUR_PASSWORD@dpg-cvgm48btq21c73e5n8og-a.singapore-postgres.render.com/chatapp_db_jsim",
  ssl: { rejectUnauthorized: false }
});

// Register route
app.post("/register", async (req, res) => {
  const { username, password, dob, gender, profilePic = "" } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (username, password, dob, gender, profile_pic) VALUES ($1, $2, $3, $4, $5)`,
      [username, hash, dob, gender, profilePic]
    );
    res.status(201).json({ message: "User registered!" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Username already exists or bad input." });
  }
});

// Login route
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: "Invalid credentials" });

    res.status(200).json({ message: "Login successful", username: user.username });
  } catch (err) {
    res.status(500).json({ error: "Login failed" });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
