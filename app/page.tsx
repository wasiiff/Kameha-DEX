import { redirect } from "next/navigation";

export default function Home() {
  // root redirect to dex
  redirect("/dex");
}
