import crypto from "crypto";
import { User } from "../entities/User";
import { ResetToken } from "../entities/ResetToken";
import { AppDataSource } from "../data-source";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import { MailtrapTransport } from "mailtrap";

export async function requestPasswordReset(email: string): Promise<string> {
  const userRepository = AppDataSource.getRepository(User);
  const resetTokenRepository = AppDataSource.getRepository(ResetToken);

  const user = await userRepository.findOne({ where: { email } });
  if (!user) throw new Error("User not found");

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour

  const resetToken = resetTokenRepository.create({
    token,
    user,
    expiresAt,
  });

  await resetTokenRepository.save(resetToken);

  return token;
}

export async function sendResetEmail(
  email: string,
  token: string
): Promise<void> {
  // const transporter = nodemailer.createTransport({
  //   host: "sandbox.smtp.mailtrap.io",
  //   port: 2525,
  //   auth: {
  //     user: "b10374f4e2842f",
  //     pass: "8fc4480df13a7e",
  //   },
  // });

  // const resetUrl = `http://localhost:5174/auth/reset-password?token=${token}`;
  // const mailOptions = {
  //   from: "theacctworld@gmail.com",
  //   to: email,
  //   subject: "Password Reset Request",
  //   text: `Click the link below to reset your password:\n\n${resetUrl}`,
  //   html: `<p>Click the link below to reset your password:</p><a href="${resetUrl}">${resetUrl}</a>`,
  // };
  const resetUrl = `http://localhost:5174/auth/reset-password?token=${token}`;

  const TOKEN = "44e100dc37252be0b29df357d290a9b1";

  const transport = nodemailer.createTransport(
    MailtrapTransport({
      token: TOKEN,
    })
  );

  const sender = {
    address: "hello@demomailtrap.com",
    name: "Reset Confirm Email",
  };
  const recipients = [email];

  transport
    .sendMail({
      from: sender,
      to: recipients,
      templateUuid: "6186d53b-aed3-4fe9-9354-acd1e6ad617e",
      templateVariables: {
        user_email: email,
        pass_reset_link: resetUrl,
      },
    })
    .then(console.log, console.error);
  // await transporter.sendMail(mailOptions);
}

export async function verifyResetToken(token: string): Promise<User> {
  const resetTokenRepository = AppDataSource.getRepository(ResetToken);

  const resetToken = await resetTokenRepository.findOne({
    where: { token },
    relations: ["user"],
  });

  if (!resetToken || resetToken.expiresAt < new Date()) {
    throw new Error("Invalid or expired token");
  }

  return resetToken.user;
}

export async function resetPassword(
  token: string,
  newPassword: string
): Promise<void> {
  const user = await verifyResetToken(token);

  const userRepository = AppDataSource.getRepository(User);
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  user.password = hashedPassword;
  await userRepository.save(user);

  // Delete the used token
  const resetTokenRepository = AppDataSource.getRepository(ResetToken);
  await resetTokenRepository.delete({ token });
}
