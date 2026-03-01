import {
  pgTable,
  serial,
  text,
  boolean,
  timestamp,
  date,
  time,
  integer,
  unique,
} from "drizzle-orm/pg-core";

export const integrantes = pgTable("integrantes", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  ativo: boolean("ativo").default(true).notNull(),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
});

export const treinos = pgTable("treinos", {
  id: serial("id").primaryKey(),
  data: date("data").notNull(),
  descricao: text("descricao").notNull(),
  horario_inicio: time("horario_inicio").notNull(),
  criado_em: timestamp("criado_em").defaultNow().notNull(),
});

export const configuracoes = pgTable("configuracoes", {
  id: serial("id").primaryKey(),
  nome_criterio: text("nome_criterio").default("Elegível").notNull(),
  descricao_criterio: text("descricao_criterio").default("Critério de elegibilidade").notNull(),
  limiar_presenca: integer("limiar_presenca").default(75).notNull(),
  limiar_pontualidade: integer("limiar_pontualidade").default(0).notNull(),
});

export const presencas = pgTable(
  "presencas",
  {
    id: serial("id").primaryKey(),
    integrante_id: integer("integrante_id")
      .references(() => integrantes.id)
      .notNull(),
    treino_id: integer("treino_id")
      .references(() => treinos.id)
      .notNull(),
    horario_checkin: timestamp("horario_checkin").defaultNow().notNull(),
    atrasado: boolean("atrasado").notNull(),
  },
  (t) => [unique().on(t.integrante_id, t.treino_id)]
);
