// src/data-source.ts
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306", 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  entities: [__dirname + "/entities/*.ts"],
  extra: {
    connectTimeout: 10000, // Increase timeout to 10 seconds
  },
});
