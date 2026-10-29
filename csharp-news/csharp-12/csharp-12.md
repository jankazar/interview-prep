# C# 12 Study Guide

C# 12 shipped in November 2023 with .NET 8 / Visual Studio 2022 17.8. **C# 12 is the default language version for .NET 8 only.** On older targets you can set `<LangVersion>12</LangVersion>`; most C# 12 features are compiler-only and work there, but some depend on runtime or library types (`InlineArray` needs .NET 8, collection expressions for custom types need `CollectionBuilder` support, `[Experimental]` needs the attribute type).

## Table of Contents

1. [Overview of new features](#1-overview-of-new-features)
2. [Primary constructors](#2-primary-constructors)
3. [Collection expressions](#3-collection-expressions)
4. [Alias any type](#4-alias-any-type)
5. [Default lambda parameters](#5-default-lambda-parameters)
6. [`ref readonly` parameters](#6-ref-readonly-parameters)
7. [Inline arrays](#7-inline-arrays)
8. [Experimental attribute](#8-experimental-attribute)
9. [Interceptors (experimental)](#9-interceptors-experimental)
10. [Quick interview cheat sheet](#10-quick-interview-cheat-sheet)

---

## 1. Overview of new features

| Feature | Purpose | Runtime requirement |
|---|---|---|
| Primary constructors (classes and structs) | Constructor parameters in scope for the whole type | None |
| Collection expressions (`[1, 2, 3]`, spread `..`) | One syntax to create arrays, lists, spans, etc. | None for arrays/`List<T>`/`Span<T>`; collection types need a builder or `Add` |
| Alias any type | `using Point = (int X, int Y);` | None |
| Default lambda parameters | `(int x = 5) => x` | None |
| `ref readonly` parameters | Pass by reference with read-only guarantee, clearer than `in` | None |
| Inline arrays | Fixed-size array inside a struct | .NET 8 (`InlineArrayAttribute` support) |
| `[Experimental]` attribute | Mark APIs as experimental, warns on use | `ExperimentalAttribute` (.NET 8) |
| Interceptors | Source generators replace calls at compile time | Experimental, opt-in |

---

## 2. Primary constructors

### 2.1 The problem
Dependency injection and simple types needed a constructor, private fields and assignments, which is boilerplate repeated in almost every service class. C# 9 `record` already had primary constructors, but only for records.

### 2.2 The idea
Put the parameter list on the type declaration. The parameters are in scope in the whole type body: field initializers, property initializers, and member bodies.

```csharp
public class OrderService(IOrderRepository repository, ILogger<OrderService> logger)
{
    public Order? Get(int id)
    {
        logger.LogInformation("Loading order {Id}", id);
        return repository.Find(id);
    }
}
```

Works for `class` and `struct` (and `record`, where it already existed).

### 2.3 Comparison with C# 11

```csharp
// C# 11 – constructor, fields and assignments written by hand
public class OrderService
{
    private readonly IOrderRepository _repository;
    private readonly ILogger<OrderService> _logger;

    public OrderService(IOrderRepository repository, ILogger<OrderService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public Order? Get(int id)
    {
        _logger.LogInformation("Loading order {Id}", id);
        return _repository.Find(id);
    }
}
```

```csharp
// C# 12 – parameters captured directly
public class OrderService(IOrderRepository repository, ILogger<OrderService> logger)
{
    public Order? Get(int id)
    {
        logger.LogInformation("Loading order {Id}", id);
        return repository.Find(id);
    }
}
```

| | C# 11 | C# 12 |
|---|---|---|
| Boilerplate for DI | Fields + constructor | Parameter list on the type |
| Parameters become properties | Only for records | **No**, for classes and structs they are captured |
| `readonly` guarantee | `readonly` field | Parameters are **mutable** captured variables |

### 2.4 Initialising members from parameters

```csharp
public class Person(string firstName, string lastName)
{
    // Property initialised from the parameter
    public string FullName { get; } = $"{firstName} {lastName}";

    // Expose a parameter as a property when you want it public
    public string FirstName { get; } = firstName;
}
```

### 2.5 Additional constructors must call the primary one

```csharp
public class Point(int x, int y)
{
    public Point() : this(0, 0) { }   // must chain to the primary constructor
    public int X { get; } = x;
    public int Y { get; } = y;
}
```

### 2.6 Rules & behaviour
* **Not the same as records**: a record primary constructor generates public init properties and equality; a class/struct primary constructor does **not** generate any member.
* A parameter used only in the constructor-time initialisers (field/property initialisers) is not stored; a parameter used in any member body is **captured into a compiler-generated private field**.
* If you both initialise a member from the parameter and use the parameter in a method, you get two copies (warning CS9124 "parameter is captured into the state of the enclosing type and its value is also used to initialize a field").
* Captured parameters are **mutable**: a method can assign to them. Nothing makes them `readonly`.
* In a struct, all fields are default-initialised before the primary constructor body, so the `this` rules differ little from C# 11 auto-default structs.
* Base class call: `public class Derived(int id) : Base(id)`.

### 2.7 Best practices & pitfalls
* Excellent for DI services and small types.
* Do not use for types whose invariants must be validated in the constructor body: there is no body (use a regular constructor, or validate in a field initialiser such as `private readonly string _name = name ?? throw new ArgumentNullException(nameof(name));`).
* Beware of a captured parameter that gets reassigned: it changes state for the whole instance.
* Parameter names are camelCase; they are not accessible as `this.name` or from outside.

---

## 3. Collection expressions

### 3.1 The problem
Creating collections used a different syntax for each type: `new[] { }`, `new List<int> { }`, `Array.Empty<int>()`, `stackalloc`, `ImmutableArray.Create(...)`. Combining collections required `Concat` or `AddRange`.

### 3.2 The idea
A **collection expression** is a bracketed list that the compiler converts to the **target type**. The *spread element* `..` inlines another collection.

```csharp
int[] array = [1, 2, 3];
List<int> list = [1, 2, 3];
Span<int> span = [1, 2, 3];
IEnumerable<int> seq = [1, 2, 3];
int[] empty = [];

int[] a = [1, 2, 3];
int[] b = [4, 5];
int[] all = [0, ..a, ..b, 6];     // 0,1,2,3,4,5,6
```

### 3.3 Comparison with C# 11

```csharp
// C# 11 – different syntax per type; combining needs LINQ or AddRange
int[] array = new[] { 1, 2, 3 };
List<int> list = new List<int> { 1, 2, 3 };
int[] empty = Array.Empty<int>();
int[] all = new[] { 0 }.Concat(a).Concat(b).Append(6).ToArray();
```

```csharp
// C# 12 – one syntax, target-typed
int[] array = [1, 2, 3];
List<int> list = [1, 2, 3];
int[] empty = [];
int[] all = [0, ..a, ..b, 6];
```

### 3.4 Supported target types
* Arrays, `Span<T>`, `ReadOnlySpan<T>`
* Types with a **collection initializer** pattern: implements `IEnumerable` and has an accessible `Add` (e.g. `List<T>`, `HashSet<T>`)
* Interfaces: `IEnumerable<T>`, `IReadOnlyCollection<T>`, `IReadOnlyList<T>`, `ICollection<T>`, `IList<T>`
* Types with a `[CollectionBuilder]` attribute (immutable collections in .NET 8, custom types)

### 3.5 Rules & behaviour
* The expression has **no natural type** (`var x = [1, 2];` is an error in C# 12); a target type is required.
* For `IEnumerable<T>`, `IReadOnlyList<T>` etc. the compiler picks an unspecified implementation: don't depend on the concrete type, and don't cast it to `List<T>`.
* Collection expressions for `ReadOnlySpan<T>` of constants can be stored in the assembly's data section without allocation.
* Spread elements evaluate their collection **once**, enumerated in order.
* Can be used as an argument when the overload is unambiguous; overload resolution prefers span types in some cases, which can be surprising.
* Dictionaries are not supported in C# 12.

### 3.6 Best practices & pitfalls
* Prefer `[]` over `Array.Empty<T>()` or `new List<T>()` for empty collections.
* A spread always copies; use it for building, not for passing large collections through hot code.
* Ternary expressions: both branches need a target type, `bool b ? [1] : [2]` needs a declared target.

---

## 4. Alias any type

### 4.1 The idea
`using` aliases can now name **any type**: tuples, arrays, pointers, generic instantiations, nullable value types. (Previously only named types.) Aliases must be `using` aliases at the top of the file or inside a namespace, and the aliased type must not be a nullable reference type.

```csharp
using Point = (int X, int Y);
using IntMatrix = int[][];
using Scores = System.Collections.Generic.Dictionary<string, int>;

Point p = (1, 2);
Console.WriteLine(p.X);

static double Distance(Point a, Point b) =>
    Math.Sqrt(Math.Pow(a.X - b.X, 2) + Math.Pow(a.Y - b.Y, 2));
```

### 4.2 Comparison with C# 11

```csharp
// C# 11 – alias works only for named types; a tuple alias is a compile error
using Scores = System.Collections.Generic.Dictionary<string, int>;   // OK (closed generic named type)
// using Point = (int X, int Y);                                      // not allowed

// Workaround: declare a struct or record
public readonly record struct Point(int X, int Y);
```

```csharp
// C# 12
using Point = (int X, int Y);
```

### 4.3 Rules & behaviour
* The alias is **compile-time only** and interchangeable with the underlying type; it is not a new type (`Point` and `(int, int)` are the same).
* Tuple element names in the alias are only a convenience.
* Aliases are file-scoped by default; add `global using` for project-wide use.
* Pointer types need an `unsafe` context.

### 4.4 Best practices
* Good for tuples shared in a file and long generic types.
* If the type has behaviour or crosses an API boundary, define a proper `record`/`struct` instead.

---

## 5. Default lambda parameters

### 5.1 The idea
Lambda expressions can have default parameter values and `params` arrays.

```csharp
var increment = (int value, int step = 1) => value + step;

Console.WriteLine(increment(5));      // 6
Console.WriteLine(increment(5, 10));  // 15

var sum = (params int[] numbers) => numbers.Sum();
Console.WriteLine(sum(1, 2, 3));      // 6
```

### 5.2 Comparison with C# 11

```csharp
// C# 11 – lambdas cannot have default values: use overloads or a local function
static int Increment(int value, int step = 1) => value + step;   // local/static function instead

Func<int, int, int> inc = (value, step) => value + step;         // caller must always pass both
```

```csharp
// C# 12
var increment = (int value, int step = 1) => value + step;
```

### 5.3 Rules & behaviour
* The lambda's delegate type is **synthesised**; `Func<>` and `Action<>` cannot represent defaults, so conversion to `Func<int, int, int>` **loses** the default.
* Defaults only apply when you call through the lambda's own (inferred) delegate type, i.e. a `var` variable.
* Defaults must be compile-time constants.
* `params` works the same way as in methods.

### 5.4 Best practices
* Useful in minimal API handlers and tests; don't over-use: a named method is clearer when options matter.

---

## 6. `ref readonly` parameters

### 6.1 The problem
`in` passes by reference without allowing modification, but the **call site** has no marker (`in` is optional and the compiler may silently make a copy for an rvalue). `ref` requires the call site to say `ref`, but allows modification.

### 6.2 The idea
`ref readonly` is a parameter that is passed by reference at the call site, but **cannot be written to** inside the method.

```csharp
static int Sum(ref readonly Matrix matrix) => matrix.A + matrix.D;

var m = new Matrix(1, 2, 3, 4);
int s = Sum(ref m);       // 'ref' at call site makes the by-reference passing visible
int t = Sum(in m);        // 'in' is also accepted
```

### 6.3 Comparison with C# 11

```csharp
// C# 11 – 'in' parameter: call site may omit 'in', or even pass a temporary (compiler copies silently)
static int Sum(in Matrix matrix) => matrix.A + matrix.D;
int s1 = Sum(m);                          // by reference, but looks like by value
int s2 = Sum(new Matrix(1, 2, 3, 4));     // temp created, passed by reference

// ref parameter – visible at the call site, but the method may modify the caller's variable
static void Reset(ref Matrix matrix) => matrix = default;
```

```csharp
// C# 12 – visible at the call site and read-only in the method
static int Sum(ref readonly Matrix matrix) => matrix.A + matrix.D;
```

| | `in` | `ref` | `ref readonly` |
|---|---|---|---|
| Call-site marker | Optional (`in`) | Required (`ref`) | `ref` preferred, `in` accepted |
| Method can modify | No | Yes | No |
| Pass an rvalue (temporary) | Yes | No | Allowed with a warning |
| Pass a literal | Yes | No | Allowed with a warning |

### 6.4 Rules & behaviour
* Passing an rvalue or omitting the modifier to a `ref readonly` parameter gives a compiler **warning**, not an error (for compatibility when upgrading APIs from `in`).
* Useful for big `readonly struct`s and library APIs that want to enforce clear semantics.
* Existing `in` APIs can be changed to `ref readonly` without breaking callers' code.

### 6.5 Best practices
* Prefer `readonly struct` plus `ref readonly` for large value types in hot paths.
* Use `in` for new small-struct APIs where call-site noise is unwanted.

---

## 7. Inline arrays

### 7.1 The idea
A struct marked `[InlineArray(N)]` with a single field behaves like a fixed-size array of N elements stored **inline** in the struct (stack or containing object), with no separate heap allocation. Mainly aimed at library authors; the runtime itself uses it.

```csharp
using System.Runtime.CompilerServices;

[InlineArray(10)]
public struct Buffer
{
    private int _element0;      // the compiler repeats this field 10 times
}

var buffer = new Buffer();
for (int i = 0; i < 10; i++)
    buffer[i] = i;               // indexer provided by the compiler

foreach (var item in buffer)     // works with foreach
    Console.WriteLine(item);

Span<int> span = buffer;         // implicit conversion to Span<int>
```

### 7.2 Comparison with C# 11

```csharp
// C# 11 – unsafe fixed-size buffer: only primitive types, needs 'unsafe'
public unsafe struct Buffer
{
    public fixed int Data[10];
}

// Or a heap array: allocation, bounds checking, indirection
int[] data = new int[10];
```

```csharp
// C# 12 – safe, any element type (incl. references), bounds-checked, Span-compatible
[InlineArray(10)]
public struct Buffer { private int _element0; }
```

### 7.3 Rules & behaviour
* The struct must have exactly one instance field, and no explicit layout.
* Length must be greater than zero.
* Element access is bounds-checked at runtime, throwing `IndexOutOfRangeException`.
* Needs .NET 8 for `InlineArrayAttribute`.

### 7.4 Best practices
* Use for stack-based small buffers in performance-sensitive code; for application code a `Span<T>` over `stackalloc` or an ordinary array is simpler.

---

## 8. Experimental attribute

### 8.1 The idea
`System.Diagnostics.CodeAnalysis.ExperimentalAttribute` marks a type, member or assembly as experimental. Callers get a compiler error with the diagnostic ID you specify unless they suppress it.

```csharp
using System.Diagnostics.CodeAnalysis;

[Experimental("MYLIB001")]
public class NewFeature { }

// Consumer:
var f = new NewFeature();   // error MYLIB001 – experimental API; opt in with #pragma warning disable MYLIB001
```

### 8.2 Comparison with C# 11

```csharp
// C# 11 – [Obsolete] abused for "preview" APIs (misleading message) or documentation only
[Obsolete("Experimental, may change", error: false)]
public class NewFeature { }
```

### 8.3 Rules & behaviour
* The diagnostic ID is required and should be unique to your library; consumers suppress with `#pragma warning disable ID` or `<NoWarn>`.
* The attribute is an **error by default** for consumers (not a warning).
* Library authors can use the optional `UrlFormat` property to link to documentation.
* Applies to assemblies, modules, classes, structs, enums, constructors, methods, properties, fields, events, interfaces and delegates.

---

## 9. Interceptors (experimental)

### 9.1 The idea
An **interceptor** is a method annotated with `[InterceptsLocation]` that the compiler substitutes for a specific call site at compile time. It is designed for source generators (e.g. ASP.NET Core minimal API request delegate generation and native AOT scenarios). In C# 12 it is a **preview/experimental** feature that must be enabled per project with `<InterceptorsPreviewNamespaces>`.

```csharp
// Generated by a source generator
file static class Interceptors
{
    [InterceptsLocation("Program.cs", line: 10, character: 5)]
    public static void LogAndCall(this Service s) { /* replaces s.Do() at that one call site */ }
}
```

### 9.2 Rules & behaviour
* Not intended for hand-written application code.
* The attribute type is defined by the generator (the compiler does not ship it).
* Replaces static method calls known at compile time, enabling AOT-friendly, reflection-free code.
* Treat as a "know it exists" topic for interviews.

---

## 10. Quick interview cheat sheet

### Likely questions and concise answers

**What are primary constructors in C# 12 and how do they differ from records?**
Parameters on the type declaration, in scope for the whole body. In a record they also generate public init properties and value equality. In a class or struct, nothing is generated: the compiler only captures the parameters into private fields if members use them.

**Are primary constructor parameters readonly?**
No, they are ordinary mutable variables, so a method can reassign them. Copy them into `readonly` fields or properties if you need immutability.

**How do you validate a primary constructor argument?**
There is no constructor body, so validate in a field/property initialiser (`private readonly string _name = name ?? throw new ArgumentNullException(nameof(name));`) or use a regular constructor.

**What are collection expressions?**
`[a, b, ..other]` syntax that the compiler converts to the target type (array, `List<T>`, `Span<T>`, interfaces, builder types). The spread element `..` inlines another collection.

**Can you write `var x = [1, 2, 3];`?**
Not in C# 12, since a collection expression has no natural type; a target type is required.

**What types can a collection expression create?**
Arrays, spans, types with a collection initializer (`IEnumerable` + `Add`), common collection interfaces, and types with `[CollectionBuilder]`.

**What does "alias any type" allow?**
`using Point = (int X, int Y);` and aliases for arrays, pointers, tuples and closed generics. It is purely compile-time; the alias is the same type.

**Can lambdas have default parameter values?**
Yes in C# 12 (`(int x, int step = 1) => ...`), but only via the lambda's inferred delegate type; converting to `Func<>` loses the default.

**What is `ref readonly`, and how does it differ from `in`?**
A by-reference parameter that cannot be modified. Unlike `in`, the call site is expected to write `ref`, making by-reference passing explicit. Passing an rvalue is a warning.

**What are inline arrays?**
`[InlineArray(N)]` on a struct with one field produces a fixed-size buffer of N elements stored inline, safe, bounds-checked and convertible to `Span<T>`. Replaces `fixed` buffers for most uses.

**What does `[Experimental]` do?**
Marks APIs as experimental with a diagnostic ID; consumers get an error until they suppress that ID.

**What are interceptors?**
An experimental compiler feature where source-generated methods replace specific call sites at compile time, used for AOT-friendly code.

**What needs runtime support?**
Inline arrays (.NET 8), `[Experimental]` attribute type, `CollectionBuilder` support for immutable collections. Primary constructors, alias any type and default lambda parameters are compiler-only.

### Common traps

* A primary constructor on a class does **not** create properties; `person.firstName` does not compile.
* Using a parameter both in a member and to initialise a field stores it twice (warning).
* Primary constructor parameters are mutable captured state, not `readonly`.
* A collection expression requires a target type; `var` does not work and the concrete type behind `IEnumerable<T>` is unspecified.
* Dictionary collection expressions do not exist in C# 12.
* A lambda with a default parameter loses it when converted to `Func<>`/`Action<>`.
* A `using` alias is not a new type; it does not give type safety or overload distinction.
* `ref readonly` accepts rvalues with only a warning, so it is not a strict guarantee at the call site.
* `[InlineArray]` structs need exactly one field and a positive length.
