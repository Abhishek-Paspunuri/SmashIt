export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark:bg-[#0f0f0f]">
      {children}
    </div>
  );
}
