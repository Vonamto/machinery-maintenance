// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench,
  ClipboardList,
  Droplets,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
    else navigate("/login");
  }, [navigate]);

  const cards = [
    {
      title: "Maintenance Log",
      color: "bg-blue-100 text-blue-800",
      icon: <Wrench size={28} />,
      link: "/maintenance",
    },
    {
      title: "Requests Parts",
      color: "bg-yellow-100 text-yellow-800",
      icon: <ClipboardList size={28} />,
      link: "/requests-parts",
    },
    {
      title: "Grease / Oil Requests",
      color: "bg-green-100 text-green-800",
      icon: <Droplets size={28} />,
      link: "/grease-oil",
    },
    {
      title: "Cleaning Log",
      color: "bg-teal-100 text-teal-800",
      icon: <Sparkles size={28} />,
      link: "/cleaning",
    },
    {
      title: "Equipment List",
      color: "bg-purple-100 text-purple-800",
      icon: <Truck size={28} />,
      link: "/equipment",
    },
    {
      title: "Users",
      color: "bg-pink-100 text-pink-800",
      icon: <Users size={28} />,
      link: "/users",
    },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`${card.color} rounded-2xl shadow hover:shadow-lg transition cursor-pointer p-6 flex flex-col items-center justify-center text-center`}
            onClick={() => navigate(card.link)}
          >
            <div className="mb-3">{card.icon}</div>
            <h2 className="text-lg font-semibold">{card.title}</h2>
          </div>
        ))}
      </main>

      <footer className="text-center text-gray-400 text-sm p-4">
        Machinery Maintenance System © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
