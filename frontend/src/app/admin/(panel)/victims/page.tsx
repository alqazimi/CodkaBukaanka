import { redirect } from "next/navigation";

export default function AdminVictimsRedirect() {
  redirect("/admin/patients");
}
