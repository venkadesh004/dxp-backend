import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsDateString, IsIn } from "class-validator";

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: "Password must be at least 6 characters long" })
  password: string;

  @IsOptional()
  @IsDateString()
  birthdate?: string;

  @IsOptional()
  @IsString()
  @IsIn(['us', 'in', 'eu'], { message: "Country must be one of: us, in, eu" })
  country?: string;
}

