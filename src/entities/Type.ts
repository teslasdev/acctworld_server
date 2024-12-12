// src/entities/Category.ts
import {
  Entity,
  Column,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Product } from "./Product";
import { Category } from "./Catogory";

@Entity("types")
export class Type extends BaseEntity {
  @Column({ unique: false })
  name!: string;

  @Column({ default: true })
  visibility!: boolean;

  @Column({ nullable: true })
  imageUrl!: string;

  @ManyToMany(() => Category, { nullable: true })
  @JoinTable({
    name: "type_categories", // The name of the join table
    joinColumn: { name: "typeId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "categoryId", referencedColumnName: "id" },
  })
  categories?: Category[]; // Make this optional

  @OneToMany(() => Product, (product) => product.type)
  products!: Product[];
}
