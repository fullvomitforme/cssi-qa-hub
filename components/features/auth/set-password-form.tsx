"use client"

import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export function SetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirmPassword) {
      setError("Password confirmation does not match.")
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) {
        setError("Unable to finish password setup right now.")
        return
      }

      window.location.href = "/overview"
    })
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={submit}>
      {error ? (
        <p
          role="alert"
          className="border border-destructive bg-background p-3 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        New password
        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        Confirm password
        <Input
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Saving password…" : "Complete account setup"}
      </Button>
    </form>
  )
}
