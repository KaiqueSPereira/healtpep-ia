// Em app/login/page.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react"; // Importe useSession
import { useRouter } from "next/navigation";
import { LoginForm } from "./_components/loginform";
import Image from "next/image";

export default function LoginPage() {
  const { status } = useSession(); // Use useSession para obter o status da sessão
  const router = useRouter();

  useEffect(() => {
    // Verifique se o status é 'authenticated'
    if (status === "authenticated") {
      router.push("/"); // redireciona para tela inicial
    }
  }, [status, router]); // Adicione status como dependência do useEffect

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[40%_60%]">
      {/* Formulário lado esquerdo */}
      <div className="flex flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-xs">
          <LoginForm />
        </div>
      </div>
      {/* Imagem lado direito */}
      <div className="relative hidden lg:block">
        <Image
          src="/login.png"
          alt="Login Image"
          layout="fill"
          objectFit="cover"
        />
      </div>
    </div>
  );
}
