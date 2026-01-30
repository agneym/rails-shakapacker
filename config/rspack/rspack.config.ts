import { RspackManifestPlugin, type FileDescriptor, type Manifest } from "rspack-manifest-plugin";
import rspack from "@rspack/core";
import type { Compilation } from "@rspack/core";
import { readdirSync } from "node:fs";
import { join, resolve, basename, extname } from "node:path";
import { env, config as shakapackerConfig } from "shakapacker";
import { tanstackRouter } from "@tanstack/router-plugin/rspack";

const isDevelopment = process.env.NODE_ENV !== "production";
const __dirname = resolve();
const root = resolve(__dirname);

const generateManifest: (
  seed: Record<string, unknown>,
  files: FileDescriptor[],
  entrypoints: Record<string, string[]>,
  context: { compilation: Compilation },
) => Manifest = (seed, files, entrypoints) => {
  const manifest = seed || {};

  files.forEach((file) => {
    manifest[file.name] = file.path;
  });

  const entrypointsManifest: Record<string, { assets: { js: string[]; css: string[] } }> = {};
  Object.entries(entrypoints).forEach(([entrypointName, entrypointFiles]) => {
    const jsFiles = entrypointFiles
      .filter((file) => file.endsWith(".js") && !file.includes(".hot-update."))
      .map((file) => shakapackerConfig.publicPathWithoutCDN + file);
    const cssFiles = entrypointFiles
      .filter((file) => file.endsWith(".css") && !file.includes(".hot-update."))
      .map((file) => shakapackerConfig.publicPathWithoutCDN + file);

    entrypointsManifest[entrypointName] = {
      assets: {
        js: jsFiles,
        css: cssFiles,
      },
    };
  });
  manifest.entrypoints = entrypointsManifest;

  return manifest;
};

const getEntryObject = () => {
  const entries: Record<string, string> = {};
  const buildRootPath = join(shakapackerConfig.source_path, shakapackerConfig.source_entry_path);

  readdirSync(buildRootPath, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .forEach((dirent) => {
      const name = basename(dirent.name, extname(dirent.name));
      const fullPath = resolve(buildRootPath, dirent.name);
      entries[name] = fullPath;
    });

  return entries;
};

const getModulePaths = () => {
  const result = [resolve(shakapackerConfig.source_path)];

  if (shakapackerConfig.additional_paths) {
    shakapackerConfig.additional_paths.forEach((pathName) => result.push(resolve(pathName)));
  }
  result.push("node_modules");

  return result;
};

const hash = env.isProduction || shakapackerConfig.useContentHash ? "-[contenthash]" : "";
const devServerPort = shakapackerConfig.dev_server?.port ?? 3035;
const devServerHost = shakapackerConfig.dev_server?.host ?? "localhost";
const devServerUrl = `http://${devServerHost === "0.0.0.0" ? "localhost" : devServerHost}:${devServerPort}`;

module.exports = {
  mode: isDevelopment ? "development" : "production",
  entry: getEntryObject(),
  output: {
    filename: `js/[name]${hash}.js`,
    chunkFilename: `js/[name]${hash}.chunk.js`,
    // https://webpack.js.org/configuration/output/#outputhotupdatechunkfilename
    hotUpdateChunkFilename: "js/[id].[fullhash].hot-update.js",
    path: shakapackerConfig.outputPath,
    publicPath: shakapackerConfig.publicPath,
  },
  devServer: {
    port: devServerPort,
    host: devServerHost,
    allowedHosts: "all",
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
    devMiddleware: {
      publicPath: shakapackerConfig.publicPath,
    },
    hot: true,
    client: {
      overlay: false,
    },
    historyApiFallback: { disableDotRule: true },
    static: {
      publicPath: shakapackerConfig.outputPath,
      watch: false,
    },
  },
  watchOptions: {
    ignored: "**/node_modules/**",
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
    modules: getModulePaths(),
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules/,
        type: "javascript/auto",
        use: {
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
                tsx: true,
              },
              transform: {
                react: {
                  runtime: "automatic",
                },
              },
            },
          },
        },
      },
      {
        test: /\.css$/i,
        use: ["postcss-loader"],
        type: "css/auto",
      },
    ],
  },
  plugins: [
    new rspack.EnvironmentPlugin({
      NODE_ENV: isDevelopment ? "development" : "production",
    }),
    new RspackManifestPlugin({
      fileName: shakapackerConfig.manifestPath.split("/").pop() ?? "manifest.json",
      publicPath: shakapackerConfig.publicPathWithoutCDN,
      generate: generateManifest,
      writeToFileEmit: true,
    }),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: join(shakapackerConfig.source_path, "routes"),
      generatedRouteTree: join(shakapackerConfig.source_path, "routeTree.gen.ts"),
      quoteStyle: "double",
    }),
  ],
  lazyCompilation: false,
  experiments: {
    css: true,
  },
};
