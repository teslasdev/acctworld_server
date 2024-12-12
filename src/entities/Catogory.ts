// src/entities/Category.ts
import { Entity, Column, OneToMany, ManyToOne, JoinColumn, ManyToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Product } from "./Product";
import { Type } from "./Type";


@Entity("categories")
export class Category extends BaseEntity {
  @Column({ unique: false })
  name!: string;

  @Column({ default: true })
  visibility!: boolean;

  @ManyToMany(() => Type, (type) => type.categories)
  types!: Type[];

  @OneToMany(() => Product, (product) => product.category)
  products!: Product[];
}
