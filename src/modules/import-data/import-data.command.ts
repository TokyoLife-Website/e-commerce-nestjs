import { Console, Command } from 'nestjs-console';
import { ImportDataService } from './import-data.service';

@Console()
export class ImportDataCommand {
  constructor(private readonly importDataService: ImportDataService) {}
  @Command({
    command: 'import-data',
    description: 'Import address data from excel files to database',
  })
  async importProvince(): Promise<void> {
    await this.importDataService.importProvinces();
    console.log('Provinces data imported successfully!');

    await this.importDataService.importDistricts();
    console.log('Districts data imported successfully!');

    await this.importDataService.importWards();
    console.log('Wards data imported successfully!');
  }
}
