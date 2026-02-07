"use client";
import { Button } from "./ui/button";
import {
  BadgeInfo,
  CalendarIcon,
  ClipboardPlus,
  HomeIcon,
  Hospital,
  LogInIcon,
  LogOutIcon,
  Pill,
  User as UserIcon, // Renomeado para evitar conflito
} from "lucide-react";
import { SheetClose, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Avatar, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { Dialog, DialogTrigger } from "./ui/dialog";
import { signOut } from "next-auth/react";
import SingInDialog from "@/app/login/_components/sing-in-dialog";
import useAuthStore from "../_stores/authStore";
import { Loader2 } from "lucide-react";

const Sidebarbotton = () => {
  const { session, status } = useAuthStore();
  const handleLogoutClick = () => signOut();

  return (
    <SheetContent className="overflow-y-auto flex flex-col">
      <SheetHeader>
        <SheetTitle>Menu</SheetTitle>
      </SheetHeader>

      <div className="items-center border-solid flex justify-between gap-3 border-b py-5">
        {status === 'loading' && (
          <div className="flex items-center justify-center w-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}
        {status === 'authenticated' && session?.user ? (
          <Link href={`/users/${session.user.id}`}>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={session.user.image ?? ""} />
              </Avatar>
              <div className="ml-3 flex flex-col">
                <p className="font-bold">{session.user.name}</p>
                <p className="text-sm text-gray-400">{session.user.email}</p>
              </div>
            </div>
          </Link>
        ) : status === 'unauthenticated' && (
          <>
            <h2 className="font-bold">Olá, faça o seu login</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon">
                  <LogInIcon />
                </Button>
              </DialogTrigger>
              <SingInDialog />
            </Dialog>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2 border-b border-solid py-5">
        <SheetClose asChild>
          <Button className="justify-start gap-2" variant="ghost" asChild>
            <Link href="/">
              <HomeIcon size={18} /> Inicio
            </Link>
          </Button>
        </SheetClose>
        {/* Outros links de navegação... */}
        <Button className="justify-start gap-2" variant="ghost" asChild>
            <Link href="/consulta"><CalendarIcon size={18} /> Consultas</Link>
        </Button>
        <Button className="justify-start gap-2" variant="ghost" asChild>
            <Link href="/unidades"><Hospital size={18} /> Unidades</Link>
        </Button>
        <Button className="justify-start gap-2" variant="ghost" asChild>
            <Link href="/profissionais"><UserIcon size={18} /> Profissionais</Link>
        </Button>
        <Button className="justify-start gap-2" variant="ghost" asChild>
            <Link href="/exames"><ClipboardPlus size={18} /> Exames</Link>
        </Button>
        <Button className="justify-start gap-2" variant="ghost" asChild>
            <Link href="/medicamentos"><Pill size={18} /> Medicamentos</Link>
        </Button>
      </div>

      <div className="mt-auto flex flex-col gap-2 py-5 border-t border-solid">
        <Button className="justify-start gap-2" variant="ghost" asChild>
          <Link href="/docs"><BadgeInfo size={18} /> Sobre</Link>
        </Button>

        {status === 'authenticated' && (
          <Button
            className="justify-start gap-2"
            onClick={handleLogoutClick}
            variant="ghost"
          >
            <LogOutIcon size={18} /> Sair da Conta
          </Button>
        )}
      </div>
    </SheetContent>
  );
};

export default Sidebarbotton;
