// This page is required for dev.localhost to work properly
// The middleware rewrites the request to /subdomains/root, but Next.js still needs a root page
export { default } from './subdomains/root/page';
