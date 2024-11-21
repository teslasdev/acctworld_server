import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { User } from "./User";

@Entity("orders")
export class Order extends BaseEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  qty!: number;

  @Column("json")
  accountFormat!: Array<Record<string, string>>;

  @Column()
  price!: number;

  @Column({ nullable: true })
  imageUrl!: string;

  // Define the Many-to-One relationship with User
  @ManyToOne(() => User, (user) => user.orders)
  @JoinColumn({ name: "userId" }) // Define the foreign key column in the 'orders' table
  user!: User;
}
