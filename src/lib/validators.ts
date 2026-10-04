export function stripDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCpf(raw: string): boolean {
  const cpf = stripDigits(raw);

  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const calcDigit = (slice: string, factor: number) => {
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

export function formatCpf(value: string): string {
  const digits = stripDigits(value).slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatCep(value: string): string {
  const digits = stripDigits(value).slice(0, 8);
  return digits.replace(/(\d{5})(\d{1,3})/, "$1-$2");
}

export function isValidCep(raw: string): boolean {
  return stripDigits(raw).length === 8;
}

/** Accepts YYYY-MM-DD; must be a real past date, age between 14 and 90. */
export function isValidBirthDate(raw: string): boolean {
  const value = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return false;
  }
  const today = new Date();
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (date.getTime() >= todayUtc) return false;
  const age =
    today.getFullYear() -
    year -
    (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)
      ? 1
      : 0);
  return age >= 14 && age <= 90;
}

export function formatBirthDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function formatPhone(value: string): string {
  const digits = stripDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}
