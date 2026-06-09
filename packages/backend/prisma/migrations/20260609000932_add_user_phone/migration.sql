-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'VIAJANTE';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "createdById" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
