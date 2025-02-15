"use client";

import SingInDialog from "@/app/_components/sing-in-dialog";
import { Dialog, DialogContent } from "@/app/_components/ui/dialog";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
 

  return (
    <form className={`flex flex-col gap-6 ${className}`} {...props}>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold">Health Pep</h1>
        <p className="text-sm text-muted-foreground">
          Faça login com sua conta Google
        </p>
      </div>
      <div>
        <Dialog open
          
        >
          <DialogContent>
            <SingInDialog />
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
}
