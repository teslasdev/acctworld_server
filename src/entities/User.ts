// src/entities/User.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne, JoinColumn } from "typeorm";
import { BaseEntity } from "./BaseEntity";
import { Payment } from "./Payments";
import { Wallet } from "./Wallet";
import { Order } from "./Order";

@Entity("users")
export class User extends BaseEntity {
  @Column({ default: null, unique: false })
  full_name!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @OneToMany(() => Payment, (payment) => payment.user)
  payments?: Payment[];

  @OneToOne(() => Wallet, (wallet) => wallet.user)
  @JoinColumn()
  wallet!: Wallet;
  
  @OneToMany(() => Order, (order) => order.user)
  orders!: Order[];
}
