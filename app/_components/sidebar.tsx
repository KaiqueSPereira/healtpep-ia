"use client";
import { Button } from "./ui/button";
import {
  CalendarIcon,
  ClipboardPlus,
  HomeIcon,
  Hospital,
  LogInIcon,
  LogOutIcon,
} from "lucide-react";
import { SheetClose, SheetContent, SheetHeader, SheetTitle } from "./ui/sheet";
import { Avatar, AvatarImage } from "./ui/avatar";
import Link from "next/link";
import { Dialog, DialogTrigger } from "./ui/dialog";
import { signOut, useSession } from "next-auth/react";
import SingInDialog from "./sing-in-dialog";
import { User } from "lucide-react";

const Sidebarbotton = () => {
  const { data } = useSession();
  const handlelogoutclick = () => signOut();

  return (
    <SheetContent className="overflow-y-auto flex flex-col h-full">
      <SheetHeader>
        <SheetTitle>Menu</SheetTitle>
      </SheetHeader>

      <div className="items-centerborder-solid flex justify-between gap-3 border-b py-5">
        {data?.user ? (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={data?.user?.image ?? ""} />
            </Avatar>
            <div className="ml-3 flex flex-col">
              <p className="font-bold">{data?.user?.name}</p>
              <p className="text-sm text-gray-400">{data?.user?.email}</p>
            </div>
          </div>
        ) : (
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
      <div className="boder-b flex flex-col gap-2 border-solid py-5 flex-grow">
        <SheetClose asChild>
          <Button className="justify-startgap-2" variant="ghost" asChild>
            <Link href="/">
              <HomeIcon size={18} /> Inicio
            </Link>
          </Button>
        </SheetClose>
        <Button className="justify-startgap-2" variant="ghost">
          <CalendarIcon size={18} />
          Agendamentos
        </Button>
        <Button className="flex items-center gap-2" variant="ghost">
          <Hospital size={18} />
          <Link href="/unidades" className="text-inherit no-underline">
            Unidades
          </Link>
        </Button>
        <Button className="flex items-center gap-2" variant="ghost">
          <User size={18} />
          <Link href="/profissionais" className="text-inherit no-underline">
            Profissionais
          </Link>
        </Button>
        <Button className="flex items-center gap-2" variant="ghost">
          <ClipboardPlus size={18} />
          <Link href="/exames" className="text-inherit no-underline">
            Exames
          </Link>
        </Button>
      </div>
      <div className="flex flex-col gap-2 py-5">
        <Button
          className="justify-startgap-2"
          variant="ghost"
          onClick={handlelogoutclick}
        >
          <LogOutIcon size={18} /> Sair da Conta
        </Button>
      </div>
    </SheetContent>
  );
};

export default Sidebarbotton;
