import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { loadAppConfig } from '../../config/app.config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: () => {
        const config = loadAppConfig();
        return {
          uri: config.mongoUri,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
