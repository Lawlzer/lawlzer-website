import { Elysia, Context } from "elysia";

// Define a specific type for the context needed by subdomain handlers
interface RequestContext {
    request: Request;
    // Add other properties from Context if they become necessary
}

// Define handlers/routes for each subdomain potentially in separate files later
const handleValorantRequest = (context: RequestContext) => {
    const pathname = new URL(context.request.url).pathname;
    const headers = { 'Content-Type': 'text/html' };

    if (pathname === '/') {
        // Return Response with correct headers
        return new Response(
            '<h1>Valorant Home</h1><p>This is the homepage for the Valorant section.</p>',
            { headers }
        );
    }
    // Add more specific Valorant routes here...
    // Return 404 Response with correct headers
    return new Response(
        '<h1>Not Found</h1><p>The requested page was not found on the Valorant subdomain.</p>',
        { status: 404, headers }
    );
};

const handleOverwatchRequest = (context: RequestContext) => {
    const pathname = new URL(context.request.url).pathname;
    const headers = { 'Content-Type': 'text/html' };

    if (pathname === '/') {
        // Return Response with correct headers
        return new Response(
            '<h1>Overwatch Home</h1><p>This is the homepage for the Overwatch section.</p>',
            { headers }
        );
    }
    // Add more specific Overwatch routes here...
    // Return 404 Response with correct headers
    return new Response(
        '<h1>Not Found</h1><p>The requested page was not found on the Overwatch subdomain.</p>',
        { status: 404, headers }
    );
};


const app = new Elysia()
    .onRequest((context) => {
        // Get host, remove port if present
        const host = context.request.headers.get('Host')?.split(':')[0];

        // Handle specific subdomains directly here
        if (host === 'valorant.lawlzer.com' || host === 'local.valorant.lawlzer.com') {
            // Returning directly sends the response and stops further handler matching
            return handleValorantRequest(context);
        } else if (host === 'overwatch.lawlzer.com' || host === 'local.overwatch.lawlzer.com') {
            // Returning directly sends the response and stops further handler matching
            return handleOverwatchRequest(context);
        }

        // If it's lawlzer.com or localhost, do nothing in this hook.
        // The request will continue to the routes defined below.

        // Optional: Handle unknown hosts explicitly if needed
        // else if (host !== 'localhost' && host !== 'lawlzer.com') {
        //     context.set.status = 404;
        //     return 'Unknown Host';
        // }
    })
    // Routes defined here are now effectively only for lawlzer.com / localhost
    .get('/', () => {
        // Return Response with correct headers
        return new Response(
            '<h1>Welcome to Lawlzer.com</h1><p>This is the main homepage.</p>',
            { headers: { 'Content-Type': 'text/html' } }
        );
    })
    // Add other lawlzer.com routes here...
    // .get('/about', () => 'About lawlzer.com')

    // Fallback route if no other route matches (for lawlzer.com/localhost)
    .all('*', () => {
        // Return 404 Response with correct headers
        return new Response(
            '<h1>Not Found</h1><p>The requested page was not found on lawlzer.com.</p>',
            { status: 404, headers: { 'Content-Type': 'text/html' } }
        );
    })
    .listen(3000);

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
