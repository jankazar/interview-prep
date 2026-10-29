# C# 9.0 Study Guide

C# 9.0 shipped in November 2020 with .NET 5 / Visual Studio 2019 16.8. Its theme is **less ceremony and immutability-friendly data modelling**: records, init-only setters, top-level statements, target-typed expressions and richer pattern matching. Another group of features (module initializers, partial method extensions, function pointers, native-sized integers, `SkipLocalsInit`) targets source generators and low-level / interop scenarios.

**Language version:** C# 9.0 is the default only for projects targeting **.NET 5**. For older targets (.NET Core 3.1, .NET Standard, .NET Framework) you can opt in with `<LangVersion>9.0</LangVersion>`, but features that need new runtime types or runtime behaviour (covariant returns, some module-initializer and function-pointer scenarios) will not fully work. Records and `init` only need the compiler-recognised marker type `System.Runtime.CompilerServices.IsExternalInit`, which you can declare yourself on older frameworks.

## Table of Contents

1. [Overview of new features](#1-overview-of-new-features)
2. [Records](#2-records)
3. [Init-only setters](#3-init-only-setters)
4. [Top-level statements](#4-top-level-statements)
5. [Pattern matching enhancements](#5-pattern-matching-enhancements)
6. [Target-typed new expressions](#6-target-typed-new-expressions)
7. [Target-typed conditional expressions](#7-target-typed-conditional-expressions)
8. [Covariant return types](#8-covariant-return-types)
9. [Lambda discard parameters](#9-lambda-discard-parameters)
10. [Static anonymous functions](#10-static-anonymous-functions)
11. [Attributes on local functions](#11-attributes-on-local-functions)
12. [Extension GetEnumerator in foreach](#12-extension-getenumerator-in-foreach)
13. [Module initializers](#13-module-initializers)
14. [Extended partial methods](#14-extended-partial-methods)
15. [Native-sized integers](#15-native-sized-integers)
16. [Function pointers](#16-function-pointers)
17. [SkipLocalsInit attribute](#17-skiplocalsinit-attribute)
18. [Quick interview cheat sheet](#18-quick-interview-cheat-sheet)

---

## 1. Overview of new features

| Feature | Purpose | Runtime / framework requirement |
|---|---|---|
| Records | Reference types with value-based equality, concise syntax, non-destructive mutation | `IsExternalInit` for init accessors (declare it manually on old frameworks) |
| Init-only setters | Properties settable only during object initialisation | `IsExternalInit` |
| Top-level statements | No `Program` class / `Main` boilerplate | None |
| Pattern matching enhancements | Relational, `and` / `or` / `not`, parenthesised and type patterns | None |
| Target-typed `new` | `new()` when the type is known from context | None |
| Target-typed conditional `?:` | Natural type of `cond ? a : b` can come from the target | None |
| Covariant return types | Override with a more derived return type | .NET 5 runtime |
| Lambda discard parameters | `(_, _) => 0` | None |
| Static anonymous functions | `static` lambdas cannot capture | None |
| Attributes on local functions | `[Attr]` on local functions | None |
| Extension `GetEnumerator` | `foreach` over types via extension method | None |
| Module initializers | Code that runs once when the module loads | .NET 5 for `ModuleInitializerAttribute` |
| Extended partial methods | Accessibility modifiers, return values, `out` parameters | None |
| Native-sized integers | `nint` / `nuint` | Platform-dependent size |
| Function pointers | `delegate*<...>` for fast unmanaged-style calls | `unsafe` context |
| `SkipLocalsInit` | Skip zero-initialising locals | `unsafe` context, .NET 5 |

---

## 2. Records

### 2.1 The problem
Modelling immutable data with value semantics in C# 8 needed a lot of boilerplate: a constructor, get-only properties, `Equals`, `GetHashCode`, `==`/`!=`, `ToString`, and a "copy with one change" method. Forgetting to update one of them after adding a property was a classic bug.

### 2.2 The idea
A `record` is a **reference type** (a class) for which the compiler synthesises **value-based equality**, `GetHashCode`, `ToString`, a copy constructor, a `with` clone method and (for the positional form) a primary constructor, init-only properties and `Deconstruct`.

```csharp
// positional record: one line
public record Person(string FirstName, string LastName);

var p1 = new Person("Ada", "Lovelace");
var p2 = new Person("Ada", "Lovelace");

Console.WriteLine(p1 == p2);                  // True  – compares values
Console.WriteLine(ReferenceEquals(p1, p2));   // False – still two objects
Console.WriteLine(p1);                        // Person { FirstName = Ada, LastName = Lovelace }

var p3 = p1 with { LastName = "Byron" };      // non-destructive mutation (copy + change)
var (first, last) = p1;                       // Deconstruct
```

### 2.3 Comparison with C# 8

```csharp
// C# 8 – the hand-written equivalent of the one-line record above
public sealed class Person : IEquatable<Person>
{
    public string FirstName { get; }
    public string LastName { get; }

    public Person(string firstName, string lastName)
    {
        FirstName = firstName;
        LastName = lastName;
    }

    public Person WithLastName(string lastName) => new Person(FirstName, lastName);

    public void Deconstruct(out string firstName, out string lastName)
    {
        firstName = FirstName;
        lastName = LastName;
    }

    public bool Equals(Person? other) =>
        other != null && FirstName == other.FirstName && LastName == other.LastName;

    public override bool Equals(object? obj) => Equals(obj as Person);
    public override int GetHashCode() => HashCode.Combine(FirstName, LastName);
    public static bool operator ==(Person? a, Person? b) => ReferenceEquals(a, b) || (a?.Equals(b) ?? false);
    public static bool operator !=(Person? a, Person? b) => !(a == b);
    public override string ToString() => $"Person {{ FirstName = {FirstName}, LastName = {LastName} }}";
}
```

| | C# 8 class | C# 9 record |
|---|---|---|
| Lines of code | ~30 | 1 |
| Value equality, `GetHashCode`, `ToString` | Hand-written, easy to get out of sync | Compiler-generated, always in sync |
| Copy with change | Custom `WithX` methods | `with { ... }` |
| Deconstruction | Hand-written | Generated (positional) |

### 2.4 What the compiler generates
* `Equals(Person?)` implementing `IEquatable<Person>`, an overridden `Equals(object?)`, `GetHashCode`, and `==` / `!=` operators.
* `ToString` printing `TypeName { Prop = value, ... }` (via a protected `PrintMembers` method).
* A protected **copy constructor** used by `with`.
* A protected virtual `EqualityContract` property (the runtime `Type`) used by equality, so a `Student` record never equals a `Person` record with the same members.
* For positional records: a primary constructor, an **init-only** property per parameter and a `Deconstruct` method.

### 2.5 Syntax variants

```csharp
// 1. Positional – immutable by default (init-only properties)
public record Point(int X, int Y);

// 2. Nominal – regular property syntax; you choose mutability
public record Customer
{
    public string Name { get; init; } = "";
    public int Age { get; set; }            // mutable is allowed, but think twice
}

// 3. Positional + extra members
public record Temperature(double Celsius)
{
    public double Fahrenheit => Celsius * 9 / 5 + 32;
}
```

### 2.6 Inheritance
A record can inherit only from another **record** (or `object`); a record cannot derive from a regular class, and a class cannot derive from a record. Equality takes the runtime type into account.

```csharp
public record Person(string FirstName, string LastName);
public record Student(string FirstName, string LastName, int Year) : Person(FirstName, LastName);

Person a = new Student("Ada", "Lovelace", 1);
Person b = new Person("Ada", "Lovelace");
Console.WriteLine(a == b);   // False – EqualityContract differs
```

### 2.7 Best practices & pitfalls
* **Reference semantics remain:** a record is still a class; `==` compares values but variables hold references and can be `null`.
* **Shallow equality:** members are compared with their own `Equals`. A `List<T>` member compares by reference, so two records with equal-looking lists are **not** equal.
* **Immutability is shallow:** `init` does not make a contained list or object immutable.
* **Mutable members break hashing:** if a record is used as a dictionary key and you mutate a `{ get; set; }` property, its hash code changes.
* **`with` is a shallow copy** of the instance (it calls the copy constructor).
* **Not an ORM-friendly default:** EF Core tracks entities by identity, whereas records equate by value; prefer records for DTOs, messages, value objects and API contracts.
* **Serialisation:** `System.Text.Json` and Newtonsoft handle `init` properties; positional records need constructor-binding support.

### 2.8 Real-world use
API request/response DTOs, domain events and commands (CQRS/messaging), immutable configuration, value objects in DDD, cache keys.

---

## 3. Init-only setters

### 3.1 The problem
Object initialisers (`new X { A = 1 }`) required public `set` accessors, which stay callable for the object's whole life. Making a type truly immutable meant giving up initialiser syntax and writing constructors.

### 3.2 The idea
`init` is an accessor that can be called only during **object initialisation**: in an object initialiser, a `with` expression, another `init` accessor, a constructor of the type (or a derived type), or an attribute usage.

```csharp
public class Product
{
    public string Name { get; init; } = "";
    public decimal Price { get; init; }
}

var p = new Product { Name = "Book", Price = 9.99m };   // OK
p.Price = 5m;                                           // compile error: init-only property
```

### 3.3 Comparison with C# 8

```csharp
// C# 8 – option A: public setters, so the object stays mutable forever
public class Product
{
    public string Name { get; set; } = "";
    public decimal Price { get; set; }
}
var p = new Product { Name = "Book", Price = 9.99m };
p.Price = 0m;                                // compiles, can be changed at any time

// C# 8 – option B: immutable, but no initialiser syntax and constructor overloads grow
public class ImmutableProduct
{
    public string Name { get; }
    public decimal Price { get; }
    public ImmutableProduct(string name, decimal price) { Name = name; Price = price; }
}
var q = new ImmutableProduct("Book", 9.99m);   // positional args, order matters
```

C# 9 gives both: initialiser readability **and** immutability after construction.

### 3.4 Rules & behaviour
* Init accessors can also be written explicitly: `get => _x; init => _x = value;`.
* Readonly fields can be assigned inside an `init` accessor.
* It is a **compile-time** guarantee, enforced via the `IsExternalInit` modreq. Reflection can still change the value, and a consumer compiled with an older compiler won't see the restriction.
* Positional records use `init` for their generated properties.
* Combine with the **non-nullable** annotation carefully: an `init` property may remain unset, so initialise it (`= ""`) or the nullable analysis warns.

### 3.5 Pitfalls
* There is no way to force callers to set an `init` property (no `required` modifier in C# 9); validate in the constructor, or expose a constructor for mandatory data.
* `init` is not a substitute for deep immutability.
* Libraries that mutate via setters (some model binders, old serialisers) may need to support `init`.

---

## 4. Top-level statements

### 4.1 The idea
The entry point can be written directly as statements at the top of one file. The compiler synthesises the `Main` method and the containing class.

```csharp
using System;

Console.WriteLine($"Hello, {args.Length} argument(s)!");
await Task.Delay(100);
return 0;                       // optional exit code

static int Twice(int x) => x * 2;   // local function, usable above
```

### 4.2 Comparison with C# 8

```csharp
// C# 8 – ceremony around three lines of real code
using System;
using System.Threading.Tasks;

namespace MyApp
{
    class Program
    {
        static async Task<int> Main(string[] args)
        {
            Console.WriteLine($"Hello, {args.Length} argument(s)!");
            await Task.Delay(100);
            return 0;
        }
    }
}
```

### 4.3 Rules & behaviour
* Only **one file** per project may contain top-level statements.
* Statements must come **before** type and namespace declarations in that file.
* `args` is available; `await` is allowed (the generated `Main` becomes async); `return <int>` sets the exit code.
* Local variables and local functions declared at top level are locals of the generated method, **not** members of a class.
* Using directives go at the top of the file as usual.

### 4.4 Best practices & pitfalls
* Great for small tools, scripts, demos and learning; larger apps still benefit from explicit structure and testable classes.
* Variables are locals, so other types cannot access them; shared state needs a class.
* Do not rely on the generated class name in tests or reflection.
* Because the compiler picks the entry point, adding a manual `Main` as well causes a warning/ambiguity.

---

## 5. Pattern matching enhancements

C# 9 completes the pattern vocabulary started in C# 7 and extended in C# 8.

| Pattern | Example |
|---|---|
| Type pattern | `o is string` / `case int:` |
| Relational patterns | `x is > 0`, `<`, `<=`, `>=` |
| Logical `and` | `x is > 0 and < 10` |
| Logical `or` | `c is 'a' or 'e' or 'i'` |
| Logical `not` | `o is not null`, `o is not string` |
| Parenthesised | `x is (> 0 and < 10) or 100` |

### 5.1 Relational and logical patterns

```csharp
static string Classify(int n) => n switch
{
    < 0               => "negative",
    0                 => "zero",
    > 0 and < 10      => "small",
    >= 10 and < 100   => "medium",
    _                 => "large"
};

static bool IsLetter(char c) => c is >= 'a' and <= 'z' or >= 'A' and <= 'Z';
```

**Comparison with C# 8:**

```csharp
// C# 8 – no relational patterns: every range needs a `when` guard
static string Classify(int n)
{
    switch (n)
    {
        case int x when x < 0: return "negative";
        case 0:                return "zero";
        case int x when x < 10:  return "small";
        case int x when x < 100: return "medium";
        default:               return "large";
    }
}

static bool IsLetter(char c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
```

### 5.2 `not` pattern and null checks

```csharp
if (obj is not null) { /* ... */ }
if (obj is not string s) return;        // s is definitely assigned after the if
Console.WriteLine(s.Length);
```

**Comparison with C# 8:**

```csharp
// C# 8
if (obj != null) { /* ... */ }          // may call an overloaded != operator
if (!(obj is string s)) return;         // negation needs the extra parentheses
Console.WriteLine(s.Length);
```

`is not null` is preferred over `!= null`: it can never invoke a user-defined `==`/`!=` operator.

### 5.3 Type pattern (no designation or discard)

```csharp
static string Describe(object o) => o switch
{
    int    => "int",
    string => "string",
    null   => "null",
    _      => "other"
};
```

**Comparison with C# 8:**

```csharp
// C# 8 – a discard designation was required
static string Describe(object o) => o switch
{
    int _    => "int",
    string _ => "string",
    null     => "null",
    _        => "other"
};
```

### 5.4 Combining everything

```csharp
public static decimal Discount(Customer c) => c switch
{
    { Age: >= 65 }                       => 0.20m,
    { Age: < 18 }                        => 0.10m,
    { IsMember: true, Orders: > 10 }     => 0.15m,
    _                                    => 0m
};
```

### 5.5 Rules & pitfalls
* Precedence: `not` binds tighter than `and`, which binds tighter than `or`; use parentheses for clarity.
* The compiler checks that arms are **reachable** and warns when a switch is **non-exhaustive**.
* A relational pattern needs a constant right-hand side of a built-in type (numeric, `char`, enum...); it cannot compare two variables.
* `x is > 0 or < 10` is always true (a common logic slip) — `or` / `and` express set union / intersection of values.

---

## 6. Target-typed new expressions

### 6.1 The idea
When the type is already known from the target, `new` can omit it.

```csharp
List<int> numbers = new();                         // local
private readonly Dictionary<string, List<int>> _map = new();   // field – `var` is impossible here
Process(new());                                     // method argument (type from parameter)
Point[] points = { new(1, 2), new(3, 4) };          // elements
```

### 6.2 Comparison with C# 8

```csharp
// C# 8
List<int> numbers = new List<int>();
private readonly Dictionary<string, List<int>> _map = new Dictionary<string, List<int>>();   // repeated type
Process(new Options());
Point[] points = { new Point(1, 2), new Point(3, 4) };
```

`var` removes the duplication for locals only; target-typed `new()` also works for fields, properties, parameters and return values.

### 6.3 Rules & pitfalls
* `var x = new();` is an error: there is no target type.
* Not allowed for anonymous types, `dynamic`, or when the target is an interface/abstract type.
* Overload resolution can become ambiguous if several overloads accept different types.
* Readability: use it when the type is obvious from the left side; on a method argument it can hide what is created.
* Works for `struct` as well as `class`, and for constructors with arguments and initialisers: `Customer c = new("Ada") { Age = 30 };`.

---

## 7. Target-typed conditional expressions

### 7.1 The problem
In C# 8 the type of `cond ? a : b` had to be determined from `a` and `b` alone, so mixing `int` and `null` or two unrelated types failed even when the assignment target was clear.

```csharp
// C# 8 – error CS0173: no implicit conversion between 'int' and '<null>'
int? x = flag ? 1 : null;

// C# 8 workarounds
int? y = flag ? 1 : (int?)null;
int? z = flag ? (int?)1 : null;
```

```csharp
// C# 9 – the target type int? is used
int? x = flag ? 1 : null;

Animal pet = flag ? new Dog() : new Cat();       // C# 8: needed a cast: (Animal)new Dog()
```

### 7.2 Rules & pitfalls
* A **natural type** is still tried first; the target type is only used if none exists.
* With `var` there is no target, so `var v = flag ? 1 : null;` still fails.
* The same rule applies to `switch` expressions (arms converted to the target type).
* `??` is unchanged.

---

## 8. Covariant return types

### 8.1 The idea
An overriding method (or read-only property) may return a type **more derived** than the base method.

```csharp
public abstract class Animal
{
    public abstract Animal Clone();
}

public class Dog : Animal
{
    public override Dog Clone() => new Dog();   // C# 9: more specific return type
}

Dog d = new Dog().Clone();                      // no cast needed
```

### 8.2 Comparison with C# 8

```csharp
// C# 8 – override must have exactly the same return type (error CS0508 otherwise)
public class Dog : Animal
{
    public override Animal Clone() => new Dog();
}
Dog d = (Dog)new Dog().Clone();                 // cast required

// C# 8 workaround: hide with `new` (breaks polymorphism) or self-referencing generics
public abstract class Animal<T> where T : Animal<T> { public abstract T Clone(); }
```

### 8.3 Rules & pitfalls
* Applies to **class** overrides only; interface implementations still need the exact type.
* Needs **.NET 5+ runtime** support (the compiler emits a `PreserveBaseOverridesAttribute`); not available when targeting .NET Framework / .NET Core 3.1.
* Properties must be get-only (a setter would break type safety).
* Useful for `Clone()`, factory methods and fluent builders in class hierarchies.

---

## 9. Lambda discard parameters

When a lambda does not use some parameters, name them `_`. Two or more underscores are discards (no variable is created).

```csharp
Func<int, int, int> constant = (_, _) => 42;         // C# 9
button.Click += (_, _) => Console.WriteLine("clicked");
```

```csharp
// C# 8 – you had to invent distinct, unused names
Func<int, int, int> constant = (a, b) => 42;
button.Click += (sender, e) => Console.WriteLine("clicked");
// or the common convention:  (_, __) => ...
```

* With a **single** `_` the parameter is still a normal parameter named `_` (backward compatibility).
* Discards communicate intent and avoid unused-parameter analyser noise.
* Works for anonymous methods too (with explicit types): `delegate (int _, int _) { return 0; }`.

---

## 10. Static anonymous functions

Add `static` to a lambda or anonymous method to **forbid capturing** locals, parameters or `this`.

```csharp
int factor = 10;

Func<int, int> bad  = static x => x * factor;   // compile error: cannot capture 'factor'
Func<int, int> good = static x => x * 2;        // OK – no closure object is created
```

**Comparison with C# 8:**

```csharp
// C# 8 – static local functions existed, lambdas had no `static` modifier
int factor = 10;
Func<int, int> f = x => x * factor;      // silently captures `factor` => closure allocation

static int Twice(int x) => x * 2;        // static local function (C# 8)
Func<int, int> g = Twice;                // method group conversion – a delegate may still be allocated
```

* Static lambdas can use constants, static members and their own parameters.
* Benefit: guaranteed no closure/display-class allocation per call site and accidental captures become compile errors.
* Useful in hot paths, LINQ queries and `Task.Run` calls where allocations matter.

---

## 11. Attributes on local functions

Local functions can now carry attributes, including on their parameters and return values.

```csharp
using System.Diagnostics.CodeAnalysis;

void Validate(string? name)
{
    if (name == null) Fail("name is required");
    Console.WriteLine(name.Length);              // no nullable warning: Fail never returns

    [DoesNotReturn]
    static void Fail(string message) => throw new ArgumentException(message);
}
```

```csharp
// C# 8 – error: attributes are not valid on local functions;
// the helper had to become a private method of the class
private static void Fail(string message) => throw new ArgumentException(message);
```

Typical attributes: `[DoesNotReturn]`, `[return: NotNullIfNotNull(...)]`, `[MethodImpl(MethodImplOptions.AggressiveInlining)]`, `[Obsolete]`.

---

## 12. Extension GetEnumerator in foreach

`foreach` uses the *pattern-based* enumerator lookup. In C# 9 the `GetEnumerator` (and `GetAsyncEnumerator`) method may be an **extension method**, so you can make a type iterable without modifying it.

```csharp
public class Sequence                      // third-party type, no GetEnumerator
{
    public int Start { get; init; }
    public int Count { get; init; }
}

public static class SequenceExtensions
{
    public static IEnumerator<int> GetEnumerator(this Sequence s)
    {
        for (var i = 0; i < s.Count; i++) yield return s.Start + i;
    }
}

foreach (var n in new Sequence { Start = 5, Count = 3 })    // 5 6 7
    Console.WriteLine(n);
```

**Comparison with C# 8:**

```csharp
// C# 8 – the type had to expose the enumerator itself or implement IEnumerable<T>;
// for a type you don't own you had to write an adapter method
public static IEnumerable<int> AsEnumerable(this Sequence s) { ... }
foreach (var n in new Sequence { Start = 5, Count = 3 }.AsEnumerable()) { ... }
```

* An **instance** `GetEnumerator` always wins over an extension method.
* The returned enumerator must still have `Current` and `MoveNext()`.
* Handy for third-party types and for `foreach` over an `IEnumerator<T>` itself.

---

## 13. Module initializers

### 13.1 The idea
A method marked with `[ModuleInitializer]` runs **once, when the module (assembly) is first loaded**, before any other code in it runs.

```csharp
using System.Runtime.CompilerServices;

internal static class Startup
{
    [ModuleInitializer]
    internal static void Init()
    {
        // e.g. register a serialiser, set up native library resolution, initialise a logger
    }
}
```

### 13.2 Requirements
* Method must be `static`, parameterless, return `void`, non-generic, and be `internal` or `public` in a non-generic (non-nested-in-generic) type.
* Several module initializers are allowed; the order is deterministic only within a single file (do not depend on cross-file order).
* The attribute type lives in .NET 5+; on older targets you can declare `ModuleInitializerAttribute` in your own code.

### 13.3 Comparison with C# 8

```csharp
// C# 8 – only static constructors: they run lazily, on first access of that class,
// so there was no way to guarantee "run before anything else in the assembly"
internal static class Startup
{
    static Startup() { /* runs when Startup is first touched */ }
}
// or hacks: the caller must remember to call Startup.Init() explicitly
```

### 13.4 Use cases and cautions
* Libraries and **source generators** that must register something without a user call.
* Native interop / assembly-resolver hooks.
* Avoid heavy or slow work (it delays assembly load) and avoid depending on other module state; exceptions here crash the load. Not a replacement for dependency injection set-up in an app.

---

## 14. Extended partial methods

### 14.1 The idea
Partial methods used to be restricted; C# 9 lifts the restrictions when an **accessibility modifier** is present. Such a method **must** have an implementation.

```csharp
// Generated.cs (e.g. produced by a source generator)
public partial class Repository
{
    public partial bool TryLoad(int id, out string name);   // signature only
}

// Hand-written part
public partial class Repository
{
    public partial bool TryLoad(int id, out string name)
    {
        name = "n/a";
        return false;
    }
}
```

### 14.2 Comparison with C# 8

```csharp
// C# 8 restrictions on a partial method without an implementation:
// - implicitly private, must return void, no out parameters, no virtual/override/sealed/extern
partial class Repository
{
    partial void OnLoaded();                // optional hook: the call is removed if there is no body
}
```

| | C# 8 | C# 9 (with accessibility modifier) |
|---|---|---|
| Accessibility | private only | any |
| Return type | `void` | any |
| `out` parameters | no | yes |
| Implementation | optional (calls vanish) | **required** |

The old `partial void` hook style still works and remains optional-implementation.

---

## 15. Native-sized integers

`nint` and `nuint` are integers whose size matches the platform (32-bit on x86, 64-bit on x64). They are keyword aliases for `System.IntPtr` / `System.UIntPtr` with full arithmetic support.

```csharp
nint a = 10;
nuint b = 20;
nint c = a * 2 + 1;           // arithmetic, comparison, shifts work
Console.WriteLine(IntPtr.Size);   // 4 or 8
```

**Comparison with C# 8:**

```csharp
// C# 8 – IntPtr was an opaque handle: no * / < > operators, conversions needed
IntPtr a = new IntPtr(10);
IntPtr c = IntPtr.Add(a, 5);               // only add/subtract helpers
long asLong = a.ToInt64() * 2;             // convert to do real arithmetic
```

* Main use: interop, memory/pointer-like arithmetic, performance-sensitive code that must follow the native word size.
* Numeric range depends on the platform: don't persist or transmit `nint` values; use `int`/`long` for data contracts.
* Constants are limited to the 32-bit range at compile time.

---

## 16. Function pointers

Function pointers give a delegate-free way to call a method through a pointer using the IL `calli` instruction. They need an `unsafe` context (and `<AllowUnsafeBlocks>true</AllowUnsafeBlocks>`).

```csharp
static int Add(int a, int b) => a + b;

unsafe
{
    delegate*<int, int, int> op = &Add;     // pointer to a static method
    int result = op(2, 3);                  // 5
}

// native / unmanaged calling convention
// delegate* unmanaged[Cdecl]<int, int> native = ...;
```

**Comparison with C# 8:**

```csharp
// C# 8 – delegates: heap allocation, an extra Invoke indirection
Func<int, int, int> op = Add;
int result = op(2, 3);

// or, for native interop, convert a delegate: Marshal.GetFunctionPointerForDelegate(del)
```

* Only for **static** methods (or via `&` on unmanaged-callable ones); no instance methods.
* Not convertible to `object`, not usable as generic arguments.
* Benefits: no allocation, no delegate invoke overhead; suited to interop with native libraries and high-performance libraries.
* Costs: unsafe, less safe and less debuggable — use only when profiling shows a need.

---

## 17. SkipLocalsInit attribute

By default the runtime **zero-initialises** all locals (`.locals init`). `[SkipLocalsInit]` tells the compiler to omit this, which saves work for large `stackalloc` buffers.

```csharp
using System.Runtime.CompilerServices;

[SkipLocalsInit]
static unsafe int Sum()
{
    Span<int> buffer = stackalloc int[256];    // NOT zeroed: contains garbage
    for (var i = 0; i < buffer.Length; i++) buffer[i] = i;
    // ... use buffer
    return buffer.Length;
}
```

**Comparison with C# 8:**

```csharp
// C# 8 – stackalloc buffers were always zeroed; the only way to avoid the cost
// was post-processing IL or a different allocation strategy
Span<int> buffer = stackalloc int[256];   // always zero-initialised
```

* Can be applied to a method, type or module; requires `unsafe` (`AllowUnsafeBlocks`).
* **Risk:** reading uninitialised memory yields undefined values and may leak data — always write before you read.
* Only worth it for hot paths with big stack buffers; measure first.

---

## 18. Quick interview cheat sheet

### Likely questions and concise answers

**What is a record in C# 9? Class or struct?**
A reference type (class) with compiler-generated value-based equality, `GetHashCode`, `ToString`, `with` copying and (positional) deconstruction.
**How do records differ from classes?**
Same reference semantics, but `==` / `Equals` compare member values (and runtime type), `ToString` prints members, and `with` provides non-destructive mutation. Records may inherit only from records.

**What does `init` do and how is it enforced?**
It allows assignment only during object initialisation (initialiser, `with`, constructor, other init accessor). Enforced at compile time via `IsExternalInit`; reflection can still bypass it.

**Are records immutable?**
Positional records are init-only (shallowly immutable) by default; nominal records may declare `set`. Contained objects/collections remain mutable.

**What does `with` do?**
Clones the record via its copy constructor and applies the changes in the braces; the original is untouched. Shallow copy.

**What are top-level statements?**
Statements written directly in one file; the compiler generates the entry point (`Main`) with `args`, async/`await` and optional exit code support.

**Which new patterns were added?**
Relational (`<`, `>`, `<=`, `>=`), logical (`and`, `or`, `not`), parenthesised and type patterns.

**`obj is not null` vs `obj != null`?**
`is not null` cannot trigger an overloaded `!=` operator, and reads naturally. Behaviour is identical for types without operator overloads.

**What is target-typed `new`?**
`new()` with the type inferred from the target. Not usable with `var`, anonymous types or interfaces.

**What are covariant return types and what do they need?**
An override may return a more derived type. Class hierarchies only (not interfaces), and requires the .NET 5+ runtime.

**What is a static lambda?**
`static x => ...` cannot capture locals or `this`, guaranteeing no closure allocation.

**What is a module initializer?**
`[ModuleInitializer]` static void method that runs once at module load, before other code in the assembly. Used by libraries and source generators.

**How were partial methods extended?**
With an accessibility modifier, a partial method may be non-void, have `out` params and any accessibility, but then must have an implementation.

**What are `nint` / `nuint`?**
Platform-sized integers (aliases of `IntPtr`/`UIntPtr`) with full arithmetic support.

**What are function pointers?**
`delegate*<...>` pointers to static methods called with `calli`, no allocation, require `unsafe`.

**Which C# 9 features need runtime support?**
Covariant return types (.NET 5 runtime), `ModuleInitializerAttribute` and `SkipLocalsInitAttribute` (types in .NET 5; declarable manually on older frameworks), `IsExternalInit` for `init`/records (declarable manually). Pure compiler features: top-level statements, patterns, target-typed expressions, static lambdas, lambda discards.

### Common traps
* Assuming records are value types or can never be `null`.
* Expecting `==` on two records to compare collection contents (they are compared by reference).
* Mutating a record used as a dictionary key (changes its hash code).
* Believing `init` makes an object deeply immutable or works through reflection.
* `x is > 0 or < 10` is always true; use `and` for ranges.
* `var x = new();` and `var v = flag ? 1 : null;` do not compile.
* A single `_` lambda parameter is a real parameter, not a discard.
* Covariant returns do not apply to interface implementations and fail on older runtimes.
* Partial methods with an accessibility modifier require an implementation (otherwise a compile error).
* `[SkipLocalsInit]` leaves `stackalloc` memory uninitialised.
* Top-level statements: only one file per project and the variables are not accessible from other classes.
