/**
 * Application facts shown in the footer. The version is package.json's
 * "version", injected at build time by vite.config.ts (`define`).
 */

declare const __APP_VERSION__: string;

export const APP_NAME = 'New CP';
export const APP_VERSION: string = __APP_VERSION__;
