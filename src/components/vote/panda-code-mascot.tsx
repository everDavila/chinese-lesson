import Image from "next/image";
import { cn } from "@/lib/utils";

const GAZE_POSITION = [
  "-translate-x-1.5",
  "-translate-x-1",
  "-translate-x-0.5",
  "translate-x-0.5",
  "translate-x-1",
  "translate-x-1.5",
] as const;

type PandaCodeMascotProps = {
  activeIndex: number | null;
  reaction?: "idle" | "confused" | "success";
};

/**
 * Mascota decorativa del acceso de alumnos. El panda mira la casilla activa;
 * el formulario sigue siendo un único input accesible y no depende del dibujo.
 */
export const PandaCodeMascot = ({ activeIndex, reaction = "idle" }: PandaCodeMascotProps) => {
  const gazePosition = activeIndex === null ? "translate-x-0" : GAZE_POSITION[activeIndex];

  return (
    <div
      aria-hidden="true"
      data-testid="panda-mascot"
      data-reaction={reaction}
      className={cn(
        "relative mx-auto aspect-square w-40 sm:w-44",
        reaction === "confused" && "motion-safe:animate-[panda-confused_700ms_ease-out]",
        reaction === "success" && "motion-safe:animate-[panda-success_850ms_ease-out]",
      )}
    >
      <Image
        src="/mascot/panda-code-head-base.webp"
        alt=""
        fill
        priority
        sizes="(min-width: 640px) 176px, 160px"
        className="object-contain drop-shadow-sm"
      />
      <Image
        src="/mascot/panda-code-head-pupils.webp"
        alt=""
        fill
        priority
        sizes="(min-width: 640px) 176px, 160px"
        data-testid="panda-pupils"
        data-gaze-index={activeIndex ?? "rest"}
        className={cn(
          "object-contain transition-transform duration-200 ease-out motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:transition-none",
          reaction === "success" && "scale-y-50 opacity-0",
          reaction === "confused" && "translate-y-2 scale-90",
          reaction === "idle" && activeIndex !== null && "translate-y-1",
          reaction === "idle" && gazePosition,
        )}
      />
      {reaction === "success" ? (
        <>
          <span className="absolute left-[24%] top-[49%] h-[11%] w-[17%] rounded-[50%] border-t-[5px] border-neutral-950" />
          <span className="absolute right-[24%] top-[49%] h-[11%] w-[17%] rounded-[50%] border-t-[5px] border-neutral-950" />
          <span className="absolute left-[20%] top-[63%] h-2 w-7 rounded-full bg-rose-300/70 blur-[1px]" />
          <span className="absolute right-[20%] top-[63%] h-2 w-7 rounded-full bg-rose-300/70 blur-[1px]" />
        </>
      ) : null}
      {reaction === "confused" ? (
        <>
          <span className="absolute left-[24%] top-[58%] h-5 w-2 rotate-12 rounded-[70%_30%_65%_35%] bg-sky-400/90 shadow-sm motion-safe:animate-[panda-tear_700ms_ease-in]" />
          <span className="absolute left-1/2 top-[65%] h-[16%] w-[30%] -translate-x-1/2 rounded-full bg-[#fbf8ed]">
            <span className="absolute left-1/2 top-[32%] h-[45%] w-[65%] -translate-x-1/2 rounded-[50%] border-t-[4px] border-neutral-950" />
          </span>
        </>
      ) : null}
    </div>
  );
};
