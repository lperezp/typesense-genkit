import Typesense from 'typesense'
/*
 *  Our JavaScript client library works on both the server and the browser.
 *  When using the library on the browser, please be sure to use the
 *  search-only API Key rather than an admin API key since the latter
 *  has write access to Typesense and you don't want to expose that.
 */
export const typesense = ({ isServer = false } = {}) =>
    new Typesense.Client({
        apiKey:
            (isServer ? process.env.TYPESENSE_ADMIN_API_KEY : process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_ONLY_API_KEY) || 'xyz',
        nodes: [
            {
                url: process.env.NEXT_PUBLIC_TYPESENSE_URL || 'http://localhost:8108',
            },
        ],
        connectionTimeoutSeconds: 5,
    })