import prisma from "./lib/prisma";

// =====================================
// GENERATE PRODUCT DESCRIPTION
// Based on product name + category
// =====================================

function generateDescription(
  name: string,
  category: string
): string {
  const productName = name.toLowerCase();
  const productCategory = category.toLowerCase();

  // -------------------------------------
  // Watches / Smartwatches
  // -------------------------------------

  if (
    productName.includes("watch") ||
    productName.includes("smartwatch")
  ) {
    return `${name} features a stylish and modern design that is suitable for everyday use. Its comfortable build and versatile appearance make it a great choice for both casual and professional occasions.`;
  }

  // -------------------------------------
  // SSD / Storage
  // -------------------------------------

  if (
    productName.includes("ssd") ||
    productName.includes("hard drive") ||
    productName.includes("storage") ||
    productName.includes("pendrive") ||
    productName.includes("pen drive")
  ) {
    return `${name} is a compact and convenient storage solution designed for everyday data storage and transfer. Its portable design makes it suitable for work, study, personal files, and other digital storage needs.`;
  }

  // -------------------------------------
  // Mouse
  // -------------------------------------

  if (productName.includes("mouse")) {
    return `${name} is designed for comfortable everyday computer use with smooth navigation and convenient handling. Its practical design makes it suitable for work, study, browsing, and general desktop use.`;
  }

  // -------------------------------------
  // Keyboard
  // -------------------------------------

  if (productName.includes("keyboard")) {
    return `${name} is designed to provide a comfortable typing experience for everyday work and study. Its practical design makes it suitable for desktops, offices, home setups, and regular computer use.`;
  }

  // -------------------------------------
  // Headphones / Earphones / Earbuds
  // -------------------------------------

  if (
    productName.includes("headphone") ||
    productName.includes("earphone") ||
    productName.includes("earbud") ||
    productName.includes("airpod")
  ) {
    return `${name} is designed for an enjoyable everyday audio experience with a comfortable and convenient design. It is suitable for music, entertainment, calls, study, and daily use.`;
  }

  // -------------------------------------
  // Speaker
  // -------------------------------------

  if (productName.includes("speaker")) {
    return `${name} is designed to deliver convenient audio for everyday entertainment. Its practical design makes it suitable for music, movies, gatherings, and personal listening.`;
  }

  // -------------------------------------
  // Laptop / Computer
  // -------------------------------------

  if (
    productName.includes("laptop") ||
    productName.includes("computer") ||
    productName.includes("notebook")
  ) {
    return `${name} is designed for everyday computing needs including work, study, browsing, and entertainment. Its practical design makes it suitable for home, office, and educational use.`;
  }

  // -------------------------------------
  // Mobile / Smartphone
  // -------------------------------------

  if (
    productName.includes("phone") ||
    productName.includes("mobile") ||
    productName.includes("smartphone")
  ) {
    return `${name} combines a modern design with features suitable for everyday communication and entertainment. It is designed for convenient daily use, browsing, communication, and multimedia activities.`;
  }

  // -------------------------------------
  // Camera
  // -------------------------------------

  if (
    productName.includes("camera") ||
    productName.includes("dslr")
  ) {
    return `${name} is designed for capturing photos and videos for everyday and creative use. Its practical design makes it suitable for photography, personal projects, travel, and special occasions.`;
  }

  // -------------------------------------
  // Television
  // -------------------------------------

  if (
    productName.includes("tv") ||
    productName.includes("television")
  ) {
    return `${name} is designed to provide an enjoyable home entertainment experience. Its modern design makes it suitable for watching movies, shows, sports, and other multimedia content.`;
  }

  // -------------------------------------
  // Printer
  // -------------------------------------

  if (productName.includes("printer")) {
    return `${name} is designed for convenient everyday printing needs at home, school, or in the office. Its practical design makes it suitable for documents, assignments, reports, and general printing tasks.`;
  }

  // -------------------------------------
  // Router / Wi-Fi
  // -------------------------------------

  if (
    productName.includes("router") ||
    productName.includes("wifi") ||
    productName.includes("wi-fi")
  ) {
    return `${name} is designed to provide convenient network connectivity for everyday internet use. It is suitable for home, office, study, browsing, streaming, and connected devices.`;
  }

  // -------------------------------------
  // Kitchen Products
  // -------------------------------------

  if (
    productCategory.includes("kitchen") ||
    productName.includes("mixer") ||
    productName.includes("blender") ||
    productName.includes("coffee") ||
    productName.includes("maker") ||
    productName.includes("kettle") ||
    productName.includes("toaster")
  ) {
    return `${name} is designed to make everyday kitchen tasks more convenient and efficient. Its practical design makes it suitable for regular home use and everyday food or beverage preparation.`;
  }

  // -------------------------------------
  // Furniture
  // -------------------------------------

  if (
    productCategory.includes("furniture") ||
    productName.includes("chair") ||
    productName.includes("table") ||
    productName.includes("desk") ||
    productName.includes("sofa")
  ) {
    return `${name} combines a practical design with everyday comfort and functionality. It is suitable for home, office, study, or living spaces and can complement a variety of interiors.`;
  }

  // -------------------------------------
  // Fashion / Clothing
  // -------------------------------------

  if (
    productCategory.includes("fashion") ||
    productCategory.includes("clothing") ||
    productName.includes("shirt") ||
    productName.includes("t-shirt") ||
    productName.includes("jeans") ||
    productName.includes("dress") ||
    productName.includes("jacket")
  ) {
    return `${name} features a stylish design suitable for everyday wear. It is designed to provide a comfortable and versatile option for casual and regular occasions.`;
  }

  // -------------------------------------
  // Shoes / Footwear
  // -------------------------------------

  if (
    productCategory.includes("footwear") ||
    productName.includes("shoe") ||
    productName.includes("sneaker") ||
    productName.includes("sandal")
  ) {
    return `${name} is designed for everyday comfort and versatile use. Its practical style makes it suitable for casual outings, daily activities, and regular wear.`;
  }

  // -------------------------------------
  // Beauty / Personal Care
  // -------------------------------------

  if (
    productCategory.includes("beauty") ||
    productCategory.includes("personal care") ||
    productName.includes("face") ||
    productName.includes("cream") ||
    productName.includes("shampoo") ||
    productName.includes("perfume")
  ) {
    return `${name} is designed for convenient everyday personal care and grooming. Its practical format makes it suitable for regular use as part of a simple daily routine.`;
  }

  // -------------------------------------
  // Sports
  // -------------------------------------

  if (
    productCategory.includes("sports") ||
    productName.includes("football") ||
    productName.includes("cricket") ||
    productName.includes("gym") ||
    productName.includes("fitness")
  ) {
    return `${name} is designed for everyday sports and fitness activities. Its practical design makes it suitable for workouts, recreational activities, training, and active lifestyles.`;
  }

  // -------------------------------------
  // Electronics fallback
  // -------------------------------------

  if (productCategory.includes("electronics")) {
    return `${name} is a practical electronic product designed for convenient everyday use. Its modern design makes it suitable for home, work, study, entertainment, and other daily activities.`;
  }

  // -------------------------------------
  // General fallback
  // -------------------------------------

  return `${name} is a practical product designed for everyday use. Its versatile design makes it suitable for a variety of personal, home, work, or lifestyle needs.`;
}

