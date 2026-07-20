-- CreateTable
CREATE TABLE "Candidatura" (
    "id" TEXT NOT NULL,
    "nomeCompleto" TEXT NOT NULL,
    "rgm" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "areaInteresse" TEXT NOT NULL,
    "cursoAtual" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidatura_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Candidatura_areaInteresse_idx" ON "Candidatura"("areaInteresse");

-- CreateIndex
CREATE UNIQUE INDEX "Candidatura_cpf_areaInteresse_key" ON "Candidatura"("cpf", "areaInteresse");
