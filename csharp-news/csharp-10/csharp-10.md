# C# 10 Study Guide

C# 10 shipped in November 2021 with .NET 6 / Visual Studio 2022. Its theme is **less ceremony and more consistency**: file-scoped namespaces, global usings and implicit usings remove boilerplate, record structs and `with` on structs round out the data-modelling story started in C# 9, and lambdas finally behave like "real" methods (natural type, attributes, return type). Several smaller features (`CallerArgumentExpression`, interpolated string handlers, parameterless struct constructors) target library authors and performance.

**Language version:** C# 10 is the default only for projects targeting **.NET 6**. On older targets you can opt in with `<LangVersion>10.0</LangVersion>`, but anything that needs new BCL types (`CallerArgumentExpressionAttribute`, `InterpolatedStringHandlerAttribute`, `DefaultInterpolatedStringHandler`, pooling async builders) either has to be declared by hand in your own project or is unavailable. Purely syntactic features (file-scoped namespaces, global usings, extended property patterns, record structs, `const` interpolated strings) work on any target. **Implicit usings** are an SDK (MSBuild) feature, not a compiler feature.

## Table of Contents

1. [Overview of new features](#1-overview-of-new-features)
2. [Record structs](#2-record-structs)
3. [File-scoped namespaces](#3-file-scoped-namespaces)
4. [Global using directives and implicit usings](#4-global-using-directives-and-implicit-usings)
5. [Lambda improvements](#5-lambda-improvements)
6. [Extended property patterns](#6-extended-property-patterns)
7. [CallerArgumentExpression](#7-callerargumentexpression)
8. [Parameterless struct constructors and field initializers](#8-parameterless-struct-constructors-and-field-initializers)
9. [`with` expression on structs and anonymous types](#9-with-expression-on-structs-and-anonymous-types)
10. [Interpolated string handlers](#10-interpolated-string-handlers)
11. [Constant interpolated strings](#11-constant-interpolated-strings)
12. [Sealed `ToString` in records](#12-sealed-tostring-in-records)
13. [Mixed assignment and declaration in deconstruction](#13-mixed-assignment-and-declaration-in-deconstruction)
14. [Improved definite assignment analysis](#14-improved-definite-assignment-analysis)
15. [AsyncMethodBuilder override](#15-asyncmethodbuilder-override)
16. [Enhanced `#line` directive](#16-enhanced-line-directive)
17. [Quick interview cheat sheet](#17-quick-interview-cheat-sheet)

---

## 1. Overview of new features

| Feature | Purpose | Runtime / framework requirement |
|---|---|---|
| Record structs | Value-type records with value equality and `with` | None (compiler-only) |
| File-scoped namespaces | `namespace X;` – one less indentation level | None |
| Global usings | `global using` applies to the whole project | None |
| Implicit usings | SDK auto-generates global usings per project type | .NET 6 SDK (`<ImplicitUsings>`) |
| Lambda improvements | Natural type, explicit return type, attributes | None for the syntax; `Func<>`/`Action<>` types come from the BCL |
| Extended property patterns | `{ Address.City: "Prague" }` | None |
| `CallerArgumentExpression` | Capture the argument's source text | Attribute is in .NET 6 (declare it yourself on older targets) |
| Parameterless struct constructors | Custom `new S()` and field initializers in structs | None |
| `with` on structs / anonymous types | Non-destructive mutation for all structs | None |
| Interpolated string handlers | Allocation-free, lazy string interpolation | .NET 6 BCL types (`DefaultInterpolatedStringHandler`, ...) |
| Constant interpolated strings | `const string s = $"{A}{B}"` | None |
| Sealed `ToString` in records | Stop derived records re-synthesising `ToString` | None |
| Mixed deconstruction | `(existing, int newVar) = ...` | None |
| Better definite assignment | Fewer false CS0165 errors | None |
| `AsyncMethodBuilder` override | Choose the async builder per method | .NET 6 for pooling builders |
| Enhanced `#line` | Span mapping for generated code (Razor etc.) | None |

---

## 2. Record structs

### 2.1 The problem
C# 9 `record` is always a **class**. If you wanted a small value type with value equality, `ToString`, `with` and a positional constructor, you still wrote it by hand (and had to get `IEquatable<T>`, `GetHashCode` and `==` right). Plain `struct` uses reflection-based `ValueType.Equals` by default, which is slow and boxes.

### 2.2 The idea
`record struct` (or `readonly record struct`) is a **value type** with compiler-generated `IEquatable<T>`, `Equals`, `GetHashCode`, `==` / `!=`, `ToString`, and (positional form) a primary constructor, properties and `Deconstruct`. `record class` is the explicit spelling of the C# 9 record.

```csharp
public record struct Point(int X, int Y);                 // mutable: X and Y have get; set;
public readonly record struct Money(decimal Amount, string Currency); // immutable: get; init;
public record class Person(string Name);                  // same as "record Person(string Name)"

var a = new Point(1, 2);
a.X = 10;                              // OK – positional properties of a record struct are settable
var m = new Money(5m, "EUR");
var m2 = m with { Amount = 7m };       // non-destructive mutation
Console.WriteLine(m);                  // Money { Amount = 5, Currency = EUR }
Console.WriteLine(m == new Money(5m, "EUR")); // True
```

### 2.3 Comparison with C# 9

```csharp
// C# 9 – options were a class record (heap allocation, reference type)...
public record PointRecord(int X, int Y);

// ...or a hand-written struct to get a value type with value equality
public readonly struct PointStruct : IEquatable<PointStruct>
{
    public int X { get; }
    public int Y { get; }
    public PointStruct(int x, int y) { X = x; Y = y; }

    public bool Equals(PointStruct other) => X == other.X && Y == other.Y;
    public override bool Equals(object? obj) => obj is PointStruct p && Equals(p);
    public override int GetHashCode() => HashCode.Combine(X, Y);
    public static bool operator ==(PointStruct a, PointStruct b) => a.Equals(b);
    public static bool operator !=(PointStruct a, PointStruct b) => !a.Equals(b);
    public override string ToString() => $"PointStruct {{ X = {X}, Y = {Y} }}";
    public void Deconstruct(out int x, out int y) { x = X; y = Y; }
}

// C# 10 – one line, value type
public readonly record struct PointRs(int X, int Y);
```

| | C# 9 `record` (class) | C# 9 hand-written struct | C# 10 `record struct` |
|---|---|---|---|
| Kind | Reference type | Value type | Value type |
| Allocation | Heap | Stack / inline | Stack / inline |
| Value equality | Generated | Hand-written | Generated |
| Boilerplate | None | ~15 lines | None |
| Positional properties | `init` | Hand-written | `get; set;` (or `init` with `readonly`) |

### 2.4 Rules & behaviour
* **Positional properties are mutable** (`get; set;`) in a plain `record struct`; declare it `readonly record struct` to get `init`-only properties and a truly immutable struct. This is the opposite of `record class`, which defaults to `init`.
* Equality is **member-wise** over fields; no `EqualityContract` / type check (value types cannot be inherited).
* No inheritance: a record struct cannot derive from another record or struct, but it can implement interfaces.
* No compiler-generated copy constructor or `<Clone>$`; `with` simply copies the struct and then sets the members.
* `ToString` is generated with the same `Name { Prop = value }` format.
* Mixing positional parameters with explicitly declared members of the same name is allowed (the compiler does not generate a property if you declare it).

### 2.5 Best practices & pitfalls
* Prefer **`readonly record struct`**; mutable structs are a classic source of defensive-copy bugs.
* Keep record structs small (rule of thumb ≤ 16 bytes); large structs are copied on every pass-by-value.
* A `default(Money)` is always possible and bypasses your constructor/validation – design so the zero value is valid.
* Do not expect reference-type behaviour: `with` and assignment copy the whole struct.
* Use `record class` when you need inheritance, nullability of the instance itself, or large payloads.

### 2.6 Real-world use
* Strongly typed IDs (`readonly record struct OrderId(Guid Value)`) – no allocation, value equality, safe as dictionary keys.
* Small value objects (coordinates, money, ranges) in hot paths; DTO-like tuples with names.

---

## 3. File-scoped namespaces

### 3.1 The problem
Every file wasted one level of indentation (and a closing brace) on the namespace block, even though nearly every file has exactly one namespace.

### 3.2 The idea
End the `namespace` declaration with a semicolon. The rest of the file belongs to that namespace.

```csharp
// C# 10
namespace Shop.Domain;

public class Order
{
    public int Id { get; set; }
}
```

### 3.3 Comparison with C# 9

```csharp
// C# 9 – block-scoped: everything is indented one extra level
namespace Shop.Domain
{
    public class Order
    {
        public int Id { get; set; }
    }
}
```

### 3.4 Rules & behaviour
* Only **one** file-scoped namespace per file, and it cannot be combined with block-scoped namespaces in the same file (compiler error).
* It must appear before any type declarations; `using` directives can come before it or after it.
* Purely syntactic – the generated IL is identical.

### 3.5 Best practices
* Make it the team default (`csharp_style_namespace_declarations = file_scoped` in `.editorconfig`); the IDE offers a bulk refactoring.
* Keep one namespace per file, matching the folder structure.

---

## 4. Global using directives and implicit usings

### 4.1 The problem
Each file began with the same 5–15 `using` lines (`System`, `System.Linq`, `System.Collections.Generic`, ...). Pure noise, and a repeated merge-conflict magnet.

### 4.2 Global usings

```csharp
// GlobalUsings.cs (any file name works)
global using System.Text;
global using System.Collections.Generic;
global using static System.Math;               // global static using
global using Json = System.Text.Json.JsonSerializer; // global alias
```

```csharp
// SomeFile.cs – no usings needed, they apply to the whole compilation
namespace Shop;

public class Report
{
    public string Build() => new StringBuilder().Append(Sqrt(16)).ToString();
}
```

### 4.3 Implicit usings (SDK feature)
```xml
<!-- .csproj -->
<PropertyGroup>
  <TargetFramework>net6.0</TargetFramework>
  <ImplicitUsings>enable</ImplicitUsings>
</PropertyGroup>
```
The SDK generates `obj/.../<Project>.GlobalUsings.g.cs` containing `global using` lines for common namespaces. For `Microsoft.NET.Sdk` that is `System`, `System.Collections.Generic`, `System.IO`, `System.Linq`, `System.Net.Http`, `System.Threading`, `System.Threading.Tasks`; the Web SDK adds ASP.NET Core namespaces. Tune with `<Using Include="..." />`, `<Using Remove="..." />` and `<Using Include="..." Alias="..." />`.

### 4.4 Comparison with C# 9

```csharp
// C# 9 – repeated at the top of every file
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Shop
{
    // ...
}

// C# 10 – declared once, applies project-wide (and the SDK can do it for you)
```

| | C# 9 | C# 10 |
|---|---|---|
| Common imports | Per file | Once per project (`global using`) |
| SDK defaults | None | `<ImplicitUsings>enable</ImplicitUsings>` |
| Aliases / `using static` project-wide | Not possible | `global using alias`, `global using static` |

### 4.5 Rules & behaviour
* `global using` directives must appear **before** all non-global `using`s and before any namespace or type declaration in that file.
* They affect the **whole compilation** (project), not the solution.
* Implicit usings are **opt-in by project file**; new .NET 6 templates enable them, upgraded projects do not.
* Can cause ambiguity (e.g. two `Timer` types in `System.Threading` and `System.Timers`); resolve with an alias or a fully qualified name.

### 4.6 Best practices & pitfalls
* Put `global using` in a single `GlobalUsings.cs`; do not scatter them.
* Only globalise namespaces used nearly everywhere – otherwise IntelliSense gets noisy and file dependencies become invisible.
* A file copied into another project may no longer compile because it relied on implicit usings – a common review point.

---

## 5. Lambda improvements

C# 10 made lambdas closer to ordinary methods in three ways.

### 5.1 Natural type

**Problem:** a lambda had no type of its own; it always needed a target delegate type, so `var` was impossible.

```csharp
// C# 9 – must name the delegate type
Func<int, int> twice = x => x * 2;
// var twice2 = (int x) => x * 2;      // error CS8917 in C# 9: the delegate type could not be inferred

// C# 10 – compiler infers Func<int,int> when parameter types are explicit
var twice3 = (int x) => x * 2;         // Func<int, int>
var greet  = () => "hello";            // Func<string>
var log    = (string m) => Console.WriteLine(m); // Action<string>
var read   = Console.ReadLine;         // method group → Func<string?>
```

* Lambdas with **implicitly typed parameters** (`x => x * 2`) still have no natural type; they need a target.
* If no `Func`/`Action` fits (e.g. `ref`/`out` parameters, more than 16 parameters), the compiler synthesises an anonymous delegate type.
* A lambda can now be assigned to `object`, `System.Delegate` or `System.Linq.Expressions.Expression`:

```csharp
object o = () => 42;                    // C# 10; error in C# 9
Delegate d = (string s) => s.Length;
```

**Real-world:** this is what makes ASP.NET Core 6 **minimal APIs** possible: `app.MapGet("/", () => "Hello");` takes a `Delegate`, and the framework inspects its signature to bind parameters.

### 5.2 Explicit return type

**Problem:** the return type was always inferred from the body; if branches returned different types it failed or picked something you did not want.

```csharp
// C# 9
Func<bool, object> pick9 = flag => flag ? (object)1 : "one"; // cast needed / delegate type needed

// C# 10 – state the return type before the parameter list
var pick = object (bool flag) => flag ? 1 : "one";
```

* Return type placed before the parentheses; it requires the parenthesised parameter list even for one parameter.
* Helps overload resolution and avoids unwanted boxing/inference.

### 5.3 Attributes on lambdas

```csharp
// C# 9 – impossible to attach an attribute to a lambda (you needed a real method)
// C# 10
var handler = [Obsolete("Use the new endpoint")] () => "old";
var f = [return: System.Diagnostics.CodeAnalysis.NotNull] (string? s) => s ?? "";
```

* Attributes go before the parameter list (and before a return type if present); parentheses are required.
* Attributes can also be applied to lambda parameters: `([FromQuery] int page) => ...` – heavily used in minimal APIs.

### 5.4 Comparison summary

| | C# 9 | C# 10 |
|---|---|---|
| `var f = (int x) => x;` | Error CS8917 | `Func<int,int>` |
| Method group in `var` | Not allowed | `var r = Console.ReadLine;` |
| Lambda → `object` / `Delegate` / `Expression` | Not allowed | Allowed |
| Return type | Inferred only | Optional explicit type |
| Attributes | Not allowed | Allowed on lambda and parameters |

### 5.5 Pitfalls
* Method-group natural type fails for overloaded groups it cannot resolve to a single method.
* Each use of a lambda converted to `Delegate` may allocate a new delegate unless the lambda is `static` (a C# 9 feature) and cached by the compiler.
* Natural type can change overload resolution results in existing code involving `Delegate`/`Expression` overloads – a rare source-compat break.

---

## 6. Extended property patterns

### 6.1 The problem
Matching a nested property required nesting braces for every level, which became unreadable fast.

### 6.2 The idea
Use dotted member access directly inside a property pattern.

```csharp
public class Address { public string City { get; set; } = ""; }
public class Customer { public Address Address { get; set; } = new Address(); }

// C# 10
static bool IsPragueCustomer(Customer c) => c is { Address.City: "Prague" };
```

### 6.3 Comparison with C# 9

```csharp
// C# 9 – nested patterns
static bool IsPragueCustomer9(Customer c) => c is { Address: { City: "Prague" } };

// C# 10 – extended property pattern
static bool IsPragueCustomer10(Customer c) => c is { Address.City: "Prague" };
```

### 6.4 Rules & behaviour
* `{ A.B.C: pattern }` is exactly equivalent to `{ A: { B: { C: pattern } } }`.
* Each intermediate member is **null-checked implicitly** (the nested pattern fails if `Address` is `null`), so no `NullReferenceException`.
* Works in `switch` expressions, `is`, and combines with relational / logical patterns:

```csharp
string Describe(Customer c) => c switch
{
    { Address.City: "Prague" or "Brno" } => "Czech",
    { Address.City.Length: > 10 }        => "Long city name",
    _                                    => "Other"
};
```

### 6.5 Best practices
* Use it for shallow-ish chains; deep chains still smell of a Law-of-Demeter problem.
* Remember each property getter runs, so avoid properties with side effects or expensive computation.

---

## 7. CallerArgumentExpression

### 7.1 The problem
Guard helpers could not report *which expression* failed. Developers passed the parameter name as a string (`nameof(x)`) or lost context entirely.

### 7.2 The idea
`[CallerArgumentExpression("param")]` on an optional parameter makes the compiler fill it with the **source text** of the argument passed to `param`.

```csharp
using System.Runtime.CompilerServices;

public static class Guard
{
    public static void Against(bool condition,
        [CallerArgumentExpression("condition")] string? expression = null)
    {
        if (condition)
            throw new ArgumentException($"Condition failed: {expression}");
    }
}

Guard.Against(order.Items.Count == 0);
// ArgumentException: Condition failed: order.Items.Count == 0
```

### 7.3 Comparison with C# 9

```csharp
// C# 9 – the caller had to repeat the text by hand (and keep it in sync)
Guard9.Against(order.Items.Count == 0, "order.Items.Count == 0");

// C# 10 – compiler supplies the text, can't go stale
Guard.Against(order.Items.Count == 0);
```

### 7.4 Rules & behaviour
* The parameter must be **optional** with a default value; the compiler substitutes the captured text at compile time (no reflection).
* Captures the *source text exactly as written*, including spaces – a refactor changes the message.
* If the caller supplies the argument explicitly, that value wins.
* The attribute type lives in .NET 6's BCL; on older targets you can declare `System.Runtime.CompilerServices.CallerArgumentExpressionAttribute` in your project and it will work.

### 7.5 Real-world use
* Guard clauses, assertion libraries, test frameworks, and `ArgumentNullException.ThrowIfNull(arg)` in .NET 6 use it to report the argument name without `nameof`.
* Don't use it for security-sensitive messages: it leaks source text into runtime strings (and obfuscators won't hide it).

---

## 8. Parameterless struct constructors and field initializers

### 8.1 The problem
Structs could not declare a parameterless constructor or field initializers; `new S()` always meant "all zero". Defaults like `Version = 1` needed workarounds.

### 8.2 The idea
Structs may declare an explicit parameterless constructor and use field/property initializers (as long as the struct declares at least one explicit constructor).

```csharp
public struct Rectangle
{
    public int Width { get; set; } = 1;          // initializer needs an explicit constructor
    public int Height { get; set; } = 1;

    public Rectangle() { }                       // custom parameterless constructor
    public Rectangle(int w, int h) { Width = w; Height = h; }
}

var r = new Rectangle();   // Width = 1, Height = 1
```

### 8.3 Comparison with C# 9

```csharp
// C# 9 – these were compile errors:
public struct Rectangle9
{
    // public int Width = 1;      // error: struct field initializers not allowed
    // public Rectangle9() { }    // error: structs cannot contain explicit parameterless constructors
}

// C# 9 workaround: a static factory or a property that fakes the default
public struct Rectangle9b
{
    private int _width;
    public int Width { get => _width == 0 ? 1 : _width; set => _width = value; }
    public static Rectangle9b Create() => new Rectangle9b();
}
```

### 8.4 Rules & behaviour
* `new Rectangle()` invokes the custom constructor, **but** `default(Rectangle)`, `new Rectangle[10]`, and uninitialised fields of that type still produce all-zero values and **do not run it**.
* Field initializers run only through explicit constructors (including the parameterless one). A struct with initializers but no explicit constructor is a compile error.
* Every explicit constructor must assign all fields (or call `this(...)`).
* A `struct` with a parameterless constructor can have non-default `new S()` semantics, so be careful with generic code (`new T()` where `T : struct` and arrays of `T`).

### 8.5 Best practices & pitfalls
* Only add it when the zero value is genuinely not a valid state, and still make `default` safe.
* Not much use for `readonly` hot-path structs: mixing "constructed" and "default" instances is confusing.

---

## 9. `with` expression on structs and anonymous types

### 9.1 The idea
The non-destructive mutation `with` from C# 9 records works on **any struct** (including built-in and tuple types) and on **anonymous types**.

```csharp
var anon = new { Name = "Ada", Age = 36 };
var older = anon with { Age = 37 };

var t = (X: 1, Y: 2);
var t2 = t with { Y = 20 };        // (X: 1, Y: 20)

public struct Stats { public int Hits { get; set; } public int Misses { get; set; } }
var s2 = new Stats { Hits = 5 } with { Misses = 1 };
```

### 9.2 Comparison with C# 9

```csharp
// C# 9 – only records could use "with"; structs and anonymous types required manual copying
var anon9 = new { Name = "Ada", Age = 36 };
var older9 = new { anon9.Name, Age = 37 };      // rebuild by hand, easy to forget a property

var t9 = (X: 1, Y: 2);
var t9b = (X: t9.X, Y: 20);                      // retype everything
```

### 9.3 Rules & behaviour
* The type must be a struct (value type) or anonymous type, and the members assigned in the `with` initialiser must be accessible **and settable** (`set` or `init` / field).
* For a struct, the compiler copies the value and then assigns the listed members; no cloning method is involved.
* On a `readonly struct` with only get-only properties you cannot use `with` to set them.

### 9.4 Best practices
* Handy for tests and for transformation pipelines on tuples / anonymous projections in LINQ.

---

## 10. Interpolated string handlers

### 10.1 The problem
Interpolated strings (`$"..."`) were always lowered to `string.Format`/`string.Concat`, which **allocates the string even when it will not be used** – e.g. a debug log call below the active log level. Boxing of value-type arguments added garbage.

### 10.2 The idea
A type decorated with `[InterpolatedStringHandler]` can be the target of an interpolated string. The compiler lowers `$"..."` into calls on a handler: constructor, `AppendLiteral`, `AppendFormatted`. The handler can also **skip the work altogether** if the result isn't needed.

```csharp
using System.Runtime.CompilerServices;
using System.Text;

[InterpolatedStringHandler]
public ref struct LogHandler
{
    private readonly StringBuilder? _sb;

    // out bool signals "don't bother building"; isEnabled comes from the overload's argument
    public LogHandler(int literalLength, int formattedCount, bool isEnabled, out bool shouldAppend)
    {
        shouldAppend = isEnabled;
        _sb = isEnabled ? new StringBuilder(literalLength) : null;
    }

    public void AppendLiteral(string s) => _sb!.Append(s);
    public void AppendFormatted<T>(T value) => _sb!.Append(value);   // no boxing: generic

    public override string ToString() => _sb?.ToString() ?? "";
}

public static class Logger
{
    public static bool DebugEnabled;

    public static void Debug(bool enabled,
        [InterpolatedStringHandlerArgument("enabled")] ref LogHandler handler)
    {
        if (enabled) Console.WriteLine(handler.ToString());
    }
}

Logger.Debug(Logger.DebugEnabled, $"Order {order.Id} took {elapsed} ms"); // nothing evaluated when disabled
```

### 10.3 Comparison with C# 9

```csharp
// C# 9 – the string is built eagerly whatever the level is
if (logger.IsEnabled(LogLevel.Debug))                 // manual guard to avoid allocation
    logger.LogDebug($"Order {order.Id} took {elapsed} ms");

// C# 9 – or the verbose template form (boxing of value-type args, params array)
logger.LogDebug("Order {OrderId} took {Elapsed} ms", order.Id, elapsed);

// C# 10 – handler decides: no formatting if the level is off, no boxing
Logger.Debug(Logger.DebugEnabled, $"Order {order.Id} took {elapsed} ms");
```

### 10.4 Rules & behaviour
* The handler's constructor receives `literalLength` and `formattedCount` so it can size buffers.
* If the constructor has an `out bool` last parameter, `false` means the compiler **skips** the remaining `Append*` calls (and the evaluation of the interpolation holes).
* `[InterpolatedStringHandlerArgument]` passes other arguments of the call (e.g. `this`, a log level) to the handler constructor.
* .NET 6 BCL uses it: `DefaultInterpolatedStringHandler` (used when `$"..."` is converted to `string`, avoiding the boxing of value types), `StringBuilder.Append($"...")`, `Debug.Assert`/`Debug.WriteLine` overloads, `MemoryExtensions.TryWrite`.
* Handlers are typically `ref struct`s.

### 10.5 Best practices & pitfalls
* Most developers *consume* this feature (it is free in .NET 6); writing a handler is for library / logging / hot-path authors.
* Beware: because the holes aren't evaluated when the handler declines, **side effects inside the interpolation may not run**.
* Structured logging (`{OrderId}` templates) still matters for log indexing; handler-based interpolation loses the template.

---

## 11. Constant interpolated strings

### 11.1 The idea
An interpolated string can be a `const` if **every placeholder is itself a constant string**.

```csharp
const string Scheme = "https";
const string Host = "example.com";
const string Url = $"{Scheme}://{Host}/api";      // C# 10
```

### 11.2 Comparison with C# 9

```csharp
// C# 9 – error CS0133: the expression must be a constant
// const string Url = $"{Scheme}://{Host}/api";

// C# 9 workaround: concatenation of consts
const string Url9 = Scheme + "://" + Host + "/api";
```

### 11.3 Rules
* Placeholders must be constant **strings**; numeric constants (`{Port}` where `Port` is an `int`) are not allowed because formatting could be culture-dependent.
* No alignment/format specifiers on placeholders that would require runtime formatting.
* Typical use: attribute arguments (`[Route($"{Base}/orders")]`), constants shared across assemblies.

---

## 12. Sealed `ToString` in records

### 12.1 The problem
In a record hierarchy every derived record re-synthesises `ToString`, so you could not freeze a custom format in the base type.

### 12.2 The idea
A record can mark its `ToString` override as `sealed`; derived records then do not generate their own.

```csharp
public record Person(string Name)
{
    public sealed override string ToString() => $"Person: {Name}";
}

public record Employee(string Name, decimal Salary) : Person(Name);

Console.WriteLine(new Employee("Ada", 100m)); // Person: Ada   (not "Employee { ... }")
```

### 12.3 Comparison with C# 9
```csharp
// C# 9 – derived record always synthesised its own ToString; sealing was not possible
public record Person9(string Name)
{
    public override string ToString() => $"Person: {Name}";
}
public record Employee9(string Name, decimal Salary) : Person9(Name);
// Employee9.ToString() → "Employee9 { Name = Ada, Salary = 100 }"  (base override ignored)
```

### 12.4 Best practices
* Seal `ToString` when it masks sensitive data (e.g. `Password = ***`) so derived records cannot leak it via the synthesised version.

---

## 13. Mixed assignment and declaration in deconstruction

### 13.1 The idea
A deconstruction can assign to existing variables **and** declare new ones in the same statement.

```csharp
int x = 0;
(x, int y) = GetPoint();      // C# 10: x assigned, y declared

static (int, int) GetPoint() => (3, 4);
```

### 13.2 Comparison with C# 9

```csharp
// C# 9 – all new (var) or all existing; mixing was an error
int x9;
// (x9, int y9) = GetPoint();       // compile error in C# 9

int y9;
(x9, y9) = GetPoint();               // declare everything first
// or
var (a, b) = GetPoint();             // all new variables
```

### 13.3 Best practices
* Useful in loops and `out`-heavy parsing code where one value is accumulated and another is new.

---

## 14. Improved definite assignment analysis

### 14.1 The problem
The compiler produced false "use of unassigned local variable" errors (CS0165) when `out` variables or captured values were used behind certain boolean expressions, forcing you to initialise variables for no reason.

### 14.2 Example

```csharp
public static string Describe(Container? c)
{
    string representation = "N/A";

    // C# 9: error CS0165 – compiler thought 'obj' might be unassigned
    // C# 10: OK – it understands that == true implies both operands were true
    if ((c != null && c.TryGetValue(out object? obj)) == true)
    {
        representation = obj!.ToString() ?? "";
    }
    return representation;
}

public class Container
{
    public bool TryGetValue(out object? value) { value = 1; return true; }
}
```

### 14.3 Comparison with C# 9
```csharp
// C# 9 – workaround: initialise needlessly, or restructure the condition
object? obj9 = null;
if (c != null && c.TryGetValue(out obj9)) { representation = obj9!.ToString() ?? ""; }
```

### 14.4 Rules
* Pure compiler analysis improvement: no runtime effect, no syntax change.
* Mostly fixes false positives around `== true`, `?.` combined with `out`/`is`, and nullable-value patterns.

---

## 15. AsyncMethodBuilder override

### 15.1 The problem
The async state machine builder was tied to the return type (`Task`, `ValueTask`, ...). You could choose a custom builder only per **type** (via attribute on the task type), not per method – so you couldn't opt a single hot method into pooling.

### 15.2 The idea
Apply `[AsyncMethodBuilder(typeof(...))]` directly to a method to choose its builder.

```csharp
using System.Runtime.CompilerServices;

public class Downloader
{
    // .NET 6: reuse state-machine boxes instead of allocating one per call
    [AsyncMethodBuilder(typeof(PoolingAsyncValueTaskMethodBuilder<>))]
    public async ValueTask<int> ReadAsync(Stream s, byte[] buffer)
        => await s.ReadAsync(buffer, 0, buffer.Length);
}
```

### 15.3 Comparison with C# 9
```csharp
// C# 9 – builder fixed by the return type; ValueTask<T> always used the default builder
public async ValueTask<int> ReadAsync9(Stream s, byte[] buffer)
    => await s.ReadAsync(buffer, 0, buffer.Length);
// Only way to change: return a custom task-like type with its own attribute
```

### 15.4 Best practices & pitfalls
* Library/perf feature; measure first. Pooled builders require that the returned `ValueTask` is awaited **exactly once** (usual `ValueTask` rule), otherwise the pooled box can be reused while still referenced.
* Pooling builders (`PoolingAsyncValueTaskMethodBuilder`) are .NET 6+.

---

## 16. Enhanced `#line` directive

* New span form: `#line (startLine, startChar)-(endLine, endChar) charOffset "file"` lets generators (Razor, source generators) map generated code to **exact regions** of the original source, so debugging and diagnostics point at the right columns.
* Previously only whole lines could be remapped: `#line 42 "page.cshtml"`.
* Almost exclusively consumed by tooling; rarely written by hand. Worth one sentence in an interview.

```csharp
// C# 9 – line-only mapping
#line 42 "Page.cshtml"
var x = 1;
#line default

// C# 10 – span mapping (line/column start–end)
#line (1, 1)-(1, 20) "Page.cshtml"
var y = 2;
#line default
```

---

## 17. Quick interview cheat sheet

### 17.1 Likely questions and concise answers

**What is a `record struct` and how does it differ from a `record class`?**
A value type with generated value equality, `ToString`, `with`, and positional members. Positional properties are mutable (`get; set;`) unless you write `readonly record struct`, whereas `record class` properties are `init`. Struct records have no inheritance and no copy constructor.

**`record` vs `record class` vs `record struct`?**
`record` and `record class` are the same (reference type); `record struct` is the value-type version.

**What are file-scoped namespaces?**
`namespace X;` applies to the entire file, saving one indentation level. Only one per file, cannot mix with block namespaces; output IL is the same.

**What does `global using` do, and what are implicit usings?**
`global using` imports a namespace for the entire compilation. Implicit usings are an SDK feature (`<ImplicitUsings>enable</ImplicitUsings>`) that auto-generates global usings for the project type.

**What is the "natural type" of a lambda?**
When parameter types are explicit, the compiler infers a `Func<>`/`Action<>` (or synthesised delegate), so `var f = (int x) => x * 2;` compiles. Implicit-parameter lambdas have no natural type.

**What else changed for lambdas?**
Explicit return type (`var f = int (string s) => ...`), attributes on lambdas and their parameters, and conversion to `object`/`Delegate`/`Expression`. Together they enable ASP.NET Core minimal APIs.

**What are extended property patterns?**
`{ A.B: pattern }` is shorthand for `{ A: { B: pattern } }`, with implicit null checks on the intermediate members.

**What does `CallerArgumentExpression` do?**
Compiler fills an optional string parameter with the source text of another argument – used for guard clauses and assertions without `nameof` or manual strings.

**Can a struct have a parameterless constructor now?**
Yes, plus field initializers (needing at least one explicit constructor). It is *not* called for `default(S)` or array elements.

**What are interpolated string handlers?**
Types marked `[InterpolatedStringHandler]` that receive the pieces of `$"..."`; they avoid allocations and can skip formatting entirely (e.g. disabled log level). The .NET 6 BCL uses them for `string` interpolation itself.

**Can `with` be used on structs?**
Yes – any struct, tuple, or anonymous type; the members must be settable.

**Can an interpolated string be `const`?**
Yes, only if every placeholder is a constant string.

**Why would you seal `ToString` in a record?**
To stop derived records from generating their own `ToString`, keeping a custom (or redacted) format.

**What needs runtime/BCL support vs compiler only?**
Compiler only: file-scoped namespaces, global usings, record structs, extended property patterns, const interpolation, sealed `ToString`, `with` on structs, lambda syntax. BCL types: `CallerArgumentExpressionAttribute`, interpolated string handler types, pooling async builders (all .NET 6; can be declared manually on older targets where it's a pure attribute/type). SDK: implicit usings.

### 17.2 Common traps

* **Record struct properties are mutable by default** – use `readonly record struct`; people assume `init` as in `record class`.
* `default(S)` and `new S[n]` **skip** a struct's custom parameterless constructor.
* Implicit usings are not a language feature – they depend on `<ImplicitUsings>` in the project file and the .NET 6 SDK.
* `global using` is per project, not per solution, and must come before ordinary usings.
* `var f = x => x;` still does not compile – natural type needs explicitly typed parameters.
* Interpolated string handlers can skip evaluation of the holes, so **side effects may not run**.
* `CallerArgumentExpression` captures *source text*, so reformatting code changes the message; it is not a security boundary.
* Extended property patterns still call the getters; and null intermediates just make the pattern fail, they do not throw.
* `const` interpolated strings reject non-string constants (`int`, `bool`, ...).
* Structs with field initializers must declare an explicit constructor, and every constructor must assign all fields.
* Pooled async builders require a `ValueTask` to be awaited once only.
