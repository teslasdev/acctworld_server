import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm";
import { User } from "./User";
import { BaseEntity } from "./BaseEntity";

@Entity("wallets")
export class Wallet extends BaseEntity {
  @Column()
  balance!: number;

  @Column({ nullable: true })
  currency!: string;

  @OneToOne(() => User, (user) => user.wallet)
  user!: User;
}
