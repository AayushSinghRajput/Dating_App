export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  // OAuth redirects are handled by WebBrowser / AuthSession directly.
  // Returning null tells Expo Router to consume the event and not navigate to an unmatched route.
  if (path.includes("oauth2redirect") || path.includes("oauthredirect")) {
    return null;
  }
  return path;
}
