import { Entity, Column, ManyToOne } from "typeorm";
import { User } from "./User";
import { BaseEntity } from "./BaseEntity";

@Entity("payments")
export class Payment extends BaseEntity {
  @Column()
  amount!: number;

  @Column({ unique: true })
  paymentReference!: string;

  @Column({ unique: true })
  txnReference!: string;

  @Column()
  redirectUrl!: string;

  @Column()
  currency!: string;

  @Column({default : 'initiated'})
  status!: string;

  @Column({default : null})
  paid_at!: Date;

  @ManyToOne(() => User, (user) => user.payments, { onDelete: "CASCADE" })
  user!: User;
}
