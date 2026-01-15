"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrutalButton } from "./BrutalButton";
import { UserDisplay } from "./UserDisplay";
import { motion } from "framer-motion";

interface NavbarProps {
  address?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  isConnected?: boolean;
}

export function Navbar({
  address,
  onConnect,
  onDisconnect,
  isConnected = false,
}: NavbarProps) {
  const pathname = usePathname();

  const navLinks = [
    { href: "/bounties", label: "BOUNTIES" },
    { href: "/create", label: "CREATE" },
    { href: "/profile", label: "PROFILE" },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="border-b-4 border-brutal-black bg-brutal-white sticky top-0 z-50 h-16">
      <div className="px-4 md:px-8 lg:px-12 h-full max-w-7xl mx-auto">
        <div className="flex items-center justify-between h-full">
          {/* LOGO */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <span className="text-base md:text-lg font-black tracking-tight">
              BOUNTY<span className="text-brutal-green">X</span>
            </span>
          </Link>

          {/* NAV LINKS - DESKTOP ONLY */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`
                    font-black text-xs uppercase transition-all duration-100 pb-1
                    ${
                      isActive(link.href)
                        ? "text-brutal-black border-b-3 border-brutal-green"
                        : "text-gray-500 hover:text-brutal-black"
                    }
                  `}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </div>

          {/* WALLET & EXIT */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {isConnected && address ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:block px-2 py-1 bg-brutal-black text-brutal-green font-mono font-bold text-xs border-2 border-brutal-black">
                  <UserDisplay address={address} showLink={false} />
                </span>
                <motion.button
                  onClick={onDisconnect}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-8 h-8 flex items-center justify-center font-black text-sm text-brutal-black border-3 border-brutal-black bg-brutal-white transition-colors duration-100 hover:bg-brutal-pink"
                  title="Exit"
                >
                  ✕
                </motion.button>
              </div>
            ) : (
              <BrutalButton variant="primary" size="sm" onClick={onConnect}>
                CONNECT
              </BrutalButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
