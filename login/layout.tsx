export const metadata = {
  title: 'Login - Xylo Cloud',
  description: 'Hotel Management System Login',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-950">
      {children}
    </div>
  )
}