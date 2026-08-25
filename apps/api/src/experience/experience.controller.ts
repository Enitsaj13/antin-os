import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { OwnerAuthGuard } from '@src/auth/owner-auth.guard';
import { CreateExperienceDto } from './dto/create-experience.dto';
import { ReorderExperienceDto } from './dto/reorder-experience.dto';
import { UpdateExperienceDto } from './dto/update-experience.dto';
import type { ExperienceResponse } from './experience-response';
import { ExperienceService } from './experience.service';

type ExperienceOperations = {
  create(dto: CreateExperienceDto): Promise<ExperienceResponse>;
  findAllManaged(): Promise<ExperienceResponse[]>;
  findManaged(id: string): Promise<ExperienceResponse>;
  update(id: string, dto: UpdateExperienceDto): Promise<ExperienceResponse>;
  remove(id: string): Promise<ExperienceResponse>;
  reorder(dto: ReorderExperienceDto): Promise<ExperienceResponse[]>;
  findAllPublic(): Promise<ExperienceResponse[]>;
};

@Controller()
export class ExperienceController {
  constructor(
    @Inject(ExperienceService)
    private readonly experienceService: ExperienceOperations,
  ) {}

  @Post('experience')
  @UseGuards(OwnerAuthGuard)
  create(@Body() dto: CreateExperienceDto): Promise<ExperienceResponse> {
    return this.experienceService.create(dto);
  }

  @Get('experience')
  @UseGuards(OwnerAuthGuard)
  findAllManaged(): Promise<ExperienceResponse[]> {
    return this.experienceService.findAllManaged();
  }

  @Patch('experience/reorder')
  @UseGuards(OwnerAuthGuard)
  reorder(@Body() dto: ReorderExperienceDto): Promise<ExperienceResponse[]> {
    return this.experienceService.reorder(dto);
  }

  @Get('experience/:id')
  @UseGuards(OwnerAuthGuard)
  findManaged(@Param('id') id: string): Promise<ExperienceResponse> {
    return this.experienceService.findManaged(id);
  }

  @Patch('experience/:id')
  @UseGuards(OwnerAuthGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExperienceDto,
  ): Promise<ExperienceResponse> {
    return this.experienceService.update(id, dto);
  }

  @Delete('experience/:id')
  @UseGuards(OwnerAuthGuard)
  remove(@Param('id') id: string): Promise<ExperienceResponse> {
    return this.experienceService.remove(id);
  }

  @Get('public/experience')
  findAllPublic(): Promise<ExperienceResponse[]> {
    return this.experienceService.findAllPublic();
  }
}
