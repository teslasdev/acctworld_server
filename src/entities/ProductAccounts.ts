import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Product } from "./Product";

@Entity("product_accounts")
export class ProductAccounts {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("json")
  accountFormat!: Record<string, string>;

  @ManyToOne(() => Product, (product) => product.accountFormats, { onDelete: "CASCADE" })
  product!: Product;
}
