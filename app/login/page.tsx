import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="min-h-svh flex items-center justify-center bg-muted px-4">
      <LoginForm next={next} />
    </div>
  );
}
