"use client";

import { useParams } from "next/navigation";
import { AdminWordEditor, AdminWordsScreen } from "./admin";
import { CollectionScreen, CollectionsScreen, type Mode } from "./collections";
import { LessonEditor } from "./lesson-editor";

// Las páginas del prototipo leen los parámetros en el cliente: los datos
// viven en el navegador, así que no hay nada que preparar en el servidor.

export function CollectionsRoute({ mode }: { mode: Mode }) {
  return <CollectionsScreen mode={mode} />;
}
export function CollectionRoute({ mode }: { mode: Mode }) {
  const { coleccion } = useParams<{ coleccion: string }>();
  return <CollectionScreen mode={mode} collectionId={coleccion} />;
}
export function LessonRoute({ mode }: { mode: Mode }) {
  const { coleccion, leccion } = useParams<{ coleccion: string; leccion: string }>();
  return <LessonEditor mode={mode} collectionId={coleccion} lessonId={leccion} />;
}
export function AdminWordsRoute() {
  return <AdminWordsScreen />;
}
export function AdminWordRoute() {
  const { hanzi } = useParams<{ hanzi: string }>();
  return <AdminWordEditor hanzi={decodeURIComponent(hanzi)} />;
}
