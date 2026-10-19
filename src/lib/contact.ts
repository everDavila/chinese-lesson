// Contacto de Renshi: pedir acceso (por invitación) y proponer ideas, por
// correo, sin formulario ni tabla. Lo usan el login y la portada.
const CONTACT = "renshi@davila.uno";
const mailto = (subject: string, body: string) =>
  `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

export const ACCESS_MAIL = mailto(
  "Quiero acceso a Renshi",
  "Hola:\n\nEnseño chino y me gustaría probar Renshi.\n\n¿A quién enseño? (niveles, clases por videollamada o presenciales):\n\n¿Qué uso hoy para preparar el vocabulario?\n\nGracias.",
);
export const IDEA_MAIL = mailto("Una idea para Renshi", "Hola:\n\nEnseño o aprendo chino y me gustaría que Renshi…\n");
