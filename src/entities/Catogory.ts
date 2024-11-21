// src/entities/Category.ts
import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Product } from "./Product";

@Entity("categories")
export class Category extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
