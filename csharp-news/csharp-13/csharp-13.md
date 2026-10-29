# C# 13 Study Guide

C# 13 shipped in November 2024 with .NET 9 / Visual Studio 2022 17.12. **C# 13 is the default language version for .NET 9 only.** On older targets you can set `<LangVersion>13</LangVersion>`; compiler-only features work there (`\e`, implicit index access, partial properties, `ref`/`unsafe` in async and iterators), but features that need new runtime or library types do not: `System.Threading.Lock`, `params ReadOnlySpan<T>` with the new `params` overloads in the BCL, `OverloadResolutionPriorityAttribute`, and `allows ref struct` (needs runtime support for ref-struct generics, .NET 9).

## Table of Contents

1. [Overview of new features](#1-overview-of-new-features)
2. [`params` collections](#2-params-collections)
3. [New `Lock` type](#3-new-lock-type)
4. [`allows ref struct` anti-constraint](#4-allows-ref-struct-anti-constraint)
5. [`ref` and `unsafe` in iterators and async methods](#5-ref-and-unsafe-in-iterators-and-async-methods)
6. [Partial properties and indexers](#6-partial-properties-and-indexers)
7. [Implicit index access in object initializers](#7-implicit-index-access-in-object-initializers)
8. [`\e` escape sequence](#8-e-escape-sequence)
9. [Method group natural type improvements](#9-method-group-natural-type-improvements)
10. [`OverloadResolutionPriority` attribute](#10-overloadresolutionpriority-attribute)
11. [Quick interview cheat sheet](#11-quick-interview-cheat-sheet)

---

## 1. Overview of new features

| Feature | Purpose | Runtime requirement |
|---|---|---|
| `params` collections | `params` works with `Span<T>`, `ReadOnlySpan<T>`, `List<T>`, `IEnumerable<T>` and more, not just arrays | Span types: .NET Core 2.1+/.NET Standard 2.1; collection types need the collection-expression rules (`Add` or builder) |
| `System.Threading.Lock` | Dedicated lock object; `lock` statement uses it directly | .NET 9 |
| `allows ref struct` | Generic type parameters can be `Span<T>`, `ReadOnlySpan<T>` and other ref structs | .NET 9 |
| `ref`/`unsafe` in async and iterators | Ref locals and ref struct locals allowed in more places | None (compiler); ref struct locals need not cross `await`/`yield` |
| Partial properties and indexers | Split declaration and implementation (source generators) | None |
| Implicit index access (`^`) in object initializers | `new C { Items = { [^1] = 5 } }` | None (type needs `Length`/`Count` and an indexer) |
| `\e` escape | Shorthand for ESC (U+001B) | None |
| Method group natural type | Fewer overload ambiguity errors for method groups | None |
| `[OverloadResolutionPriority]` | Library authors steer overload resolution | .NET 9 (attribute type) |

The `field` keyword and `partial` extras beyond the above were only a **preview** in C# 13 (needed `LangVersion` `preview`) and are not part of the shipped feature set.

---

## 2. `params` collections

### 2.1 The problem
`params` only worked with arrays. Every call allocated a new array on the heap, even for two arguments, and you could not use `params` with `Span<T>` or `List<T>`.

### 2.2 The idea
`params` can be applied to any type that is valid as a collection-expression target:
- `T[]` (as before)
- `Span<T>`, `ReadOnlySpan<T>`
- types with a `CollectionBuilder` or an `Add` method and parameterless constructor: `List<T>`, `HashSet<T>`, ...
- interfaces: `IEnumerable<T>`, `IReadOnlyList<T>`, `ICollection<T>`, `IList<T>`, ...

```csharp
public static int Sum(params ReadOnlySpan<int> values)
{
    var total = 0;
    foreach (var v in values) total += v;
    return total;
}

Sum(1, 2, 3);   // compiler can build the span on the stack – no heap allocation
```

### 2.3 Comparison with C# 12

```csharp
// C# 12 – params must be an array; every call allocates int[]
public static int Sum(params int[] values)
{
    var total = 0;
    foreach (var v in values) total += v;
    return total;
}

// params ReadOnlySpan<int> v; error CS0225 in C# 12:
// "The params parameter must have a valid collection type"
```

```csharp
// C# 13 – span-based params, stack-allocated/inline buffer by the compiler
public static int Sum(params ReadOnlySpan<int> values) { /* ... */ return 0; }

// C# 13 – flexible collection types
public static void Log(params IEnumerable<string> messages) { /* ... */ }
public static void Add(params List<int> numbers) { /* ... */ }
```

| | C# 12 | C# 13 |
|---|---|---|
| Allowed `params` types | Arrays only | Arrays, spans, `IEnumerable<T>`, `List<T>`, ... |
| Allocation per call | Always a new array | None for spans (compiler uses inline storage) |
| BCL overloads | `string.Join(string, params string[])` etc. | Added `params ReadOnlySpan<T>` overloads (`Path.Combine`, `string.Concat`, `Task.WhenAll`, ...) in .NET 9 |

### 2.4 Rules & behaviour
- The parameter type must be a valid collection-expression target with an accessible way to construct it.
- `IEnumerable<T>` and other interface forms usually create an array or `List<T>` behind the scenes.
- Overload resolution prefers span overloads over array overloads when both exist (so existing callers are recompiled to the cheaper version).
- Passing an existing array or span directly (not expanded) still works.

### 2.5 Best practices & pitfalls
- Prefer `params ReadOnlySpan<T>` for hot paths; the callee must not store the span beyond the call.
- Recompiling against .NET 9 changes which overload is called; binary compatibility is preserved, source behaviour is almost always identical.
- A `params Span<T>` (mutable) lets the callee modify the stack buffer; use `ReadOnlySpan<T>` unless you really need writes.

---

## 3. New `Lock` type

### 3.1 The problem
`lock (obj)` used `Monitor.Enter/Exit` on an arbitrary reference object, which relies on the object header / sync block. Developers used `object _sync = new()` and sometimes locked on `this` or a `Type` by mistake. Nothing in the type said "this is a lock".

### 3.2 The idea
`System.Threading.Lock` is a dedicated, lightweight lock type. The compiler recognises it: `lock (lockInstance)` compiles to `Lock.EnterScope()` and `Dispose` of the returned `Lock.Scope`, not `Monitor`.

```csharp
public class Counter
{
    private readonly Lock _lock = new();
    private int _value;

    public void Increment()
    {
        lock (_lock)          // compiles to _lock.EnterScope() + using-like dispose
        {
            _value++;
        }
    }

    public bool TryIncrement()
    {
        if (_lock.TryEnter())
        {
            try { _value++; return true; }
            finally { _lock.Exit(); }
        }
        return false;
    }
}
```

### 3.3 Comparison with C# 12

```csharp
// C# 12 – any object, Monitor underneath
private readonly object _sync = new();
public void Increment()
{
    lock (_sync) { _value++; }     // Monitor.Enter / Monitor.Exit
}
```

```csharp
// C# 13 / .NET 9 – dedicated type, compiler uses Lock.EnterScope()
private readonly Lock _sync = new();
public void Increment()
{
    lock (_sync) { _value++; }     // same syntax, different codegen
}
```

| | C# 12 (`object`) | C# 13 (`Lock`) |
|---|---|---|
| Intent in code | Implicit | Explicit type |
| Underlying mechanism | `Monitor` | `Lock.EnterScope()` / `Lock.Scope.Dispose()` |
| Performance | Sync block / thin lock | Faster, purpose-built |
| Accidental misuse | `lock(this)`, boxed value types possible | Locking on a `Lock` through `Monitor` APIs is not supported |

### 3.4 Rules & behaviour
- Syntax of `lock` is unchanged; the compiler picks the new pattern when the expression's compile-time type is exactly `Lock`.
- If you cast a `Lock` to `object` and `lock` on it, you get the old `Monitor` behaviour. Keep the static type `Lock`. (The compiler warns about converting `Lock` to another type in a `lock`.)
- Not async-friendly: like `Monitor`, it is thread-affine; do not `await` inside a `lock` (compile error).
- Reentrant by the same thread, like `Monitor`.
- Members: `EnterScope()`, `Enter()`, `TryEnter()`, `TryEnter(TimeSpan)`, `Exit()`, `IsHeldByCurrentThread`.

### 3.5 Best practices & pitfalls
- Replace `private readonly object _lock = new();` with `Lock` in new code on .NET 9+.
- Use `var` carefully: `var l = new object()` does not give you a `Lock`.
- For async code use `SemaphoreSlim` instead.

---

## 4. `allows ref struct` anti-constraint

### 4.1 The problem
Ref structs (`Span<T>`, `ReadOnlySpan<T>`, custom `ref struct`) cannot be boxed or stored on the heap, so they could not be used as a generic type argument at all. Generic helpers (`Func<T>`, `IEnumerable<T>`, your own `Process<T>`) were impossible to use with spans.

### 4.2 The idea
A new *anti-constraint*, `allows ref struct`, says "T may be a ref struct". It relaxes rules rather than restricting. The generic code is then compiled under ref-struct restrictions (no boxing, no storing on heap, no `async`/lambda capture of T).

```csharp
public static class Util
{
    public static void Use<T>(T value, Action<T> action)
        where T : allows ref struct
    {
        action(value);
    }
}

// .NET 9: Action<T> declared with "allows ref struct"
Util.Use("hello".AsSpan(), span => Console.WriteLine(span.Length));
```

### 4.3 Comparison with C# 12

```csharp
// C# 12 – spans cannot be type arguments
// error CS0306: The type 'ReadOnlySpan<char>' may not be used as a type argument
Func<ReadOnlySpan<char>, int> f = s => s.Length;   // does not compile
```

```csharp
// C# 13 / .NET 9 – the BCL delegates and interfaces opt in
Func<ReadOnlySpan<char>, int> f = s => s.Length;   // compiles
```

### 4.4 Ref struct interfaces
A `ref struct` can now implement interfaces (it still **cannot be converted to the interface type**, as that would box). It is used through generics with `allows ref struct`.

```csharp
public interface IScanner { bool MoveNext(); }

public ref struct SpanScanner : IScanner
{
    private ReadOnlySpan<char> _text;
    public SpanScanner(ReadOnlySpan<char> text) => _text = text;
    public bool MoveNext() { /* ... */ return false; }
}

static void Run<T>(ref T scanner) where T : IScanner, allows ref struct
{
    while (scanner.MoveNext()) { }
}
```

```csharp
// C# 12 – "ref struct SpanScanner : IScanner" is error CS8343:
// ref structs cannot implement interfaces
```

### 4.5 Rules & behaviour
- `allows ref struct` must be the last constraint in the list.
- The generic body must obey ref-safety: no boxing, no `object` conversion, no static fields of `T`, no capture in lambdas or async methods.
- Interface members with default implementations cannot be called on a `ref struct` type.
- Runtime support is required: .NET 9 updated `Func`, `Action`, `Span<T>` helpers, `IEnumerable<T>`-like APIs (`IEnumerable<T>` itself still does not allow ref struct, since its enumerator is a class).

### 4.6 Best practices & pitfalls
- Think "ref struct as T" for parsers, tokenizers and allocation-free pipelines.
- It is an *anti*-constraint: it adds capability for callers and restrictions for the implementer.

---

## 5. `ref` and `unsafe` in iterators and async methods

### 5.1 The problem
Methods marked `async` or containing `yield` could not declare any `ref` local, `ref struct` local (such as `Span<T>`) or use `unsafe` code, even when the local was never live across a suspension point. This forced awkward extraction into helper methods.

### 5.2 The idea
Allowed in `async` methods and iterators, as long as these locals are **not used across `await` or `yield`**:
- `ref` locals and `ref struct` locals (`Span<T>`)
- `unsafe` context (the unsafe code can't contain `await`/`yield`)

```csharp
public async Task<int> ProcessAsync(Stream stream)
{
    var buffer = new byte[1024];
    await stream.ReadAsync(buffer);

    // C# 13: Span<T> local in an async method, used in a block without await
    Span<byte> span = buffer;
    var sum = 0;
    foreach (var b in span) sum += b;

    await Task.Delay(1);   // fine: span is not used after this point
    return sum;
}
```

### 5.3 Comparison with C# 12

```csharp
// C# 12 – error CS4012: Parameters or locals of type 'Span<byte>' cannot be
// declared in async methods or async lambda expressions
public async Task<int> ProcessAsync(Stream stream)
{
    var buffer = new byte[1024];
    await stream.ReadAsync(buffer);
    Span<byte> span = buffer;     // not allowed in C# 12
    return span.Length;
}

// C# 12 workaround – move span code into a synchronous helper
public async Task<int> ProcessAsync12(Stream stream)
{
    var buffer = new byte[1024];
    await stream.ReadAsync(buffer);
    return SumBuffer(buffer);
}
private static int SumBuffer(byte[] buffer)
{
    Span<byte> span = buffer;
    var sum = 0;
    foreach (var b in span) sum += b;
    return sum;
}
```

### 5.4 Rules & behaviour
- The compiler checks that the local is not live over `await`/`yield`; if it is, you still get an error.
- Applies to async methods, async lambdas, iterator methods (`yield return`).
- An `unsafe` block is permitted in these methods, but the `await`/`yield` must stay outside the unsafe code.
- Parameters of ref struct type on async methods remain forbidden (they would live in the state machine).

### 5.5 Best practices & pitfalls
- Scope span locals in a `{ }` block before the next `await`; that makes intent obvious and the compiler happy.
- Do not conclude that async can now capture spans: state machine fields still cannot hold them.

---

## 6. Partial properties and indexers

### 6.1 The problem
`partial` only applied to methods (C# 3/9), classes and, later, events. Source generators (e.g. `LibraryImport`, `GeneratedRegex`, MVVM toolkits, logging) could generate method bodies but had to hand users fields with attributes or ask them to write `[ObservableProperty] private string _name;` and generate the property elsewhere.

### 6.2 The idea
A property or indexer can have a *defining declaration* (no body) and an *implementing declaration* (with body), typically one hand-written and one generated.

```csharp
// Hand-written file
public partial class Person
{
    public partial string Name { get; set; }
}

// Generated file
public partial class Person
{
    private string _name = "";
    public partial string Name
    {
        get => _name;
        set { _name = value; OnNameChanged(); }
    }
}
```

### 6.3 Comparison with C# 12

```csharp
// C# 12 – only methods could be partial; properties had to be a single declaration
public partial class Person
{
    public string Name { get; set; }   // cannot split declaration and implementation
    partial void OnNameChanged();      // partial *method* only
}
// "public partial string Name { get; set; }" -> error CS0753 (partial on property not allowed)
```

```csharp
// C# 13 – generator emits the implementation of a property you declared
public partial string Name { get; set; }
```

### 6.4 Rules & behaviour
- Exactly one defining and one implementing declaration; both must be `partial`.
- Signatures (type, accessors, modifiers) must match.
- The defining declaration looks like an auto-property, so the implementing declaration must **not** be an auto-property (it needs accessor bodies; no auto-property implementation in C# 13).
- Applies to indexers too.

### 6.5 Best practices & pitfalls
- Mainly a source-generator feature (e.g. `CommunityToolkit.Mvvm` `[ObservableProperty]` on partial properties, replacing the field-based pattern).
- Attributes on the declarations are merged (as for partial methods).

---

## 7. Implicit index access in object initializers

### 7.1 The idea
The "from the end" operator `^` is now allowed in an object initializer's indexer target, so you can set elements counted from the end.

```csharp
public class Countdown
{
    public int[] Numbers { get; } = new int[10];
}

var c = new Countdown
{
    Numbers =
    {
        [^1] = 0,   // last element
        [^2] = 1    // second to last
    }
};
```

### 7.2 Comparison with C# 12

```csharp
// C# 12 – error CS1503/CS0832-style: ^ not allowed in an initializer indexer
var c = new Countdown
{
    Numbers = { [^1] = 0 }   // does not compile in C# 12
};

// C# 12 workaround
var c2 = new Countdown();
c2.Numbers[c2.Numbers.Length - 1] = 0;
```

### 7.3 Rules & behaviour
- Requires the type to be countable (`Length` or `Count`) and have an accessible `int` indexer, as with the C# 8 implicit index support.
- The compiler turns `^1` into `Length - 1`.
- The inner collection must already be non-null (the initializer doesn't create it).

---

## 8. `\e` escape sequence

### 8.1 The idea
`\e` is a character escape for ESC (U+001B), used for ANSI/VT terminal sequences.

```csharp
Console.WriteLine("\e[31mError\e[0m");   // red text, then reset
```

### 8.2 Comparison with C# 12

```csharp
// C# 12 – \u001b or \x1b; \x1b is risky because \x takes 1–4 hex digits
Console.WriteLine("\u001b[31mError\u001b[0m");
Console.WriteLine("\x1b[31mError\x1b[0m");   // OK here, but "\x1b1" would be read as U+01B1
```

### 8.3 Rules & behaviour
- Works in regular strings, char literals (`'\e'`) and interpolated strings.
- Same value as `\u001b`, purely a readability improvement.

---

## 9. Method group natural type improvements

### 9.1 The problem
In C# 10 method groups gained a "natural type" (e.g. `var f = Foo;`). The compiler first collected *all* candidate methods in scope, including inapplicable ones, then pruned. Candidates from outer scopes or ones failing generic constraints caused ambiguity errors.

### 9.2 The idea
The compiler prunes candidates earlier: by scope (inner scopes first) and by generic constraints, before computing the natural type.

```csharp
public static class Program
{
    static void Main()
    {
        var f = Helper.Process;   // C# 13: resolves to the single viable candidate
    }
}

static class Helper
{
    public static void Process<T>(T value) where T : struct { }
    public static void Process(string value) { }
}
```

### 9.3 Comparison with C# 12
- C# 12: candidates with unsatisfied constraints still counted, which could cause `var f = ...;` to fail (error CS8917: "The delegate type could not be inferred").
- C# 13: candidates are removed first; the natural type is inferred when exactly one remains.

### 9.4 Rules & behaviour
- A source-compatible improvement: code that compiled before keeps compiling; some previously failing code now works.
- Rarely noticed; mainly affects lambda-heavy minimal APIs (`app.MapGet("/", Handler)`).

---

## 10. `OverloadResolutionPriority` attribute

### 10.1 The problem
Library authors adding a better overload (such as `params ReadOnlySpan<T>`) cannot make the compiler prefer it without risking ambiguity or breaking existing callers.

### 10.2 The idea
`[OverloadResolutionPriority(n)]` (namespace `System.Runtime.CompilerServices`) lets an author give one overload a higher priority. When several overloads are applicable, the higher priority wins **before** the usual tie-breakers (better conversion, etc.).

```csharp
using System.Runtime.CompilerServices;

public static class Logger
{
    // Old API stays for binary compatibility
    public static void Write(params string[] items) { }

    // New API is preferred on recompilation
    [OverloadResolutionPriority(1)]
    public static void Write(params ReadOnlySpan<string> items) { }
}

Logger.Write("a", "b");   // chooses the span overload
```

### 10.3 Comparison with C# 12
No equivalent. In C# 12 authors had to remove the old overload (binary break) or accept ambiguity/the compiler's own choice, or hide it with `[EditorBrowsable]`/`[Obsolete]`, which does not change resolution.

### 10.4 Rules & behaviour
- Default priority is 0; higher wins; compared only among members of the same declaring type.
- Does not affect already-compiled binaries; it is compile-time resolution only.
- Intended for library authors, not everyday application code.
- Can be put on indexers and constructors as well.

---

## 11. Quick interview cheat sheet

### Likely questions and concise answers

**What was released with C# 13 and which runtime?**
C# 13 shipped in November 2024 with .NET 9 and Visual Studio 2022 17.12. It is the default language version for .NET 9 only.

**What are `params` collections?**
`params` now supports `Span<T>`, `ReadOnlySpan<T>`, `IEnumerable<T>`, `List<T>` and other collection-expression targets, not only arrays. With spans, calls need no heap allocation.

**How does the new `Lock` type work?**
`System.Threading.Lock` is a dedicated lock. When the static type is `Lock`, `lock (x)` compiles to `EnterScope()` and `Dispose()` instead of `Monitor.Enter/Exit`. It is faster and states intent.

**Can you `await` inside a `lock`?**
No; compile error for both `object` and `Lock`. Use `SemaphoreSlim` for async mutual exclusion.

**What is `allows ref struct`?**
An anti-constraint on a generic parameter that permits ref structs such as `Span<T>` as type arguments. The generic code is compiled with ref-struct restrictions (no boxing, no heap storage).

**Can a ref struct implement an interface?**
Since C# 13 yes, but it cannot be converted to the interface (boxing). Use it through a generic `where T : IFoo, allows ref struct`.

**What can you do with `ref`/`unsafe` in async methods now?**
Declare `ref` locals, `Span<T>` locals and `unsafe` blocks as long as they are not live across `await`/`yield`.

**What are partial properties?**
A property or indexer with separate defining and implementing declarations, mainly for source generators. The implementation can't be an auto-property.

**What is implicit index access in object initializers?**
`[^1] = value` is allowed in an initializer, so you can assign from the end of an array-like member.

**What is `\e`?**
A character escape for ESC (U+001B) for ANSI terminal codes; equivalent to `\u001b`.

**What does `OverloadResolutionPriority` do?**
It lets a library author make one overload win during overload resolution, used to introduce better overloads without breaking callers.

**What is the difference between `lock (object)` and `lock (Lock)`?**
Same syntax. `object` uses `Monitor`; `Lock` uses `Lock.EnterScope()` and a disposable scope. Behaviour changes only if the static type is `Lock`.

**What needs runtime support and what is compiler-only?**
Runtime/library (.NET 9): `Lock`, `allows ref struct` generics in BCL, `OverloadResolutionPriorityAttribute`, new `params` span overloads. Compiler-only: `\e`, partial properties, implicit index in initializers, `ref`/`unsafe` in async/iterators, method group improvements.

**Was `field` part of C# 13?**
It was only a preview feature in C# 13 (requires `LangVersion` `preview`), not part of the final C# 13 feature set.

### Common traps
- `var x = new object()` is **not** a `Lock`; `lock` uses `Monitor` unless the static type is `Lock`.
- Passing a `Lock` as `object` silently falls back to `Monitor` semantics (with a compiler warning).
- `await` inside `lock` is still illegal; `Lock` is thread-affine.
- `params ReadOnlySpan<T>`: the callee must not retain the span; the buffer may be on the stack.
- Recompiling on .NET 9 can change which `params` overload (array vs span) is selected; behaviour should be identical but allocations differ.
- `allows ref struct` does not mean `IEnumerable<T>` accepts spans; only APIs updated in .NET 9 do.
- A ref struct implementing an interface still cannot be assigned to the interface type.
- `ref`/`Span<T>` locals in async methods must not be live across an `await`; parameters of ref struct type are still not allowed.
- Partial property implementations cannot be auto-properties; the declaring and implementing signatures must match.
- `OverloadResolutionPriority` is compile-time only and only compares overloads from the same type.
