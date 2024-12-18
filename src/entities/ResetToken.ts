import { Entity, Column, ManyToOne } from "typeorm";
import { User } from "./User"; // Assuming you have a User entity
import { BaseEntity } from "./BaseEntity";

@Entity("reset_tokens")
export class ResetToken extends BaseEntity {
  @Column()
  token!: string;

  @ManyToOne(() => User, (user) => user.resetTokens, { onDelete: "CASCADE" })
  user!: User;

  @Column()
  expiresAt!: Date;
}
