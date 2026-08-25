import {
  BadRequestException,
  Injectable,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { RESUME_CONTENT_TYPE } from '@antin-os/shared';
import { getMaxResumeBytes } from './resume.constants';

export type ValidatedResumeFile = {
  body: Buffer;
  contentType: string;
  originalFilename: string;
  fileSize: number;
};

@Injectable()
export class ResumeFileService {
  validate(file?: Express.Multer.File): ValidatedResumeFile {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }

    if (file.size === 0) {
      throw new BadRequestException('Resume file must not be empty');
    }

    const maxBytes = getMaxResumeBytes();

    if (file.size > maxBytes) {
      throw new BadRequestException(
        `Resume PDF must be ${Math.floor(maxBytes / (1024 * 1024))} MB or smaller`,
      );
    }

    if (file.mimetype !== RESUME_CONTENT_TYPE) {
      throw new UnsupportedMediaTypeException('Resume file must be a PDF');
    }

    if (!file.originalname.toLowerCase().endsWith('.pdf')) {
      throw new BadRequestException('Resume filename must end with .pdf');
    }

    if (!this.looksLikePdf(file.buffer)) {
      throw new UnsupportedMediaTypeException(
        'Resume file must be a valid PDF',
      );
    }

    return {
      body: file.buffer,
      contentType: RESUME_CONTENT_TYPE,
      originalFilename: file.originalname,
      fileSize: file.size,
    };
  }

  private looksLikePdf(buffer: Buffer): boolean {
    const header = buffer.subarray(0, 8).toString('latin1');
    const trailer = buffer
      .subarray(Math.max(0, buffer.length - 2048))
      .toString('latin1');

    return header.startsWith('%PDF-') && trailer.includes('%%EOF');
  }
}
