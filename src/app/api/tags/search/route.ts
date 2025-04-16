import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim().toLowerCase() || "";

  if (!q || q.length < 1) {
    return NextResponse.json([], { status: 200 });
  }

  const tags = await prisma.tag.findMany({
    where: {
      name: {
        contains: q,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      _count: { select: { stories: true } },
    },
    orderBy: [
      { stories: { _count: "desc" } },
      { name: "asc" },
    ],
    take: 20,
  });

  return NextResponse.json(tags);
}
