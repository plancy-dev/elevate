import { redirect } from "next/navigation";

export default function ProductionsChannelsRedirectPage() {
  redirect("/dashboard/productions?studio=channels");
}
