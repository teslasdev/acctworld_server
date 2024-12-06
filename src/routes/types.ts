import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Type } from "../entities/Type";
import authMiddleware from "../helper/middleware";
import multer from "multer";
import path from "path";
import fs from "fs";
const typeRouter = Router();

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

typeRouter.post("/types", upload.single("file"), async (req: any, res: any) => {
  const { name, visibility } = req.body;

  const typeRepository = AppDataSource.getRepository(Type);

  if (!name) {
    return res.status(400).json({
      success: false,
      message: "type name is required",
    });
  }

  const isActiveBoolean = visibility === "true" ? true : false;

  const imageUrl = `/uploads/${req.file.filename}`;

  await typeRepository.save(
    await typeRepository.create({ name, imageUrl, visibility: isActiveBoolean })
  );

  res.status(201).json({
    success: true,
    message: "Type of Account added successfully",
    data: { name, imageUrl, visibility },
  });
});

typeRouter.put(
  "/types/:id",
  authMiddleware(["Super Admin"]),
  upload.single("file"),
  async (req: any, res: any) => {
    const { id } = req.params;
    const { name, visibility } = req.body;
    const uploadedFile = req.file;

    const typeRepository = AppDataSource.getRepository(Type);

    // Check if type exists
    const type = await typeRepository.findOne({ where: { id } });
    if (!type) {
      if (uploadedFile) {
        fs.unlinkSync(uploadedFile.path);
      }
      return res.status(404).json({
        success: false,
        message: "Type not found",
      });
    }

    if (!name) {
      // If no name provided, delete the uploaded file (cleanup)
      if (uploadedFile) {
        fs.unlinkSync(uploadedFile.path);
      }
      return res.status(400).json({
        success: false,
        message: "Type name is required",
      });
    }

    if (type.imageUrl) {
      const oldImagePath = path.join(
        __dirname,
        "..",
        "public",
        "uploads",
        type.imageUrl
      );
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    const isActiveBoolean = visibility === "true" ? true : false;

    type.name = name;
    type.visibility = isActiveBoolean;

    if (uploadedFile) {
      type.imageUrl = `/uploads/${uploadedFile.filename}`;
    }

    await typeRepository.save(type);

    res.status(200).json({
      success: true,
      message: "Type updated successfully",
      data: type,
    });
  }
);

typeRouter.get("/type", authMiddleware(), async (req: any, res: any) => {
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
