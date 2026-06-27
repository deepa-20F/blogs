import hero from "@/assets/hero-featured.jpg";

export const heroImage = hero;

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  author: { name: string; role: string; initials: string };
  date: string;
  readTime: string;
  views: string;
  likes: string;
};

export const categories = [
  { name: "Wellness", icon: "🌿" },
  { name: "Nutrition", icon: "🥗" },
  { name: "Mental Health", icon: "🧘" },
  { name: "Mindfulness", icon: "✨" },
  { name: "Fitness", icon: "🏃" },
  { name: "Lifestyle", icon: "🌸" },
  { name: "Travel", icon: "🌍" },
  { name: "Business", icon: "💼" },
  { name: "Technology", icon: "💡" },
  { name: "AI", icon: "🤖" },
  { name: "Marketing", icon: "📈" },
];

export const articles: Article[] = [];


export const stats = [
  { label: "Articles", value: "1,000+" },
  { label: "Categories", value: "50+" },
  { label: "Readers", value: "1M+" },
];