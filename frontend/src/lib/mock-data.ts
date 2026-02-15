import { Item } from "@/components/item-card";

export const MOCK_ITEMS: Item[] = [
    {
        id: "1",
        title: "Blue Thermos Bottle",
        description: "Lost it near the cafeteria during lunch break. It has a sticker of a cat on it.",
        type: "LOST",
        category: "Personal Items",
        location: "Cafeteria",
        date: "Dec 18, 2025",
        status: "OPEN",
        imageUrl: "https://images.unsplash.com/photo-1602143407151-01114192003b?auto=format&fit=crop&q=80&w=1000"
    },
    {
        id: "2",
        title: "Calculus Textbook",
        description: "Found a heavy Calculus book left on a bench in the courtyard. Has name 'John Doe' inside.",
        type: "FOUND",
        category: "Books",
        location: "Courtyard",
        date: "Dec 17, 2025",
        status: "OPEN",
        imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000"
    },
    {
        id: "3",
        title: "Airpods Pro Case",
        description: "White charging case, no pods inside. Found near the gym entrance.",
        type: "FOUND",
        category: "Electronics",
        location: "Gym",
        date: "Dec 16, 2025",
        status: "OPEN",
        imageUrl: "https://images.unsplash.com/photo-1588156979435-379b9d802b0a?auto=format&fit=crop&q=80&w=1000"
    },
    {
        id: "4",
        title: "Red Nike Hoodie",
        description: "Left it in the library study room 3. Size M.",
        type: "LOST",
        category: "Clothing",
        location: "Library",
        date: "Dec 15, 2025",
        status: "OPEN",
        imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=1000"
    },
];
