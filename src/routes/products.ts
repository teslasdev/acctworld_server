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
import multer from "multer";
import path from "path";
import fs from "fs";

const productRouter = Router();

const storage = multer.diskStorage({
  destination: (req: any, file: any, cb) => {
    const uploadPath = path.join(__dirname, "../public/uploads");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req: any, file: any, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

productRouter.post(
  "/product",
  upload.single("file"),
  async (req: any, res: any) => {
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
        category,
        type,
        previewLink,
      } = req.body;

      if (accountFormat.length <= 0) {
        return res
          .status(400)
          .json({ success: false, message: "No Account Format is added" });
      }

      const typeFetch = await typeRepository.findOne({ where: { id: type } });
      const catFetch = await catRepository.findOne({ where: { id: category } });

      let imageUrl;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      }

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
        category: catFetch,
        previewLink,
        itemCount: accountFormat?.length || 0,
        type: typeFetch,
      });

      // Save the product to the database
      const savedProduct = await productRepository.save(newProduct);
      // Save ProductAccounts
      if (accountFormat) {
        const productAccounts = accountFormat.map((accountFormat: any) => {
          const productAccount = productAccountsRepository.create({
            accountFormat,
            product: savedProduct,
          });
          return productAccount;
        });

        await productAccountsRepository.save(productAccounts);
      }
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
  }
);

productRouter.put(
  "/product/:id",
  upload.single("file"),
  async (req: any, res: any) => {
    try {
      const productRepository = AppDataSource.getRepository(Product);
      const catRepository = AppDataSource.getRepository(Category);
      const typeRepository = AppDataSource.getRepository(Type);
      const productAccountsRepository =
        AppDataSource.getRepository(ProductAccounts);

      const { id } = req.params;
      const {
        name,
        description,
        accountFormat,
        price,
        type,
        category,
        previewLink,
      } = req.body;

      // Fetch existing product
      const product = await productRepository.findOne({
        where: { id },
        relations: ["category", "type", "accountFormats"],
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found.",
        });
      }

      // Validate input
      if (!name || !price) {
        return res.status(400).json({
          success: false,
          message: "Name and price are required fields.",
        });
      }

      if (!accountFormat || accountFormat.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Account format cannot be empty.",
        });
      }

      const typeEntity = await typeRepository.findOne({ where: { id: type } });
      const catEntity = await catRepository.findOne({
        where: { id: category },
      });

      if (typeEntity) {
        product.type = typeEntity;
      }

      if (catEntity) {
        product.category = catEntity;
      }
      // Update product fields
      product.name = name;
      product.description = description;
      product.price = price;
      product.previewLink = previewLink;
      product.itemCount = accountFormat.length;

      if (req.file) {
        product.imageUrl = `/uploads/${req.file.filename}`;
      }
      // Update the product
      const updatedProduct = await productRepository.save(product);
      // Update product accounts
      // Remove old ProductAccounts
      await productAccountsRepository.delete({ product: { id } });

      // Add new ProductAccounts
      const newProductAccounts = accountFormat.map((format: any) =>
        productAccountsRepository.create({
          accountFormat: format,
          product: updatedProduct,
        })
      );
      await productAccountsRepository.save(newProductAccounts);

      return res.status(200).json({
        success: true,
        message: "Product updated successfully.",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while updating the product.",
        error: error,
      });
    }
  }
);

productRouter.get("/product", async (req: any, res: any) => {
  const { category, type } = req.query;
  try {
    const productRepository = AppDataSource.getRepository(Product);
    const productsQuery = productRepository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.type", "type")
      .leftJoinAndSelect("type.categories", "categories")
      .leftJoinAndSelect("product.category", "category");

    // Add a filter for `category` if provided

    // Add a filter for `type` (assuming `type` is mandatory)
    if (type) {
      productsQuery.andWhere("type.id = :typeId", { typeId: type });
    }

    if (category) {
      productsQuery.andWhere("category.id = :categoryId", {
        categoryId: category,
      });
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

productRouter.get("/product/one", async (req: any, res: any) => {
  const { product_id } = req.query;

  try {
    const productRepository = AppDataSource.getRepository(Product);

    const product = await productRepository
      .createQueryBuilder("product")
      .leftJoinAndSelect("product.category", "category")
      .leftJoinAndSelect("product.type", "type")
      .leftJoinAndSelect("product.accountFormats", "accountFormats")
      .where("product.id = :product_id", { product_id })
      .getOne();

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Product data retrieved successfully",
      product,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error retrieving product data",
      error: error,
      success: false,
    });
  }
});

productRouter.delete("/product/delete", async (req: any, res: any) => {
  const { product_id } = req.query;

  try {
    const productRepository = AppDataSource.getRepository(Product);

    // Find the product to ensure it exists before deletion
    const product = await productRepository.findOne({
      where: { id: product_id },
    });

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
        success: false,
      });
    }

    // Delete the product
    await productRepository.delete({ id: product_id });

    res.status(200).json({
      message: "Product deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting product",
      error: error,
      success: false,
    });
  }
});

export default productRouter;
