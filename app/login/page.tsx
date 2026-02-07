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
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[40%_60%]">
      <div className="flex flex-col items-center justify-center bg-background p-8">
        <div className="w-full max-w-xs">
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
