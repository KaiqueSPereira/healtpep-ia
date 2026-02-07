
'use client';
import Image from 'next/image';
import { Card, CardContent } from './ui/card';
import Link from 'next/link';
import { Button } from './ui/button';
import {
  MenuIcon, MoonIcon, SunIcon, BadgeInfo, CalendarIcon, ClipboardPlus,
  HomeIcon, Hospital, LogInIcon, LogOutIcon, Pill, Shield, User as UserIcon
} from 'lucide-react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { useTheme } from 'next-themes';
import NotificationBell from './notification-bell';
import { signOut } from 'next-auth/react';
import { Avatar, AvatarImage } from './ui/avatar';
import { Dialog, DialogTrigger } from './ui/dialog';
import SingInDialog from '@/app/login/_components/sing-in-dialog';
import useAuthStore from '../_stores/authStore';
import { Loader2 } from 'lucide-react';

const Header = () => {
  const { theme, setTheme } = useTheme();
  const { session, status } = useAuthStore();
  const handleLogoutClick = () => signOut();
  const buttonClasses = "justify-center gap-2 hover:bg-destructive/10 hover:text-destructive";

  return (
    <Card className="border-none">
      <CardContent className="flex flex-row items-center justify-between p-4">
        <Link href="/">
          <Image src="/iconprontuario.png" alt="icon" width={80} height={80} />
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <MoonIcon size={18} /> : <SunIcon size={18} />}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="border-none">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent className="p-0 flex flex-col">
              <SheetHeader className="border-b border-solid p-5">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              {/* Conteúdo do antigo sidebar.tsx */}
              <div className="items-center border-solid flex justify-center border-b p-5">
                {status === 'loading' && (
                  <div className="flex items-center justify-center w-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
                )}
                {status === 'authenticated' && session?.user ? (
                  <Link href={`/users/${session.user.id}`}>
                    <div className="flex flex-col items-center gap-3">
                      <Avatar className="h-16 w-16"><AvatarImage src={session.user.image ?? ""} /></Avatar>
                      <div className="text-center">
                        <p className="font-bold">{session.user.name}</p>
                        <p className="text-sm text-gray-400">{session.user.email}</p>
                      </div>
                    </div>
                  </Link>
                ) : status === 'unauthenticated' && (
                  <div className="flex flex-col items-center gap-3">
                    <h2 className="font-bold">Olá, faça o seu login</h2>
                    <Dialog>
                      <DialogTrigger asChild><Button><LogInIcon className="mr-2" /> Entrar</Button></DialogTrigger>
                      <SingInDialog />
                    </Dialog>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 p-5">
                  <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/"><HomeIcon size={18} /> Inicio</Link></Button></SheetClose>
                  <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/consulta"><CalendarIcon size={18} /> Consultas</Link></Button></SheetClose>
                  <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/unidades"><Hospital size={18} /> Unidades</Link></Button></SheetClose>
                  <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/profissionais"><UserIcon size={18} /> Profissionais</Link></Button></SheetClose>
                  <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/exames"><ClipboardPlus size={18} /> Exames</Link></Button></SheetClose>
                  <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/medicamentos"><Pill size={18} /> Medicamentos</Link></Button></SheetClose>
              </div>

              <div className="mt-auto flex flex-col gap-3 p-5 border-t border-solid">
                  <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/docs"><BadgeInfo size={18} /> Sobre</Link></Button></SheetClose>
                  {status === 'authenticated' && session?.user?.role?.name === 'ADMIN' && (
                      <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/admin"><Shield size={18} /> Administração</Link></Button></SheetClose>
                  )}
                  {status === 'authenticated' && (
                      <Button className={buttonClasses} onClick={handleLogoutClick} variant="ghost"><LogOutIcon size={18} /> Sair da Conta</Button>
                  )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </CardContent>
    </Card>
  );
};

export default Header;
