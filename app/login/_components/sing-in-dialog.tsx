
import { signIn } from "next-auth/react";
import { Button } from "@/app/_components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/_components/ui/dialog";
import Image from "next/image";

const SingInDialog = () => {
    const handleloginifgoogleclick = () => signIn("google");
    
    return (
      <DialogContent className="w-[70%]">
        <DialogHeader>
          <DialogTitle>Faça o seu login</DialogTitle>
          <DialogDescription>
            Conecte-se usando a sua conta Google
          </DialogDescription>
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
        </DialogHeader>
      </DialogContent>
    );
}
 
export default SingInDialog;