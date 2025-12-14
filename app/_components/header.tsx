'use client';
import Image from 'next/image';
import { Card, CardContent } from './ui/card';
import Link from 'next/link';
import { Button } from './ui/button';
import { MenuIcon, MoonIcon, SunIcon } from 'lucide-react';
import { Sheet, SheetTrigger } from './ui/sheet';
import { useTheme } from 'next-themes';

import Sidebarbotton from './sidebar';
import NotificationBell from './notification-bell'; // Importado

const Header = () => {
  const { theme, setTheme } = useTheme();

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
            <Sidebarbotton />
          </Sheet>
        </div>
      </CardContent>
    </Card>
  );
};

export default Header;
