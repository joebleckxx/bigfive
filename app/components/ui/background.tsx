type Props = { className?: string };

export default function TMJBackground({ className = "" }: Props) {
  return <div aria-hidden="true" className={`tmj-background pointer-events-none absolute inset-0 ${className}`} />;
}
