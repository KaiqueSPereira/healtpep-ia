"use client";

import { Button } from "@/app/_components/ui/button";
import Image from "next/image";
import { signIn } from "next-auth/react";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const handleLoginGoogleClick = () => signIn("google", { callbackUrl: "/" });

  return (
    <form className={`flex flex-col gap-6 ${className}`} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        {/* Logo do site */}
        <Image
          src="/iconprontuario.png" 
          width={64}
          height={64}
          alt="Logo"
          className="mb-2"
        />

        <h1 className="text-2xl font-bold">Health Pep</h1>
        <p className="text-sm text-muted-foreground">
          Faça login com sua conta Google
        </p>
      </div>

      <div>
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2 font-bold"
          onClick={handleLoginGoogleClick}
        >
          <Image
            src="/icons-google.svg"
            width={18}
            height={18}
            alt="Google Icon"
          />
          Google
        </Button>
      </div>
    </form>
  );
}
