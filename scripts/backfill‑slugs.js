import { PrismaClient } from "@prisma/client";
import slugify from "slugify";

const prisma = new PrismaClient();
async function main() {
  const tags = await prisma.tag.findMany({ where: { slug: null } });
  await Promise.all(tags.map(t =>
    prisma.tag.update({
      where: { id: t.id },
      data: { slug: slugify(t.name, { lower: true, strict: true }) },
    })
  ));
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
