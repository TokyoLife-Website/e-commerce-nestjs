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
    await this.importDataService.importDistricts();
    await this.importDataService.importWards();
    console.log('Address data imported successfully!');
  }
}
