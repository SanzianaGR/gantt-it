"use client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export default function HomePage() {
  const router = useRouter();

  const start = () => {
    router.push("/coming-soon");
  };

  const features = [
    {
      title: "Zero Learning Curve",
      description:
        "Start creating professional Gantt charts in seconds. No tutorials needed.",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      title: "One-Click Sharing",
      description:
        "Share your timeline instantly. Real-time collaboration without complexity.",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
      ),
    },
    {
      title: "Instant Export",
      description:
        "Download high-quality PDFs and PNGs with a single click. No waiting.",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
          />
        </svg>
      ),
    },
  ];

  return (
    <main
      className={`min-h-screen flex flex-col items-center justify-center bg-[#F8F9FA] px-4 sm:px-6 lg:px-8 ${inter.className}`}
    >
      <div className="w-full max-w-7xl mx-auto py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center mb-16 lg:mb-24">
          {/* Left Column - Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 lg:space-y-8"
          >
            <div className="space-y-4 lg:space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="inline-block px-4 py-2 bg-[#FF6B6B]/10 rounded-full"
              >
                <span className="text-[#FF6B6B] font-medium">
                  The Easiest Gantt Chart Tool
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold text-[#343A40] tracking-tight leading-tight"
              >
                Create Gantt Charts
                <span className="block text-[#FF6B6B]">In Seconds</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg sm:text-xl text-[#343A40]/80 leading-relaxed max-w-xl"
              >
                The simplest way to visualize your project timeline. No login.
                No learning. Just pure productivity.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="space-y-6"
            >
              <button
                onClick={start}
                className="group px-8 py-4 bg-[#FF6B6B] text-white rounded-full text-lg font-medium hover:bg-[#FF6B6B]/90 transition-all duration-300 shadow-sm hover:shadow-lg hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  Start Creating
                  <svg
                    className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </button>

              <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-sm text-[#343A40]/60">
                <div className="flex items-center gap-2">
                  <span className="text-[#FF6B6B]">•</span>
                  <span>No account needed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#FF6B6B]">•</span>
                  <span>Instant creation</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[#FF6B6B]">•</span>
                  <span>One-click export</span>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Column - Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="relative lg:ml-8"
          >
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 transform hover:scale-[1.02] transition-transform duration-300">
              <div className="aspect-video bg-[#F8F9FA] rounded-lg overflow-hidden">
                <div className="h-full w-full bg-gradient-to-br from-[#FF6B6B]/10 to-[#FF6B6B]/5 flex items-center justify-center">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-[#FF6B6B]/10 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-[#FF6B6B]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <p className="text-[#343A40]/60">Interactive Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Enhanced Feature Boxes Section */}
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-[#343A40] mb-4">
              Everything You Need
            </h2>
            <p className="text-[#343A40]/60 max-w-2xl mx-auto">
              Powerful features, simple interface. Create, share, and export
              your Gantt charts with ease.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 + index * 0.2 }}
                className="group relative bg-white p-6 sm:p-8 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF6B6B]/0 via-[#FF6B6B]/0 to-[#FF6B6B]/0 group-hover:from-[#FF6B6B]/5 group-hover:via-[#FF6B6B]/10 group-hover:to-[#FF6B6B]/5 transition-all duration-500" />
                <div className="relative">
                  <div className="w-12 h-12 bg-[#FF6B6B]/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#FF6B6B]/20 transition-colors duration-300">
                    <div className="text-[#FF6B6B]">{feature.icon}</div>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-[#343A40] mb-3 sm:mb-4 group-hover:text-[#FF6B6B] transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-[#343A40]/70 leading-relaxed text-sm sm:text-base">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          className="mt-24 pt-8 border-t border-[#343A40]/10"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-[#343A40]/60 text-sm">
              © {new Date().getFullYear()} Ganttit. Made with 🍷 by{" "}
              <a
                href="https://sanzianagrecu.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#FF6B6B] hover:text-[#FF6B6B]/80 transition-colors duration-200 font-medium hover:underline decoration-2 underline-offset-4"
              >
                snz{" "}
              </a>
              & cursor
            </div>
            <div className="flex items-center gap-6">
              <a
                href="https://github.com/yourusername/ganttit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#343A40]/60 hover:text-[#FF6B6B] transition-colors duration-200 text-sm flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                Contribute on GitHub
              </a>
            </div>
          </div>
        </motion.footer>
      </div>
    </main>
  );
}
