// frontend/src/pages/Dashboard.jsx
import React from "react";
import { Link } from "react-router-dom";
import { Wrench, FileText, Car, SprayCan, Users, HardHat, Truck } from "lucide-react";
import Navbar from "@/components/Navbar";
// Import the custom hook instead of the context object
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
    // Use the custom hook to get the user
    const { user } = useAuth();

    // Define card configuration based on user role
    const cardConfig = [
        {
            title: "Maintenance Log",
            path: "/maintenance",
            icon: <Wrench className="w-8 h-8" />,
            roles: ["Supervisor", "Mechanic", "Driver"],
            color: "from-blue-500 to-cyan-500"
        },
        {
            title: "Maintenance Requests",
            path: "/requests",
            icon: <FileText className="w-8 h-8" />,
            roles: ["Supervisor", "Mechanic", "Driver"],
            color: "from-amber-500 to-orange-500"
        },
        {
            title: "Cleaning Log",
            path: "/cleaning",
            icon: <SprayCan className="w-8 h-8" />,
            roles: ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"], // Assuming all can view/add to cleaning
            color: "from-emerald-500 to-teal-500"
        },
        {
            title: "Equipment List",
            path: "/equipment",
            icon: <Truck className="w-8 h-8" />,
            roles: ["Supervisor", "Mechanic", "Driver", "Cleaning Guy"],
            color: "from-violet-500 to-purple-500"
        },
        {
            title: "Users",
            path: "/users",
            icon: <Users className="w-8 h-8" />,
            roles: ["Supervisor"],
            color: "from-rose-500 to-pink-500"
        }
    ];

    // Filter cards based on user role
    const visibleCards = cardConfig.filter(card => card.roles.includes(user?.role));

    return (
        <div className="min-h-screen bg-theme-background-primary text-theme-text-primary"> {/* Apply main theme colors */}
            <Navbar user={user} />
            <div className="p-6">
                <h1 className="text-3xl font-bold mb-8 text-center text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                    Maintenance Management Dashboard
                </h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleCards.map((card, index) => (
                        <Link
                            key={index}
                            to={card.path}
                            className={`p-6 rounded-2xl shadow-lg bg-gradient-to-br ${card.color} text-white flex flex-col items-center justify-center transform transition-transform hover:scale-105`}
                        >
                            <div className="mb-4">{card.icon}</div>
                            <h2 className="text-xl font-semibold">{card.title}</h2>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
