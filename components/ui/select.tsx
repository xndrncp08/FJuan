/**
 * Select — Radix UI Select primitives styled for the FJUAN dark theme.
 *
 * Key fixes vs. the original:
 *   - Removed all light-mode defaults (white bg, zinc borders)
 *   - Uses --bg-surface (#111) for dropdown content
 *   - Focus rings use F1 red
 *   - Sharp corners (rounded-none) throughout
 *   - Consistent font: Barlow Condensed + uppercase tracking
 */
"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/* ── Root / Group / Value re-exports ─────────────────────────────────────── */
const Select        = SelectPrimitive.Root;
const SelectGroup   = SelectPrimitive.Group;
const SelectValue   = SelectPrimitive.Value;

/* ── Trigger button ───────────────────────────────────────────────────────── */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // Layout
      "flex h-10 w-full items-center justify-between px-3 py-2",
      // Typography — condensed uppercase to match FJUAN labels
      "font-condensed font-semibold text-sm uppercase tracking-[0.06em]",
      // Colours — dark surface, white text
      "bg-[#111] border border-white/[0.10] text-white/70",
      // Focus — red ring, no default outline
      "focus:outline-none focus:ring-1 focus:ring-[#E10600] focus:border-[#E10600]/50",
      // States
      "placeholder:text-white/30",
      "disabled:cursor-not-allowed disabled:opacity-45",
      "[&>span]:line-clamp-1",
      // Hover
      "hover:border-white/20 hover:text-white",
      "transition-all duration-150",
      "rounded-none", // Sharp corners
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-40 shrink-0 ml-2" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/* ── Scroll up button ─────────────────────────────────────────────────────── */
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1 text-white/40", className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

/* ── Scroll down button ───────────────────────────────────────────────────── */
const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1 text-white/40", className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

/* ── Dropdown content panel ───────────────────────────────────────────────── */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        // Positioning & sizing
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden",
        // Dark panel — matches bg-panel surface
        "bg-[#111] border border-white/[0.10] text-white",
        "shadow-[0_8px_32px_rgba(0,0,0,0.6)]",
        // Radix animation classes
        "data-[state=open]:animate-in data-[state=closed]:animate-out",
        "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
        "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        "rounded-none", // Sharp corners
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

/* ── Group label ──────────────────────────────────────────────────────────── */
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn(
      "py-1.5 pl-8 pr-2 font-mono-f1 text-[0.6rem] uppercase tracking-[0.18em] text-white/30",
      className
    )}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

/* ── Option item ──────────────────────────────────────────────────────────── */
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center",
      "py-2 pl-8 pr-3",
      "font-condensed font-semibold text-sm uppercase tracking-[0.06em] text-white/65",
      // Focus / active highlight
      "focus:bg-[#E10600]/10 focus:text-white",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
      "outline-none transition-colors duration-100",
      className
    )}
    {...props}
  >
    {/* Selected checkmark */}
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-[#E10600]" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

/* ── Separator ────────────────────────────────────────────────────────────── */
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-white/[0.07]", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
};
