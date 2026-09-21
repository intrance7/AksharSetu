const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const booksToDelete = await prisma.book.findMany({
    where: {
      title: {
        in: [
          "Introduction to Algorithms, Fourth Edition",
          "Gray's Anatomy for Students",
          "The Silent Patient",
          "Sapiens: A Brief History of Humankind",
          "Clean Code: A Handbook of Agile Software Craftsmanship",
          "Harrison's Principles of Internal Medicine",
          "milk and honey"
        ]
      }
    }
  });

  const bookIds = booksToDelete.map(b => b.id);

  if (bookIds.length > 0) {
    await prisma.bookRequest.deleteMany({
      where: { bookId: { in: bookIds } }
    });

    const result = await prisma.book.deleteMany({
      where: { id: { in: bookIds } }
    });
    
    console.log("Deleted books:", result);
  } else {
    console.log("No books found to delete.");
  }
}

run().catch(console.error).finally(() => process.exit(0));
