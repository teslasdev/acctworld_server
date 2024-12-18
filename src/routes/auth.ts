// src/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";
import { AppDataSource } from "../data-source";
import authMiddleware from "../helper/middleware";
import { Wallet } from "../entities/Wallet";
import {
  requestPasswordReset,
  resetPassword,
  sendResetEmail,
} from "../services/PasswordReset";

const authRouter = Router();

authRouter.post("/signup", async (req: any, res: any) => {
  const { full_name, email, password, role } = req.body as User;

  try {
    const userRepository = AppDataSource.getRepository(User);
    const walletRepository = AppDataSource.getRepository(Wallet);

    // Check if user already exists
    const existingUser = await userRepository.findOneBy({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create and save the user

    const newUser = userRepository.create({
      full_name,
      email,
      password: hashedPassword,
      is_admin: role !== "User" ? true : false,
      role,
    });
    await userRepository.save(newUser);
    // Create a wallet for the new user with default balance and currency
    const newWallet = walletRepository.create({
      balance: 0,
      currency: "NGN",
      user: newUser,
    });
    await walletRepository.save(newWallet);

    res.status(201).json({
      message: "Account created successfully",
      status: 201,
      success: true,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating user", error, status: 500 });
  }
});

authRouter.post("/signin", async (req: any, res: any) => {
  const { email, password } = req.body;

  try {
    const userRepository = AppDataSource.getRepository(User);

    // Find the user by email
    const user = await userRepository.findOneBy({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid Password" });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" }
    );
    return res
      .status(200)
      .json({ success: true, message: "Login successful", user, token });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
});
authRouter.get("/get-me", authMiddleware(), async (req: any, res: any) => {
  try {
    // Access the authenticated user
    const user = req.user;
    res.status(200).json({
      message: "User data retrieved successfully",
      user,
      success: true,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving user data", error, success: false });
  }
});

authRouter.post(
  "/change-password",
  authMiddleware(),
  async (req: any, res: any) => {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ error: "New Password is required" });
    }
    try {
      const userId = req.user?.id; // Assumes `req.user` is populated by middleware after authentication
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const userRepository = AppDataSource.getRepository(User);
      const user = await userRepository.findOneBy(userId);

      console.log(user);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      // Update the password in the database
      user.password = hashedPassword;
      await userRepository.save(user);

      res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// Password Reset
authRouter.post("/password-reset", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        message: "Email is required",
        success: false,
      });
    }

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        message: "User with this email does not exist",
        success: false,
      });
    }
    const token = await requestPasswordReset(email);
    await sendResetEmail(email, token);
    res.status(200).json({
      message: "Password reset email sent",
      success: true,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error retrieving user data", error, success: false });
  }
});

authRouter.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    console.log(req.body);
    await resetPassword(token, password);
    res.status(200).json({
      message: "Password updated successfully",
      success: true,
    });
  } catch (error) {
    res
      .status(400)
      .json({ message: "Error retrieving user data", error, success: false });
  }
});

export default authRouter;
