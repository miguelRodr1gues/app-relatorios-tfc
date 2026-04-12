"use client";

import * as React from "react";

import { cn } from "./utils";

function ResizablePanelGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div data-slot="resizable-panel-group" className={cn("flex h-full w-full", className)} {...props} />;
}

function ResizablePanel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div data-slot="resizable-panel" className={cn("flex-1", className)} {...props} />;
}

function ResizableHandle({
  className,
  ...props
}: React.ComponentProps<"div"> & {
  withHandle?: boolean;
}) {
  return <div data-slot="resizable-handle" className={cn("w-px bg-border", className)} {...props} />;
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
