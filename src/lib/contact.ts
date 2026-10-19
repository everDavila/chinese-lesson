// Contacto de Renshi: pedir acceso (por invitación) y proponer ideas, por
// correo, sin formulario ni tabla. El asunto y el texto vienen del espacio
// de traducción "Contact", en el idioma de la interfaz.
export const CONTACT = "renshi@davila.uno";

export const mailto = (subject: string, body: string) =>
  `mailto:${CONTACT}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
