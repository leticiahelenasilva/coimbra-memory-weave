import { ReactNode } from "react";

export const Stamp = ({ children, dot = true }: { children: ReactNode; dot?: boolean }) => (
  <span className="stamp">
    {dot && <span className="h-1.5 w-1.5 rounded-full bg-lilac-deep" />}
    {children}
  </span>
);
