import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DeepSeekResponse } from './dtos/deepseek-response.dto';

@Injectable()
export class DeepseekService {
  private readonly logger = new Logger(DeepseekService.name);
  private readonly openai: OpenAI;
  //   private readonly openai2: OpenAI;

  constructor(private readonly configService: ConfigService) {
    // this.openai2 = new OpenAI();
    const openrouterApiKey =
      this.configService.get<string>('OPENROUTER_API_KEY');
    const openrouterBaseUrl =
      this.configService.get<string>('OPENROUTER_BASE_URL') ||
      'https://openrouter.ai/api/v1';

    if (!openrouterApiKey) {
      throw new Error('OPENROUTER_API_KEY is required');
    }

    this.openai = new OpenAI({
      apiKey: openrouterApiKey,
      baseURL: openrouterBaseUrl,
      defaultHeaders: {
        'HTTP-Referer':
          this.configService.get<string>('APP_URL') || 'http://localhost:3000',
        'X-Title':
          this.configService.get<string>('APP_NAME') || 'E-commerce App',
      },
    });
  }

  //   async searchKnowledge(query: string) {
  //     const embedding = await this.openai2.embeddings.create({
  //       model: 'text-embedding-3-small',
  //       input: query,
  //       encoding_format: 'float',
  //     });
  //     console.log(embedding);
  //     return embedding;

  //     // return results.matches.map((match) => match.metadata.text).join('\n');
  //   }

  async chatCompletion(messages: string): Promise<DeepSeekResponse> {
    try {
      //   const knowledge = await this.searchKnowledge(messages);
      const model = 'deepseek/deepseek-chat-v3.1:free';
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `Bạn là trợ lý ảo Tokyo Life, chỉ trả lời về thời trang, quần áo.
      Nếu thông tin nằm trong dữ liệu nội bộ thì dùng, nếu không thì lịch sự từ chối.`,
          },
          {
            role: 'user',
            content: messages,
          },
        ],
      });

      return response as DeepSeekResponse;
    } catch (error) {
      this.logger.error('Error in DeepSeek chat completion:', error);
      throw error;
    }
  }
}
