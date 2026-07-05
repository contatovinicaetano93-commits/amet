import Image from "next/image";

type AmetMarkProps = {
  className?: string;
};

/**
 * Símbolo AMET — triângulo entrelaçado oficial (rosa, azul e índigo),
 * arte original da marca em /public/amet-mark.png (fundo transparente).
 */
export function AmetMark({ className }: AmetMarkProps) {
  return (
    <Image
      src="/amet-mark.png"
      alt=""
      aria-hidden
      width={146}
      height={138}
      className={`object-contain ${className ?? ""}`}
    />
  );
}
