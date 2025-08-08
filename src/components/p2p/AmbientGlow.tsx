import React from "react";

interface AmbientGlowProps {
  className?: string;
}

const AmbientGlow: React.FC<AmbientGlowProps> = ({ className }) => {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      el.style.setProperty("--mx", `${x}px`);
      el.style.setProperty("--my", `${y}px`);
    };
    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <div
      ref={ref}
      className={
        "relative overflow-hidden rounded-lg border border-sidebar-border bg-gradient-to-b from-background to-[hsl(var(--surface-1))] " +
        (className ?? "")
      }
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px opacity-60 [background:radial-gradient(300px_300px_at_var(--mx)_var(--my),hsl(var(--brand)/0.25),transparent_60%)]"
      />
      {/** children will be passed by composing with this component as a wrapper */}
    </div>
  );
};

export default AmbientGlow;
