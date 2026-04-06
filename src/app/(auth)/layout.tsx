export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl">
            C
          </div>
          <h1 className="mt-4 text-2xl font-bold">ChannelOS</h1>
          <p className="text-muted-foreground">
            Automação de canais dark YouTube
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
