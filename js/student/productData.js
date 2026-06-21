// js/student/productData.js
//
// CHANGED: This file previously exported the live product list (PRODUCTS)
// that menuPage.js read directly. It now exports only the *seed* data,
// used once by inventoryStore.js to populate localStorage on first run.
//
// After seeding, inventoryStore.js is the single source of truth for
// product data and stock — menuPage.js, cartPage.js, and the admin
// inventory page all read/write through it instead of this file.
// This file is kept around because:
//   1. inventoryStore.js imports SEED_PRODUCTS from here on first load.
//   2. It documents the original mock catalog in one readable place.
//
// CATEGORIES is unchanged and still used directly by menuPage.js for the
// category filter chips, since categories aren't a stock-bearing concept.

export const SEED_PRODUCTS = [
  {
    id: 1,
    name: "A4 Spiral Notebook",
    description: "200 pages, single ruled, hard cover",
    category: "Notebooks",
    price: 65,
    stock: 50,
  },
  {
    id: 2,
    name: "Long Notebook (Lecture)",
    description: "160 pages, wide ruled, soft cover",
    category: "Notebooks",
    price: 45,
    stock: 80,
  },
  {
    id: 3,
    name: "Graph Notebook",
    description: "100 pages, 4mm grid, for diagrams",
    category: "Notebooks",
    price: 55,
    stock: 0,
  },
  {
    id: 4,
    name: "Blue Gel Pen (Pack of 5)",
    description: "0.5mm tip, smooth ink flow",
    category: "Pens",
    price: 60,
    stock: 200,
  },
  {
    id: 5,
    name: "Black Ballpoint Pen",
    description: "Classic click-top, medium tip",
    category: "Pens",
    price: 10,
    stock: 300,
  },
  {
    id: 6,
    name: "Highlighter Set (4 colors)",
    description: "Chisel tip, low odor ink",
    category: "Pens",
    price: 90,
    stock: 8,
  },
  {
    id: 7,
    name: "B&W Printout",
    description: "Laser print, single-sided — upload a PDF to order",
    category: "Printing",
    price: 2,
    stock: 999,
  },
  {
    id: 8,
    name: "Color Printout",
    description: "Laser print, single-sided — upload a PDF to order",
    category: "Printing",
    price: 10,
    stock: 999,
  },
  {
    id: 9,
    name: "Spiral Binding",
    description: "Up to 100 pages, choice of cover color",
    category: "Printing",
    price: 35,
    stock: 60,
  },
  {
    id: 10,
    name: "Project File (L-Fold)",
    description: "Transparent front, A4 size",
    category: "Files",
    price: 25,
    stock: 75,
  },
  {
    id: 11,
    name: "Ring Binder File",
    description: "2-inch capacity, 4 D-rings",
    category: "Files",
    price: 110,
    stock: 30,
  },
  {
    id: 12,
    name: "Sketch Pens (Pack of 12)",
    description: "Bright colors, washable ink",
    category: "Others",
    price: 75,
    stock: 50,
  },
  {
    id: 13,
    name: "Stapler (Standard)",
    description: "26/6 pins, desktop use",
    category: "Others",
    price: 95,
    stock: 6,
  },
];

export const CATEGORIES = ["All", "Notebooks", "Pens", "Printing", "Files", "Others"];