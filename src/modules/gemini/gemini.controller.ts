import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { Public } from 'src/common/decorators/public.decorator';
import { GeminiResponse } from './dtos/gemini-response.dto';

@Controller('gemini')
@UsePipes(new ValidationPipe({ transform: true }))
export class GeminiController {
  constructor(private readonly geminiService: GeminiService) {}

  @Post('chat')
  @Public()
  @HttpCode(HttpStatus.OK)
  async chatCompletion(
    @Body() { messages }: { messages: string },
  ): Promise<{ data: GeminiResponse; success: boolean }> {
    const response = await this.geminiService.chatCompletion(messages);
    return {
      data: response,
      success: true,
    };
  }
}
