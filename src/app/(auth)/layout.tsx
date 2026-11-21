import { Logo } from "@/components/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-6">
      <div className="mb-8"><Logo /></div>
      <main className="flex-1">{children}</main>
    </div>
  );
}
