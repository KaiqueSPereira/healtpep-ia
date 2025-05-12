import Image from "next/image";
import { Card, CardContent } from "./ui/card";
import Link from "next/link";
import { Button } from "./ui/button";
import { MenuIcon } from "lucide-react";
import { Sheet, SheetTrigger } from "./ui/sheet";

import Sidebarbotton from "./sidebar";

const Header = () => {
  return (
    <Card>
      <CardContent className="flex flex-row items-center justify-between p-4">
        <Link href="/">
          <Image src="/iconprontuario.png" alt="icon" width={80} height={80} />
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <Sidebarbotton />
        </Sheet>
      </CardContent>
    </Card>
  );
};

export default Header;
