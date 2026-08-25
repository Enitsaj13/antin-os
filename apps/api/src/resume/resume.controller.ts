import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Patch,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { OwnerAuthGuard } from '@src/auth/owner-auth.guard';
import type { PublicResume, Resume } from '@antin-os/shared';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { getMaxResumeBytes } from './resume.constants';
import { UpdateResumePublicationDto } from './dto/update-resume-publication.dto';
import { ResumeService } from './resume.service';

@Controller()
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  @Get('resume')
  @UseGuards(OwnerAuthGuard)
  getManaged(): Promise<Resume> {
    return this.resumeService.getManaged();
  }

  @Post('resume')
  @UseGuards(OwnerAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: getMaxResumeBytes() },
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File): Promise<Resume> {
    return this.resumeService.upload(file);
  }

  @Patch('resume/publication')
  @UseGuards(OwnerAuthGuard)
  updatePublication(@Body() dto: UpdateResumePublicationDto): Promise<Resume> {
    return this.resumeService.updatePublication(dto);
  }

  @Delete('resume')
  @UseGuards(OwnerAuthGuard)
  remove(): Promise<Resume> {
    return this.resumeService.remove();
  }

  @Get('public/resume')
  getPublic(): Promise<PublicResume> {
    return this.resumeService.getPublic();
  }

  @Get('public/resume/download')
  @Header('Content-Type', 'application/pdf')
  async downloadPublic(@Res() response: Response): Promise<void> {
    const download = await this.resumeService.downloadPublic();

    response.setHeader('Content-Type', download.contentType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${download.filename}"`,
    );
    response.setHeader('Cache-Control', 'private, max-age=300');

    if (download.contentLength !== undefined) {
      response.setHeader('Content-Length', String(download.contentLength));
    }

    response.send(download.body);
  }
}
