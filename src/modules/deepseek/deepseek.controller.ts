import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { DeepseekService } from './deepseek.service';
import { Public } from 'src/common/decorators/public.decorator';
import { DeepSeekResponse } from './dtos/deepseek-response.dto';

@Controller('deepseek')
@UsePipes(new ValidationPipe({ transform: true }))
export class DeepseekController {
  constructor(private readonly deepseekService: DeepseekService) {}

  @Post('chat')
  @Public()
  @HttpCode(HttpStatus.OK)
  async chatCompletion(
    @Body() { messages }: { messages: string },
  ): Promise<{ data: DeepSeekResponse; success: boolean }> {
    const response = await this.deepseekService.chatCompletion(messages);
    return {
      data: response,
      success: true,
    };
  }
}
