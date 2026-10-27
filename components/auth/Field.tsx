"use client"

import React from "react"

interface FieldProps {
  id:           string
  label:        string
  error?:       string
  children:     React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>
}

export function Field({ id, label, error, children }: FieldProps) {
  return (
    <div className="mb-[12px] relative">
      <label
        htmlFor={id}
        className="block text-[12px] mb-[4px] ml-[14px]"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[11.5px] mt-[4px] ml-[14px]" style={{ color: "#c0261d" }}>
          {error}
        </p>
      )}
    </div>
  )
}
