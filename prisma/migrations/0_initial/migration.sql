-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "TipoAnexo" AS ENUM ('Encaminhamento', 'Atestado', 'Declaracao', 'Receita_Medica', 'Relatorio', 'Outro');

-- CreateEnum
CREATE TYPE "TipoMedicaoGlicemia" AS ENUM ('JEJUM', 'PRE_REFEICAO', 'POS_REFEICAO', 'AO_DEITAR', 'COM_SINTOMAS', 'SEM_SINTOMAS', 'OUTRO');

-- CreateEnum
CREATE TYPE "TipoMeta" AS ENUM ('PESO', 'GORDURA_CORPORAL', 'MASSA_MUSCULAR', 'IMC', 'PESCOCO', 'TORAX', 'CINTURA', 'QUADRIL', 'BRACO_E', 'BRACO_D', 'PERNA_E', 'PERNA_D', 'PANTURRILHA_E', 'PANTURRILHA_D');

-- CreateEnum
CREATE TYPE "StatusMeta" AS ENUM ('ATIVA', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusMedicamento" AS ENUM ('Ativo', 'Concluido', 'Suspenso');

-- CreateEnum
CREATE TYPE "FrequenciaTipo" AS ENUM ('Hora', 'Dia', 'Semana', 'Mes');

-- CreateEnum
CREATE TYPE "TipoMedicamento" AS ENUM ('Uso_Continuo', 'Tratamento_Clinico', 'Esporadico');

-- CreateEnum
CREATE TYPE "Consultatype" AS ENUM ('Rotina', 'Exame', 'Emergencia', 'Retorno', 'Tratamento');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermissionOnRole" (
    "roleId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermissionOnRole_pkey" PRIMARY KEY ("roleId","permissionId")
);

