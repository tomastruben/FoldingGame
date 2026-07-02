import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mol* (molstar) ships ESM with circular module dependencies. Left as opaque
  // node_modules code, the production minifier reorders those modules and some
  // internal references (e.g. ModelSymmetry.Provider) resolve to `undefined`,
  // which crashes the viewer in prod builds only. Transpiling it through Next's
  // pipeline keeps the module graph intact.
  transpilePackages: ["molstar"],
};

export default nextConfig;
