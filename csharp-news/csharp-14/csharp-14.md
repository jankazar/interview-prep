# C# 14 Study Guide

C# 14 shipped in November 2025 with .NET 10 / Visual Studio 2026 (and the .NET 10 SDK). **C# 14 is the default language version for .NET 10 only.** The features are mostly compiler-level, so with the .NET 10 SDK you can set `<LangVersion>14</LangVersion>` on older target frameworks and most of them work (extension members, `field`, null-conditional assignment, lambda modifiers, `nameof` with unbound generics, partial constructors/events, user-defined compound assignment). The exception is first-class span support: the compiler change works everywhere, but the benefit depends on which `MemoryExtensions`/BCL overloads exist on your target.

## Table of Contents

1. [Overview of new features](#1-overview-of-new-features)
2. [Extension members](#2-extension-members)
3. [The `field` keyword (field-backed properties)](#3-the-field-keyword-field-backed-properties)
4. [Null-conditional assignment](#4-null-conditional-assignment)
5. [First-class `Span<T>` and `ReadOnlySpan<T>` (implicit conversions)](#5-first-class-spant-and-readonlyspant-implicit-conversions)
6. [User-defined compound assignment operators](#6-user-defined-compound-assignment-operators)
7. [Simple lambda parameters with modifiers](#7-simple-lambda-parameters-with-modifiers)
8. [`nameof` with unbound generic types](#8-nameof-with-unbound-generic-types)
9. [Partial constructors and partial events](#9-partial-constructors-and-partial-events)
10. [Quick interview cheat sheet](#10-quick-interview-cheat-sheet)

---

## 1. Overview of new features

| Feature | Purpose | Runtime requirement |
|---|---|---|
| Extension members | Extension properties, static extension members, extension operators via `extension` blocks | None (compiler); .NET 10 SDK |
| `field` keyword | Access the compiler-generated backing field in a property accessor | None |
| Null-conditional assignment | `a?.B = value`, `a?.B += value` | None |
| First-class spans | Implicit conversions array ⇄ `Span<T>` ⇄ `ReadOnlySpan<T>`, `string` → `ReadOnlySpan<char>`; works with extension receivers and generic inference | None for the compiler; span overloads come from the BCL (.NET 10 adds more) |
| User-defined compound assignment | Overload `+=`, `-=`, `++` ... as in-place `void` instance operators | None |
| Lambda parameter modifiers | `(text, out result) => ...` without parameter types | None |
| `nameof` unbound generics | `nameof(List<>)` | None |
| Partial constructors and events | Source generators can implement constructors and events | None |

---

## 2. Extension members

### 2.1 The problem
Extension methods (C# 3) were the only kind of extension. You could not add an extension **property**, a **static** member to a type you do not own, or an **operator**. Workarounds were `GetX()` methods, helper static classes, or wrappers.

### 2.2 The idea
A new `extension` block, declared inside a non-generic, non-nested `static class`, declares a **receiver** and then the members that extend it. The receiver parameter is written once for the whole block.

```csharp
public static class StringExtensions
{
    // Instance extension members: the receiver is a value named "s"
    extension(string s)
    {
        public bool IsNullOrEmpty => string.IsNullOrEmpty(s);          // extension property
        public int WordCount() => s.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length;
    }

    // Static extension members: receiver has only a type, no name
    extension(string)
    {
        public static string Join(string a, string b) => a + " " + b;  // string.Join(a, b)-style
    }
}

// Usage
var text = "hello world";
bool empty = text.IsNullOrEmpty;     // property syntax
string s = string.Join("a", "b");    // static extension (see "Rules": real members win overload resolution)
```

Generic receivers put the type parameters on the block:

```csharp
public static class EnumerableExtensions
{
    extension<T>(IEnumerable<T> source)
    {
        public bool IsEmpty => !source.Any();
        public IEnumerable<T> WhereNotNull() => source.Where(x => x is not null);
    }

    extension<T>(IEnumerable<T>) where T : IAdditionOperators<T, T, T>
    {
        // static extension operator
        public static IEnumerable<T> operator +(IEnumerable<T> left, IEnumerable<T> right)
            => left.Concat(right);
    }
}
```

### 2.3 Comparison with C# 13

```csharp
// C# 13 – only instance methods; a "property" had to be a method
public static class StringExtensions
{
    public static bool IsNullOrEmpty(this string s) => string.IsNullOrEmpty(s);
    // No way to write: public static bool IsNullOrEmpty(this string s) { get; }
    // No way to add a static member to string or an operator to IEnumerable<T>
}

var empty = text.IsNullOrEmpty();   // call syntax
```

```csharp
// C# 14 – property syntax and static members
public static class StringExtensions
{
    extension(string s)
    {
        public bool IsNullOrEmpty => string.IsNullOrEmpty(s);
    }
}

var empty = text.IsNullOrEmpty;     // property syntax
```

| | C# 13 | C# 14 |
|---|---|---|
| Extension methods | Yes (`this` parameter) | Yes, still supported; `extension` block alternative |
| Extension properties | No | Yes |
| Static extension members | No | Yes (`extension(Type)`) |
| Extension operators | No | Yes (static operators) |
| Receiver written | On every method | Once per block |
| Instance state / fields | n/a | Not allowed (only computed members) |

### 2.4 Rules & behaviour
- Both styles can live in the same static class; old `this` methods are **not** deprecated and stay source- and binary-compatible. Migrating a method from `this` form to a block form does not break callers.
- Extension members cannot add state: no instance fields and no auto-properties (they need a backing field); properties must have explicit accessors/expression bodies.
- Receiver modifiers are allowed on the receiver parameter: `ref`, `ref readonly`, `in` (useful for extending value types without copying or for mutating a struct via `ref`).
- **Real members always win.** If the type already has a member with the same signature, the extension is never picked; an extension cannot override or shadow an instance member.
- Static extension members are called on the type name (`string.Something`), instance ones on the value.
- Compiles into static methods plus metadata describing the block; old-style `this` methods compile as before.

### 2.5 Best practices & pitfalls
- Use extension properties for cheap, side-effect-free, property-like values (`IsEmpty`, `Count`-like). Do not hide expensive work (e.g. enumerating a sequence each access) behind property syntax; that surprises callers. `IEnumerable<T>.IsEmpty` above enumerates on each read.
- Keep extension members discoverable: the namespace of the static class must be imported (same rule as extension methods).
- Prefer migrating gradually; there is no need to rewrite existing extension methods.
- Static extension operators are scoped to where the extension is in scope and never replace operators defined on the type itself.

### 2.6 Real-world use
- Adding `IsEmpty` / `HasValue`-style properties to `IEnumerable<T>`, `string`, `HttpRequest`.
- Adding factory-like static members to types you do not own (`Result.Empty`-style helpers).
- Library authors can offer fluent, property-like APIs on `IServiceCollection`, `ClaimsPrincipal`, etc.

---

## 3. The `field` keyword (field-backed properties)

### 3.1 The problem
You want a **bit of logic** in one accessor (validation, normalising, change notification) but otherwise an auto-property. Before C# 14, using any accessor body forced you to declare the backing field yourself and write both accessors.

### 3.2 The idea
Inside a property accessor, `field` refers to the compiler-synthesised backing field. You can add logic to one or both accessors and keep the other as auto-implemented.

```csharp
public class Person
{
    // set has logic, get is auto – the compiler generates the backing field
    public string Name
    {
        get;
        set => field = value?.Trim() ?? throw new ArgumentNullException(nameof(value));
    }

    // get-only with lazy default; field with an initializer
    public string Title
    {
        get => field ?? "(none)";
        set;
    } = "Mr";

    // Change notification
    public int Age
    {
        get;
        set
        {
            if (field == value) return;
            field = value;
            OnPropertyChanged();
        }
    }

    private void OnPropertyChanged() { /* raise event */ }
}
```

### 3.3 Comparison with C# 13

```csharp
// C# 13 – need an explicit field and both accessors even for one line of logic
public class Person
{
    private string _name;

    public string Name
    {
        get => _name;
        set => _name = value?.Trim() ?? throw new ArgumentNullException(nameof(value));
    }
}
```

```csharp
// C# 14 – field keyword removes the boilerplate and keeps the field private to the accessors
public class Person
{
    public string Name
    {
        get;
        set => field = value?.Trim() ?? throw new ArgumentNullException(nameof(value));
    }
}
```

| | C# 13 | C# 14 |
|---|---|---|
| Logic in one accessor | Needs explicit backing field + both accessors | Other accessor stays auto |
| Field visible to other members | Yes (class scope) – can be bypassed | No – only the accessors can touch `field` |
| Property initializer with logic | Needs a field initializer | `{ get; set => ...; } = value;` |

### 3.4 Rules & behaviour
- `field` is a contextual keyword, valid only inside accessors of a property (and indexers are not supported: they have no auto-implemented form).
- It is scoped to that property; other members cannot reach it. Serialisers/reflection still see a normal private compiler-generated field.
- **Breaking-change risk**: if your class already has a member (or local) named `field`, inside the accessor `field` now means the keyword and the compiler warns. Disambiguate with `@field` or `this.field`.
- The property needs at least one accessor without a body, or one accessor that uses `field`, so the compiler knows to synthesise the field. A property whose accessors do not use `field` and both have bodies behaves as before.
- Auto-property initializers work with `field` properties.
- `field` could not be applied to an `init`-less read-only logic with no setter and no initializer (the backing field would never be assigned); use the initializer syntax.

### 3.5 Best practices & pitfalls
- Use for validation, trimming, null-coalescing, `INotifyPropertyChanged`; keep accessor bodies short.
- If you need the field outside the accessors (e.g. two properties sharing it), keep a classic explicit field.
- Rename any existing identifiers called `field` before upgrading, or accept the warning and use `@field`.
- With `required`/`init` members, `field` works the same way in the `init` accessor.

### 3.6 Real-world use
- DTOs and view-models with `INotifyPropertyChanged` boilerplate.
- EF Core entities that need a normalised property while EF maps the generated field (check mapping if you configure field access by name; the generated name is not stable).

---

## 4. Null-conditional assignment

### 4.1 The problem
`?.` and `?[]` worked only for **reading**. To assign to a member of a possibly-null object you needed an `if`.

### 4.2 The idea
The left-hand side of an assignment or compound assignment may use `?.` or `?[]`. If the receiver is `null`, the assignment is skipped **and the right-hand side is not evaluated**.

```csharp
customer?.Name = "Anna";          // assigned only if customer != null
customer?.Orders[0] = order;      // indexer on a non-null chain
settings?.RetryCount += 1;        // compound assignment
handlers?[key] = handler;         // null-conditional indexer assignment
```

### 4.3 Comparison with C# 13

```csharp
// C# 13 – explicit null check around every write
if (customer is not null)
{
    customer.Name = GetNewName();
}

// error CS0131 in C# 13: "The left-hand side of an assignment must be a variable, property or indexer"
// customer?.Name = GetNewName();
```

```csharp
// C# 14 – GetNewName() is NOT called when customer is null
customer?.Name = GetNewName();
```

| | C# 13 | C# 14 |
|---|---|---|
| Null-safe read | `a?.B` | `a?.B` |
| Null-safe write | `if (a != null) a.B = x;` | `a?.B = x;` |
| RHS evaluated when `a` is null | n/a | No (short-circuit) |
| `++` / `--` | n/a | Not allowed on a null-conditional |

### 4.4 Rules & behaviour
- Allowed: `=`, and compound assignments (`+=`, `-=`, `??=` etc.). **Not allowed**: `++` and `--` on a null-conditional access.
- The right-hand side is evaluated only if the receiver is non-null (a side-effect trap if you rely on it running).
- The whole expression has no value usable as a result in the null case; use it as a statement.
- It does not make `null` references safe in the rest of the chain: only the points marked `?` are checked.

### 4.5 Best practices & pitfalls
- Do not rely on side effects in the RHS (counters, logging, `Next()` calls); they silently disappear when the receiver is null.
- It hides "nothing happened" cases, so use it when skipping is the intended semantics, not when null would be a bug (then throw).
- Nullable reference type analysis understands it: after `x?.Prop = value` the compiler does not assume `x` is non-null.

---

## 5. First-class `Span<T>` and `ReadOnlySpan<T>` (implicit conversions)

### 5.1 The problem
`Span<T>` and `ReadOnlySpan<T>` are central to allocation-free code, but they were second-class citizens in the language: extension methods and generic type inference often failed because arrays and strings needed an explicit conversion (`.AsSpan()`) or user-defined conversions that the compiler did not consider in all positions.

### 5.2 The idea
The language recognises built-in **implicit span conversions**:

| From | To |
|---|---|
| `T[]` | `Span<T>`, `ReadOnlySpan<T>` |
| `Span<T>` | `ReadOnlySpan<T>` |
| `ReadOnlySpan<T>` | `ReadOnlySpan<T>` (identity-like, e.g. variance forms) |
| `string` | `ReadOnlySpan<char>` |

These conversions participate in **extension-method receiver binding**, generic type inference, and overload resolution (better-conversion rules favour span targets).

```csharp
// Extension method declared on ReadOnlySpan<char>
public static class SpanExt
{
    public static bool HasDigits(this ReadOnlySpan<char> s)
    {
        foreach (var c in s) if (char.IsDigit(c)) return true;
        return false;
    }
}

string text = "abc123";
bool b = text.HasDigits();   // string -> ReadOnlySpan<char> as an extension receiver
```

### 5.3 Comparison with C# 13

```csharp
// C# 13 – explicit conversion needed; string is not a valid receiver for ReadOnlySpan<char> extensions
bool b = text.AsSpan().HasDigits();

// Generic inference also failed
static void Print<T>(ReadOnlySpan<T> items) { /* ... */ }
var arr = new[] { 1, 2, 3 };
// Print(arr);              // error CS0411 in C# 13: type arguments cannot be inferred from the usage
Print<int>(arr);            // compiled: explicit type argument -> user-defined/implicit array conversion
```

```csharp
// C# 14 – natural usage
bool b = text.HasDigits();
Print(arr);                 // T inferred from int[] -> ReadOnlySpan<int>
```

| | C# 13 | C# 14 |
|---|---|---|
| Array/string as span extension receiver | Explicit `.AsSpan()` | Implicit |
| Generic inference through array → span | Often fails | Works |
| Conversion kind | Library-defined implicit operators on `Span<T>` | Built-in language conversions |
| Overload preference | Array/`IEnumerable<T>` overloads often chosen | Span overloads preferred (better conversion) |

### 5.4 Rules & behaviour
- This is a compiler/language change; no new runtime types. Which overloads exist is a library question: .NET 10 adds more `ReadOnlySpan<T>`/`Span<T>` overloads.
- Span conversions are **views** over the same memory; they never copy. Writing through a `Span<T>` made from an array changes the array.
- `ReadOnlySpan<T>` over a `string` cannot be mutated.
- Spans remain `ref struct`s: no boxing, no fields in classes, no capturing in lambdas across `await`, etc.

### 5.5 Best practices & pitfalls
- **Overload resolution changes can silently pick a different method.** A known example: `array.Reverse()` with `using System.Linq;` could bind to an in-place `MemoryExtensions.Reverse(Span<T>)` instead of the LINQ `Reverse()`, changing semantics from a lazy copy to in-place mutation. Library fixes exist in newer SDKs, but this is a source-breaking class of change to watch for when upgrading; verify with tests.
- Prefer `ReadOnlySpan<T>` for parameters that only read.
- If you want the old behaviour, call the intended method explicitly (`Enumerable.Reverse(arr)`).

### 5.6 Real-world use
- Parsing/formatting code (`ReadOnlySpan<char>` APIs called directly on strings).
- Hot paths in ASP.NET Core, serialisers, and protocol parsers.

---

## 6. User-defined compound assignment operators

### 6.1 The problem
`a += b` was always translated to `a = a + b`. For large types (matrices, big numbers, buffers) that creates a **new** object each time, even if you only wanted to mutate `a` in place.

### 6.2 The idea
You can define compound operators (`+=`, `-=`, `*=`, `/=`, `%=`, `&=`, `|=`, `^=`, `<<=`, `>>=`, `>>>=`) and increment/decrement (`++`, `--`) as **public instance `void` operators** that mutate `this`.

```csharp
public class Matrix
{
    private readonly double[] _data;
    public Matrix(double[] data) => _data = data;

    // Binary operator – allocates a new Matrix
    public static Matrix operator +(Matrix a, Matrix b)
    {
        var r = new double[a._data.Length];
        for (var i = 0; i < r.Length; i++) r[i] = a._data[i] + b._data[i];
        return new Matrix(r);
    }

    // Compound assignment – mutates in place, no allocation
    public void operator +=(Matrix other)
    {
        for (var i = 0; i < _data.Length; i++) _data[i] += other._data[i];
    }
}

var m = new Matrix(new double[] { 1, 2 });
m += new Matrix(new double[] { 3, 4 });   // calls the instance operator, no new Matrix
```

### 6.3 Comparison with C# 13

```csharp
// C# 13 – m += x always means m = m + x; the + operator allocates a new Matrix every time
m += other;                // m = m + other  (allocation)

// No way to declare: public void operator +=(Matrix other)
```

```csharp
// C# 14 – += is in-place when the type defines it
m += other;                // m.op_AdditionAssignment(other)  (no allocation)
```

| | C# 13 | C# 14 |
|---|---|---|
| `x += y` meaning | `x = x + y` | In-place `x.+=(y)` if defined, else `x = x + y` |
| Allocation for large types | One new object per `+=` | None if operator is in place |
| Operator form | `static` with return value | `public` instance `void` |

### 6.4 Rules & behaviour
- The operator must be an **instance** member, return `void`, and not be `static`.
- If you do not define the compound operator, the compiler falls back to `x = x + y` (using the binary operator).
- There are `checked` variants (`operator checked +=`) just like for binary operators.
- You can define compound operators without the matching binary one, but the in-place semantics must be consistent with it.
- For **value types** (structs) mutation of a copy is visible only through the variable the operator is applied on; remember struct copy semantics.

### 6.5 Best practices & pitfalls
- Keep `a += b` and `a = a + b` semantically equivalent, otherwise users are surprised.
- Beware of **aliasing**: when `a` and `b` are the same instance (`a += a`), an in-place implementation must still produce correct results.
- Mutating a shared reference changes it for every holder; for reference types in-place `+=` is observable by other references, unlike `a = a + b` which rebinds only `a`.
- Use for performance-sensitive numeric/buffer/collection types; do not use for immutable types (use binary operators).

---

## 7. Simple lambda parameters with modifiers

### 7.1 The problem
To use `ref`, `out`, `in`, `ref readonly` or `scoped` on a lambda parameter you had to write the **type** of every parameter, even when the delegate type made it obvious.

### 7.2 The idea
Modifiers can be used without declaring types when the target delegate type provides them.

```csharp
delegate bool TryParse<T>(string text, out T result);

TryParse<int> parse = (text, out result) => int.TryParse(text, out result);
```

### 7.3 Comparison with C# 13

```csharp
// C# 13 – explicit types required as soon as a modifier is used
TryParse<int> parse = (string text, out int result) => int.TryParse(text, out result);

// error CS8100 in C# 13: "Parameter modifiers require explicit types" (types cannot be omitted with out/ref/in)
// TryParse<int> p = (text, out result) => int.TryParse(text, out result);
```

```csharp
// C# 14 – types inferred from the delegate
TryParse<int> parse = (text, out result) => int.TryParse(text, out result);
```

| | C# 13 | C# 14 |
|---|---|---|
| `(text, out result) => ...` | Not allowed | Allowed |
| Modifiers supported without types | none | `ref`, `out`, `in`, `ref readonly`, `scoped` |
| `params` | Needs explicit type | Still needs explicit type |

### 7.4 Rules & behaviour
- Requires a target delegate type that supplies the parameter types and modifiers (target-typed context); `var f = (out x) => ...` does not infer a natural type.
- Purely syntactic; the same IL as the explicit-type form.
- `params` is not part of this relaxation: a lambda with `params` still needs its types spelled out.

### 7.5 Best practices & pitfalls
- Use when you implement `TryXxx`-style delegates; keep explicit types when it helps readability.
- The modifier must match the delegate's parameter modifier, otherwise a compile-time error.

---

## 8. `nameof` with unbound generic types

### 8.1 The problem
`nameof(List<T>)` required supplying type arguments even though the name does not depend on them.

### 8.2 The idea
`nameof` accepts an unbound generic type with empty angle brackets.

```csharp
string n = nameof(List<>);            // "List"
string d = nameof(Dictionary<,>);     // "Dictionary"
```

### 8.3 Comparison with C# 13

```csharp
// C# 13 – had to pick arbitrary type arguments
string n = nameof(List<int>);         // "List" – arbitrary int to satisfy the compiler

// error in C# 13: nameof(List<>) is not valid (type argument expected)
```

```csharp
// C# 14
string n = nameof(List<>);            // "List"
```

### 8.4 Rules & behaviour
- Result is the simple name without type arguments (`"List"`, not ``"List`1"``).
- Compile-time constant, no runtime cost.
- Constraints are not checked on unbound arguments.

### 8.5 Best practices
- Use in log messages, `Type`-based registration diagnostics, and attributes where the generic arity is irrelevant.

---

## 9. Partial constructors and partial events

### 9.1 The problem
Partial methods and properties let source generators supply implementations, but **constructors** and **events** could not be split. Generators needed workarounds (extra `Initialize()` methods, hand-written event plumbing).

### 9.2 The idea
Constructors and events can be declared `partial`, with one **defining** declaration (the signature) and one **implementing** declaration (the body).

```csharp
// Hand-written file – defining declarations
public partial class Widget
{
    public partial Widget(string name);        // defining declaration, no body
    public partial event EventHandler Changed; // field-like, no accessors
}

// Generator-produced file – implementing declarations
public partial class Widget
{
    private EventHandler _changed;

    public partial Widget(string name)
    {
        Name = name;
    }

    public partial event EventHandler Changed
    {
        add => _changed += value;
        remove => _changed -= value;
    }
}
```

### 9.3 Comparison with C# 13

```csharp
// C# 13 – only partial methods (and partial properties/indexers) existed
public partial class Widget
{
    public Widget(string name)
    {
        Name = name;
        Initialize();            // generator workaround: call a partial method from a real ctor
    }

    partial void Initialize();   // implemented by the generator
}
// error in C# 13: "partial" modifier is not valid on a constructor or an event
```

```csharp
// C# 14 – the generator can own the whole constructor/event
public partial Widget(string name);
```

| | C# 13 | C# 14 |
|---|---|---|
| Partial methods | Yes | Yes |
| Partial properties/indexers | Yes | Yes |
| Partial constructors | No | Yes |
| Partial events | No | Yes |

### 9.4 Rules & behaviour
- Exactly one defining and one implementing declaration; signatures must match.
- Only the implementing constructor declaration may include an initializer (`: this(...)`/`: base(...)`) and, if used, primary-constructor syntax can appear on only one part.
- A defining partial event is field-like; the implementing declaration provides `add`/`remove`.
- Primarily a feature for **source generators** (`[GeneratedRegex]`-style, `LibraryImport`-style patterns).

### 9.5 Best practices & pitfalls
- Application developers rarely write these by hand; know them as generator enablers.
- A missing implementation is a compile error (unlike `partial void` without an implementation, which is removed).

---

## 10. Quick interview cheat sheet

### Likely questions and concise answers

**What are extension members in C# 14?**
A new `extension(Receiver r) { ... }` block, inside a static class, that lets you declare extension *properties*, static members and operators, in addition to methods. Old `this`-parameter extension methods still work.

**Can an extension property have its own state?**
No. Extension members cannot add fields or auto-properties; they can only compute from the receiver.

**What if an extension has the same name as a real member?**
The real instance member wins; extensions never override or shadow existing members.

**What does the `field` keyword do?**
Inside a property accessor it refers to the compiler-generated backing field, so you can add logic to one accessor and leave the other auto-implemented.

**What happens if my class already has a member called `field`?**
In an accessor `field` now means the keyword; the compiler warns. Use `@field` or `this.field` to refer to your member.

**What is null-conditional assignment?**
`a?.B = value` assigns only if `a` is non-null, and the right-hand side is not evaluated when `a` is null. Compound assignments work, `++`/`--` do not.

**What are first-class spans?**
Built-in implicit conversions between arrays, `Span<T>`, `ReadOnlySpan<T>` and `string` → `ReadOnlySpan<char>`, which also apply to extension receivers and generic inference, so span-based APIs are chosen more naturally.

**Difference between `+` and `+=` as user-defined operators in C# 14?**
`+` is static and returns a new value. `+=` can now be an instance `void` operator that mutates in place and avoids allocation; if it is not defined, `a += b` falls back to `a = a + b`.

**How did lambda parameters change?**
Modifiers (`ref`, `out`, `in`, `ref readonly`, `scoped`) can be used without explicit types: `(text, out result) => ...`.

**What does `nameof(List<>)` return?**
`"List"`, a compile-time constant; unbound generic types are now allowed.

**What are partial constructors and events for?**
They let source generators implement constructors and events through a defining and an implementing declaration.

**What needs runtime support?**
Almost nothing: these are compiler features and need the .NET 10 SDK (C# 14 is default only for .NET 10 targets). Span overload benefits depend on BCL overloads present in .NET 10.

**Difference between C# 13 `Lock`-era `params` span and C# 14 first-class spans?**
`params` span (C# 13) is about the parameter declaration; C# 14 adds the implicit conversions that make calling and binding span APIs work naturally.

### Common traps

- Extension properties cannot hold state; also they look like cheap fields but can do expensive work.
- Real members beat extension members, even if the extension is "better".
- Existing identifiers named `field` change meaning inside property accessors (warning, not error).
- `a?.B = Foo()`: `Foo()` is skipped when `a` is null; `a?.Count++` is not allowed.
- Implicit span conversions can change which overload is chosen after upgrading (for example `Reverse` on arrays with LINQ imported); span views alias the original memory.
- In-place `+=` on reference types is visible through every reference; aliasing (`a += a`) must be handled.
- Compound assignment operators must be instance `void` operators, not static.
- `params` lambda parameters still need explicit types.
- `nameof(List<>)` gives `"List"`, not ``"List`1"``.
- A partial constructor/event without an implementing declaration is a compile error.
