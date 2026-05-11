import type { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { takeDownload } from "@/lib/download-tokens";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { token } = await ctx.params;
  const file = takeDownload(token, session.userId);
  if (!file) {
    return new Response("Not found or expired", { status: 404 });
  }

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Content-Length": String(file.buffer.length),
      "Cache-Control": "no-store",
    },
  });
}
