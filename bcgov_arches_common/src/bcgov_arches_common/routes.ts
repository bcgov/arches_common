interface RouteNames {
    home: string;
    login: string;
}

const routeNames: RouteNames = { home: '/', login: '' };

type RouteNamesType = typeof routeNames;

// RouteNames = {
//     "home": string,
//     "login": string
// };
//
// type RouteNamesType = {
//     "home": string,
//     "login": string
// }

export type { RouteNamesType };
export { routeNames };
