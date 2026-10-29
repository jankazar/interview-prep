# C# 8.0 Study Guide

C# 8.0 shipped in September 2019 with .NET Core 3.0 / Visual Studio 2019 16.3. It is the first C# version where some features depend on runtime support, so the default language version is tied to the target framework: **C# 8.0 is the default for .NET Core 3.x only**. For .NET Standard 2.0 / .NET Framework you can opt in with `<LangVersion>8.0</LangVersion>`, but features that need new runtime types (indexes/ranges, async streams, default interface members) are only partially or not supported there.

## Table of Contents

1. [Overview of new features](#1-overview-of-new-features)
2. [Nullable reference types](#2-nullable-reference-types)
3. [Switch expressions](#3-switch-expressions)
4. [Pattern matching enhancements](#4-pattern-matching-enhancements)
5. [Using declarations](#5-using-declarations)
6. [Static local functions](#6-static-local-functions)
7. [Indices and ranges](#7-indices-and-ranges)
8. [Null-coalescing assignment](#8-null-coalescing-assignment-)
9. [Asynchronous streams](#9-asynchronous-streams)
10. [Asynchronous disposable](#10-asynchronous-disposable)
11. [Default interface members](#11-default-interface-members)
12. [Readonly members](#12-readonly-members)
13. [Disposable ref structs](#13-disposable-ref-structs)
14. [Unmanaged constructed types](#14-unmanaged-constructed-types)
15. [Stackalloc in nested expressions](#15-stackalloc-in-nested-expressions)
16. [Enhancement of interpolated verbatim strings](#16-enhancement-of-interpolated-verbatim-strings)
17. [Quick interview cheat sheet](#17-quick-interview-cheat-sheet)

---

## 1. Overview of new features

| Feature | Purpose | Runtime requirement |
|---|---|---|
| Nullable reference types | Compile-time null-safety analysis | None (compiler only, attributes in BCL) |
| Switch expressions | Expression-based, concise `switch` | None |
| Property / tuple / positional patterns | Richer pattern matching | None (positional needs `Deconstruct`) |
| `using` declarations | Dispose at end of enclosing scope | None |
| Static local functions | Prevent accidental capture | None |
| Indices and ranges (`^`, `..`) | Slicing sequences | `System.Index`, `System.Range` |
| `??=` | Assign only when null | None |
| `IAsyncEnumerable<T>` / `await foreach` | Async pull-based streams | `IAsyncEnumerable<T>` (.NET Core 3.0+/.NET Standard 2.1) |
| `IAsyncDisposable` / `await using` | Async cleanup | .NET Core 3.0+/.NET Standard 2.1 |
| Default interface members | Evolve interfaces without breaking implementers | Runtime support (.NET Core 3.0+) |
| `readonly` struct members | Fine-grained immutability, fewer defensive copies | None |
| Disposable `ref struct` | `ref struct` with `Dispose()` usable in `using` | None |
| Unmanaged constructed types | Generic struct of unmanaged args is unmanaged | None |
| `stackalloc` in nested expressions | `Span<int> s = cond ? stackalloc int[5] : new int[5]` | None |
| `$@""` and `@$""` | Either order for interpolated verbatim strings | None |

---

## 2. Nullable reference types

### 2.1 The problem
Before C# 8, every reference type was implicitly nullable, so `NullReferenceException` was the most common runtime failure ("the billion-dollar mistake"). Value types already had `Nullable<T>` (`int?`); reference types had no way to express intent.

### 2.2 The idea
With the **nullable context** enabled:
* `string` means **non-nullable** — the compiler expects it never to be `null`.
* `string?` means **nullable** — the compiler requires a null check before dereferencing.

Crucially, these are **annotations and compiler warnings only**. There is no runtime change: `string` and `string?` are the same type at runtime (the nullability is emitted as attributes such as `[Nullable]`/`[NullableContext]`). The compiler produces warnings (CS8600-series), not errors, unless you use `<WarningsAsErrors>nullable</WarningsAsErrors>` or `TreatWarningsAsErrors`.

### 2.3 Enabling it

Project-wide (`.csproj`):

```xml
<PropertyGroup>
  <Nullable>enable</Nullable>
</PropertyGroup>
```

Per file / region:

```csharp
#nullable enable      // annotations + warnings
#nullable disable     // old behaviour
#nullable restore     // return to project setting
#nullable enable annotations   // only annotations, no warnings
#nullable enable warnings      // only warnings, no annotations
```

Project values: `enable`, `disable`, `warnings`, `annotations`.

### 2.4 Example

```csharp
#nullable enable

public class Customer
{
    public string Name { get; set; }          // CS8618 warning: non-nullable property uninitialized
    public string? MiddleName { get; set; }   // OK, nullable by design

    public Customer(string name) => Name = name;
}

string? input = Console.ReadLine();
int length = input.Length;        // CS8602: dereference of a possibly null reference
int safe  = input?.Length ?? 0;   // OK
if (input != null)                // flow analysis: input is non-null here
{
    Console.WriteLine(input.Length);
}
```

### 2.4.1 Comparison with C# 7.x

```csharp
// C# 7.x – no way to express intent; every reference may be null, nothing warns
public class Customer
{
    public string Name { get; set; }          // null or not? Only documentation can tell
    public string MiddleName { get; set; }    // same type, same signature
}

string input = Console.ReadLine();
int length = input.Length;                    // compiles silently, NullReferenceException at runtime
```

```csharp
// C# 8 – intent is part of the signature and the compiler checks every dereference
public class Customer
{
    public string Name { get; set; }          // warning CS8618 if not initialised
    public string? MiddleName { get; set; }   // explicitly optional
}

string? input = Console.ReadLine();
int length = input.Length;                    // warning CS8602 at compile time
```

| | C# 7.x | C# 8 |
|---|---|---|
| Express "may be null" | Comments / `[CanBeNull]` (ReSharper) | `string?` |
| Detect null bugs | Runtime exception | Compile-time warning |
| Runtime type change | – | None |

### 2.5 Flow analysis and the null-forgiving operator
The compiler tracks the **null-state** ("maybe-null" / "not-null") of each variable through the code. When you know better than the compiler, use the **null-forgiving operator** `!` (postfix):

```csharp
string? s = GetValueKnownToBeNonNull();
int n = s!.Length;   // suppresses the warning – no runtime check!
```

`!` is a promise, not a check — misuse leads to a real `NullReferenceException`. Prefer fixing the design; use `!` sparingly (e.g. in tests, or for EF Core navigation properties with `= null!;`).

### 2.6 Nullable attributes (for API authors)
Located in `System.Diagnostics.CodeAnalysis`; they describe contracts the compiler can't infer:

| Attribute | Meaning |
|---|---|
| `[AllowNull]` / `[DisallowNull]` | Input may/may not be null though the type says otherwise |
| `[MaybeNull]` / `[NotNull]` | Output may be null / is guaranteed non-null |
| `[MaybeNullWhen(bool)]` / `[NotNullWhen(bool)]` | Conditional on the return value (`TryGetValue` pattern) |
| `[NotNullIfNotNull("param")]` | Return is non-null if the named argument is non-null |
| `[MemberNotNull]` / `[MemberNotNullWhen]` | Method guarantees members are initialised |
| `[DoesNotReturn]` / `[DoesNotReturnIf(bool)]` | Method never returns (throws) |

```csharp
public bool TryGetUser(int id, [NotNullWhen(true)] out User? user) { ... }

if (repo.TryGetUser(1, out var u))
{
    Console.WriteLine(u.Name);   // no warning: u is non-null here
}
```

### 2.7 Generics and `notnull`

```csharp
public class Cache<T> where T : notnull { }   // T cannot be a nullable type
public T? Find<T>(...) where T : class { }    // in C# 8, T? requires a class or struct constraint
```

### 2.8 Migration strategy
1. Enable `<Nullable>warnings</Nullable>` or per-file `#nullable enable` to adopt incrementally.
2. Start with leaf libraries/projects with no dependencies, move upward.
3. Annotate public APIs first — they are the contract consumers see.
4. Remember the `null!` idiom for fields initialised by frameworks (DI, serializers, EF).

### 2.9 Best practices & pitfalls
* Don't use `!` to silence warnings wholesale — treat warnings as bugs.
* Still validate public input at API boundaries (throw `ArgumentNullException`): callers with nullable disabled or using `!` can still pass `null`.
* Arrays: `string?[]` (array of nullable) vs `string[]?` (nullable array) vs `string?[]?`.
* `Nullable<T>` (`int?`) and nullable reference types are different mechanisms; `int?` changes the runtime type, `string?` does not.
* Libraries/serialisers/reflection ignore the annotations unless they read the attributes.
* `default` for a non-nullable reference type gives a warning (`string s = default;`).

---

## 3. Switch expressions

A **switch expression** is an expression (it produces a value) with a more compact syntax than the `switch` statement: no `case`, no `break`, `=>` instead of `:`, `_` for default.

### 3.1 Before and after

```csharp
// C# 7
string GetName(Color c)
{
    switch (c)
    {
        case Color.Red:   return "Red";
        case Color.Green: return "Green";
        default:          throw new ArgumentOutOfRangeException(nameof(c));
    }
}

// C# 8
string GetName(Color c) => c switch
{
    Color.Red   => "Red",
    Color.Green => "Green",
    _           => throw new ArgumentOutOfRangeException(nameof(c))
};
```

### 3.2 Rules
* The variable comes **before** the `switch` keyword.
* Arms are separated by commas; the last comma is optional.
* Arms are evaluated **top to bottom**; the first match wins.
* The compiler checks **exhaustiveness**: a non-exhaustive switch gives warning CS8509. If no arm matches at runtime a `SwitchExpressionException` (derived from `InvalidOperationException`) is thrown.
* The compiler also reports **subsumed arms** (an arm that can never be reached) as an error (CS8510).
* The result type is the best common type of the arms.
* `throw` is allowed as an arm expression.

### 3.3 Arms with conditions (`when`)

```csharp
string Classify(int n) => n switch
{
    var x when x < 0      => "negative",
    0                     => "zero",
    var x when x % 2 == 0 => "even",
    _                     => "odd"
};
```

---

## 4. Pattern matching enhancements

C# 7 introduced type and constant patterns (`is`, `case`). C# 8 added **recursive patterns** and new pattern forms.

### 4.1 Property patterns
Match against properties/fields of the object:

```csharp
public static decimal CalculateTax(Address a) => a switch
{
    { State: "WA" }                    => 0.095m,
    { State: "MN", City: "Minneapolis"} => 0.0875m,
    { State: "MN" }                    => 0.075m,
    null                               => throw new ArgumentNullException(nameof(a)),
    _                                  => 0m
};
```

**Comparison with C# 7.x:**

```csharp
// C# 7.x – type pattern + manual property checks inside `when`
public static decimal CalculateTax(Address a)
{
    if (a == null) throw new ArgumentNullException(nameof(a));

    switch (a)
    {
        case Address x when x.State == "WA":
            return 0.095m;
        case Address x when x.State == "MN" && x.City == "Minneapolis":
            return 0.0875m;
        case Address x when x.State == "MN":
            return 0.075m;
        default:
            return 0m;
    }
}
```

A property pattern `{ }` also matches any **non-null** value; `{ Prop: ... }` implies a null check, so it is a handy null-safe test.

Nested properties are matched with nested patterns: `{ Address: { State: "WA" } }`.

### 4.2 Positional patterns
Use `Deconstruct` (or tuple deconstruction) to match positions:

```csharp
public readonly struct Point
{
    public int X { get; }
    public int Y { get; }
    public Point(int x, int y) => (X, Y) = (x, y);
    public void Deconstruct(out int x, out int y) => (x, y) = (X, Y);
}

string Quadrant(Point p) => p switch
{
    (0, 0)                  => "origin",
    (var x, var y) when x > 0 && y > 0 => "I",
    (var x, var y) when x < 0 && y > 0 => "II",
    (var x, var y) when x < 0 && y < 0 => "III",
    (var x, var y) when x > 0 && y < 0 => "IV",
    (_, 0)                  => "x-axis",
    (0, _)                  => "y-axis",
    _                       => "unreachable"
};
```

**Comparison with C# 7.x:**

```csharp
// C# 7.x – deconstruct first, then use `when` guards
string Quadrant(Point p)
{
    int x, y;
    p.Deconstruct(out x, out y);

    if (x == 0 && y == 0) return "origin";
    if (x > 0 && y > 0) return "I";
    if (x < 0 && y > 0) return "II";
    if (x < 0 && y < 0) return "III";
    if (x > 0 && y < 0) return "IV";
    if (y == 0) return "x-axis";
    return "y-axis";
}
```

### 4.3 Tuple patterns
Switch over several values at once:

```csharp
string Play(string a, string b) => (a, b) switch
{
    ("rock", "paper")     => "paper wins",
    ("rock", "scissors")  => "rock wins",
    ("paper", "scissors") => "scissors wins",
    (var x, var y) when x == y => "draw",
    _                     => "reverse"
};
```

The compiler does not allocate a tuple here — the values are matched directly.

**Comparison with C# 7.x:**

```csharp
// C# 7.x – nested ifs / combined conditions
string Play(string a, string b)
{
    if (a == "rock" && b == "paper") return "paper wins";
    if (a == "rock" && b == "scissors") return "rock wins";
    if (a == "paper" && b == "scissors") return "scissors wins";
    if (a == b) return "draw";
    return "reverse";
}
```

C# 7.x could technically `switch` on a tuple (`switch ((a, b)) { case var t when t.Item1 == ... }`), but without tuple patterns it was verbose and unreadable.

### 4.4 Recursive patterns
Patterns can be nested inside each other:

```csharp
if (order is { Customer: { Address: { Country: "CZ" } }, Total: var total } && total > 1000) { }
```

### 4.5 `var` pattern and discard
* `var x` always matches and captures the value (even `null`).
* `_` is the discard pattern in a switch expression: matches anything.

---

## 5. Using declarations

A `using` declaration removes the braces: the object is disposed at the **end of the enclosing scope**.

```csharp
// C# 7
static void Write(string path)
{
    using (var file = new StreamWriter(path))
    {
        file.WriteLine("hello");
    }   // disposed here
}

// C# 8
static void Write(string path)
{
    using var file = new StreamWriter(path);
    file.WriteLine("hello");
}   // disposed here (end of method)
```

* Multiple declarations are disposed in **reverse order** of declaration.
* Works inside any block (`if`, `for`, a method...). Disposal happens when that block exits, including via exception, return or `goto`.
* The variable is read-only and cannot be reassigned.
* Works with `IDisposable` and with pattern-based disposal for `ref struct`s.
* Pitfall: the resource lives longer than with a braced `using`, which may hold a file/connection/lock longer than intended. Introduce a block `{ }` when you need earlier disposal.
* Pitfall: you can't use it to declare in a `for` initialiser or a `switch` case section without braces.

---

## 6. Static local functions

Local functions (C# 7) can capture variables of the enclosing method, which creates a closure (possibly allocating an object/delegate). Marking one `static` forbids capturing.

```csharp
int Add(int x, int y)
{
    return Sum(x, y);

    static int Sum(int a, int b) => a + b;   // cannot reference x or y
}
```

**Comparison with C# 7.x:**

```csharp
// C# 7.x – a (non-static) local function silently captures `factor` => closure
int Multiply(int value, int factor)
{
    return Calc(value);

    int Calc(int v) => v * factor;     // captures 'factor'; compiles fine, may allocate
}

// C# 8 – `static` turns accidental capture into a compile error
int Multiply2(int value, int factor)
{
    return Calc(value, factor);

    static int Calc(int v, int f) => v * f;   // must receive everything as parameters
}
```

Why use it:
* **Intent + safety:** accidental capture is a compile error (CS8421).
* **Performance:** guaranteed not to capture, so there's no closure allocation.
* A static local function can reference other static members, constants, and its own parameters/locals.

Common idiom — eager argument validation with iterator/async methods:

```csharp
public static IEnumerable<int> Range(int from, int count)
{
    if (count < 0) throw new ArgumentOutOfRangeException(nameof(count));   // runs eagerly
    return Core(from, count);

    static IEnumerable<int> Core(int start, int n)
    {
        for (var i = 0; i < n; i++) yield return start + i;
    }
}
```

---

## 7. Indices and ranges

New syntax and two BCL types make slicing concise and safe.

### 7.1 `Index` and the hat operator `^`
* `System.Index` represents a position, from the start or the **end**.
* `^n` means "n from the end": `^1` is the last element, `^0` is one past the end (length).
* An `int` converts implicitly to `Index` (from start).

```csharp
string[] words = { "The", "quick", "brown", "fox", "jumps" };
Console.WriteLine(words[^1]);   // jumps
Console.WriteLine(words[^2]);   // fox
Index i = ^3;                   // "brown"
```

**Comparison with C# 7.x:**

```csharp
// C# 7.x
var last       = words[words.Length - 1];
var secondLast = words[words.Length - 2];

// C# 8
var last2       = words[^1];
var secondLast2 = words[^2];
```

### 7.2 `Range` and the range operator `..`
* `System.Range` has a `Start` and an `End` `Index`. Start is **inclusive**, end is **exclusive**.

```csharp
var slice1 = words[1..3];    // "quick", "brown"
var slice2 = words[..2];     // "The", "quick"
var slice3 = words[2..];     // "brown", "fox", "jumps"
var slice4 = words[^2..];    // "fox", "jumps"
var all    = words[..];      // copy of everything
Range r = 1..^1;             // reusable Range value
```

**Comparison with C# 7.x:**

```csharp
// C# 7.x – manual arithmetic and helper calls
var slice1 = words.Skip(1).Take(2).ToArray();                    // LINQ, allocates iterators
var slice2 = new string[2];
Array.Copy(words, 1, slice2, 0, 2);                              // manual copy
var tail   = new ArraySegment<string>(words, words.Length - 2, 2);
var sub    = text.Substring(1, 2);                               // strings

// C# 8
var slice3 = words[1..3];
var tail2  = words[^2..];
var sub2   = text[1..3];
```

### 7.3 What supports it?
* Arrays — `array[range]` **creates a copy** (via `RuntimeHelpers.GetSubArray`).
* `string` — `s[1..3]` calls `Substring` (a new string).
* `Span<T>` / `ReadOnlySpan<T>` / `Memory<T>` — **no copy**, a view onto the same memory.
* `List<T>` supports `^` index but **not** ranges natively (until you add a `Slice` method); `list[^1]` works.
* Custom types: the compiler uses **implicit support** if the type is *Countable* (has `Length` or `Count`) and has an accessible `int` indexer (for `Index`) and/or a `Slice(int start, int length)` method (for `Range`). Or declare explicit indexers taking `Index`/`Range`.

```csharp
public class Sentence
{
    private readonly string[] _words;
    public Sentence(string[] w) => _words = w;
    public int Length => _words.Length;
    public string this[int i] => _words[i];            // enables ^n via implicit support
    public string[] Slice(int start, int length)       // enables ranges
        => _words.AsSpan(start, length).ToArray();
}

var s = new Sentence(words);
var last = s[^1];
var part = s[1..3];
```

### 7.4 Gotchas
* Out-of-range → `ArgumentOutOfRangeException`/`IndexOutOfRangeException` at runtime.
* `^0` is valid for a range end but throws as an element index.
* Prefer spans for slicing large arrays in hot paths to avoid copies: `words.AsSpan()[1..3]`.
* `Enumerable.Take/Skip` aren't replaced by ranges.

---

## 8. Null-coalescing assignment (`??=`)

Assigns the right operand to the left only if the left operand evaluates to `null`.

```csharp
List<int>? numbers = null;
numbers ??= new List<int>();     // creates the list
numbers.Add(1);
numbers ??= new List<int>();     // no-op, right side not evaluated

// C# 7.x equivalents
if (numbers == null) numbers = new List<int>();
numbers = numbers ?? new List<int>();      // always performs a (self-)assignment
```

* Right-hand side is evaluated **lazily** (only when the left is null).
* Works with fields, properties, locals, indexers and with nullable value types (`int? x = null; x ??= 5;`).
* Handy for lazy init: `_cache ??= LoadCache();` — but **not thread-safe**; use `Lazy<T>` or `LazyInitializer` for concurrency.
* The result of the whole expression is the final value of the left operand.

---

## 9. Asynchronous streams

Before C# 8 you could either return **one** async value (`Task<T>`) or **many** sync values (`IEnumerable<T>`). Async streams add *many async values*: `IAsyncEnumerable<T>`.

### 9.1 Interfaces (in `System.Collections.Generic`)

```csharp
public interface IAsyncEnumerable<out T>
{
    IAsyncEnumerator<T> GetAsyncEnumerator(CancellationToken cancellationToken = default);
}

public interface IAsyncEnumerator<out T> : IAsyncDisposable
{
    T Current { get; }
    ValueTask<bool> MoveNextAsync();
}
```

### 9.2 Producing: async iterator method
A method that is `async`, returns `IAsyncEnumerable<T>`, and uses `yield return`:

```csharp
public static async IAsyncEnumerable<int> GenerateAsync(
    int count,
    [EnumeratorCancellation] CancellationToken ct = default)
{
    for (var i = 0; i < count; i++)
    {
        await Task.Delay(100, ct);   // simulate async work
        yield return i;
    }
}
```

### 9.3 Consuming: `await foreach`

```csharp
await foreach (var n in GenerateAsync(10))
{
    Console.WriteLine(n);
}

// with cancellation and ConfigureAwait
using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(1));
await foreach (var n in GenerateAsync(10).WithCancellation(cts.Token).ConfigureAwait(false))
{
    Console.WriteLine(n);
}
```

### 9.3.1 Comparison with C# 7.x

```csharp
// C# 7.x – option A: async, but all items are buffered before the caller sees any
public static async Task<List<int>> GenerateAsync(int count)
{
    var result = new List<int>();
    for (var i = 0; i < count; i++)
    {
        await Task.Delay(100);
        result.Add(i);
    }
    return result;
}
var items = await GenerateAsync(10);
foreach (var n in items) Console.WriteLine(n);

// C# 7.x – option B: lazy, but synchronous – blocks the thread while waiting
public static IEnumerable<int> Generate(int count)
{
    for (var i = 0; i < count; i++)
    {
        Task.Delay(100).Wait();      // blocking!
        yield return i;
    }
}
foreach (var n in Generate(10)) Console.WriteLine(n);
```

C# 8 combines both: lazy **and** non-blocking (`IAsyncEnumerable<T>` + `await foreach`, shown above).

| | `Task<List<T>>` (C# 7.x) | `IEnumerable<T>` (C# 7.x) | `IAsyncEnumerable<T>` (C# 8) |
|---|---|---|---|
| Non-blocking | Yes | No | Yes |
| Items available as produced | No | Yes | Yes |
| Memory | Whole set | One at a time | One at a time |

### 9.4 Key points
* `[EnumeratorCancellation]` makes the token passed to `WithCancellation(...)` flow into your parameter.
* `MoveNextAsync` returns `ValueTask<bool>` to avoid allocations when the next item is ready synchronously.
* Streams are **lazy and pull-based**: the next item is produced only when the consumer asks, giving natural **back-pressure** and low memory use.
* An exception thrown in the producer surfaces at the consumer's `await foreach`.
* Breaking out of `await foreach` calls `DisposeAsync` on the enumerator (running `finally` blocks).
* Compared to `Task<IEnumerable<T>>` (all data at once) and `IObservable<T>` (push-based).
* LINQ for async streams: `System.Linq.Async` NuGet package.

### 9.5 Real-world uses
* Reading rows from a database/file/HTTP page-by-page (e.g. EF Core `AsAsyncEnumerable()`).
* ASP.NET Core controller actions can return `IAsyncEnumerable<T>`; gRPC server streaming.
* Polling APIs with pagination:

```csharp
public async IAsyncEnumerable<Product> GetAllProductsAsync(
    [EnumeratorCancellation] CancellationToken ct = default)
{
    string? next = "/products?page=1";
    while (next != null)
    {
        Page<Product> page = await _client.GetPageAsync<Product>(next, ct);
        foreach (var p in page.Items) yield return p;
        next = page.NextUrl;
    }
}
```

---

## 10. Asynchronous disposable

`IAsyncDisposable` supports cleanup that needs `await` (flushing a buffer, closing a network connection).

```csharp
public interface IAsyncDisposable
{
    ValueTask DisposeAsync();
}
```

### 10.1 Usage

```csharp
await using (var conn = new AsyncConnection())
{
    await conn.SendAsync(data);
}

// or with a using declaration
await using var conn2 = new AsyncConnection();
await conn2.SendAsync(data);
```

**Comparison with C# 7.x:**

```csharp
// C# 7.x – no async disposal: either block, or call a Close method manually
using (var conn = new Connection())
{
    await conn.SendAsync(data);
}   // Dispose() is synchronous – must block on the flush (.GetAwaiter().GetResult())

var conn2 = new AsyncConnection();
try
{
    await conn2.SendAsync(data);
}
finally
{
    await conn2.CloseAsync();       // custom method, easy to forget, no language support
}
```

### 10.2 Implementing the pattern

```csharp
public class AsyncConnection : IAsyncDisposable, IDisposable
{
    private bool _disposed;

    public async ValueTask DisposeAsync()
    {
        await DisposeAsyncCore().ConfigureAwait(false);
        Dispose(disposing: false);
        GC.SuppressFinalize(this);
    }

    protected virtual async ValueTask DisposeAsyncCore()
    {
        if (!_disposed)
        {
            await FlushAsync().ConfigureAwait(false);
            _disposed = true;
        }
    }

    public void Dispose() { Dispose(true); GC.SuppressFinalize(this); }
    protected virtual void Dispose(bool disposing) { /* sync cleanup */ }
}
```

### 10.3 Notes
* `await using` calls `DisposeAsync()` and awaits it; use `ConfigureAwait(false)` on it with `await using var x = ...ConfigureAwait(false)` style: `await using (x.ConfigureAwait(false))`.
* Types such as `Stream`, `DbContext`, `HttpClient`-related handlers, `Utf8JsonWriter` implement it.
* Provide both `IDisposable` and `IAsyncDisposable` when the object may be used from sync code.
* Async enumerators implement `IAsyncDisposable`, so `await foreach` disposes them.

---

## 11. Default interface members

Interfaces can now contain **method bodies** (default implementations), plus static members, private members and more.

### 11.1 Motivation: evolve interfaces without breaking changes
Adding a method to a published interface used to break every implementer. With a default implementation, existing implementers keep compiling.

```csharp
public interface ILogger
{
    void Log(string message);

    // new member with default body – existing implementers are unaffected
    void LogError(string message) => Log($"ERROR: {message}");
}

public class ConsoleLogger : ILogger
{
    public void Log(string message) => Console.WriteLine(message);
}

ILogger logger = new ConsoleLogger();
logger.LogError("boom");              // OK – via interface type

var concrete = new ConsoleLogger();
// concrete.LogError("boom");         // ERROR: not a member of the class!
((ILogger)concrete).LogError("boom"); // must cast to the interface
```

**Comparison with C# 7.x:**

```csharp
// C# 7.x – adding LogError to the interface is a BREAKING change
public interface ILogger
{
    void Log(string message);
    void LogError(string message);      // every implementer now fails to compile
}

// Workarounds: a new interface (ILogger2 : ILogger), an abstract base class,
// or an extension method (cannot be overridden by implementers)
public static class LoggerExtensions
{
    public static void LogError(this ILogger logger, string message)
        => logger.Log("ERROR: " + message);
}
```

### 11.2 What interfaces may now contain
* Instance methods, properties, indexers and events **with bodies**
* `static` members (fields, methods, properties, events, constructors)
* `private`, `protected`, `internal`, `public` (default), `sealed`, `virtual`, `abstract`, `static` modifiers
* **Not allowed:** instance fields, instance constructors, instance state, operators `Equals/GetHashCode/Finalize` overriding.

```csharp
public interface IGreeter
{
    private static string Prefix = "Hello";            // static state OK
    string Name { get; }
    string Greet() => $"{Prefix}, {Name}!";
    protected string Helper() => Name.ToUpper();       // accessible to derived interfaces
}
```

### 11.3 Overriding and the diamond problem
A class can override the default by providing its own member (implicitly or explicitly):

```csharp
public class QuietLogger : ILogger
{
    public void Log(string m) { }
    public void LogError(string m) { /* custom */ }
}
```

A derived interface can re-implement (override) a base default via **explicit implementation**:

```csharp
public interface IFileLogger : ILogger
{
    void ILogger.LogError(string m) => Log($"[FILE] {m}");
}
```

**Diamond problem:** if a class implements two interfaces which both provide a default for the same member (through different inheritance paths) with no "most specific" override, the compiler errors and the class must provide its own implementation. The "most specific override" wins when one interface derives from the other.

### 11.4 Interfaces vs abstract classes after C# 8
| | Interface with defaults | Abstract class |
|---|---|---|
| Multiple inheritance | Yes (many interfaces) | No |
| Instance state (fields) | No | Yes |
| Constructors | No | Yes |
| Member accessible from class instance | Only through interface reference | Yes |
| Versioning | Add members safely | Add non-abstract members safely |

### 11.5 Use cases and cautions
* **Versioning** of library interfaces (the main reason; BCL uses it, e.g. adding members to `ILogger` abstractions).
* **Traits / mixins**-like behaviour.
* **Caution:** it blurs interface vs. class; don't turn interfaces into "multiple-inheritance abstract classes". Prefer extension methods for optional helpers that need not be overridden.
* Requires runtime support: not available on .NET Framework or Xamarin of that era; supported on .NET Core 3.0+ / .NET Standard 2.1.
* Mocking frameworks need to handle default members (Moq/NSubstitute do).

---

## 12. Readonly members

Within a `struct`, individual members can be marked `readonly` to declare they don't modify state.

```csharp
public struct Point
{
    public double X { get; set; }
    public double Y { get; set; }

    public readonly double Distance => Math.Sqrt(X * X + Y * Y);

    public readonly override string ToString() => $"({X}, {Y})";

    public void Translate(double dx, double dy) { X += dx; Y += dy; }   // mutating, not readonly
}
```

**Comparison with C# 7.x:**

```csharp
// C# 7.x – only the whole struct could be readonly (C# 7.2); otherwise the compiler
// must assume every method may mutate the struct and makes a defensive copy
public struct Point
{
    public double X { get; set; }
    public double Y { get; set; }

    public double Distance => Math.Sqrt(X * X + Y * Y);   // not marked – copy on `in`/readonly use
}

static double Measure(in Point p) => p.Distance;           // defensive copy of p in C# 7.x
```

* The compiler verifies the member does not mutate `this` (CS1604 error otherwise).
* A `readonly` member can be called on an `in` parameter or a `readonly` field **without a defensive copy**, which is a performance win for large structs.
* Can be applied to methods, properties, indexers, event accessors; on a property it can be put on individual accessors (`public double X { readonly get; set; }`).
* Auto-implemented `get` accessors are already treated as readonly.
* Contrast with `readonly struct` (C# 7.2): all members are readonly and all fields must be readonly.

---

## 13. Disposable ref structs

A `ref struct` (e.g. `Span<T>`) cannot implement interfaces, so it could not implement `IDisposable` and be used in `using`. C# 8 allows **pattern-based disposal**: any accessible instance `void Dispose()` method works.

```csharp
ref struct ResourceScope
{
    public void Dispose() => Console.WriteLine("released");
}

using var scope = new ResourceScope();   // OK: no IDisposable needed
```

**Comparison with C# 7.x:**

```csharp
// C# 7.x – ref struct cannot implement IDisposable, so `using` was rejected
ref struct ResourceScope { public void Dispose() { } }

using (var scope = new ResourceScope()) { }    // error CS1674 in C# 7.x

var s = new ResourceScope();                   // workaround: manual try/finally
try { /* use */ } finally { s.Dispose(); }
```

The same applies to `readonly ref struct`. Note this is *only* synchronous disposal; `await using` still needs `IAsyncDisposable`-shaped methods and a ref struct can't be used across awaits anyway.

---

## 14. Unmanaged constructed types

A type is **unmanaged** if it is a primitive/enum/pointer or a struct containing only unmanaged fields. Before C# 8, a **generic** struct instantiated with unmanaged arguments (`Coord<int>`) was *not* considered unmanaged. In C# 8 a constructed generic struct *is* unmanaged if all its fields are of unmanaged types, so you can take its address or use `stackalloc`:

```csharp
public struct Coord<T>
{
    public T X;
    public T Y;
}

Span<Coord<int>> buffer = stackalloc Coord<int>[10];    // allowed in C# 8
unsafe { Coord<int> c = default; Coord<int>* p = &c; }
```

**Comparison with C# 7.x:**

```csharp
// C# 7.x
Span<Coord<int>> buffer = stackalloc Coord<int>[10];   // error CS0208/CS8520: Coord<int> is managed
Span<Coord> plain = stackalloc Coord[10];              // only a NON-generic struct worked
```

(The `unmanaged` generic constraint itself is C# 7.3.)

---

## 15. Stackalloc in nested expressions

`stackalloc` results can be used as `Span<T>` anywhere an expression is allowed, not only in a variable initialiser:

```csharp
Span<int> numbers = stackalloc[] { 1, 2, 3, 4, 5, 6 };
var ind = numbers.IndexOfAny(stackalloc[] { 2, 4, 6, 8 });
Console.WriteLine(ind);   // 1
```

**Comparison with C# 7.x:**

```csharp
// C# 7.x – stackalloc only allowed as a variable initialiser
Span<int> numbers = stackalloc int[] { 1, 2, 3, 4, 5, 6 };
Span<int> lookup  = stackalloc int[] { 2, 4, 6, 8 };       // extra variable required
var ind = numbers.IndexOfAny(lookup);

// C# 8 – usable inline in a nested expression
var ind2 = numbers.IndexOfAny(stackalloc[] { 2, 4, 6, 8 });
```

* `stackalloc` memory lives on the stack, is freed when the method returns, avoids GC allocation, but is limited in size (≈1 MB stack by default) — keep buffers small and use a threshold with `ArrayPool<T>` fallback:

```csharp
Span<byte> buf = size <= 256 ? stackalloc byte[size] : new byte[size];
```

---

## 16. Enhancement of interpolated verbatim strings

The order of `$` and `@` is now free:

```csharp
var path = "temp";
string a = $@"C:\{path}\file.txt";   // C# 7.x: only this order compiled
string b = @$"C:\{path}\file.txt";   // C# 8: also allowed (error CS1056 in C# 7.x)
```

---

## 17. Quick interview cheat sheet

### Likely questions and concise answers

**What are nullable reference types and do they affect runtime?**
A compile-time feature: `T` = non-nullable, `T?` = nullable, flow analysis emits warnings. No runtime type change and no runtime checks; `!` suppresses warnings.

**Difference between `int?` and `string?`?**
`int?` is `Nullable<int>`, a distinct runtime struct type. `string?` is just an annotation on the same `string` type.

**How does a switch expression differ from a switch statement?**
It's an expression that returns a value, uses `=>`, has no `case/break`, uses `_` as default, must be exhaustive (otherwise warning + `SwitchExpressionException` at runtime), arms evaluated in order.

**List the C# 8 pattern types.**
Property, positional, tuple (plus the older type, constant, `var`, discard) and they can be nested recursively.

**`using` statement vs `using` declaration?**
Declaration form has no braces and disposes at end of the enclosing scope, in reverse order of declaration.

**Why use a `static` local function?**
No captured variables → no closure allocation, accidental capture is a compile error.

**What does `^1` mean, and what is `1..3`?**
`^1` is an `Index` from the end (last element). `1..3` is a `Range` with inclusive start, exclusive end. On arrays slicing copies; on `Span<T>` it doesn't.

**What is `??=`?**
Assign the right side only if the left side is null (lazy evaluation of right side).

**What are async streams?**
`IAsyncEnumerable<T>` produced by `async` + `yield return`, consumed with `await foreach`. Lazy, pull-based, supports cancellation with `[EnumeratorCancellation]` / `WithCancellation`.

**When do you use `IAsyncDisposable`?**
When cleanup is itself asynchronous (flush, close connection); consume with `await using`.

**What are default interface members for? Can a class instance call them directly?**
Evolving interfaces without breaking implementers. They are only accessible via the interface type unless the class implements them itself.

**Which C# 8 features need runtime support?**
Indices/ranges (`Index`, `Range`), async streams, `IAsyncDisposable`, default interface members. Hence C# 8 is only officially supported on .NET Core 3.x / .NET Standard 2.1.

**What does `readonly` on a struct member do?**
Guarantees no mutation of `this`; avoids defensive copies on `in`/`readonly` usage.

### Common traps
* Treating `!` as a runtime check.
* Assuming `array[1..3]` is a view (it's a copy; `Span<T>` is the view).
* Calling a default interface method through the class variable.
* Forgetting `[EnumeratorCancellation]` so the token from `WithCancellation` is ignored.
* A non-exhaustive switch expression compiles (warning only) but can throw at runtime.
* `using` declaration keeping a resource alive longer than expected.
* `??=` is not thread-safe.
