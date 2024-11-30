import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Category } from "./Catogory";
import { Type } from "./Type";
import { ProductAccounts } from "./ProductAccounts";

@Entity("products")
export class Product extends BaseEntity {
  @Column()
  name!: string;

  @Column()
  description!: string;

  @Column()
  price!: number;

  @Column({ nullable: true })
  imageUrl!: string;

  @Column()
  itemCount!: number;

  @ManyToOne(() => Category, (category) => category.products)
  @JoinColumn({ name: "categoryId" })
  category!: Category;

  @ManyToOne(() => Type, (type) => type.products)
  @JoinColumn({ name: "typeId" })
  type!: Type;

  @OneToMany(() => ProductAccounts, (product_accounts: { product: any; }) => product_accounts.product, { cascade: true })
  accountFormats!: ProductAccounts[];
}