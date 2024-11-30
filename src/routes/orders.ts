// src/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";
import { AppDataSource } from "../data-source";
import authMiddleware from "../helper/middleware";
import {
  generatePaymentReference,
  initiatePayment,
  verifyTransaction,
} from "../helper/helper";
import { Payment } from "../entities/Payments";
import { Wallet } from "../entities/Wallet";
import { Order } from "../entities/Order";
import { Product } from "../entities/Product";
import { ProductAccounts } from "../entities/ProductAccounts";

const orderRouter = Router();

orderRouter.post(
  "/order/initiate",
  authMiddleware(),
  async (req: any, res: any) => {
    const { id, name, imageUrl, qty, price } = req.body;
    const user = req.user as User;
    try {
      const orderRepository = AppDataSource.getRepository(Order);
      const productRepository = AppDataSource.getRepository(Product);
      const productAccountsRepository =
        AppDataSource.getRepository(ProductAccounts);
      const productAccounts = await productAccountsRepository.find({
        where: { product: { id: id } },
        take: qty,
        select: ["id", "accountFormat"],
      });
      if (!productAccounts) {
        return res.status(404).json({ message: "Product not found" });
      }

      const accountFormats = productAccounts.map(
        (account) => account.accountFormat
      );

      console.log(accountFormats);

      if (productAccounts.length === 0) {
        throw new Error("No product accounts available for transfer.");
      }
      const newOrder = orderRepository.create({
        name,
        imageUrl,
        qty,
        price,
        accountFormat: accountFormats,
        user,
      });
      await orderRepository.save(newOrder);
      const walletRepository = AppDataSource.getRepository(Wallet);
      const wallet = await walletRepository.findOne({
        where: { user: { id: user.id } },
      });

      if (!wallet) {
        return res.status(404).json({ message: "Wallet not found" });
      }

      // Step 3: Delete the selected records from `product_accounts`
      const idsToDelete = productAccounts.map((account) => account.id);
      await productAccountsRepository.delete(idsToDelete);
      wallet.balance = wallet.balance - parseInt(price);

      await walletRepository.save(wallet);

      // Save IteM Count
      const product = await productRepository.findOneBy({ id: id });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const [pAcc, total] = await productAccountsRepository.findAndCount({
        where: { product: { id: id } },
      });

      product.itemCount = total;

      await productRepository.save(product);
      res.status(201).json({
        message: "Order Successfully Done",
        status: 201,
        success: true,
        data: "",
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error Initiating Order", error, status: 500 });
    }
  }
);

orderRouter.get("/orders", authMiddleware(), async (req: any, res: any) => {
  const user = req.user as User;
  try {
    const orderRepository = AppDataSource.getRepository(Order);
    const data = await orderRepository.find({
      where: { user: { id: user.id } },
      order : {
        createdAt : 'DESC'
      }
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
});

export default orderRouter;
