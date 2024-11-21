// src/entities/BaseEntity.ts
import {
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    BaseEntity as TypeORMBaseEntity,
  } from 'typeorm';
  
  export abstract class BaseEntity extends TypeORMBaseEntity {
    @PrimaryGeneratedColumn()
    id!: number;
  
    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  }
  