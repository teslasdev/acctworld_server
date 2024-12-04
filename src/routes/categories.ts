import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Category } from "../entities/Catogory";
import authMiddleware from "../helper/middleware";

const catRouter = Router();

catRouter.post(
  "/categories",
  authMiddleware(["SuperAdmin"]),
  async (req: any, res: any) => {
    const { name , visibility } = req.body;

    console.log(visibility)
    const catRepository = AppDataSource.getRepository(Category);

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    await catRepository.save(await catRepository.create({ name , visibility }));

    res.status(201).json({
      success: true,
      message: "Category added successfully",
      data: {name , visibility},
    });
  }
);

catRouter.put(
  "/categories/:id",
  authMiddleware(["SuperAdmin"]),
  async (req: any, res: any) => {
    const { id } = req.params;
    const { name , visibility } = req.body;

    console.log(visibility)
    const catRepository = AppDataSource.getRepository(Category);

    // Check if category exists
    const category = await catRepository.findOne({ where: { id } });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    // Update the category
    category.name = name;
    category.visibility = visibility
    await catRepository.save(category);

    res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  }
);

catRouter.delete(
  "/categories/:id",
  authMiddleware(["SuperAdmin"]),
  async (req: any, res: any) => {
    const { id } = req.params;

    const catRepository = AppDataSource.getRepository(Category);

    // Check if category exists
    const category = await catRepository.findOne({ where: { id } });
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Delete the category
    await catRepository.remove(category);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  }
);

catRouter.get("/categories", authMiddleware(), async (req: any, res: any) => {
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
