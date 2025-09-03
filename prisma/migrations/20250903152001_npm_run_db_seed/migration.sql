/*
  Warnings:

  - The values [VISA,MASTERCARD] on the enum `PaymentMethod` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `createdAt` on the `audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `maintenanceNotes` on the `availability_slots` table. All the data in the column will be lost.
  - You are about to drop the column `assignedRoomNo` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `checkInTime` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `checkOutTime` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `rateCode` on the `bookings` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `gender` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `group` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `guestClassification` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `lastStayDate` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `passportNumber` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `profileId` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `source` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `totalSpent` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `totalStays` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `travelAgent` on the `guests` table. All the data in the column will be lost.
  - You are about to drop the column `altDescription` on the `hotels` table. All the data in the column will be lost.
  - You are about to drop the column `altName` on the `hotels` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `amountPaidToday` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `completionDate` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `remainingBalance` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `payments` table. All the data in the column will be lost.
  - You are about to drop the column `alternativePrice` on the `rooms` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `role` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `emergency_contacts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `guest_preferences` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `loyalty_programs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `system_settings` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `companyId` to the `hotels` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paidAmount` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `remainingAmount` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalAmount` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchasePrice` to the `rooms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `groupId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('AVAILABLE', 'OCCUPIED', 'FULLY_PAID', 'PARTIALLY_PAID', 'BLOCKED');

-- AlterEnum
ALTER TYPE "BoardType" ADD VALUE 'ALL_INCLUSIVE';

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentMethod_new" AS ENUM ('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'CHECK');
ALTER TABLE "payments" ALTER COLUMN "method" TYPE "PaymentMethod_new" USING ("method"::text::"PaymentMethod_new");
ALTER TYPE "PaymentMethod" RENAME TO "PaymentMethod_old";
ALTER TYPE "PaymentMethod_new" RENAME TO "PaymentMethod";
DROP TYPE "PaymentMethod_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "emergency_contacts" DROP CONSTRAINT "emergency_contacts_guestId_fkey";

-- DropForeignKey
ALTER TABLE "guest_preferences" DROP CONSTRAINT "guest_preferences_guestId_fkey";

-- DropForeignKey
ALTER TABLE "loyalty_programs" DROP CONSTRAINT "loyalty_programs_guestId_fkey";

-- DropIndex
DROP INDEX "guests_profileId_key";

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "createdAt",
ADD COLUMN     "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "availability_slots" DROP COLUMN "maintenanceNotes",
ADD COLUMN     "notes" TEXT;

-- AlterTable
ALTER TABLE "bookings" DROP COLUMN "assignedRoomNo",
DROP COLUMN "checkInTime",
DROP COLUMN "checkOutTime",
DROP COLUMN "rateCode",
ADD COLUMN     "discountRate" DECIMAL(10,2),
ADD COLUMN     "numberOfAdults" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "numberOfChildren" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "remainingAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "taxAmount" DECIMAL(10,2),
ALTER COLUMN "specialRequests" DROP NOT NULL,
ALTER COLUMN "specialRequests" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "guests" DROP COLUMN "city",
DROP COLUMN "company",
DROP COLUMN "country",
DROP COLUMN "gender",
DROP COLUMN "group",
DROP COLUMN "guestClassification",
DROP COLUMN "lastStayDate",
DROP COLUMN "passportNumber",
DROP COLUMN "profileId",
DROP COLUMN "source",
DROP COLUMN "totalSpent",
DROP COLUMN "totalStays",
DROP COLUMN "travelAgent",
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "isBlacklisted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passportNo" TEXT;

-- AlterTable
ALTER TABLE "hotels" DROP COLUMN "altDescription",
DROP COLUMN "altName",
ADD COLUMN     "companyId" TEXT NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "rating" SMALLINT,
ADD COLUMN     "website" TEXT;

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "amount",
DROP COLUMN "amountPaidToday",
DROP COLUMN "completionDate",
DROP COLUMN "remainingBalance",
DROP COLUMN "startDate",
DROP COLUMN "transactionId",
ADD COLUMN     "paidAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "remainingAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "totalAmount" DECIMAL(12,2) NOT NULL,
ALTER COLUMN "paymentDate" DROP DEFAULT,
ALTER COLUMN "paymentDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "rooms" DROP COLUMN "alternativePrice",
ADD COLUMN     "bedType" TEXT,
ADD COLUMN     "discountPrice" DECIMAL(10,2),
ADD COLUMN     "hasBalcony" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasSeaView" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "purchasePrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "smokingAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "RoomStatus" NOT NULL DEFAULT 'AVAILABLE';

-- AlterTable
ALTER TABLE "seasonal_prices" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "startDate" SET DATA TYPE DATE,
ALTER COLUMN "endDate" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "role",
DROP COLUMN "updatedAt",
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "groupId" TEXT NOT NULL,
ADD COLUMN     "lastPasswordChange" TIMESTAMP(3),
ADD COLUMN     "maxDiscountRate" INTEGER,
ADD COLUMN     "passwordExpired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordNeverExpires" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "salary" DECIMAL(10,2),
ALTER COLUMN "email" DROP NOT NULL;

-- DropTable
DROP TABLE "emergency_contacts";

-- DropTable
DROP TABLE "guest_preferences";

-- DropTable
DROP TABLE "loyalty_programs";

-- DropTable
DROP TABLE "system_settings";

-- DropEnum
DROP TYPE "Gender";

-- DropEnum
DROP TYPE "LoyaltyLevel";

-- DropEnum
DROP TYPE "SmokingPreference";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_permissions" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "isAllowed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "group_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_permissions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "isAllowed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_agreements" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "room_files" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "room_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_filters" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filterType" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_filters_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "permissions_module_idx" ON "permissions"("module");

-- CreateIndex
CREATE INDEX "permissions_action_idx" ON "permissions"("action");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "user_groups_name_key" ON "user_groups"("name");

-- CreateIndex
CREATE UNIQUE INDEX "group_permissions_groupId_permissionId_key" ON "group_permissions"("groupId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "user_permissions_userId_permissionId_key" ON "user_permissions"("userId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE INDEX "saved_filters_createdById_idx" ON "saved_filters"("createdById");

-- CreateIndex
CREATE INDEX "saved_filters_filterType_idx" ON "saved_filters"("filterType");

-- CreateIndex
CREATE INDEX "saved_filters_isPublic_idx" ON "saved_filters"("isPublic");

-- CreateIndex
CREATE INDEX "saved_filters_isDefault_idx" ON "saved_filters"("isDefault");

-- CreateIndex
CREATE INDEX "audit_logs_tableName_idx" ON "audit_logs"("tableName");

-- CreateIndex
CREATE INDEX "audit_logs_recordId_idx" ON "audit_logs"("recordId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_tableName_recordId_idx" ON "audit_logs"("tableName", "recordId");

-- CreateIndex
CREATE INDEX "availability_slots_roomId_idx" ON "availability_slots"("roomId");

-- CreateIndex
CREATE INDEX "availability_slots_date_idx" ON "availability_slots"("date");

-- CreateIndex
CREATE INDEX "availability_slots_availableCount_idx" ON "availability_slots"("availableCount");

-- CreateIndex
CREATE INDEX "bookings_hotelId_idx" ON "bookings"("hotelId");

-- CreateIndex
CREATE INDEX "bookings_roomId_idx" ON "bookings"("roomId");

-- CreateIndex
CREATE INDEX "bookings_guestId_idx" ON "bookings"("guestId");

-- CreateIndex
CREATE INDEX "bookings_status_idx" ON "bookings"("status");

-- CreateIndex
CREATE INDEX "bookings_checkInDate_idx" ON "bookings"("checkInDate");

-- CreateIndex
CREATE INDEX "bookings_checkOutDate_idx" ON "bookings"("checkOutDate");

-- CreateIndex
CREATE INDEX "bookings_createdAt_idx" ON "bookings"("createdAt");

-- CreateIndex
CREATE INDEX "bookings_createdById_idx" ON "bookings"("createdById");

-- CreateIndex
CREATE INDEX "bookings_checkInDate_checkOutDate_idx" ON "bookings"("checkInDate", "checkOutDate");

-- CreateIndex
CREATE INDEX "guests_fullName_idx" ON "guests"("fullName");

-- CreateIndex
CREATE INDEX "guests_email_idx" ON "guests"("email");

-- CreateIndex
CREATE INDEX "guests_phone_idx" ON "guests"("phone");

-- CreateIndex
CREATE INDEX "guests_nationality_idx" ON "guests"("nationality");

-- CreateIndex
CREATE INDEX "guests_isVip_idx" ON "guests"("isVip");

-- CreateIndex
CREATE INDEX "guests_isBlacklisted_idx" ON "guests"("isBlacklisted");

-- CreateIndex
CREATE INDEX "guests_createdAt_idx" ON "guests"("createdAt");

-- CreateIndex
CREATE INDEX "hotels_isActive_idx" ON "hotels"("isActive");

-- CreateIndex
CREATE INDEX "hotels_location_idx" ON "hotels"("location");

-- CreateIndex
CREATE INDEX "hotels_rating_idx" ON "hotels"("rating");

-- CreateIndex
CREATE INDEX "hotels_createdAt_idx" ON "hotels"("createdAt");

-- CreateIndex
CREATE INDEX "hotels_createdById_idx" ON "hotels"("createdById");

-- CreateIndex
CREATE INDEX "payments_bookingId_idx" ON "payments"("bookingId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_method_idx" ON "payments"("method");

-- CreateIndex
CREATE INDEX "payments_paymentDate_idx" ON "payments"("paymentDate");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE INDEX "rooms_hotelId_idx" ON "rooms"("hotelId");

-- CreateIndex
CREATE INDEX "rooms_roomType_idx" ON "rooms"("roomType");

-- CreateIndex
CREATE INDEX "rooms_isActive_idx" ON "rooms"("isActive");

-- CreateIndex
CREATE INDEX "rooms_capacity_idx" ON "rooms"("capacity");

-- CreateIndex
CREATE INDEX "rooms_basePrice_idx" ON "rooms"("basePrice");

-- CreateIndex
CREATE INDEX "rooms_boardType_idx" ON "rooms"("boardType");

-- CreateIndex
CREATE INDEX "rooms_createdAt_idx" ON "rooms"("createdAt");

-- CreateIndex
CREATE INDEX "seasonal_prices_roomId_idx" ON "seasonal_prices"("roomId");

-- CreateIndex
CREATE INDEX "seasonal_prices_startDate_idx" ON "seasonal_prices"("startDate");

-- CreateIndex
CREATE INDEX "seasonal_prices_endDate_idx" ON "seasonal_prices"("endDate");

-- CreateIndex
CREATE INDEX "seasonal_prices_isActive_idx" ON "seasonal_prices"("isActive");

-- CreateIndex
CREATE INDEX "seasonal_prices_startDate_endDate_idx" ON "seasonal_prices"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "users_groupId_idx" ON "users"("groupId");

-- CreateIndex
CREATE INDEX "users_isActive_idx" ON "users"("isActive");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "user_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "user_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_permissions" ADD CONSTRAINT "group_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_agreements" ADD CONSTRAINT "hotel_agreements_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "hotels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "room_files" ADD CONSTRAINT "room_files_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
