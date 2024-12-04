// src/entities/Category.ts
import { Entity, Column, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Product } from "./Product";

@Entity("types")
export class Type extends BaseEntity {
  @Column({ unique: false })
  name!: string;

  @Column({ default: true })
  visibility!: boolean;


  @Column({ nullable: true })
  imageUrl!: string;
  

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
