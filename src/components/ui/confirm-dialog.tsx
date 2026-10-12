"use client";

import { useCallback, useRef, useState } from "react";
import { AlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "@/components/ui/button";

// Confirmación propia en lugar de window.confirm (auditoría UX/UI
// 2026-10-12): con el estilo y el idioma de la app, foco atrapado, Escape para
// cancelar, y que el navegador no pueda suprimir (borrar sin confirmar).
//
//   const [confirm, dialog] = useConfirm();
//   if (await confirm({ title: "¿Borrar…?", confirmLabel: "Borrar", cancelLabel: "Cancelar" })) …
//   return <>{…}{dialog}</>;

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  /** Acción que borra o descarta: botón en rojo. */
  destructive?: boolean;
};

export function useConfirm(): [(options: ConfirmOptions) => Promise<boolean>, React.ReactNode] {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    resolver.current?.(false); // una confirmación pendiente anterior cuenta como cancelada
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setOptions(null);
  };

  const dialog = (
    <AlertDialog.Root open={options !== null} onOpenChange={(open) => !open && close(false)}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <AlertDialog.Popup className="fixed top-1/2 left-1/2 z-50 flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border border-border bg-card p-5 text-card-foreground shadow-xl">
          <AlertDialog.Title className="text-lg font-semibold">{options?.title}</AlertDialog.Title>
          {options?.description && (
            <AlertDialog.Description className="text-sm text-muted-foreground">{options.description}</AlertDialog.Description>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => close(false)}>
              {options?.cancelLabel}
            </Button>
            <Button variant={options?.destructive ? "destructive" : "default"} onClick={() => close(true)}>
              {options?.confirmLabel}
            </Button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );

  return [confirm, dialog];
}
