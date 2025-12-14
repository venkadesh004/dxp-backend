import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type UserDocument = User & Document;

interface RecentlyViewedGame {
  slug: string;
  coverImage?: string;
  viewedAt: Date;
}

interface WishlistItem {
  entryUid: string;
  addedAt: Date;
}

interface DownloadedGame {
  entryUid: string;
  downloadedAt: Date;
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: Date })
  birthdate?: Date;

  @Prop({ default: [] })
  recentlyViewed: RecentlyViewedGame[];

  @Prop({ default: [] })
  wishlist: WishlistItem[];

  @Prop({ default: [] })
  downloads: DownloadedGame[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop({ type: String })
  country?: String;
}

// Create schema and add virtual properties
export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('age').get(function(this: UserDocument) {
  if (!this.birthdate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthdate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

