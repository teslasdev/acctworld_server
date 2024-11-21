import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Type } from "../entities/Type";
import authMiddleware from "../helper/middleware";
import { Wallet } from "../entities/Wallet";
import { Payment } from "../entities/Payments";
import { User } from "../entities/User";
import { Product } from "../entities/Product";
import { Order } from "../entities/Order";

const walletRouter = Router();

walletRouter.post("/wallet", authMiddleware, async (req: any, res: any) => {
  try {
    const walletRepository = AppDataSource.getRepository(Wallet);
    const userId = parseInt(req.params.userId, 10);
    const wallet = await walletRepository.findOne({
      where: { user: { id: userId } },
      relations: ["user"], // Include related User data if needed
    });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    return res.status(200).json(wallet);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching wallet", error });
  }
});

// Return Stats
walletRouter.get("/analystic", authMiddleware, async (req: any, res: any) => {
  const user = req.user as User;
  try {
    const walletRepository = AppDataSource.getRepository(Wallet);
    const paymentRepository = AppDataSource.getRepository(Payment);
    const productRepository = AppDataSource.getRepository(Product);
    const orderRepository = AppDataSource.getRepository(Order);

    const wallet = await walletRepository.findOne({
      where: { user: { id: user.id } },
      relations: ["user"],
    });

    const [payment , total] = await paymentRepository.findAndCount({
      where: { user: { id: user.id } },
    });
    const [products , totalPro] = await productRepository.findAndCount();

    const [order , totalOrd] = await orderRepository.findAndCount({
      where: { user: { id: user.id } },
    });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }
    const analystic = {
        wallet : wallet.balance,
        payment : total,
        products : totalPro,
        order : totalOrd
    }
    res.status(200).json({
        message: "Analystic Retrieved Successfully",
        status: 200,
        success: true,
        data: analystic,
      });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching wallet", error });
  }
});

export default walletRouter;
