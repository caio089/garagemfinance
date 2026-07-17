import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  // Libera acesso pelo IP da rede (celular / outros dispositivos)
  allowedDevOrigins: [
    "192.168.0.2",
    "127.0.0.1",
    "localhost",
  ],
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
