"use client";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export default function ComingSoonPage() {
  return (
    <main className={`min-h-screen bg-[#F8F9FA] ${inter.className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col items-center justify-center min-h-screen">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-6xl mb-8"
        >
          🚧 🏗️ 🛠️
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-4xl font-bold text-[#343A40] text-center mb-4"
        >
          Woah there! 🚧
        </motion.h1>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl text-[#343A40]/80 text-center mb-12 max-w-2xl"
        >
          Our awesome Gantt editor is under construction! 🏗️ We're putting the final touches to make it absolutely amazing. Stay tuned for the grand opening! 🎉
        </motion.p>

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, delay: 0.6 }}
          className="w-full max-w-md bg-white rounded-full h-4 overflow-hidden shadow-sm"
        >
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "0%" }}
            transition={{
              duration: 2,
              delay: 0.6,
              ease: "easeInOut",
            }}
            className="h-full bg-[#FF6B6B] rounded-full"
            style={{
              width: "100%",
              background: "linear-gradient(90deg, #FF6B6B 0%, #FF8E8E 100%)",
            }}
          />
        </motion.div>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-[#343A40]/60 mt-4 text-center mb-8"
        >
          Coming faster than you can say "Gantt Chart"! ⚡
        </motion.p>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Link href="/">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-[#FF6B6B] text-white rounded-lg hover:bg-[#FF6B6B]/90 transition-colors font-medium flex items-center gap-2 shadow-sm"
            >
              <span>←</span> Back to Home
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
