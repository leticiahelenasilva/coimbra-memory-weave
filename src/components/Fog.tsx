// Decorative fog backdrop — evokes the Mondego at dawn
export const Fog = ({ intensity = 1 }: { intensity?: number }) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        className="absolute -inset-[10%] fog-layer animate-fog"
        style={{ opacity: 0.55 * intensity }}
      />
      <div
        className="absolute -inset-[15%] fog-layer animate-fog"
        style={{ opacity: 0.35 * intensity, animationDuration: "26s", animationDirection: "reverse" }}
      />
    </div>
  );
};
