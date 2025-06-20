"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginForm } from "./_components/loginform";
import Image from "next/image";

export default function LoginPage() {
  const {status} = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/"); // redireciona para tela inicial
    }
  }, [status, router]);

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[40%_60%]">
      {/* Formulário lado esquerdo */}
      <div className="flex flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-xs">
          <LoginForm />
        </div>
      </div>

      {/* Imagem lado direito */}
      <div className="relative h-full w-full">
        <Image
          src="/login.png"
          alt="Imagem de fundo"
          fill
          className="object-cover dark:brightness-[0.3] dark:grayscale"
          priority
        />
      </div>
    </div>
  );
}
