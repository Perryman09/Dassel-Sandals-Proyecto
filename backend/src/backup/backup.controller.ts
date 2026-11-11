import { Controller, Get, Post, Body } from '@nestjs/common';
import { BackupService } from './backup.service';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Get('export')
  exportBackup() {
    return this.backupService.exportBackup();
  }

  @Post('restore')
  restoreBackup(@Body() backupData: any) {
    return this.backupService.restoreBackup(backupData);
  }
}
