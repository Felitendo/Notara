import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsNotEmpty,
  IsArray,
  IsInt,
} from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsBoolean()
  @IsOptional()
  isPinned?: boolean;

  @IsBoolean()
  @IsOptional()
  isArchived?: boolean;

  @IsString()
  @IsOptional()
  background?: string;

  @IsInt()
  @IsOptional()
  position?: number;

  @IsDateString()
  @IsOptional()
  reminderAt?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tagIds?: string[];
}
