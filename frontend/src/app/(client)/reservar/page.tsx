import type { Metadata } from "next";
import { HOTEL } from "@/lib/hotel-config";
import BookingWizard from "./BookingWizard";

export const metadata: Metadata = {
  title: `Reservar — ${HOTEL.nombre}`,
};

export default async function ReservarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  return <BookingWizard params={sp} />;
}
