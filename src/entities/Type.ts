// src/entities/Category.ts
import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Product } from "./Product";

@Entity("types")
export class Type extends BaseEntity {
  @Column({ unique: true })
  name!: string;

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
