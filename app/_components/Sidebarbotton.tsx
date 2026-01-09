'use client';
import { Button } from './ui/button';
import {
  BadgeInfo,
  CalendarIcon,
  ClipboardPlus,
  HomeIcon,
  Hospital,
  LogInIcon,
  LogOutIcon,
  Pill,
  User,
} from 'lucide-react';
import { SheetClose, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Avatar, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import { Dialog, DialogTrigger } from './ui/dialog';
import { signOut, useSession } from 'next-auth/react';
import SingInDialog from '@/app/login/_components/sing-in-dialog';

const Sidebarbotton = () => {
  const { data } = useSession();
  const handlelogoutclick = () => signOut();

  return (
    <SheetContent className="flex flex-col">
      <SheetHeader>
        <SheetTitle>Menu</SheetTitle>
      </SheetHeader>

      <div className="items-center border-solid flex justify-between gap-3 border-b py-5">
        {data?.user ? (
          <SheetClose asChild>
            <Link href={`/users/${data.user.id}`} className="flex items-center gap-3 w-full">
              <Avatar>
                <AvatarImage src={data.user.image ?? ""} />
              </Avatar>
              <div className="flex flex-col">
                <p className="font-bold">{data.user.name}</p>
                <p className="text-sm text-gray-400">{data.user.email}</p>
              </div>
            </Link>
          </SheetClose>
        ) : (
          <>
            <div className="flex-1">
              <h2 className="font-bold">Olá, faça o seu login</h2>
            </div>
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

      <div className="flex flex-col gap-2 py-5">
        <SheetClose asChild>
          <Button className="justify-start gap-2" variant="ghost" asChild>
            <Link href="/">
              <HomeIcon size={18} /> Inicio
            </Link>
          </Button>
        </SheetClose>

        {data?.user && (
          <>
            <SheetClose asChild>
              <Button className="justify-start gap-2" variant="ghost" asChild>
                <Link href="/consulta">
                  <CalendarIcon size={18} />
                  Consultas
                </Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button className="justify-start gap-2" variant="ghost" asChild>
                <Link href="/unidades">
                  <Hospital size={18} />
                  Unidades
                </Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button className="justify-start gap-2" variant="ghost" asChild>
                <Link href="/profissionais">
                  <User size={18} />
                  Profissionais
                </Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button className="justify-start gap-2" variant="ghost" asChild>
                <Link href="/exames">
                  <ClipboardPlus size={18} />
                  Exames
                </Link>
              </Button>
            </SheetClose>
            <SheetClose asChild>
              <Button className="justify-start gap-2" variant="ghost" asChild>
                <Link href="/medicamentos">
                  <Pill size={18} />
                  Medicamentos
                </Link>
              </Button>
            </SheetClose>
          </>
        )}
      </div>

      <div className="mt-auto flex flex-col gap-2 border-t border-solid py-5">
        <SheetClose asChild>
          <Button className="justify-start gap-2" variant="ghost" asChild>
            <Link href="/docs">
              <BadgeInfo size={18} /> Sobre
            </Link>
          </Button>
        </SheetClose>
        {data?.user && (
          <Button
            className="justify-start gap-2"
            onClick={handlelogoutclick}
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
