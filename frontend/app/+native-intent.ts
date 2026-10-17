export function redirectSystemPath({
  path,
  initial,
}: {
  path: string;
  initial: boolean;
}) {
  // OAuth redirects are handled by WebBrowser / AuthSession directly.
  // Call deep links (datingapp://call?...) are handled exclusively by CallContext.
  // Returning null tells Expo Router to consume the event without attempting unmatched route navigation.
  if (
    path.includes("oauth2redirect") ||
    path.includes("oauthredirect") ||
    path.includes("call") ||
    path === "call" ||
    path.startsWith("call") ||
    path.startsWith("/call")
  ) {
    return null;
  }
  return path;
}
