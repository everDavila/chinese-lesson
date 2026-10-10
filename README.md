# chinese-lesson

Plataforma web para aprender vocabulario chino **en contexto**, pensada para
clases online.

## Descripción

Las tarjetas tradicionales (tipo Quizlet) muestran palabras sueltas:
`认识 → conocer`. Así no se distinguen sinónimos aparentes (房子 / 家), no se
ven los distintos usos de una palabra (家 también es clasificador: 一家公司) y
partículas como 了 o 过 son imposibles de entender.

Esta plataforma propone aprender cada palabra **dentro de frases**, con una
herramienta hecha específicamente para el chino:

- **La profesora solo escribe la palabra.** El sistema genera pinyin,
  significado, nivel HSK, descomposición en caracteres y radicales, frases de
  ejemplo actuales del mismo nivel y una nota cultural. Ella revisa y aprueba.
- **Tarjetas para el alumno** con animación del orden de trazos, radicales en
  color, pinyin ocultable, audio y una frase con hueco como pista.
- **Ficha ampliable** con la historia del carácter y notas culturales para
  quien quiera profundizar.
- **Panel de la profesora** con un semáforo por palabra (🟢 ya la saben ·
  🟡 repasar · 🔴 reforzar) para preparar la próxima clase.
- **Trilingüe:** chino, español (alumnos) e inglés (profesora).
- **Base curada propia:** cada corrección queda guardada y mejora el
  contenido para las siguientes lecciones.

## Estado

En fase de diseño. Primero se construirá una **demo (MVP)** para mostrársela a
la profesora.

## Stack

- Next.js + TypeScript, desplegado en Vercel.
- Tailwind + shadcn/ui (propuesta).
- Supabase para datos y login (propuesta).
- Recursos para chino: Hanzi Writer, CC-CEDICT, listas HSK y Make Me a Hanzi.

## Documentación

| Archivo | Contenido |
|---|---|
| [IDEA.md](IDEA.md) | Origen de la idea, argumentos, referencias y requisitos |
| [ARQUITECTURA.md](ARQUITECTURA.md) | Recursos externos, motor de contenido, modelo de datos, pantallas y fases |
| [BRIEF-DISENO.md](BRIEF-DISENO.md) | Brief para el diseño visual (listo para pasar a otro modelo o diseñador) |
| [AGENTS.md](AGENTS.md) | Contexto, reglas y bitácora para agentes de IA |
| [LECCIONES.md](LECCIONES.md) | Lecciones técnicas heredadas de otros proyectos |
