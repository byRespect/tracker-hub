import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema()
export class Session {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  timestamp!: string;

  @Prop({ required: true })
  type!: string;

  @Prop()
  duration!: number;

  @Prop({ type: [Object], default: [] })
  consoleLogs!: Record<string, any>[];

  @Prop({ type: [Object], default: [] })
  networkLogs!: Record<string, any>[];

  @Prop({ type: [Object], default: [] })
  domEvents!: Record<string, any>[];

  @Prop({ type: [Object], default: [] })
  rrwebEvents!: Record<string, any>[];

  @Prop()
  userAgent!: string;

  @Prop()
  url!: string;

  @Prop({ type: Object })
  user!: Record<string, any>;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
