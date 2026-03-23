CREATE TABLE "configuracoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome_criterio" text DEFAULT 'Elegível' NOT NULL,
	"descricao_criterio" text DEFAULT 'Critério de elegibilidade' NOT NULL,
	"limiar_presenca" integer DEFAULT 75 NOT NULL,
	"limiar_pontualidade" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrantes" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integrantes_times" (
	"integrante_id" integer NOT NULL,
	"time_id" integer NOT NULL,
	CONSTRAINT "integrantes_times_integrante_id_time_id_unique" UNIQUE("integrante_id","time_id")
);
--> statement-breakpoint
CREATE TABLE "presencas" (
	"id" serial PRIMARY KEY NOT NULL,
	"integrante_id" integer NOT NULL,
	"treino_id" integer NOT NULL,
	"horario_checkin" timestamp DEFAULT now() NOT NULL,
	"atrasado" boolean NOT NULL,
	CONSTRAINT "presencas_integrante_id_treino_id_unique" UNIQUE("integrante_id","treino_id")
);
--> statement-breakpoint
CREATE TABLE "times" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "treinos" (
	"id" serial PRIMARY KEY NOT NULL,
	"data" date NOT NULL,
	"descricao" text NOT NULL,
	"horario_inicio" time NOT NULL,
	"criado_em" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "integrantes_times" ADD CONSTRAINT "integrantes_times_integrante_id_integrantes_id_fk" FOREIGN KEY ("integrante_id") REFERENCES "public"."integrantes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integrantes_times" ADD CONSTRAINT "integrantes_times_time_id_times_id_fk" FOREIGN KEY ("time_id") REFERENCES "public"."times"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_integrante_id_integrantes_id_fk" FOREIGN KEY ("integrante_id") REFERENCES "public"."integrantes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presencas" ADD CONSTRAINT "presencas_treino_id_treinos_id_fk" FOREIGN KEY ("treino_id") REFERENCES "public"."treinos"("id") ON DELETE no action ON UPDATE no action;