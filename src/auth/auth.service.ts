import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "./schemas/user.schema";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { AuthResponseDto, UserResponseDto } from "./dto/auth-response.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, password, birthdate, country } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    try {
      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "10", 10);
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create new user
      const newUser = new this.userModel({
        email,
        password: hashedPassword,
        birthdate: birthdate ? new Date(birthdate) : undefined,
        country: country || undefined,
        recentlyViewed: [],
      });

      const savedUser = await newUser.save();

      // Generate JWT token
      const token = this.generateToken(savedUser);

      return {
        user: this.sanitizeUser(savedUser),
        accessToken: token,
      };
    } catch (error) {
      throw new InternalServerErrorException("Failed to create user");
    }
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      accessToken: token,
    };
  }

  async validateUser(userId: string): Promise<UserDocument | null> {
    return this.userModel.findById(userId);
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return this.sanitizeUser(user);
  }

  async updateRecentlyViewed(
    userId: string,
    gameSlug: string,
    coverImage?: string,
  ): Promise<UserResponseDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Remove existing entry if present
    user.recentlyViewed = user.recentlyViewed.filter((item) => item.slug !== gameSlug);

    // Add new entry at the beginning
    user.recentlyViewed.unshift({
      slug: gameSlug,
      coverImage,
      viewedAt: new Date(),
    });

    // Keep only the last 20 items
    if (user.recentlyViewed.length > 20) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 20);
    }

    await user.save();
    return this.sanitizeUser(user);
  }

  async addToWishlist(userId: string, entryUid: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Check if already in wishlist
    const exists = user.wishlist.some((item) => item.entryUid === entryUid);
    if (!exists) {
      user.wishlist.push({
        entryUid,
        addedAt: new Date(),
      });
      await user.save();
    }

    return this.sanitizeUser(user);
  }

  async removeFromWishlist(userId: string, entryUid: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    user.wishlist = user.wishlist.filter((item) => item.entryUid !== entryUid);
    await user.save();

    return this.sanitizeUser(user);
  }

  async getWishlist(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return user.wishlist.map((item) => item.entryUid);
  }

  async addToDownloads(userId: string, entryUid: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Check if already downloaded
    const exists = user.downloads.some((item) => item.entryUid === entryUid);
    if (!exists) {
      user.downloads.push({
        entryUid,
        downloadedAt: new Date(),
      });
      await user.save();
    }

    return this.sanitizeUser(user);
  }

  async removeFromDownloads(userId: string, entryUid: string): Promise<UserResponseDto> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    user.downloads = user.downloads.filter((item) => item.entryUid !== entryUid);
    await user.save();

    return this.sanitizeUser(user);
  }

  async getDownloads(userId: string): Promise<string[]> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return user.downloads.map((item) => item.entryUid);
  }

  private generateToken(user: UserDocument): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
    };

    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

    return this.jwtService.sign(payload, { expiresIn });
  }

  private sanitizeUser(user: UserDocument): UserResponseDto {
    // Calculate age from birthdate
    let age: number | null = null;
    if (user.birthdate) {
      const today = new Date();
      const birthDate = new Date(user.birthdate);
      age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
    }

    return {
      id: user._id.toString(),
      email: user.email,
      createdAt: user.createdAt,
      birthdate: user.birthdate,
      age,
      country: user.country as string | undefined,
      recentlyViewed: user.recentlyViewed || [],
      wishlist: user.wishlist?.map((item) => item.entryUid) || [],
      downloads: user.downloads?.map((item) => item.entryUid) || [],
    };
  }
}

