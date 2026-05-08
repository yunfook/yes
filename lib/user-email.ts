export const USER_EMAIL_DOMAIN = "yunfook.com.my";

export function usernameToEmail(username: string) {
  const normalized = username.toLowerCase().trim();
  return normalized.includes("@")
    ? normalized
    : `${normalized}@${USER_EMAIL_DOMAIN}`;
}

export function emailToUsername(email: string) {
  const normalized = email.toLowerCase().trim();
  const suffix = `@${USER_EMAIL_DOMAIN}`;
  return normalized.endsWith(suffix)
    ? normalized.slice(0, -suffix.length)
    : normalized;
}
