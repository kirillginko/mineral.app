import { NextResponse } from "next/server";

export async function GET() {
  // Simulate a delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Return a 500 error
  return NextResponse.json({ error: "This is a test error" }, { status: 500 });
}
