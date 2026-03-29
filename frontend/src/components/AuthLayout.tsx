import { Outlet } from "react-router-dom";

export function AuthLayout() {
  return (
    <div className="h-screen w-full relative flex items-center justify-center bg-background overflow-hidden p-4">
      {/* Dynamic Background Decoration */}
      <div
        className="absolute inset-0 z-0 opacity-30"
        style={{
          background: "hsl(var(--background))",
          backgroundImage: `
            radial-gradient(
              circle at top right,
              oklch(0.75 0.15 190.00),
              transparent 70%
            )
          `,
          filter: "blur(80px)",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #e5e7eb 1px, transparent 1px), linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
          maskImage: `radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)`,
          WebkitMaskImage: `radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)`,
        }}
      />
      {/* Content */}
      <div className="relative z-10 w-full flex justify-center">
        <Outlet />
      </div>
    </div>
  );
}
