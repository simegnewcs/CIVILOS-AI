import { NextResponse } from "next/server";
import { COOKIE_NAME_EXPORT } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(COOKIE_NAME_EXPORT, "", { maxAge: 0, path: "/" });
  return res;
}
