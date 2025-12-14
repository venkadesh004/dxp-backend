export class AuthResponseDto {
  user: {
    id: string;
    email: string;
    createdAt: Date;
    birthdate?: Date;
    age?: number | null;
    country?: string;
    recentlyViewed?: any[];
    wishlist?: string[];
    downloads?: string[];
  };
  accessToken: string;
}

export class UserResponseDto {
  id: string;
  email: string;
  createdAt: Date;
  birthdate?: Date;
  age?: number | null;
  country?: string;
  recentlyViewed?: any[];
  wishlist?: string[];
  downloads?: string[];
}

