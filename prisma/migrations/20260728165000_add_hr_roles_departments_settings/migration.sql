ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "hrRoles" TEXT NOT NULL DEFAULT 'Manager,Cashier,Salesperson,Stock Manager,Production Assistant,Administrator';
ALTER TABLE "SystemSetting" ADD COLUMN IF NOT EXISTS "hrDepartments" TEXT NOT NULL DEFAULT 'Sales,Store,Warehouse,Production,Administration,Finance';
