import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Category } from "../entities/Catogory";
import authMiddleware from "../helper/middleware";

const catRouter = Router();

catRouter.post("/categories", async (req: any, res: any) => {
  const { name } = req.body;

  const catRepository = AppDataSource.getRepository(Category);

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Category name is required",
    });
  }

  await catRepository.save(await catRepository.create({ name }));

  res.status(201).json({
    success: true,
    message: "Category added successfully",
    data: name,
  });
});

catRouter.get("/categories", authMiddleware, async (req: any, res: any) => {
  try {
    const catRepository = AppDataSource.getRepository(Category);
    const categories = await catRepository.find();
    res.status(200).json({
      message: "Categories retrieved successfully",
      categories,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving Categories data",
      error,
      success: false,
    });
  }
});

export default catRouter;
