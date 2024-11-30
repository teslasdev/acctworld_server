// src/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";
import { AppDataSource } from "../data-source";
import authMiddleware from "../helper/middleware";
import { Wallet } from "../entities/Wallet";
import { Payment } from "../entities/Payments";
import { Product } from "../entities/Product";
import { Order } from "../entities/Order";

const adminRouter = Router();

adminRouter.get(
  "/get-me",
  authMiddleware(["SuperAdmin"]),
  async (req: any, res: any) => {
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
  }
);

// Payment Routes
adminRouter.get("/payments", authMiddleware(), async (req: any, res: any) => {
  try {
    const user = req.user as User;
    const PaymentRepository = AppDataSource.getRepository(Payment);
    const data = await PaymentRepository.find({
      relations: ["user"],
      order: {
        createdAt: "DESC",
      },
    });
    res.status(200).json({
      message: "Payment retrieved successfully",
      data,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving Payment data",
      error,
      success: false,
    });
  }
});

// Users
adminRouter.get("/users", authMiddleware(), async (req: any, res: any) => {
  try {
    const user = req.user as User;
    const usersRepository = AppDataSource.getRepository(User);
    const data = await usersRepository.find({
      order: {
        createdAt: "DESC",
      },
    });
    res.status(200).json({
      message: "Users retrieved successfully",
      data,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving Users data",
      error,
      success: false,
    });
  }
});

//   Analystics
adminRouter.get(
  "/analystic",
  authMiddleware(["SuperAdmin"]),
  async (req: any, res: any) => {
    const user = req.user as User;
    try {
      const paymentRepository = AppDataSource.getRepository(Payment);
      const productRepository = AppDataSource.getRepository(Product);
      const orderRepository = AppDataSource.getRepository(Order);
      const userRepository = AppDataSource.getRepository(User);
      const [payments, total] = await paymentRepository.findAndCount();
      const [user, totalUsers] = await userRepository.findAndCount();
      const [products, totalPro] = await productRepository.findAndCount();
      const [order, totalOrd] = await orderRepository.findAndCount();

      const totals = payments.reduce(
        (acc, payment: any) => {
          acc.all += payment.amount;
          if (payment.status === "success") {
            acc.success += payment.amount;
          } else if (payment.status === "failed") {
            acc.failed += payment.amount;
          } else if (payment.status === "initiated") {
            acc.initiated += payment.amount;
          }
          return acc;
        },
        { success: 0, failed: 0, initiated: 0, all: 0 } // Initial values
      );

      console.log(totals);

      const analystic = {
        payment: total,
        products: totalPro,
        order: totalOrd,
        users: totalUsers,
        totals,
      };
      res.status(200).json({
        message: "Analystic Retrieved Successfully",
        status: 200,
        success: true,
        data: analystic,
      });
    } catch (error) {
      return res.status(500).json({ message: "Error fetching wallet", error });
    }
  }
);

// Orders
adminRouter.get(
  "/orders",
  authMiddleware(["SuperAdmin"]),
  async (req: any, res: any) => {
    const user = req.user as User;
    try {
      const orderRepository = AppDataSource.getRepository(Order);
      const data = await orderRepository.find({
        order: {
          createdAt: "DESC",
        },
      });
      res.status(200).json({
        message: "Orders retrieved successfully",
        data,
        success: true,
      });
    } catch (error) {
      res.status(500).json({
        message: "Error retrieving order data",
        error,
        success: false,
      });
    }
  }
);

export default adminRouter;
