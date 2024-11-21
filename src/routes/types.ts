import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Type } from "../entities/Type";
import authMiddleware from "../helper/middleware";

const typeRouter = Router();

typeRouter.post("/types", async (req: any, res: any) => {
  const { name } = req.body;

  const typeRepository = AppDataSource.getRepository(Type);

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Category name is required",
    });
  }

  await typeRepository.save(await typeRepository.create({ name }));

  res.status(201).json({
    success: true,
    message: "Type of Account added successfully",
    data: name,
  });
});

typeRouter.get("/type", authMiddleware, async (req: any, res: any) => {
  try {
    const typeRepository = AppDataSource.getRepository(Type);
    const data = await typeRepository.find();
    res.status(200).json({
      message: "Types retrieved successfully",
      data,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving Types data",
      error,
      success: false,
    });
  }
});

export default typeRouter;
