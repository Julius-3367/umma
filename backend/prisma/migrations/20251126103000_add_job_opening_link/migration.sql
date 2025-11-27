-- AlterTable
ALTER TABLE `placements`
  ADD COLUMN `jobOpeningId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `placements`
  ADD CONSTRAINT `placements_jobOpeningId_fkey`
    FOREIGN KEY (`jobOpeningId`) REFERENCES `job_openings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
