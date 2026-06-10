const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { signupSchema, loginSchema, resetPasswordSchema } = require("../src/validators/auth.validator");
const pool = require("../config/db");

// 1. Signup
router.post("/signup", async (req, res) => {
  try {
    const { error } = signupSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, email, password, role } = req.body;

    const userExistRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExistRes.rows.length > 0) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserRes = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, hashedPassword, role || 'user']
    );
    const newUser = newUserRes.rows[0];

    // Generate Verification Token (Simulated email)
    const verificationToken = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: "1h" });
    const verifyLink = `http://localhost:5000/api/auth/verify-email/${verificationToken}`;
    console.log(`\n\n[MOCK EMAIL] To verify your account, please click this link:\n${verifyLink}\n\n`);

    res.status(201).json({
      message: "User Registered. Please check your terminal for the verification link.",
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    if (error.code === '28P01' || error.code === 'ECONNREFUSED' || error.message?.includes('password authentication failed')) {
      return res.status(503).json({ message: "Database unavailable. Check the PostgreSQL credentials in backend/.env." });
    }
    res.status(500).json({ message: error.message });
  }
});

// 2. Verify Email
router.get("/verify-email/:token", async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET || 'fallback_secret');
    await pool.query('UPDATE users SET verified = true WHERE id = $1', [decoded.id]);
    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired verification token" });
  }
});

// 3. Login
router.post("/login", async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { email, password } = req.body;
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];

    if (!user) return res.status(400).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Wrong Password" });

    if (!user.verified) return res.status(403).json({ message: "Please verify your email before logging in." });

    const accessToken = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: "30d" }
    );

    await pool.query('INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2)', [user.id, refreshToken]);

    res.json({
      message: "Login Success",
      token: accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    if (error.code === '28P01' || error.code === 'ECONNREFUSED' || error.message?.includes('password authentication failed')) {
      return res.status(503).json({ message: "Database unavailable. Check the PostgreSQL credentials in backend/.env." });
    }
    res.status(500).json({ message: error.message });
  }
});

// 4. Refresh Token
router.post("/refresh-token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: "Refresh token required" });

    const tokenRes = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1', [token]);
    const storedToken = tokenRes.rows[0];
    if (!storedToken) return res.status(403).json({ message: "Invalid refresh token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    const user = userRes.rows[0];

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: "15m" }
    );

    res.json({ token: newAccessToken });
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
});

// 5. Logout
router.post("/logout", async (req, res) => {
  try {
    const { token } = req.body; // refresh token
    // Delete refresh token from database
    if (token) {
      await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [token]);
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6. Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userRes.rows[0];
    
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await pool.query('INSERT INTO password_reset (user_id, token, expires_at) VALUES ($1, $2, $3)', [user.id, resetToken, expiresAt]);

    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
    console.log(`\n\n[MOCK EMAIL] Password Reset requested. Click here to reset:\n${resetLink}\n\n`);

    res.json({ message: "Password reset link sent to terminal." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 7. Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { error } = resetPasswordSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { token, newPassword } = req.body;

    const resetRes = await pool.query('SELECT * FROM password_reset WHERE token = $1 AND expires_at > NOW()', [token]);
    const resetRecord = resetRes.rows[0];

    if (!resetRecord) return res.status(400).json({ message: "Invalid or expired reset token" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, resetRecord.user_id]);

    // Delete used token
    await pool.query('DELETE FROM password_reset WHERE id = $1', [resetRecord.id]);

    res.json({ message: "Password has been successfully reset" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
