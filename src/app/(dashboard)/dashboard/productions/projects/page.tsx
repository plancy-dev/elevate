import { redirect } from "next/navigation";

/** Deep links → 제작 허브에서 프로젝트 다이얼로그로 연다. */
export default function ProductionsProjectsRedirectPage() {
  redirect("/dashboard/productions?studio=projects");
}
