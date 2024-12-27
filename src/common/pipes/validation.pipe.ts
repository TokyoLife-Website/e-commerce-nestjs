import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

@Injectable()
export class CustomValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);
    if (errors.length > 0) {
      const errorDetails = this.formatErrors(errors);
      // const errorDetails = errors.reduce((acc, err) => {
      //   acc[err.property] = Object.values(err.constraints || {});
      //   return acc;
      // }, {});
      // console.log(errors?.children);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorDetails,
      });
    }
    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: ValidationError[]): any {
    return errors.reduce((acc, err) => {
      acc[err.property] = Object.values(err.constraints || {});
      if (err.children && err.children.length > 0) {
        acc[err.property].push(this.formatErrors(err.children));
      }
      return acc;
    }, {});
  }
}
