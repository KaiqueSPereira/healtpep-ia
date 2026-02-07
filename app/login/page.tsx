// Em app/login/page.tsx
"use client";

import { useEffect } from "react";
import useAuthStore from "@/app/_stores/authStore"; 
import { useRouter } from "next/navigation";
import { LoginForm } from "./_components/loginform";
import Image from "next/image";

export default function LoginPage() {
  const { status } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[40%_60%]">
      {/* Esta coluna agora permite que o conteúdo interno dite sua própria largura com base no padding */}
      <div className="flex flex-col items-center justify-center bg-background px-8 py-12 sm:px-12 md:px-16 lg:px-20">
        {/* 
          CORREÇÃO: A classe `max-w-*` foi removida.
          Agora, o formulário ocupará 100% da largura do contêiner pai (w-full).
          O tamanho do contêiner pai é controlado pelo padding horizontal responsivo (px-*) na linha acima.
          Isso torna o layout fluido e adaptável a qualquer tamanho de tela.
        */}
        <div className="w-full">
          <LoginForm />
        </div>
      </div>
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
