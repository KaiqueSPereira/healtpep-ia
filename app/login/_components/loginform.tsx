"use client";
import { Button } from "@/app/_components/ui/button";
import Image from "next/image";
import { cn } from "@/app/_lib/utils";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const router = useRouter();

  const handleloginifgoogleclick = async () => {
    const result = await signIn("google", { redirect: false });

    if (result?.ok) {
      router.push("/"); // Redireciona para a tela inicial
    } else {
      console.error("Erro ao fazer login:", result?.error);
      // Exibir mensagem de erro para o usuário, se necessário
    }
  };

  return (
    <form className={cn("flex flex-col gap-6", className)} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Health Pep</h1>
        <p className="text-balance text-sm text-muted-foreground">
          Faça login com sua conta Google
        </p>
      </div>
      <div className="grid gap-6">
        <Button
          variant="outline"
          className="gap-2 font-bold"
          onClick={handleloginifgoogleclick}
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
