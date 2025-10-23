// frontend/src/pages/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, ClipboardList, Droplets, Truck, Users } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role || "Guest";

  const cards = [
    {
      title: "Maintenance Log",
      description: "Fill or view maintenance operations",
      icon: <Wrench className="w-8 h-8 text-blue-500" />,
      link: "/maintenance",
      allowed: ["Supervisor", "Mechanic", "Driver"],
    },
    {
      title: "Maintenance Requests",
      description: "Manage Spare Parts and Oil/Grease requests",
      icon: <ClipboardList className="w-8 h-8 text-green-500" />,
      link: "/requests",
      allowed: ["Supervisor", "Mechanic", "Driver"],
    },
    {
      title: "Cleaning Log",
      description: "Record and view cleaning activities",
      icon: <Droplets className="w-8 h-8 text-sky-500" />,
      link: "/cleaning",
      allowed: ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"],
    },
    {
      title: "Equipment List",
      description: "View and manage all vehicles/equipment",
      icon: <Truck className="w-8 h-8 text-orange-500" />,
      link: "/equipment",
      allowed: ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"],
    },
    {
      title: "Users",
      description: "Manage user accounts and roles",
      icon: <Users className="w-8 h-8 text-purple-500" />,
      link: "/users",
      allowed: ["Supervisor"],
    },
  ];

  const visibleCards = cards.filter((card) => card.allowed.includes(role));

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visibleCards.map((card) => (
          <Link to={card.link} key={card.title}>
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                {card.icon}
                <h2 className="text-xl font-semibold text-gray-700">
                  {card.title}
                </h2>
                <p className="text-gray-500 text-sm">{card.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
