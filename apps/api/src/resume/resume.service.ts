import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { PublicResume, Resume } from '@antin-os/shared';
import { PrismaService } from '@prisma/prisma.service';
import { ResumeFileService } from './resume-file.service';
import {
  DEFAULT_RESUME_DOWNLOAD_FILENAME,
  RESUME_SINGLETON_KEY,
} from './resume.constants';
import {
  ResumeRecord,
  resumeSelect,
  toPublicResumeResponse,
  toResumeResponse,
} from './resume-response';
import { UpdateResumePublicationDto } from './dto/update-resume-publication.dto';
import { RESUME_STORAGE } from './storage/resume-storage';
import type { DownloadedResume, ResumeStorage } from './storage/resume-storage';

export type ResumeDownload = DownloadedResume & {
  filename: string;
};

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileService: ResumeFileService,
    @Inject(RESUME_STORAGE)
    private readonly storage: ResumeStorage,
  ) {}

  async getManaged(): Promise<Resume> {
    return toResumeResponse(await this.requireResume());
  }

  async upload(file?: Express.Multer.File): Promise<Resume> {
    const existing = await this.findResume();
    const validated = this.fileService.validate(file);
    const uploaded = await this.storage.upload({
      body: validated.body,
      contentType: validated.contentType,
    });

    let saved: ResumeRecord;

    try {
      saved = await this.prisma.resume.upsert({
        where: { singletonKey: RESUME_SINGLETON_KEY },
        create: {
          singletonKey: RESUME_SINGLETON_KEY,
          originalFilename: validated.originalFilename,
          fileSize: validated.fileSize,
          contentType: validated.contentType,
          objectKey: uploaded.key,
          isPublic: false,
          uploadedAt: new Date(),
        },
        update: {
          originalFilename: validated.originalFilename,
          fileSize: validated.fileSize,
          contentType: validated.contentType,
          objectKey: uploaded.key,
          isPublic: false,
          uploadedAt: new Date(),
        },
        select: resumeSelect,
      });
    } catch (error) {
      await this.deleteUploadedAfterFailure(uploaded.key);
      throw error;
    }

    if (existing?.objectKey) {
      await this.deletePreviousAfterReplacement(existing.objectKey);
    }

    return toResumeResponse(saved);
  }

  async updatePublication(dto: UpdateResumePublicationDto): Promise<Resume> {
    await this.requireResume();

    const resume = await this.prisma.resume.update({
      where: { singletonKey: RESUME_SINGLETON_KEY },
      data: { isPublic: dto.isPublic },
      select: resumeSelect,
    });

    return toResumeResponse(resume);
  }

  async remove(): Promise<Resume> {
    const existing = await this.requireResume();
    const deleted = await this.prisma.resume.delete({
      where: { singletonKey: RESUME_SINGLETON_KEY },
      select: resumeSelect,
    });

    await this.deletePreviousAfterReplacement(existing.objectKey);

    return toResumeResponse(deleted);
  }

  async getPublic(): Promise<PublicResume> {
    return toPublicResumeResponse(await this.requirePublicResume());
  }

  async downloadPublic(): Promise<ResumeDownload> {
    const resume = await this.requirePublicResume();
    const downloaded = await this.storage.download(resume.objectKey);

    return {
      ...downloaded,
      filename: DEFAULT_RESUME_DOWNLOAD_FILENAME,
    };
  }

  private async findResume(): Promise<ResumeRecord | null> {
    return this.prisma.resume.findUnique({
      where: { singletonKey: RESUME_SINGLETON_KEY },
      select: resumeSelect,
    });
  }

  private async requireResume(): Promise<ResumeRecord> {
    const resume = await this.findResume();

    if (!resume) {
      throw new NotFoundException('Resume not found');
    }

    return resume;
  }

  private async requirePublicResume(): Promise<ResumeRecord> {
    const resume = await this.prisma.resume.findUnique({
      where: { singletonKey: RESUME_SINGLETON_KEY },
      select: resumeSelect,
    });

    if (!resume?.isPublic) {
      throw new NotFoundException('Resume not found');
    }

    return resume;
  }

  private async deleteUploadedAfterFailure(key: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch (error) {
      this.logger.error('Failed to clean up newly uploaded resume', error);
      throw new InternalServerErrorException('Failed to clean up resume');
    }
  }

  private async deletePreviousAfterReplacement(key: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch (error) {
      this.logger.error('Failed to delete previous resume object', error);
    }
  }
}
