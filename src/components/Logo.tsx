import { BUSINESS } from "@/lib/business";

type Props = {
  className?: string;
};

/** Plain img so html2canvas can capture it in PDF downloads. */
export function Logo({ className }: Props) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- html2canvas needs a plain img
    <img src={BUSINESS.logoSrc} alt={BUSINESS.name} className={className} />
  );
}
