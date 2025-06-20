"use client";

import { Toaster } from "./ui/toaster";
import AuthProvider from "../_providers/auth"; // Assuming AuthProvider is in _providers folder
import { ThemeProvider } from "next-themes";

interface ProvidersProps {
  children: React.ReactNode;
}

const Providers = ({ children }: ProvidersProps) => {
  return (
    <ThemeProvider attribute="class">
      <AuthProvider>{children}</AuthProvider>
      <Toaster />
    </ThemeProvider>
  );
};

export default Providers;