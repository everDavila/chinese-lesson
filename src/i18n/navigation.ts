import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Link, redirect y router que conservan el prefijo de idioma.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
