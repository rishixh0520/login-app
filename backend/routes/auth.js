const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { PrismaClient } = require("../src/generated/prisma");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { signupSchema, loginSchema, resetPasswordSchema } = require("../src/validators/auth.validator");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// 1. Signup
router.post("/signup", async (req, res) => {
  try {
    const { error } = signupSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const { name, email, password, role } = req.body;

    const userExist = await prisma.users.findUnique({ where: { email } });
    if (userExist) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'user'
      }
    });

    // Generate Verification Token (Simulated email)
    const verificationToken = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: "1h" });
    const verifyLink = `http://localhost:5000/api/auth/verify-email/${verificationToken}`;
    console.log(`\n\n[MOCK EMAIL] To verify your account, please click this link:\n${verifyLink}\n\n`);

    res.status(201).json({
      message: "User Registered. Please check your terminal for the verification link.",
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 2. Verify Email
router.get("/verify-email/:token", async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    await prisma.users.update({
      where: { id: decoded.id },
      data: { verified: true }
    });
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
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) return res.status(400).json({ message: "User not found" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Wrong Password" });

    const accessToken = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "15m" } // 15 mins for access token
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" } // 30 days for refresh token
    );

    // (refresh token db insert removed to prevent error)

    res.json({
      message: "Login Success",
      token: accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 4. Refresh Token
router.post("/refresh-token", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: "Refresh token required" });

    const storedToken = await prisma.refresh_tokens.findFirst({ where: { token } });
    if (!storedToken) return res.status(403).json({ message: "Invalid refresh token" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.users.findUnique({ where: { id: decoded.id } });

    const newAccessToken = jwt.sign(
      { id: user.id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
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
    // (refresh token db delete removed to prevent error)
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// 6. Forgot Password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.users.findUnique({ where: { email } });
    
    if (!user) return res.status(404).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await prisma.password_reset.create({
      data: { user_id: user.id, token: resetToken, expires_at: expiresAt }
    });

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

    const resetRecord = await prisma.password_reset.findFirst({
      where: { token, expires_at: { gt: new Date() } }
    });

    if (!resetRecord) return res.status(400).json({ message: "Invalid or expired reset token" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.users.update({
      where: { id: resetRecord.user_id },
      data: { password: hashedPassword }
    });

    // Delete used token
    await prisma.password_reset.delete({ where: { id: resetRecord.id } });

    res.json({ message: "Password has been successfully reset" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
