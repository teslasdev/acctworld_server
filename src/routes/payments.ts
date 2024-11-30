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

const paymentRouter = Router();

paymentRouter.post(
  "/payment/initiate",
  authMiddleware(),
  async (req: any, res: any) => {
    const { amount, ref } = req.body;
    const user = req.user;
    const data = {
      amount: amount,
      paymentReference: ref,
      paymentMethods: "card,bank-transfer,ussd,qrcode",
      redirectUrl:
        `${"http://localhost:5173/dashboard/payment/success"}`,
      customerName: user.full_name,
      customerEmail: user.email,
      description: "The description for this payment goes here",
      currency: "NGN",
      feeBearer: "customer",
    };

    const paymentRepository = AppDataSource.getRepository(Payment);
    const newPayment = paymentRepository.create({
      amount,
      paymentReference: data.paymentReference,
      currency: data.currency,
      redirectUrl: data.redirectUrl,
      user,
    });

    const response = await initiatePayment(data);
    newPayment.txnReference = response.responseBody.transactionReference;
    await paymentRepository.save(newPayment);
    try {
      res.status(201).json({
        message: "Payment Initiated",
        status: 201,
        success: true,
        data: response,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error Initiating Payment", error, status: 500 });
    }
  }
);

paymentRouter.post(
  "/payment/verify",
  authMiddleware(),
  async (req: any, res: any) => {
    const { txnref } = req.body as any;
    const user = req.user;
    try {
      const response = await verifyTransaction(txnref);
      const paymentRepository = AppDataSource.getRepository(Payment);
      const walletRepository = AppDataSource.getRepository(Wallet);
      const paymentToUpdate = await paymentRepository.findOne({ where: { txnReference: txnref } });
      const wallet = await walletRepository.findOne({
        where: { user: { id: user.id } },
        relations: ["user"],
      });
      if(!wallet) {
        throw new Error("Payment record not found for the user");
      }
      if (!paymentToUpdate) {
        throw new Error("Payment record not found for the user");
      }
      if(response.responseCode == 'success' && paymentToUpdate.status !== "success") {
        wallet.balance = wallet.balance + response.responseBody.amount
        await walletRepository.save(wallet)
      }
      paymentToUpdate.status = response.responseCode;
      await paymentRepository.save(paymentToUpdate);
      res.status(200).json({
        message: "Payment Verification Successful",
        status: 200,
        success: true,
        data: response,
      });
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({
        message: "Error Verifying Payment",
        status: 500,
        success: false,
        error: error.response?.data || error.message, // Include detailed error information
      });
    }
  }
);

paymentRouter.get("/payments", authMiddleware(), async (req: any, res: any) => {
  try {
    const user = req.user as User
    const PaymentRepository = AppDataSource.getRepository(Payment);
    const data = await PaymentRepository.find({
      where : { user : { id : user.id }},
      order: {
        createdAt: "DESC", // Or 'DESC' for descending order
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

export default paymentRouter;
