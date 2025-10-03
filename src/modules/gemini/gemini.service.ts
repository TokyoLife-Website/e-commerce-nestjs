import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiResponse } from './dtos/gemini-response.dto';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey =
      this.configService.get<string>('GEMINI_API_KEY') ||
      this.configService.get<string>('GOOGLE_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY or GOOGLE_API_KEY is required');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async chatCompletion(messages: string): Promise<GeminiResponse> {
    try {
      const modelName = 'gemini-2.5-flash';
      const model = this.genAI.getGenerativeModel({
        model: modelName,
        systemInstruction:
          'Bạn là trợ lý ảo Tokyo Life, chỉ trả lời về thời trang, quần áo. Nếu thông tin nằm trong dữ liệu nội bộ thì dùng, nếu không thì lịch sự từ chối.',
      });
      model.cachedContent;
      const result = await model.generateContent(messages);
      const text =
        typeof result.response?.text === 'function'
          ? result.response.text()
          : '';

      const now = Math.floor(Date.now() / 1000);
      const mapped: GeminiResponse = {
        id: '',
        object: 'chat.completion',
        created: now,
        model: modelName,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: text,
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };

      return mapped;
    } catch (error) {
      this.logger.error('Error in Gemini chat completion:', error);
      throw error;
    }
  }
}
