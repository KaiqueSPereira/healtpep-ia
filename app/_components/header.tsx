
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
// CORREÇÃO: Importando DialogContent que estava faltando.
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import SingInDialog from '@/app/login/_components/sing-in-dialog';
import useAuthStore from '../_stores/authStore';
import { Loader2 } from 'lucide-react';

const Header = () => {
  const { theme, setTheme } = useTheme();
  const { session, status } = useAuthStore();
  const handleLogoutClick = () => signOut();
  const buttonClasses = "w-full justify-center gap-2 text-xs font-semibold py-2 hover:bg-destructive/10 hover:text-destructive";

  return (
    <Card className="border-none shadow-sm">
      <CardContent className="flex flex-row items-center justify-between p-2">
        <Link href="/">
          <Image src="/iconprontuario.png" alt="icon" width={45} height={45} />
        </Link>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          >
            {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="border-none">
                <MenuIcon size={20}/>
              </Button>
            </SheetTrigger>
            <SheetContent className="p-0 flex flex-col w-[260px]">
              <SheetHeader className="border-b border-solid p-3 text-center">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="flex flex-col flex-grow">
                <div className="border-solid flex justify-center border-b p-3">
                  {status === 'loading' && (
                    <div className="flex items-center justify-center w-full h-[76px]"><Loader2 className="h-5 w-5 animate-spin" /></div>
                  )}
                  {status === 'authenticated' && session?.user ? (
                    <Link href={`/users/${session.user.id}`}>
                      <div className="flex flex-col items-center gap-1">
                        <Avatar className="h-12 w-12"><AvatarImage src={session.user.image ?? ""} /></Avatar>
                        <div className="text-center">
                          <p className="font-bold text-sm">{session.user.name}</p>
                          <p className="text-xs text-gray-400">{session.user.email}</p>
                        </div>
                      </div>
                    </Link>
                  ) : status === 'unauthenticated' && (
                    <div className="flex flex-col items-center gap-2">
                      <h2 className="font-bold text-sm">Olá, faça o seu login</h2>
                      {/* CORREÇÃO: Adicionando DialogContent para encapsular o formulário de login */}
                      <Dialog>
                        <DialogTrigger asChild><Button size="sm"><LogInIcon className="mr-2 h-4 w-4" /> Entrar</Button></DialogTrigger>
                        <DialogContent>
                           <SingInDialog />
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-0 p-1">
                    <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/"><HomeIcon size={14} /> Inicio</Link></Button></SheetClose>
                    <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/consulta"><CalendarIcon size={14} /> Consultas</Link></Button></SheetClose>
                    <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/unidades"><Hospital size={14} /> Unidades</Link></Button></SheetClose>
                    <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/profissionais"><UserIcon size={14} /> Profissionais</Link></Button></SheetClose>
                    <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/exames"><ClipboardPlus size={14} /> Exames</Link></Button></SheetClose>
                    <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/medicamentos"><Pill size={14} /> Medicamentos</Link></Button></SheetClose>
                </div>
              </div>

              <div className="flex flex-col gap-0 p-1 border-t border-solid">
                  <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/docs"><BadgeInfo size={14} /> Sobre</Link></Button></SheetClose>
                  {/* CORREÇÃO: Verificando role como uma string, não um objeto */}
                  {status === 'authenticated' && session?.user?.role === 'ADMIN' && (
                      <SheetClose asChild><Button className={buttonClasses} variant="ghost" asChild><Link href="/admin"><Shield size={14} /> Administração</Link></Button></SheetClose>
                  )}
                  {status === 'authenticated' && (
                      <Button className={buttonClasses} onClick={handleLogoutClick} variant="ghost"><LogOutIcon size={14} /> Sair da Conta</Button>
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
