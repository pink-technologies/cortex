/**
 * Sole root TypeScript input for the monorepo `tsconfig.json`.
 *
 * The root config only shares `compilerOptions` with Nest apps and packages.
 * Application and package sources are intentionally excluded so each workspace
 * project uses its own tsconfig. This ambient module satisfies TypeScript's
 * requirement that a project have at least one input file.
 */
export {}
