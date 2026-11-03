import { redirect } from "next/navigation"

export default function LegacyInboxThreadRedirect() {
  redirect("/orders")
}