-- CreateTable
CREATE TABLE "ResourceLimit" (
    "id" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "limit" INTEGER NOT NULL,

    CONSTRAINT "ResourceLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "roleId" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcompanhamentoCorporal" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "peso" TEXT,
    "imc" TEXT,
    "pescoco" TEXT,
    "torax" TEXT,
    "cintura" TEXT,
    "quadril" TEXT,
    "bracoE" TEXT,
    "bracoD" TEXT,
    "pernaE" TEXT,
    "pernaD" TEXT,
    "pantE" TEXT,
    "pantD" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcompanhamentoCorporal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FotosAcompanhamento" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimetype" TEXT,
    "arquivo" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "acompanhamentoId" TEXT NOT NULL,

    CONSTRAINT "FotosAcompanhamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bioimpedancia" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "gorduraCorporal" TEXT,
    "massaMuscular" TEXT,
    "gorduraVisceral" TEXT,
    "taxaMetabolica" TEXT,
    "idadeCorporal" TEXT,
    "massaOssea" TEXT,
    "aguaCorporal" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bioimpedancia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnexoBioimpedancia" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimetype" TEXT,
    "arquivo" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bioimpedanciaId" TEXT NOT NULL,

    CONSTRAINT "AnexoBioimpedancia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL,
    "tipo" "TipoMeta" NOT NULL,
    "valorAlvo" TEXT NOT NULL,
    "valorInicial" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "status" "StatusMeta" NOT NULL DEFAULT 'ATIVA',
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnvisaMedicamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "principioAtivo" TEXT NOT NULL,

    CONSTRAINT "AnvisaMedicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DadosSaude" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "CNS" TEXT,
    "tipoSanguineo" TEXT,
    "sexo" TEXT,
    "dataNascimento" TEXT,
    "altura" TEXT,
    "alergias" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "DadosSaude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Authenticator" (
    "credentialID" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "credentialPublicKey" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credentialDeviceType" TEXT NOT NULL,
    "credentialBackedUp" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("userId","credentialID")
);

-- CreateTable
CREATE TABLE "Consultas" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "tipodeexame" TEXT,
    "tipo" "Consultatype" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "unidadeId" TEXT,
    "motivo" TEXT NOT NULL,
    "consultaOrigemId" TEXT,

    CONSTRAINT "Consultas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anotacoes" (
    "id" TEXT NOT NULL,
    "consultaId" TEXT NOT NULL,
    "anotacao" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Anotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Endereco" (
    "id" TEXT NOT NULL,
    "CEP" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "rua" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "UF" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "userId" TEXT,
    "unidadeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profissional" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "especialidade" TEXT NOT NULL,
    "NumClasse" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Profissional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CondicaoSaude" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "objetivo" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "observacoes" TEXT,
    "cidCodigo" TEXT,
    "cidDescricao" TEXT,
    "userId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CondicaoSaude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadeDeSaude" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "enderecoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "telefone" TEXT,
    "userId" TEXT,

    CONSTRAINT "UnidadeDeSaude_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exame" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataExame" TIMESTAMP(3),
    "anotacao" TEXT,
    "userId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "consultaId" TEXT,
    "unidadesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "tipo" TEXT,
    "analiseIA" TEXT,
    "condicaoSaudeId" TEXT,
    "profissionalExecutanteId" TEXT,
    "laudoFinalizado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Exame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoExame" (
    "id" TEXT NOT NULL,
    "exameId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "unidade" TEXT,
    "referencia" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "categoria" TEXT,

    CONSTRAINT "ResultadoExame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnexoExame" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "mimetype" TEXT,
    "arquivo" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "exameId" TEXT NOT NULL,

    CONSTRAINT "AnexoExame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnexoConsulta" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "tipo" "TipoAnexo" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "consultaId" TEXT NOT NULL,
    "arquivo" BYTEA,
    "mimetype" TEXT,

    CONSTRAINT "AnexoConsulta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "posologia" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3),
    "status" "StatusMedicamento" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "profissionalId" TEXT,
    "consultaId" TEXT,
    "estoque" INTEGER DEFAULT 0,
    "frequenciaNumero" INTEGER,
    "frequenciaTipo" "FrequenciaTipo",
    "quantidadeCaixa" INTEGER,
    "quantidadeDose" DOUBLE PRECISION,
    "forma" TEXT,
    "tipo" "TipoMedicamento" NOT NULL,
    "condicaoSaudeId" TEXT,
    "linkBula" TEXT,
    "principioAtivo" TEXT,
    "ultimaAtualizacaoEstoque" TIMESTAMP(3),

    CONSTRAINT "Medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "medicamentoId" TEXT,
    "relatedId" TEXT,
    "relatedModel" TEXT,
    "type" TEXT NOT NULL,
    "url" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionLog" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "component" TEXT,
    "level" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "ActionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbastecimentoMedicamento" (
    "id" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "quantidade" TEXT NOT NULL,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "medicamentoId" TEXT NOT NULL,
    "unidadeDeSaudeId" TEXT,

    CONSTRAINT "AbastecimentoMedicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiomarkerRule" (
    "id" TEXT NOT NULL,
    "normalizedRawName" TEXT NOT NULL,
    "standardizedName" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "BiomarkerRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PressaoArterial" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "sistolica" TEXT NOT NULL,
    "diastolica" TEXT NOT NULL,
    "pulso" TEXT NOT NULL,
    "observacoes" TEXT,
    "dadosSaudeId" TEXT NOT NULL,
    "condicaoSaudeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PressaoArterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GlicemiaCapilar" (
    "id" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "valor" TEXT NOT NULL,
    "tipoMedicao" "TipoMedicaoGlicemia" NOT NULL,
    "observacoes" TEXT,
    "dadosSaudeId" TEXT NOT NULL,
    "condicaoSaudeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlicemiaCapilar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ProfissionalUnidades" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ProfissionalUnidades_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CondicaoSaudeToConsultas" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CondicaoSaudeToConsultas_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE INDEX "ResourceLimit_roleId_idx" ON "ResourceLimit"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "ResourceLimit_roleId_resource_key" ON "ResourceLimit"("roleId", "resource");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_roleId_idx" ON "User"("roleId");

-- CreateIndex
CREATE INDEX "AcompanhamentoCorporal_userId_idx" ON "AcompanhamentoCorporal"("userId");

-- CreateIndex
CREATE INDEX "FotosAcompanhamento_acompanhamentoId_idx" ON "FotosAcompanhamento"("acompanhamentoId");

-- CreateIndex
CREATE INDEX "Bioimpedancia_userId_idx" ON "Bioimpedancia"("userId");

-- CreateIndex
CREATE INDEX "AnexoBioimpedancia_bioimpedanciaId_idx" ON "AnexoBioimpedancia"("bioimpedanciaId");

-- CreateIndex
CREATE INDEX "Meta_userId_idx" ON "Meta"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AnvisaMedicamento_id_key" ON "AnvisaMedicamento"("id");

-- CreateIndex
CREATE INDEX "AnvisaMedicamento_nome_idx" ON "AnvisaMedicamento"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "DadosSaude_userId_key" ON "DadosSaude"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialID_key" ON "Authenticator"("credentialID");

-- CreateIndex
CREATE INDEX "Consultas_userId_idx" ON "Consultas"("userId");

-- CreateIndex
CREATE INDEX "Consultas_profissionalId_idx" ON "Consultas"("profissionalId");

-- CreateIndex
CREATE INDEX "Consultas_unidadeId_idx" ON "Consultas"("unidadeId");

-- CreateIndex
CREATE INDEX "Consultas_data_idx" ON "Consultas"("data");

-- CreateIndex
CREATE INDEX "Anotacoes_consultaId_idx" ON "Anotacoes"("consultaId");

-- CreateIndex
CREATE INDEX "Endereco_userId_idx" ON "Endereco"("userId");

-- CreateIndex
CREATE INDEX "Endereco_unidadeId_idx" ON "Endereco"("unidadeId");

-- CreateIndex
CREATE UNIQUE INDEX "Profissional_NumClasse_key" ON "Profissional"("NumClasse");

-- CreateIndex
CREATE INDEX "Profissional_userId_idx" ON "Profissional"("userId");

-- CreateIndex
CREATE INDEX "CondicaoSaude_userId_idx" ON "CondicaoSaude"("userId");

-- CreateIndex
CREATE INDEX "CondicaoSaude_profissionalId_idx" ON "CondicaoSaude"("profissionalId");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadeDeSaude_enderecoId_key" ON "UnidadeDeSaude"("enderecoId");

-- CreateIndex
CREATE INDEX "UnidadeDeSaude_userId_idx" ON "UnidadeDeSaude"("userId");

-- CreateIndex
CREATE INDEX "Exame_userId_idx" ON "Exame"("userId");

-- CreateIndex
CREATE INDEX "Exame_profissionalId_idx" ON "Exame"("profissionalId");

-- CreateIndex
CREATE INDEX "Exame_consultaId_idx" ON "Exame"("consultaId");

-- CreateIndex
CREATE INDEX "Exame_unidadesId_idx" ON "Exame"("unidadesId");

-- CreateIndex
CREATE INDEX "Exame_condicaoSaudeId_idx" ON "Exame"("condicaoSaudeId");

-- CreateIndex
CREATE INDEX "Exame_profissionalExecutanteId_idx" ON "Exame"("profissionalExecutanteId");

-- CreateIndex
CREATE INDEX "ResultadoExame_exameId_idx" ON "ResultadoExame"("exameId");

-- CreateIndex
CREATE INDEX "AnexoExame_exameId_idx" ON "AnexoExame"("exameId");

-- CreateIndex
CREATE INDEX "AnexoConsulta_consultaId_idx" ON "AnexoConsulta"("consultaId");

-- CreateIndex
CREATE INDEX "Medicamento_userId_idx" ON "Medicamento"("userId");

-- CreateIndex
CREATE INDEX "Medicamento_profissionalId_idx" ON "Medicamento"("profissionalId");

-- CreateIndex
CREATE INDEX "Medicamento_consultaId_idx" ON "Medicamento"("consultaId");

-- CreateIndex
CREATE INDEX "Medicamento_condicaoSaudeId_idx" ON "Medicamento"("condicaoSaudeId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_medicamentoId_idx" ON "Notification"("medicamentoId");

-- CreateIndex
CREATE INDEX "Notification_relatedId_relatedModel_idx" ON "Notification"("relatedId", "relatedModel");

-- CreateIndex
CREATE INDEX "ActionLog_userId_idx" ON "ActionLog"("userId");

-- CreateIndex
CREATE INDEX "ActionLog_action_idx" ON "ActionLog"("action");

-- CreateIndex
CREATE INDEX "ActionLog_level_idx" ON "ActionLog"("level");

-- CreateIndex
CREATE INDEX "AbastecimentoMedicamento_medicamentoId_idx" ON "AbastecimentoMedicamento"("medicamentoId");

-- CreateIndex
CREATE INDEX "AbastecimentoMedicamento_unidadeDeSaudeId_idx" ON "AbastecimentoMedicamento"("unidadeDeSaudeId");

-- CreateIndex
CREATE UNIQUE INDEX "BiomarkerRule_normalizedRawName_key" ON "BiomarkerRule"("normalizedRawName");

-- CreateIndex
CREATE INDEX "BiomarkerRule_standardizedName_idx" ON "BiomarkerRule"("standardizedName");

-- CreateIndex
CREATE INDEX "BiomarkerRule_category_idx" ON "BiomarkerRule"("category");

-- CreateIndex
CREATE INDEX "PressaoArterial_dadosSaudeId_idx" ON "PressaoArterial"("dadosSaudeId");

-- CreateIndex
CREATE INDEX "PressaoArterial_condicaoSaudeId_idx" ON "PressaoArterial"("condicaoSaudeId");

-- CreateIndex
CREATE INDEX "GlicemiaCapilar_dadosSaudeId_idx" ON "GlicemiaCapilar"("dadosSaudeId");

-- CreateIndex
CREATE INDEX "GlicemiaCapilar_condicaoSaudeId_idx" ON "GlicemiaCapilar"("condicaoSaudeId");

-- CreateIndex
CREATE INDEX "_ProfissionalUnidades_B_index" ON "_ProfissionalUnidades"("B");

-- CreateIndex
CREATE INDEX "_CondicaoSaudeToConsultas_B_index" ON "_CondicaoSaudeToConsultas"("B");

-- AddForeignKey
ALTER TABLE "PermissionOnRole" ADD CONSTRAINT "PermissionOnRole_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermissionOnRole" ADD CONSTRAINT "PermissionOnRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceLimit" ADD CONSTRAINT "ResourceLimit_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcompanhamentoCorporal" ADD CONSTRAINT "AcompanhamentoCorporal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FotosAcompanhamento" ADD CONSTRAINT "FotosAcompanhamento_acompanhamentoId_fkey" FOREIGN KEY ("acompanhamentoId") REFERENCES "AcompanhamentoCorporal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bioimpedancia" ADD CONSTRAINT "Bioimpedancia_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnexoBioimpedancia" ADD CONSTRAINT "AnexoBioimpedancia_bioimpedanciaId_fkey" FOREIGN KEY ("bioimpedanciaId") REFERENCES "Bioimpedancia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meta" ADD CONSTRAINT "Meta_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DadosSaude" ADD CONSTRAINT "DadosSaude_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultas" ADD CONSTRAINT "Consultas_consultaOrigemId_fkey" FOREIGN KEY ("consultaOrigemId") REFERENCES "Consultas"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Consultas" ADD CONSTRAINT "Consultas_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultas" ADD CONSTRAINT "Consultas_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "UnidadeDeSaude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultas" ADD CONSTRAINT "Consultas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anotacoes" ADD CONSTRAINT "Anotacoes_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consultas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Endereco" ADD CONSTRAINT "Endereco_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Profissional" ADD CONSTRAINT "Profissional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CondicaoSaude" ADD CONSTRAINT "CondicaoSaude_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CondicaoSaude" ADD CONSTRAINT "CondicaoSaude_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadeDeSaude" ADD CONSTRAINT "UnidadeDeSaude_enderecoId_fkey" FOREIGN KEY ("enderecoId") REFERENCES "Endereco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnidadeDeSaude" ADD CONSTRAINT "UnidadeDeSaude_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exame" ADD CONSTRAINT "Exame_condicaoSaudeId_fkey" FOREIGN KEY ("condicaoSaudeId") REFERENCES "CondicaoSaude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exame" ADD CONSTRAINT "Exame_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consultas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exame" ADD CONSTRAINT "Exame_profissionalExecutanteId_fkey" FOREIGN KEY ("profissionalExecutanteId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exame" ADD CONSTRAINT "Exame_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exame" ADD CONSTRAINT "Exame_unidadesId_fkey" FOREIGN KEY ("unidadesId") REFERENCES "UnidadeDeSaude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exame" ADD CONSTRAINT "Exame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoExame" ADD CONSTRAINT "ResultadoExame_exameId_fkey" FOREIGN KEY ("exameId") REFERENCES "Exame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnexoExame" ADD CONSTRAINT "AnexoExame_exameId_fkey" FOREIGN KEY ("exameId") REFERENCES "Exame"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnexoConsulta" ADD CONSTRAINT "AnexoConsulta_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consultas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicamento" ADD CONSTRAINT "Medicamento_condicaoSaudeId_fkey" FOREIGN KEY ("condicaoSaudeId") REFERENCES "CondicaoSaude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicamento" ADD CONSTRAINT "Medicamento_consultaId_fkey" FOREIGN KEY ("consultaId") REFERENCES "Consultas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicamento" ADD CONSTRAINT "Medicamento_profissionalId_fkey" FOREIGN KEY ("profissionalId") REFERENCES "Profissional"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicamento" ADD CONSTRAINT "Medicamento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
	
-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionLog" ADD CONSTRAINT "ActionLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbastecimentoMedicamento" ADD CONSTRAINT "AbastecimentoMedicamento_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbastecimentoMedicamento" ADD CONSTRAINT "AbastecimentoMedicamento_unidadeDeSaudeId_fkey" FOREIGN KEY ("unidadeDeSaudeId") REFERENCES "UnidadeDeSaude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PressaoArterial" ADD CONSTRAINT "PressaoArterial_condicaoSaudeId_fkey" FOREIGN KEY ("condicaoSaudeId") REFERENCES "CondicaoSaude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PressaoArterial" ADD CONSTRAINT "PressaoArterial_dadosSaudeId_fkey" FOREIGN KEY ("dadosSaudeId") REFERENCES "DadosSaude"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlicemiaCapilar" ADD CONSTRAINT "GlicemiaCapilar_condicaoSaudeId_fkey" FOREIGN KEY ("condicaoSaudeId") REFERENCES "CondicaoSaude"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GlicemiaCapilar" ADD CONSTRAINT "GlicemiaCapilar_dadosSaudeId_fkey" FOREIGN KEY ("dadosSaudeId") REFERENCES "DadosSaude"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfissionalUnidades" ADD CONSTRAINT "_ProfissionalUnidades_A_fkey" FOREIGN KEY ("A") REFERENCES "Profissional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ProfissionalUnidades" ADD CONSTRAINT "_ProfissionalUnidades_B_fkey" FOREIGN KEY ("B") REFERENCES "UnidadeDeSaude"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CondicaoSaudeToConsultas" ADD CONSTRAINT "_CondicaoSaudeToConsultas_A_fkey" FOREIGN KEY ("A") REFERENCES "CondicaoSaude"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CondicaoSaudeToConsultas" ADD CONSTRAINT "_CondicaoSaudeToConsultas_B_fkey" FOREIGN KEY ("B") REFERENCES "Consultas"("id") ON DELETE CASCADE ON UPDATE CASCADE;