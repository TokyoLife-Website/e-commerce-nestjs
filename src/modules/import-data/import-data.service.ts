import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as ExcelJS from 'exceljs';
import { DataSource, Repository } from 'typeorm';
import { Province } from '../provinces/entities/province.entity';
import { District } from '../districts/entities/district.entity';
import { Ward } from '../wards/entities/ward.entity';
import { join } from 'path';

@Injectable()
export class ImportDataService {
  private readonly batchSize = 100;
  private readonly excelDirectory = join(
    __dirname,
    '..',
    '..',
    '..',
    'assets',
    'excel',
  );
  constructor(
    @InjectRepository(Province)
    private provinceRepository: Repository<Province>,
    @InjectRepository(District)
    private districtRepository: Repository<District>,
    @InjectRepository(Ward)
    private wardRepository: Repository<Ward>,
    private readonly dataSource: DataSource,
  ) {}

  private getFilePath(filename: string): string {
    return join(this.excelDirectory, filename);
  }

  async importProvinces() {
    const filePath = this.getFilePath('address.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet('provinces');
    const provinces = [];
    worksheet.eachRow(async (row, rowNumber) => {
      if (rowNumber === 1 || rowNumber === worksheet.rowCount) return;
      const rowData = {
        id: +row.getCell(1).value,
        name: row.getCell(2).value,
      };
      provinces.push(rowData);
      if (provinces.length === this.batchSize) {
        await this.provinceRepository.save(provinces);
        provinces.length = 0;
      }
    });
    if (provinces.length > 0) {
      await this.provinceRepository.save(provinces);
    }
  }

  async importDistricts() {
    const filePath = this.getFilePath('address.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet('districts');
    const districts = [];
    worksheet.eachRow(async (row, rowNumber) => {
      if (rowNumber === 1 || rowNumber === worksheet.rowCount) return;
      districts.push({
        id: row.getCell(1).value,
        name: row.getCell(2).value,
        province: { id: +row.getCell(5).value },
      });
    });
    const promise = [];
    for (let i = 0; i < districts.length; i += this.batchSize) {
      const batch = districts.slice(i, i + this.batchSize);
      promise.push(this.districtRepository.insert(batch));
    }
    try {
      await Promise.all(promise);
    } catch (error) {
      console.log(error);
    }
  }

  async importWards() {
    const filePath = this.getFilePath('address.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet('wards');
    const wards = [];
    worksheet.eachRow(async (row, rowNumber) => {
      if (rowNumber === 1 || rowNumber === worksheet.rowCount) return;
      const districtId = +row.getCell(5).value;
      const wardName = row.getCell(2).value;
      if (districtId && wardName) {
        wards.push({
          id: +row.getCell(1).value,
          name: wardName,
          district: { id: +row.getCell(5).value },
        });
      } else {
        console.error(
          `Invalid data at row ${rowNumber}: districtId=${districtId}, wardName=${wardName}`,
        );
      }
    });
    const promise = [];
    for (let i = 0; i < wards.length; i += this.batchSize) {
      const batch = wards.slice(i, i + this.batchSize);
      promise.push(this.wardRepository.insert(batch));
      if (promise.length >= this.batchSize) {
        await Promise.all(promise);
        promise.length = 0;
      }
    }
    if (promise.length > 0) {
      await Promise.all(promise);
    }
  }

  async updateOrdersAddressFromUserDefault() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Update orders.address by joining to users' default address
      await queryRunner.query(
        `
        UPDATE ` +
          '`order`' +
          ` o
        INNER JOIN address a ON a.userId = o.userId AND a.isDefault = 1
        LEFT JOIN ward w ON w.id = a.wardId
        LEFT JOIN district d ON d.id = a.districtId
        LEFT JOIN province p ON p.id = a.provinceId
        SET o.address = CONCAT(
          COALESCE(a.detail, ''), ', ',
          COALESCE(w.name, ''), ', ',
          COALESCE(d.name, ''), ', ',
          COALESCE(p.name, '')
        )
      `,
      );

      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }
}
