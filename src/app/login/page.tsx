import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100dvh-2rem)] flex-col items-center justify-center py-8">
      <LoginForm />
    </div>
  );
}
