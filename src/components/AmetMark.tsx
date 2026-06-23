type AmetMarkProps = {
  className?: string;
};

/**
 * Símbolo AMET — três braços entrelaçados (nó triangular) nas cores oficiais.
 * Vetor puro, sem fundo nem relevo de imagem.
 */
export function AmetMark({ className }: AmetMarkProps) {
  return (
    <svg
      viewBox="0 0 100 92"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path
        d="M50 10 L50 38 L22 38 C14 38 10 42 10 50 L10 62"
        stroke="#B355C9"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M50 10 L50 38 L78 38 C86 38 90 42 90 50 L90 62"
        stroke="#285ACE"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 62 L50 62 L50 82 C50 86 54 90 62 90 L78 90"
        stroke="#1C2493"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
