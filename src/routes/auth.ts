// src/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";
import { AppDataSource } from "../data-source";
import authMiddleware from "../helper/middleware";
import { Wallet } from "../entities/Wallet";

const authRouter = Router();

authRouter.post("/signup", async (req: any, res: any) => {
  const { full_name, email, password , role } = req.body as User;

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
      is_admin : role !== 'User' ? true : false,
      role
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
    res
      .status(200)
      .json({
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

export default authRouter;
