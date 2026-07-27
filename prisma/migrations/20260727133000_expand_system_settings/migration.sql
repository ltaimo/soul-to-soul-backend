ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "hrPaymentTypes" TEXT NOT NULL DEFAULT 'Salary,Rent,Advance,Bonus,Transport,Utilities,Commission,Other';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "paymentMethods" TEXT NOT NULL DEFAULT 'Cash,M-Pesa,E-Mola,Card,Bank Transfer';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "warehouseTypes" TEXT NOT NULL DEFAULT 'Warehouse,Shop,Storage,Transit';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "productCategories" TEXT NOT NULL DEFAULT 'Skincare,Haircare,Beard Care,Raw Material,Packaging';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "productTypes" TEXT NOT NULL DEFAULT 'Finished Good,Raw Material,Packaging';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "productUnits" TEXT NOT NULL DEFAULT 'pcs,kg,g,l,ml,box';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "attendanceStatuses" TEXT NOT NULL DEFAULT 'Present,Absent,Late,Half Day,Leave';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "payFrequencies" TEXT NOT NULL DEFAULT 'Monthly,Weekly,Daily,Hourly';

UPDATE "SystemSetting"
SET "companyName" = 'Soul2Soul'
WHERE "id" = 1
  AND ("companyName" IS NULL OR "companyName" = '' OR "companyName" = 'Soul to Soul ERP');
