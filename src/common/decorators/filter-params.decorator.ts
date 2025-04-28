import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';

export const FilterParams = createParamDecorator(
  (
    data: string[] | undefined,
    ctx: ExecutionContext,
  ): Record<string, string | number> => {
    const req: Request = ctx.switchToHttp().getRequest();
    const queryParams = req.query;
    const filters = data
      ? Object.keys(queryParams)
          .filter((key) => data.includes(key))
          .reduce((obj, key) => {
            obj[key] = queryParams[key];
            return obj;
          }, {})
      : queryParams;

    if (Object.keys(filters).length === 0) return {};
    return filters;
  },
);
