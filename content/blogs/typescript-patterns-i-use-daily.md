---
title: "TypeScript Patterns I Use Every Day"
description: "A handful of TypeScript tricks that have made my code more expressive and easier to maintain."
date: "2026-02-20"
tags: ["TypeScript", "JavaScript", "Best Practices"]
---

After years of writing TypeScript across many projects, certain patterns have become muscle memory. Here are the ones that consistently make a difference.

## Discriminated Unions for State

Instead of a maze of booleans, model your state as a union:

```typescript
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };
```

The compiler will force you to handle every case.

## `satisfies` for Config Objects

`satisfies` lets you validate a value against a type without widening it:

```typescript
const routes = {
  home: "/",
  about: "/about",
} satisfies Record<string, string>;

// routes.home is still typed as "/" not string
```

## Template Literal Types

Great for building typed event systems or API route definitions:

```typescript
type Method = "GET" | "POST" | "DELETE";
type Route = "/users" | "/posts";
type Endpoint = `${Method} ${Route}`;
// "GET /users" | "GET /posts" | "POST /users" | ...
```

## `infer` in Conditional Types

Extract inner types without a utility library:

```typescript
type Awaited<T> = T extends Promise<infer U> ? U : T;
type ElementType<T> = T extends (infer E)[] ? E : never;
```

These patterns pay off the moment your codebase grows beyond a single person.
