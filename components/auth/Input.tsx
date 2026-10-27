"use client"

import React from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ hasError, className = "", style, ...props }, ref) {
    return (
      <input
        ref={ref}
        style={{
          width: "100%",
          height: "44px",
          border: `1.5px solid ${hasError ? "#c0261d" : "transparent"}`,
          background: "var(--field)",
          color: "var(--ink)",
          borderRadius: "999px",
          padding: "0 18px",
          fontFamily: "inherit",
          fontSize: "14px",
          outline: "none",
          transition: "border-color .15s, box-shadow .15s",
          ...style,
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = "#f5b000"
          e.currentTarget.style.boxShadow   = "0 0 0 4px rgba(245,176,0,.2)"
        }}
        onBlur={e => {
          if (!hasError) e.currentTarget.style.borderColor = "transparent"
          e.currentTarget.style.boxShadow = "none"
          props.onBlur?.(e)
        }}
        className={className}
        {...props}
      />
    )
  }
)
