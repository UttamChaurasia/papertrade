import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './users.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email: email.toLowerCase() });
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async create(data: { email: string; passwordHash: string }): Promise<User> {
    return this.userModel.create({
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
    });
  }

  async updateRefreshToken(userId: string, hashedToken: string | null){
    return this.userModel.findByIdAndUpdate(userId, { refreshToken: hashedToken, });
  }
}