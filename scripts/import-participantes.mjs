#!/usr/bin/env node
/**
 * Importa CPFs da planilha Lista Única Alunos → data/participantes.json
 *
 * Uso:
 *   node scripts/import-participantes.mjs [caminho-da-planilha.xlsx]
 *
 * Padrão: data/source/lista-unica-alunos.xlsx
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEFAULT_XLSX = path.join(ROOT, "data", "source", "lista-unica-alunos.xlsx");
const OUT_FILE = path.join(ROOT, "data", "participantes.json");

function stripDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function isValidCpf(raw) {
  let cpf = stripDigits(raw);
  if (cpf.length === 10) cpf = cpf.padStart(11, "0");
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (slice, factor) => {
    let total = 0;
    for (let i = 0; i < slice.length; i += 1) {
      total += Number(slice[i]) * (factor - i);
    }
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const first = calcDigit(cpf.slice(0, 9), 10);
  const second = calcDigit(cpf.slice(0, 10), 11);
  return first === Number(cpf[9]) && second === Number(cpf[10]);
}

function normalizeCpf(raw) {
  let digits = stripDigits(raw);
  if (digits.length === 10) digits = digits.padStart(11, "0");
  return digits;
}

function extractCpfsFromXlsx(xlsxPath) {
  const py = `
import zipfile, re, json, sys
from xml.etree import ElementTree as ET

path = sys.argv[1]
ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}

with zipfile.ZipFile(path) as z:
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in root.findall("m:si", ns):
            texts = [t.text or "" for t in si.findall(".//m:t", ns)]
            shared.append("".join(texts))

    sheet = ET.fromstring(z.read("xl/worksheets/sheet1.xml"))
    rows = sheet.findall("m:sheetData/m:row", ns)

    def col_row(ref):
        m = re.match(r"([A-Z]+)(\\d+)", ref)
        return m.group(1), int(m.group(2))

    def cell_value(c):
        t = c.attrib.get("t")
        v = c.find("m:v", ns)
        if v is None:
            return None
        if t == "s":
            return shared[int(v.text)]
        return v.text

    header = {}
    if rows:
        for c in rows[0].findall("m:c", ns):
            col, _ = col_row(c.attrib["r"])
            header[col] = cell_value(c)

    cpf_col = next((col for col, h in header.items() if h and "cpf" in str(h).lower()), None)
    if not cpf_col:
        raise SystemExit("Coluna CPF não encontrada no cabeçalho.")

    values = []
    for row in rows[1:]:
        val = None
        for c in row.findall("m:c", ns):
            if col_row(c.attrib["r"])[0] == cpf_col:
                val = cell_value(c)
                break
        values.append("" if val is None else str(val))

    print(json.dumps({"header": header.get(cpf_col), "values": values}, ensure_ascii=False))
`;

  const stdout = execFileSync("python3", ["-c", py, xlsxPath], {
    encoding: "utf-8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(stdout);
}

function main() {
  const xlsxPath = path.resolve(process.argv[2] ?? DEFAULT_XLSX);

  if (!existsSync(xlsxPath)) {
    console.error(`Planilha não encontrada: ${xlsxPath}`);
    console.error("");
    console.error("Coloque o arquivo em data/source/lista-unica-alunos.xlsx");
    console.error("ou passe o caminho: npm run import:participantes -- /caminho/arquivo.xlsx");
    process.exit(1);
  }

  console.log(`Lendo: ${xlsxPath}`);
  const { header, values } = extractCpfsFromXlsx(xlsxPath);
  console.log(`Coluna CPF: ${header ?? "(sem nome)"}`);
  console.log(`Linhas lidas: ${values.length}`);

  const imported = [];
  const seen = new Set();
  let duplicates = 0;
  let invalid = 0;
  const invalidSamples = [];

  for (const raw of values) {
    const normalized = normalizeCpf(raw);
    if (!isValidCpf(normalized)) {
      invalid += 1;
      if (invalidSamples.length < 20) {
        invalidSamples.push({ raw: raw || "(vazio)", normalized });
      }
      continue;
    }
    if (seen.has(normalized)) {
      duplicates += 1;
      continue;
    }
    seen.add(normalized);
    imported.push(normalized);
  }

  imported.sort();

  mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, `${JSON.stringify({ cpfs: imported }, null, 2)}\n`, "utf-8");

  console.log("");
  console.log("Relatório:");
  console.log(`  total lidos:     ${values.length}`);
  console.log(`  importados:      ${imported.length}`);
  console.log(`  duplicados:      ${duplicates}`);
  console.log(`  inválidos:       ${invalid}`);
  console.log(`  saída:           ${OUT_FILE}`);

  if (invalidSamples.length > 0) {
    console.log("");
    console.log("Amostra de inválidos (até 20):");
    for (const sample of invalidSamples) {
      console.log(`  - raw=${JSON.stringify(sample.raw)} normalized=${sample.normalized}`);
    }
  }
}

main();
