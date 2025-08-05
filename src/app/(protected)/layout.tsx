"use client";

import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  Video, 
  Image as ImageIcon, 
  TrendingUp, 
  Menu, 
  X, 
  ChevronDown,
} from "lucide-react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [masterMenuOpen, setMasterMenuOpen] = useState(false);

  const navigation = [
    { 
      name: "Vídeos", 
      href: "/packs", 
      icon: Video,
      current: pathname === "/packs" || pathname.startsWith("/videos")
    },
    { 
      name: "Master", 
      href: "#",
      icon: TrendingUp,
      current: pathname.startsWith("/master") || pathname.startsWith("/commissions") || pathname.startsWith("/control"),
      submenu: [
        { name: "Comissões Master", href: "/master/commissions" },
        { name: "Controle Master", href: "/master/control" }
      ]
    },
    { 
      name: "Artes", 
      href: "/arts", 
      icon: ImageIcon,
      current: pathname === "/arts"
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="bg-black shadow-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and main navigation */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/home" className="flex items-center space-x-3">
                  <Image
                    src="/logo.png"
                    alt="Master Afiliados Logo"
                    width={40}
                    height={40}
                    className="rounded-lg"
                  />
                  <span className="text-xl font-bold text-white">
                    Master Afiliados
                  </span>
                </Link>
              </div>
              
              {/* Desktop navigation */}
              <div className="hidden md:ml-8 md:flex md:space-x-4">
                {navigation.map((item) => (
                  <div key={item.name} className="relative">
                    {item.submenu ? (
                      <div className="relative">
                        <button
                          onClick={() => setMasterMenuOpen(!masterMenuOpen)}
                          className={`${
                            item.current
                              ? "bg-gray-900 border-[#7d570e] text-[#7d570e]"
                              : "border-transparent text-gray-300 hover:text-white hover:bg-gray-900"
                          } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium rounded-t-md transition-colors duration-200`}
                        >
                          <item.icon className="w-4 h-4 mr-2" />
                          {item.name}
                          <ChevronDown className="w-4 h-4 ml-1" />
                        </button>
                        
                        {masterMenuOpen && (
                          <div className="absolute z-50 mt-1 w-56 bg-black rounded-md shadow-lg ring-1 ring-gray-800 border border-gray-800">
                            <div className="py-1">
                              {item.submenu.map((subItem) => (
                                <Link
                                  key={subItem.href}
                                  href={subItem.href}
                                  className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-900 hover:text-white"
                                  onClick={() => setMasterMenuOpen(false)}
                                >
                                  {subItem.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        href={item.href}
                        className={`${
                          item.current
                            ? "bg-gray-900 border-[#7d570e] text-[#7d570e]"
                            : "border-transparent text-gray-300 hover:text-white hover:bg-gray-900"
                        } inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium rounded-t-md transition-colors duration-200`}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* User menu */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-[#7d570e] rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-200">
                    {user?.username}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-[#7d570e] hover:text-[#6b4a0c] px-3 py-2 rounded-md hover:bg-gray-900 transition-colors duration-200"
                >
                  Sair
                </button>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-900"
              >
                {mobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800 bg-black">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.submenu ? (
                    <div>
                      <button
                        onClick={() => setMasterMenuOpen(!masterMenuOpen)}
                        className={`${
                          item.current
                            ? "bg-gray-900 text-[#7d570e]"
                            : "text-gray-300 hover:bg-gray-900 hover:text-white"
                        } group flex items-center px-3 py-2 text-base font-medium rounded-md w-full`}
                      >
                        <item.icon className="w-5 h-5 mr-3" />
                        {item.name}
                        <ChevronDown className="w-4 h-4 ml-auto" />
                      </button>
                      
                      {masterMenuOpen && (
                        <div className="ml-8 space-y-1">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              className="block px-3 py-2 text-sm text-gray-300 hover:bg-gray-900 hover:text-white rounded-md"
                              onClick={() => {
                                setMobileMenuOpen(false);
                                setMasterMenuOpen(false);
                              }}
                            >
                              {subItem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                                                                    className={`${
                        item.current
                          ? "bg-gray-900 text-[#7d570e]"
                          : "text-gray-300 hover:bg-gray-900 hover:text-white"
                      } group flex items-center px-3 py-2 text-base font-medium rounded-md`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
              
              {/* Mobile user menu */}
              <div className="border-t border-gray-800 pt-4">
                <div className="flex items-center px-3 py-2">
                  <div className="w-8 h-8 bg-[#7d570e] rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-200">
                      {user?.username}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="block px-3 py-2 text-base font-medium text-[#7d570e] hover:bg-gray-900 hover:text-[#6b4a0c] rounded-md w-full text-left"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
