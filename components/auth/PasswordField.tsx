"use client"

import { useState } from "react"
import { Field } from "./Field"
import { Input } from "./Input"

interface PasswordFieldProps {
  id:          string
  label:       string
  placeholder: string
  autoComplete:string
  error?:      string
  value:       string
  onChange:    (v: string) => void
  onBlur:      () => void
}

export function PasswordField({ id, label, placeholder, autoComplete, error, value, onChange, onBlur }: PasswordFieldProps) {
  const [show, setShow] = useState(false)

  return (
    <Field id={id} label={label} error={error}>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          onBlur={onBlur}
          hasError={!!error}
          style={{ paddingRight: "46px" }}
        />
        <button
          type="button"
          aria-label="Show password"
          onClick={() => setShow(s => !s)}
          style={{
            position:     "absolute",
            right:        "6px",
            bottom:       "6px",
            width:        "32px",
            height:       "32px",
            border:       0,
            borderRadius: "50%",
            background:   "none",
            cursor:       "pointer",
            color:        "var(--muted)",
            fontSize:     "15px",
            display:      "flex",
            alignItems:   "center",
            justifyContent: "center",
            padding:      0,
          }}
        >
          👁
        </button>
      </div>
    </Field>
  )
}