// =====================================
// BULK UPDATE
// =====================================

async function generateBulkDescriptions() {
  try {
    console.log("=====================================");
    console.log("ProductHub Bulk Description Generator");
    console.log("=====================================");

    // Find only products without descriptions
    const products = await prisma.products.findMany({
      where: {
        OR: [
          {
            description: null,
          },
          {
            description: "",
          },
        ],
      },
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
      },
      orderBy: {
        id: "asc",
      },
    });

    console.log(
      `Found ${products.length} products without descriptions.`
    );

    if (products.length === 0) {
      console.log("All products already have descriptions.");
      return;
    }

    let updatedCount = 0;

    for (const product of products) {
      const description = generateDescription(
        product.name,
        product.category
      );

      await prisma.products.update({
        where: {
          id: product.id,
        },
        data: {
          description,
        },
      });

      updatedCount++;

      console.log(
        `✅ Updated ID ${product.id}: ${product.name}`
      );
    }

    console.log("-------------------------------------");
    console.log(
      `Successfully updated ${updatedCount} products.`
    );
    console.log("-------------------------------------");
  } catch (error) {
    console.error(
      "❌ Error generating descriptions:",
      error
    );
  } finally {
    await prisma.$disconnect();
  }
}

// =====================================
// RUN SCRIPT
// =====================================

generateBulkDescriptions();