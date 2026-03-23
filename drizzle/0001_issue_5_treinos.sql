ALTER TABLE "presencas" ALTER COLUMN "horario_checkin" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "presencas" ALTER COLUMN "horario_checkin" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "presencas" ALTER COLUMN "atrasado" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "presencas" ADD COLUMN "status" text DEFAULT 'esperado' NOT NULL;