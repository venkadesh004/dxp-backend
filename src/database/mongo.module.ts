import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import dotenv from "dotenv";

dotenv.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || "", {
      dbName: process.env.DB_NAME || "gamestore-dxp",
    }),
  ],
})
export class MongoModule {}

