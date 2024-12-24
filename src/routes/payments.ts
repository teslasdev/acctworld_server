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
    try {
      const { amount, ref, paymentMethods } = req.body;
      const user = req.user;
      console.log(ref);
      // Validate request body
      if (!amount || !ref || !paymentMethods) {
        return res.status(400).json({
          message:
            "Invalid request data. Please provide amount, ref, and paymentMethods.",
          status: 400,
          success: false,
        });
      }

      // Build payment data based on the payment method
      const data = buildPaymentData(paymentMethods, amount, ref, user);
      if (!data) {
        return res.status(400).json({
          message: `Unsupported payment method: ${paymentMethods}`,
          status: 400,
          success: false,
        });
      }

      // Save payment in the repository
      const paymentRepository = AppDataSource.getRepository(Payment);
      const newPayment = paymentRepository.create({
        amount,
        paymentReference: data?.paymentReference ?? data?.reference,
        currency: data?.currency,
        redirectUrl: data?.redirectUrl ?? data?.redirect_url,
        user,
        paymentMethod: paymentMethods,
      });

      // Initiate the payment
      const response = await initiatePayment(data, paymentMethods);

      console.log("Ref", response);
      // Update payment with transaction reference and save
      newPayment.txnReference =
        response.responseBody?.transactionReference ?? response.data?.reference;
      await paymentRepository.save(newPayment);
      return res.status(201).json({
        message: "Payment Initiated",
        status: 201,
        success: true,
        data: response,
        checkOutUrl:
          response.responseBody?.checkoutUrl ?? response.data?.checkout_url,
      });
    } catch (error) {
      console.error("Error initiating payment:", error);
      return res.status(500).json({
        message: "Error Initiating Payment",
        error: error,
        status: 500,
        success: false,
      });
    }
  }
);

/**
 * Helper function to build payment data based on the selected method
 */
const buildPaymentData = (
  paymentMethod: string,
  amount: number,
  ref: string,
  user: any
) => {
  const redirectUrl = `https://acctworld.com/dashboard/payment/success/`;

  switch (paymentMethod) {
    case "ercspay":
      return {
        amount,
        paymentReference: ref,
        paymentMethods: "card,bank-transfer,ussd,qrcode",
        redirectUrl,
        customerName: user.full_name,
        customerEmail: user.email,
        description: "The description for this payment goes here",
        currency: "NGN",
        feeBearer: "customer",
      };

    case "korapay":
      return {
        amount,
        redirect_url: redirectUrl,
        currency: "NGN",
        reference: ref,
        narration: "Payment for product",
        channels: ["card", "bank_transfer"],
        default_channel: "card",
        customer: {
          name: user.full_name,
          email: user.email,
        },
        notification_url:
          "https://webhook.site/8d321d8d-397f-4bab-bf4d-7e9ae3afbd50",
      };

    default:
      return null; // Unsupported payment method
  }
};

paymentRouter.post(
  "/payment/verify",
  authMiddleware(),
  async (req: any, res: any) => {
    const { txnref, method } = req.body as any;
    const user = req.user;
    try {
      const response = await verifyTransaction(txnref, method);

      console.log(response);
      const paymentRepository = AppDataSource.getRepository(Payment);
      const walletRepository = AppDataSource.getRepository(Wallet);
      const paymentToUpdate = await paymentRepository.findOne({
        where: { txnReference: txnref },
      });
      const wallet = await walletRepository.findOne({
        where: { user: { id: user.id } },
        relations: ["user"],
      });
      if (!wallet) {
        throw new Error("Payment record not found for the user");
      }
      if (!paymentToUpdate) {
        throw new Error("Payment record not found for the user");
      }
      if (
        response.responseCode == "success" &&
        paymentToUpdate.status !== "success"
      ) {
        const amount = response.responseBody.amount;

        wallet.balance = wallet.balance + amount;
        await walletRepository.save(wallet);
      } else if (
        response.data.status == "success" &&
        paymentToUpdate.status !== "success"
      ) {
        const amount = response.data.amount;
        wallet.balance = wallet.balance + parseInt(amount);
        await walletRepository.save(wallet);
      }
      paymentToUpdate.status = response.responseCode ?? response.data.status;
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
    const user = req.user as User;
    const PaymentRepository = AppDataSource.getRepository(Payment);
    const data = await PaymentRepository.find({
      where: { user: { id: user.id } },
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
