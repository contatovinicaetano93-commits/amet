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
