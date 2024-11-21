// src/routes/auth.ts
import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../entities/User";
import { AppDataSource } from "../data-source";
import authMiddleware from "../helper/middleware";
import { Product } from "../entities/Product";
import { Category } from "../entities/Catogory";
import { Type } from "../entities/Type";
import { ProductAccounts } from "../entities/ProductAccounts";

const productRouter = Router();

productRouter.post("/product", async (req: any, res: any) => {
  try {
    const productRepository = AppDataSource.getRepository(Product);
    const catRepository = AppDataSource.getRepository(Category);
    const typeRepository = AppDataSource.getRepository(Type);
    const productAccountsRepository =
      AppDataSource.getRepository(ProductAccounts);

    // Destructure product details from request body
    const {
      name,
      description,
      accountFormat,
      price,
      imageUrl,
      category,
      type,
    } = req.body;
    const catFetch = await catRepository.findOne({ where: { id: category } });
    const typeFetch = await typeRepository.findOne({ where: { id: type } });

    if (!typeFetch) {
      return res.status(500).json({ error: "Type not Found!" });
    }

    if (!catFetch) {
      return res.status(500).json({ error: "Category not Found!" });
    }

    // Validate input
    if (!name || !price) {
      return res
        .status(400)
        .json({ error: "Name, price, and itemCount are required fields." });
    }

    // Create a new product
    const newProduct = productRepository.create({
      name,
      description,
      price,
      imageUrl,
      itemCount: accountFormat.length || 0,
      category: catFetch,
      type: typeFetch,
    });

    // Save the product to the database
    const savedProduct = await productRepository.save(newProduct);
    // Save ProductAccounts
    const productAccounts = accountFormat.map((accountFormat: any) => {
      const productAccount = productAccountsRepository.create({
        accountFormat,
        product : savedProduct,
      });
      return productAccount;
    });

    await productAccountsRepository.save(productAccounts);

    return res.status(201).json({
      message: "Product created successfully",
      product: savedProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while creating the product." });
  }
});

productRouter.get("/product", authMiddleware, async (req: any, res: any) => {
  const { category, type } = req.query;
  try {
    const productRepository = AppDataSource.getRepository(Product);
    const productsQuery = productRepository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.category", "category")
      .leftJoinAndSelect("product.type", "type");

    // Add a filter for `category` if provided
    if (category) {
      productsQuery.andWhere("category.id = :categoryId", {
        categoryId: category,
      });
    }

    // Add a filter for `type` (assuming `type` is mandatory)
    if (type) {
      productsQuery.andWhere("type.id = :typeId", { typeId: type });
    }

    // Execute the query
    const products = await productsQuery.getMany();

    res.status(200).json({
      message: "Products data retrieved successfully",
      products,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving products data",
      error,
      success: false,
    });
  }
});

export default productRouter;
