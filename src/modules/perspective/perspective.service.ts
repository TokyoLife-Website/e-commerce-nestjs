import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PerspectiveService {
  private readonly logger = new Logger(PerspectiveService.name);
  private readonly apiKey: string;
  private readonly apiUrl =
    'https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze';

  constructor(
    private readonly httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('PERSPECTIVE_API_KEY');
    if (!this.apiKey) {
      throw new Error('PERSPECTIVE_API_KEY is required');
    }
  }

  async analyzeComment(text: string): Promise<number> {
    try {
      const url = `${this.apiUrl}?key=${this.apiKey}`;
      const body = {
        comment: { text },
        // languages: ['en', 'vi'],
        requestedAttributes: { TOXICITY: {} },
      };

      const response = await firstValueFrom(this.httpService.post(url, body));
      return response.data.attributeScores.TOXICITY.summaryScore.value;
    } catch (error) {
      console.log(error);
    }
  }
}
