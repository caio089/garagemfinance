import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Libera acesso pelo IP da rede (celular / outros dispositivos)
  allowedDevOrigins: [
    "192.168.0.33",
    "192.168.0.6",
    "192.168.0.2",
    "127.0.0.1",
    "localhost",
  ],
  turbopack: {
    root: rootDir,
  },
};

export default nextConfig;
