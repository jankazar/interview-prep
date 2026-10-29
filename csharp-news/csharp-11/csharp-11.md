# C# 11 Study Guide

C# 11 shipped in November 2022 with .NET 7 / Visual Studio 2022 17.4. **C# 11 is the default language version for .NET 7 only.** On older targets you can set `<LangVersion>11</LangVersion>`, but features that need new runtime types or runtime support (static abstract interface members, `ref` fields, generic math, `required` attributes, UTF-8 literals as `ReadOnlySpan<byte>`) only work if the types exist (.NET 7+) or you polyfill the attributes. Purely syntactic features (raw strings, list patterns, newlines in interpolations, `nameof` scope, file-local types) work on any target once `LangVersion` is set.

## Table of Contents

1. [Overview of new features](#1-overview-of-new-features)
2. [Raw string literals](#2-raw-string-literals)
3. [Required members](#3-required-members)
4. [List patterns](#4-list-patterns)
5. [Static abstract members in interfaces and generic math](#5-static-abstract-members-in-interfaces-and-generic-math)
6. [Generic attributes](#6-generic-attributes)
7. [UTF-8 string literals](#7-utf-8-string-literals)
8. [Newlines in string interpolation expressions](#8-newlines-in-string-interpolation-expressions)
9. [File-local types](#9-file-local-types)
10. [Auto-default structs](#10-auto-default-structs)
11. [Pattern matching `Span<char>` on a constant string](#11-pattern-matching-spanchar-on-a-constant-string)
12. [Extended `nameof` scope](#12-extended-nameof-scope)
13. [Ref fields and `scoped`](#13-ref-fields-and-scoped)
14. [Numeric `IntPtr` / `UIntPtr`](#14-numeric-intptr--uintptr)
15. [Improved method group conversion to delegate](#15-improved-method-group-conversion-to-delegate)
16. [Unsigned right shift and relaxed shift operators](#16-unsigned-right-shift-and-relaxed-shift-operators)
17. [Warning wave 7](#17-warning-wave-7)
18. [Quick interview cheat sheet](#18-quick-interview-cheat-sheet)

---

## 1. Overview of new features

| Feature | Purpose | Runtime requirement |
|---|---|---|
| Raw string literals (`"""`) | Multi-line text with no escaping | None |
| `required` members | Force callers to initialise members in an object initializer | Attributes `RequiredMemberAttribute`, `SetsRequiredMembersAttribute`, `CompilerFeatureRequiredAttribute` (in .NET 7) |
| List patterns | Match arrays/lists by shape and elements | None for the pattern itself; type needs `Length`/`Count` and an indexer (slices need a `Range` indexer or `Slice`) |
| Static abstract / virtual interface members | Operators and static members in interfaces; generic math | Runtime support (.NET 7) |
| Generic math (`INumber<T>` etc.) | Write numeric algorithms once for all numeric types | .NET 7 (`System.Numerics`) |
| Generic attributes | `[MyAttribute<T>]` | None |
| UTF-8 string literals (`"..."u8`) | Allocation-free `ReadOnlySpan<byte>` | `ReadOnlySpan<byte>` (.NET Core 3.0+/Standard 2.1) |
| Newlines in interpolation holes | Format long expressions | None |
| `file` types | Type visible only in one source file | None |
| Auto-default structs | Compiler zero-initialises unassigned struct fields | None |
| Span<char> constant-string patterns | `span is "abc"` | `MemoryExtensions` (Span, .NET Core 2.1+) |
| Extended `nameof` | Parameter names in attribute arguments on the method | None |
| `ref` fields, `scoped` | `ref struct` can hold a reference | Runtime support (.NET 7) |
| Numeric `IntPtr`/`UIntPtr` | `nint`/`nuint` aliases for the real types | .NET 7 |
| Method group conversion | Cached delegates, better overload inference | None |
| `>>>` and relaxed shifts | Unsigned right shift; shift count of any integral type in user operators | None |
| Warning wave 7 | New warnings (e.g. type names in lowercase) | None |

---

## 2. Raw string literals

### 2.1 The problem
JSON, XML, regex, SQL and HTML in C# strings meant `\"` escaping, doubled quotes in verbatim strings (`""`) and fragile indentation.

### 2.2 The idea
A raw string starts and ends with **at least three** double quotes `"""`. Inside, nothing is escaped. If the content itself contains `"""`, use more quotes in the delimiters (four, five...).

```csharp
string json = """
    {
      "name": "Alice",
      "age": 30
    }
    """;
```

### 2.3 Comparison with C# 10

```csharp
// C# 10 – verbatim string: quotes doubled, and the indentation of the closing line
// leaks into the content unless you left-align the text in the source file
string json = @"{
  ""name"": ""Alice"",
  ""age"": 30
}";
```

```csharp
// C# 11 – raw string: quotes verbatim, leading whitespace before the closing """ is removed
string json = """
    {
      "name": "Alice",
      "age": 30
    }
    """;
```

### 2.4 Interpolated raw strings
The number of `$` characters sets how many braces open an interpolation hole. Use more `$` when the content has braces.

```csharp
int x = 1, y = 2;

// C# 11 – a single $ means {x} is a hole; literal braces would need {{ }}
string a = $"""{x}, {y}""";

// C# 11 – two $$ mean {{x}} is a hole and a single { } is plain text (handy for JSON)
string b = $$"""
    { "x": {{x}}, "y": {{y}} }
    """;
```

```csharp
// C# 10 – had to double every literal brace
string c = $"{{ \"x\": {x}, \"y\": {y} }}";
```

### 2.5 Rules & behaviour
* Multi-line form: opening `"""` and closing `"""` are on their own lines; the **closing delimiter's indentation is stripped from every line**.
* Compile error if a content line is indented less than the closing `"""`.
* The newline after the opening `"""` and before the closing `"""` is not part of the string.
* Single-line form `"""text"""` is allowed.
* The result is an ordinary `string`: compile-time only feature.

### 2.6 Best practices & pitfalls
* Great for regex patterns, JSON/SQL fixtures in tests and embedded templates.
* With `$$"""` the hole count is `{{ }}`; a run of braces longer than the hole size is a compile error.
* Raw strings do not make SQL safe: still use parameters, never interpolate user input.

---

## 3. Required members

### 3.1 The problem
Object initializers let callers skip properties, and the only way to force a value was a constructor (verbose with many parameters, and awkward for serializers/ORMs that need a parameterless constructor).

### 3.2 The idea
`required` on a field or property means every caller **must set it** in an object initializer (or the constructor must be marked `[SetsRequiredMembers]`).

```csharp
public class Person
{
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
    public string? MiddleName { get; init; }   // optional
}

var ok  = new Person { FirstName = "Ada", LastName = "Lovelace" };
var bad = new Person { FirstName = "Ada" };    // error CS9035: required member 'LastName' must be set
```

### 3.3 Comparison with C# 10

```csharp
// C# 10 – nothing prevents an incomplete object; only constructor parameters enforce it
public class Person
{
    public string FirstName { get; init; } = default!;   // forced to silence the nullable warning
    public string LastName  { get; init; } = default!;
}
var p = new Person { FirstName = "Ada" };   // compiles, LastName is null at runtime

// Alternative: constructor – safe, but not usable by initializer syntax
public class Person2
{
    public string FirstName { get; }
    public string LastName { get; }
    public Person2(string firstName, string lastName) { FirstName = firstName; LastName = lastName; }
}
```

```csharp
// C# 11 – enforced at compile time, initializer syntax and nullable analysis both happy
public class Person
{
    public required string FirstName { get; init; }
    public required string LastName { get; init; }
}
```

| | C# 10 | C# 11 |
|---|---|---|
| Enforce initialisation | Constructor parameters only | `required` |
| Nullable warning CS8618 for properties | Needs `= default!` or constructor | Not reported for `required` members |
| Works with object initializers | Yes, but unenforced | Yes, enforced |

### 3.4 `SetsRequiredMembers`
A constructor that really sets all required members can opt out of the caller check:

```csharp
public class Person
{
    public required string FirstName { get; init; }
    public required string LastName { get; init; }

    public Person() { }   // callers must use an initializer

    [System.Diagnostics.CodeAnalysis.SetsRequiredMembers]
    public Person(string first, string last) { FirstName = first; LastName = last; }
}
```

### 3.5 Rules & behaviour
* A `required` member must be at least as accessible as its containing type.
* Derived classes inherit the requirement; `override` of a required property must also be `required`.
* Enforcement is **compile-time only**. Reflection, `Activator.CreateInstance` and unaware serializers bypass it (`System.Text.Json` enforces `required` from .NET 7).
* `SetsRequiredMembers` is trusted: the compiler does not check the constructor body.
* A `required` member cannot be hidden from the caller (e.g. `private required` is an error).
* Types with required members cannot be used as generic arguments for `new()` constraints.

### 3.6 Best practices & pitfalls
* Good for DTOs, options classes and EF Core entities (`required` removes the need for `= null!`).
* Combine with `init` for immutable-after-construction objects.
* Do not use it where callers cannot use initializers; a constructor is clearer there.

---

## 4. List patterns

### 4.1 The idea
Match an array or list-like value against a **sequence of patterns**. `_` matches one element; `..` (slice pattern) matches zero or more elements and may itself carry a pattern (`..var rest`).

```csharp
int[] numbers = { 1, 2, 3 };

numbers is [1, 2, 3]        // true  – exact match
numbers is [1, _, 3]        // true  – any middle element
numbers is [1, ..]          // true  – starts with 1
numbers is [.., 3]          // true  – ends with 3
numbers is [_, _, _]        // true  – exactly three elements
numbers is [var first, .., var last]   // true – captures first and last
numbers is [1, .. var rest] // rest == { 2, 3 }
```

### 4.2 Comparison with C# 10

```csharp
// C# 10 – manual length and index checks
static string Describe(int[] a)
{
    if (a.Length == 0) return "empty";
    if (a.Length == 1) return $"one: {a[0]}";
    return $"starts {a[0]}, ends {a[a.Length - 1]}";
}
```

```csharp
// C# 11 – declarative shape
static string Describe(int[] a) => a switch
{
    []                         => "empty",
    [var x]                    => $"one: {x}",
    [var first, .., var last]  => $"starts {first}, ends {last}"
};
```

### 4.3 Combined with other patterns

```csharp
// Parse a command line: verb + arguments
static string Run(string[] args) => args switch
{
    ["help"]                     => "usage...",
    ["add", var a, var b]        => $"{a}+{b}",
    ["delete", .. var targets]   => $"deleting {targets.Length} items",
    [var verb, ..]               => $"unknown: {verb}",
    []                           => "no command"
};
```

### 4.4 Rules & behaviour
* The type must be **countable** (`Length` or `Count`) and **indexable** (an `int` indexer). It works with arrays, `string`, `List<T>`, `Span<T>`.
* Using `..` as a *slice with capture* additionally needs a `Range` indexer or a `Slice(int, int)` method; for arrays and strings the compiler uses `GetSubArray`/`Substring`.
* Only **one** `..` per list pattern.
* `IEnumerable<T>` is **not** supported (not indexable); materialise it first.
* Slice capture allocates a new array or substring (except for `Span<T>`, which slices without copying).
* Works with `switch` statements, expressions and `is`.

### 4.5 Best practices & pitfalls
* A `switch` expression without a catch-all gives warning CS8509 (not exhaustive); the compiler does understand `[]`, `[..]` as exhaustive combinations.
* Avoid capturing a slice in hot paths on arrays; it copies.

---

## 5. Static abstract members in interfaces and generic math

### 5.1 The problem
Interfaces could only describe **instance** members, so you could not say "type `T` has a `+` operator" or "`T` has a static `Parse`". Numeric generic code required duplicate overloads for `int`, `long`, `double`...

### 5.2 The idea
Interfaces may declare `static abstract` (and `static virtual`) members, including operators. Type parameters constrained to such an interface can then call `T.Member`.

```csharp
public interface IShape
{
    static abstract string Name { get; }
    static abstract IShape Create();
}

public class Circle : IShape
{
    public static string Name => "circle";
    public static IShape Create() => new Circle();
}

static string Describe<T>() where T : IShape => T.Name;   // resolved statically, no instance needed
```

### 5.3 Generic math
.NET 7 uses this to add interfaces in `System.Numerics`: `INumber<T>`, `IAdditionOperators<,,>`, `IMultiplyOperators<,,>`, `IParsable<T>`, `IMinMaxValue<T>`, and so on. All built-in numeric types implement them.

```csharp
using System.Numerics;

// C# 11 – one method for int, long, double, decimal, BigInteger, custom types...
static T Sum<T>(IEnumerable<T> values) where T : INumber<T>
{
    T total = T.Zero;            // static abstract member
    foreach (var v in values)
        total += v;              // operator from IAdditionOperators
    return total;
}

Sum(new[] { 1, 2, 3 });          // 6
Sum(new[] { 1.5, 2.5 });         // 4
```

### 5.4 Comparison with C# 10

```csharp
// C# 10 – no common abstraction: duplicate methods (or dynamic / boxing tricks)
static int Sum(IEnumerable<int> values)       { int t = 0;     foreach (var v in values) t += v; return t; }
static double Sum(IEnumerable<double> values) { double t = 0;  foreach (var v in values) t += v; return t; }
static decimal Sum(IEnumerable<decimal> values) { decimal t = 0; foreach (var v in values) t += v; return t; }

// Or slow, unchecked-at-compile-time dynamic dispatch:
static dynamic SumDyn(IEnumerable<dynamic> values) { dynamic t = 0; foreach (var v in values) t += v; return t; }
```

| | C# 10 | C# 11 |
|---|---|---|
| Generic numeric algorithm | Overload per type or `dynamic` | One method with `where T : INumber<T>` |
| Operators in an interface | Impossible | `static abstract` operators |
| Static members through `T` | Reflection or instance workaround | `T.Parse(...)`, `T.Zero` |
| Performance | `dynamic` slow | Resolved at JIT time, specialised per value type |

### 5.5 Implementing operators in an interface

```csharp
public interface IAddable<T> where T : IAddable<T>
{
    static abstract T operator +(T left, T right);
}

public readonly record struct Money(decimal Amount) : IAddable<Money>
{
    public static Money operator +(Money l, Money r) => new(l.Amount + r.Amount);
}
```

### 5.6 Checked user-defined operators
C# 11 lets you define separate `checked` variants of operators, which the compiler picks in a `checked` context.

```csharp
public readonly struct Meters
{
    public int Value { get; }
    public Meters(int v) => Value = v;

    public static Meters operator +(Meters a, Meters b) => new(unchecked(a.Value + b.Value));
    public static Meters operator checked +(Meters a, Meters b) => new(checked(a.Value + b.Value));
}
```

### 5.7 Rules & behaviour
* Static abstract members are called through a **type parameter** (`T.Name`); they cannot be accessed through the interface type itself (`IShape.Name` is a compile error), so such interfaces are mostly used as constraints.
* `static virtual` members have a default implementation that implementers may override.
* Needs runtime support: **.NET 7+**.
* Implementations must be public static; explicit implementation is allowed.
* Operators in these interfaces must have at least one parameter of the type parameter.

### 5.8 Best practices & pitfalls
* Use for numeric libraries, parsers (`IParsable<T>`), serializers and factories (`T.Create()`) instead of reflection.
* Interfaces with self-referencing constraints (`where T : IFoo<T>`, the "curiously recurring template pattern") are the norm.
* For ordinary application code, normal interfaces and DI remain the right tool.

---

## 6. Generic attributes

### 6.1 The problem
Attributes that carry a type had to take a `System.Type` parameter, so there was no compile-time type safety.

### 6.2 Example and comparison

```csharp
// C# 10 – Type argument: nothing stops you passing a type that does not fit
[AttributeUsage(AttributeTargets.Class)]
public class ValidatorAttribute : Attribute
{
    public Type ValidatorType { get; }
    public ValidatorAttribute(Type validatorType) => ValidatorType = validatorType;
}

[Validator(typeof(string))]   // compiles, wrong at runtime
public class Order { }
```

```csharp
// C# 11 – generic attribute, constraint checked by the compiler
public class ValidatorAttribute<T> : Attribute where T : IValidator { }

[Validator<OrderValidator>]
public class Order { }
```

### 6.3 Rules & behaviour
* All type arguments must be **concrete at the use site**: `[Validator<T>]` inside a generic class using its own `T` is an error, and `List<T>`-style open or `dynamic`/nullable-annotated reference types are not allowed as type arguments.
* The attribute class must still derive from `Attribute`.
* Reflection: `typeof(ValidatorAttribute<>)` for the open generic, `GetCustomAttributes` returns closed types.

### 6.4 Best practices
* Use for `[Produces<T>]`-style metadata, validators, converters, DI markers.

---

## 7. UTF-8 string literals

### 7.1 The idea
Append `u8` to a string literal to get UTF-8 bytes at compile time.

```csharp
ReadOnlySpan<byte> hello = "Hello"u8;     // type is ReadOnlySpan<byte>
byte[] array = "Hello"u8.ToArray();       // copies when an array is needed
```

### 7.2 Comparison with C# 10

```csharp
// C# 10 – runtime encoding on every call (or a static field you must cache by hand)
byte[] hello = System.Text.Encoding.UTF8.GetBytes("Hello");

static readonly byte[] Cached = System.Text.Encoding.UTF8.GetBytes("Hello");
```

```csharp
// C# 11 – bytes are stored in the assembly's data section, no allocation, no encoding at runtime
ReadOnlySpan<byte> hello = "Hello"u8;
```

### 7.3 Rules & behaviour
* The type is `ReadOnlySpan<byte>`, so it cannot be used in `async` methods across `await`, stored as a class field, or boxed.
* Only for **constant** strings; interpolated strings with `u8` are an error. Concatenation of two `u8` literals with `+` is allowed (C# 11).
* Works with `var` (inferred `ReadOnlySpan<byte>`).

### 7.4 Real-world use
* HTTP/protocol headers, JSON property names (`Utf8JsonWriter.WriteString("name"u8, ...)`), parsers, hot paths in ASP.NET Core and Kestrel.

---

## 8. Newlines in string interpolation expressions

Expressions inside `{ }` of an interpolated string may span multiple lines (no longer limited to one line in non-verbatim strings).

```csharp
// C# 10 – had to compute outside the string
var status = person.Age switch { < 18 => "minor", < 65 => "adult", _ => "senior" };
string msg = $"{person.Name} is {status}";
```

```csharp
// C# 11 – readable multi-line expression inside the hole
string msg = $"{person.Name} is {
    person.Age switch
    {
        < 18 => "minor",
        < 65 => "adult",
        _    => "senior"
    }}";
```

* Compile-time only. Comments, lambdas and LINQ queries can also be formatted across lines.
* Prefer extracting a local variable when the expression is long; it is easier to debug.

---

## 9. File-local types

### 9.1 The idea
The `file` modifier limits a top-level type to **the file in which it is declared**.

```csharp
// OrderMapper.cs
file class OrderMappingHelper        // invisible to other files in the project
{
    public static string Map(Order o) => o.Id.ToString();
}

public class OrderMapper
{
    public string Map(Order o) => OrderMappingHelper.Map(o);
}
```

### 9.2 Comparison with C# 10

```csharp
// C# 10 – internal is project-wide; the helper pollutes the namespace and can collide
internal class OrderMappingHelper { }   // another file declaring the same name => CS0101

// Workaround: nested private class, which makes the file long
public class OrderMapper
{
    private static class Helper { }
}
```

```csharp
// C# 11 – two files can each declare their own `file class Helper` with no clash
file class Helper { }
```

### 9.3 Rules & behaviour
* `file` can only be applied to **top-level** types (class, struct, interface, enum, delegate, record).
* A file-local type cannot appear in the signature of a non-file member that is more accessible (e.g. a public method returning a `file` type is error).
* Intended mainly for **source generators**, which can emit helper types without name collisions.
* Same-named `file` types in different files are different types (the compiler mangles their metadata names).

---

## 10. Auto-default structs

### 10.1 The problem
In a struct constructor all fields had to be assigned before the constructor finished (CS0171 / CS0188 for `this` use).

### 10.2 Example and comparison

```csharp
// C# 10 – every field must be assigned
public struct Point
{
    public int X;
    public int Y;
    public string Label;

    public Point(int x, int y)
    {
        X = x;
        Y = y;
        Label = null;       // required in C# 10, error CS0171 otherwise
    }
}
```

```csharp
// C# 11 – unassigned fields are default-initialised by the compiler
public struct Point
{
    public int X;
    public int Y;
    public string Label;

    public Point(int x, int y)
    {
        X = x;
        Y = y;
        // Label is left as default (null) automatically
    }
}
```

### 10.3 Rules & behaviour
* The compiler emits the zero-initialisation (`this = default` effectively) at the start of the constructor.
* Also applies to auto-properties and to fields in structs where you read `this` before assigning everything.
* With nullable context enabled, you still get nullable warnings for `Label` being possibly null.
* Don't rely on it for correctness: a struct whose fields silently default may hide forgotten assignments.

---

## 11. Pattern matching `Span<char>` on a constant string

`Span<char>` and `ReadOnlySpan<char>` can be matched against a constant string.

```csharp
static bool IsYes(ReadOnlySpan<char> text) => text is "yes" or "y";

static int Parse(ReadOnlySpan<char> command) => command switch
{
    "start" => 1,
    "stop"  => 2,
    _       => 0
};
```

```csharp
// C# 10 – SequenceEqual or ToString() (allocates)
static bool IsYes(ReadOnlySpan<char> text) =>
    text.SequenceEqual("yes") || text.SequenceEqual("y");
```

* Comparison is ordinal and allocation-free.
* Handy when parsing buffers without creating strings.

---

## 12. Extended `nameof` scope

Inside an attribute on a method, `nameof` can reference the method's **parameter names** and type parameters.

```csharp
// C# 11
[return: NotNullIfNotNull(nameof(path))]   // 'path' is a parameter of the same method
public static string? Normalize(string? path) => path?.Trim();
```

```csharp
// C# 10 – had to use string literals; renaming the parameter silently broke the attribute
[return: NotNullIfNotNull("path")]
public static string? Normalize(string? path) => path?.Trim();
```

* Applies to attributes on methods, their parameters and type parameters.
* Removes magic strings and survives renames.

---

## 13. Ref fields and `scoped`

### 13.1 The problem
A `ref struct` (such as `Span<T>`) could not hold a reference to another variable directly; `Span<T>` was implemented with runtime-internal tricks.

### 13.2 The idea
A `ref struct` can declare **`ref` fields** and `readonly ref` fields. The `scoped` modifier limits the lifetime of a `ref`/`in`/`out` parameter or local to the current method.

```csharp
public readonly ref struct MySpan<T>
{
    private readonly ref T _start;     // C# 11 ref field
    private readonly int _length;

    public MySpan(ref T start, int length)
    {
        _start = ref start;
        _length = length;
    }

    public ref T this[int index]
    {
        get
        {
            if ((uint)index >= (uint)_length) throw new IndexOutOfRangeException();
            return ref Unsafe.Add(ref _start, index);   // System.Runtime.CompilerServices.Unsafe
        }
    }
}
```

```csharp
// scoped: the ref cannot escape the method, so callers can pass short-lived locals safely
static int Sum(scoped ReadOnlySpan<int> values)
{
    int total = 0;
    foreach (var v in values) total += v;
    return total;
}
```

### 13.3 Comparison with C# 10

```csharp
// C# 10 – ref fields not allowed: a ref struct could not declare "ref int _value"
// (the BCL's Span<T> relied on internal runtime support instead)
```

### 13.4 Rules & behaviour
* Needs .NET 7 runtime support (`RefSafetyRulesAttribute`, updated `Span<T>`).
* New "ref safety rules" apply; a method taking a `ref` parameter and a `Span<T>` may now be treated as able to capture the reference. `scoped` removes that assumption.
* `[UnscopedRef]` does the opposite: it lets a `ref`/`out` parameter or a struct's `this` be returned by reference when the default rules would forbid it.
* Rarely used in application code; common in low-level libraries and performance work.

---

## 14. Numeric `IntPtr` / `UIntPtr`

`nint`/`nuint` become **aliases** for `System.IntPtr`/`System.UIntPtr`, so they now support arithmetic and conversions as real numeric types.

```csharp
// C# 11 on .NET 7
nint a = 10;
IntPtr b = a;                 // same type, no conversion
nint sum = a + b;             // arithmetic operators on IntPtr
```

```csharp
// C# 10 – nint was a compiler-level native-sized integer; the runtime IntPtr type
// had no numeric operators or numeric interfaces of its own
nint a = 10;
```

* The runtime types `IntPtr`/`UIntPtr` gain the numeric operators and generic math interfaces (`INumber<T>`...) in .NET 7.
* Relevant in interop code and `Unsafe`/pointer arithmetic.

---

## 15. Improved method group conversion to delegate

The compiler now caches the delegate created for a **static method group** and can infer better overloads.

```csharp
// C# 10 – every evaluation of the method group allocated a new delegate
Func<int, string> f = Convert;           // new allocation each time in a hot loop

// C# 11 – delegate is cached in a static field by the compiler
Func<int, string> g = Convert;           // allocated once, reused

static string Convert(int i) => i.ToString();
```

* Behavioural improvement; no syntax change.
* Reduces GC pressure with LINQ calls like `items.Select(Convert)`.

---

## 16. Unsigned right shift and relaxed shift operators

### 16.1 `>>>`
Unsigned right shift fills the high bits with zeros, regardless of the sign.

```csharp
int n = -8;
int a = n >> 1;    // C# 10 – arithmetic shift, sign preserved: -4
int b = n >>> 1;   // C# 11 – logical shift: 2147483644
```

```csharp
// C# 10 – cast to unsigned and back to get a logical shift
int b = (int)((uint)n >> 1);
```

### 16.2 Relaxed shift operators
The right operand of a user-defined shift operator no longer needs to be `int`.

```csharp
// C# 11 – required for generic math (IShiftOperators<TSelf, TOther, TResult>)
public static MyNumber operator <<(MyNumber value, MyNumber shift) => ...;
```

```csharp
// C# 10 – second parameter of a user-defined << had to be int
public static MyNumber operator <<(MyNumber value, int shift) => ...;
```

---

## 17. Warning wave 7

* Warning wave 7 (enabled by default for C# 11) adds new warnings, mainly **CS8981**: a type name made of only lowercase ASCII letters is reserved for the language (e.g. `class record {}`).
* Control with `<AnalysisLevel>`, `<WarningLevel>` or `#pragma warning disable`.
* Not a feature to use but a migration item: upgrading `LangVersion` can introduce new warnings (an error in builds with `TreatWarningsAsErrors`).

---

## 18. Quick interview cheat sheet

### Likely questions and concise answers

**What is a raw string literal and when do you use it?**
A string delimited by three or more `"` that needs no escaping and trims the indentation of the closing delimiter. Use it for JSON, XML, regex, SQL and templates.

**How do you embed braces in an interpolated raw string?**
Use `$$"""`: two `$` means `{{x}}` is a hole and a single `{` is text. The number of `$` sets the number of braces that open a hole.

**What does `required` do, and what does it not do?**
It forces callers to set the member in an object initializer (compile error CS9035 otherwise). It is a compile-time check only; reflection and unaware serializers can bypass it. A constructor with `[SetsRequiredMembers]` opts out.

**Difference between `required` and a constructor parameter?**
`required` works with object initializers and parameterless constructors (ORMs, serializers) and avoids long constructors; constructor parameters enforce at the call site and are usable everywhere.

**What are list patterns?**
Patterns that match arrays and other countable, indexable types by element: `[1, _, ..]`, `[var first, .., var last]`. `..` is a slice pattern, allowed once per list pattern.

**Which types support list patterns?**
Types with `Length`/`Count` and an `int` indexer (arrays, `string`, `List<T>`, `Span<T>`). Not `IEnumerable<T>`.

**What are static abstract members in interfaces?**
Members declared `static abstract`/`static virtual` that implementing types must provide. They can only be accessed via a type parameter constrained to the interface, e.g. `T.Zero`.

**What is generic math?**
The `System.Numerics` interfaces (`INumber<T>`, `IAdditionOperators<...>`, ...) built on static abstract members, letting one generic method work for all numeric types.

**What are generic attributes?**
Attribute classes with type parameters (`[Validator<OrderValidator>]`) replacing `Type` constructor arguments; type arguments must be fully concrete at the use site.

**What does `"text"u8` produce?**
A `ReadOnlySpan<byte>` of UTF-8 bytes created at compile time, with no allocation at runtime.

**What is a `file` type?**
A top-level type visible only within its source file. Avoids name collisions; mainly useful for source generators.

**What are auto-default structs?**
A struct constructor no longer has to assign every field; the compiler default-initialises the rest.

**What are `ref` fields and `scoped`?**
`ref struct`s can store a `ref` to another variable. `scoped` limits a reference parameter's or local's lifetime to the current method so it cannot escape.

**Difference between `>>` and `>>>`?**
`>>` is an arithmetic shift preserving the sign bit; `>>>` is a logical shift filling with zeros.

**What needs runtime support (.NET 7)?**
Static abstract interface members/generic math, `ref` fields, the `required` attributes (can be polyfilled), numeric `IntPtr`. Raw strings, list patterns, file types, newlines in holes and `u8` need only the compiler (and `ReadOnlySpan<byte>`).

### Common traps

* `required` is not enforced at runtime; `new Person()` via reflection yields null properties.
* `required` does not mean non-null; the nullable annotation still decides null-state.
* A static abstract member can't be called through an interface-typed variable, only via a constrained generic.
* List patterns don't work on `IEnumerable<T>`; slice captures on arrays copy.
* `"..."u8` is a span, not `byte[]`: can't be stored in a field or used across `await`.
* The closing `"""` position in a raw string controls indentation; content lines indented less than it are a compile error.
* `file` is not an access modifier on members and does not apply to nested types.
* Upgrading to C# 11 can add warnings (wave 7), e.g. lowercase type names.
* Polyfilling `RequiredMemberAttribute` etc. is needed to use `required` on older targets, and doing so is unsupported by serializers that check it.
