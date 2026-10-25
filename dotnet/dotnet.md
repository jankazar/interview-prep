# .NET Interview Questions

Source: [.NET Interview Questions and Answers (With Code Examples)](https://zerotomastery.io/blog/dot-NET-interview-questions/)

## Beginner .NET Interview Questions

### 1. What is .NET, and how does it work?

.NET is a cross-platform framework developed by Microsoft for building web, desktop, mobile, and cloud applications. It supports multiple programming languages, including C#, F#, and VB.NET, and provides a managed runtime environment for executing applications.

Instead of compiling code directly into machine instructions, .NET applications first compile into Common Intermediate Language (CIL). The Common Language Runtime (CLR) then translates CIL into machine code at runtime, allowing cross-platform execution.

**Key components of .NET include:**

* **CLR (Common Language Runtime)**. This executes .NET applications and manages memory, security, and performance
* **Base Class Library (BCL)**. This is a collection of reusable libraries for file handling, collections, and more
* **JIT (Just-In-Time) Compiler.** This converts CIL into optimized machine code at runtime

**Why do interviewers ask this?**

Interviewers want to see if you understand the architecture of .NET, how it differs from traditional compiled languages, and how the CLR enables cross-platform execution.

### 2. What is the CLR, and why is it important?

The Common Language Runtime (CLR) is the execution environment for .NET applications. It provides **automatic memory management, security, and performance optimizations**, making applications more reliable and efficient.

How it works:

* Code written in C# or another .NET language compiles into Common Intermediate Language (CIL)
* The Just-In-Time (JIT) compiler translates CIL into machine code at runtime
* The Garbage Collector (GC) automatically manages memory by reclaiming unused objects
* The CLR enforces security policies and prevents unauthorized memory access

**Why do interviewers ask this?**

Since the CLR is the core of the .NET runtime, interviewers want to see if you understand how .NET applications execute and how features like JIT compilation and garbage collection improve performance.

### 3. What are the differences between .NET Framework, .NET Core, and modern .NET?

.NET has evolved significantly over time, moving from a Windows-only framework to a modern, unified, cross-platform platform.

Key differences:

* **.NET Framework** is the original implementation of .NET and is tightly coupled to Windows. It’s commonly used for legacy desktop applications such as WinForms and WPF, as well as older ASP.NET applications. While it’s still supported, it no longer receives major feature updates and is mainly maintained for existing systems
* **.NET Core** was introduced to address the limitations of .NET Framework. It brought cross-platform support, better performance, and a modular architecture designed for cloud, containers, and microservices. .NET Core was a major turning point, but it is no longer developed under that name
* **Modern .NET** represents the unification of the platform. Starting with .NET 5, Microsoft merged .NET Core and .NET Framework into a single platform simply called .NET. This supports web, desktop, mobile, cloud, and AI workloads under one framework.
* **.NET 10** is the current long-term support (LTS) release, while **.NET 9** is the previous standard-term support (STS) release. Microsoft ships a new major .NET version every November, alternating between LTS and STS releases

In real-world development, new applications are built using modern .NET, while .NET Framework is primarily used to maintain older Windows-only systems.

**Why do interviewers ask this?**

Interviewers ask this question to assess whether you understand the evolution of .NET and can distinguish between legacy and modern approaches. It helps them gauge whether you can maintain existing applications while also making informed decisions when building or modernizing systems using today’s unified .NET platform.

### 4. What is CIL (Common Intermediate Language)?

When you compile C# code, it doesn’t turn into machine code directly. Instead, it compiles into Common Intermediate Language (CIL), which is then executed by the CLR.

CIL enables:

* **Cross-platform compatibility**. This means that code written in any .NET language can run on different operating systems via the CLR
* **Language interoperability**. Since all .NET languages compile to CIL, C#, F#, and VB.NET can interact seamlessly

**Why do interviewers ask this?**

Understanding CIL shows that you grasp how .NET code executes and why .NET applications are cross-platform and language-agnostic.

### 5. What is the difference between managed and unmanaged code?

In .NET, code can be **managed** or **unmanaged**, depending on whether it runs inside the Common Language Runtime (CLR).

The difference comes down to how memory is managed and how safely the code executes.

**Managed code**

When you write C# code, it runs inside the CLR, which takes care of memory management, security, and exception handling for you. You don’t have to worry about allocating and freeing memory manually, and the CLR ensures your application doesn’t access memory it shouldn’t.

This makes managed code safer and more stable.

**For example**

If you create an object in C#: `Person p = new Person();`

The CLR will automatically free up memory when `p` is no longer needed, thanks to the garbage collector. This prevents memory leaks and other issues that often plague low-level languages.

**Unmanaged code**

Unmanaged code runs outside the CLR, meaning it doesn’t get these safety features. Instead, the developer is responsible for managing memory manually.

This can make it more efficient in some cases, but it also means there’s a greater risk of memory leaks, security vulnerabilities, and crashes if something goes wrong.

Languages like C and C++ generate unmanaged code, and even in .NET, you might encounter it when working with:

* **System APIs** that require direct access to hardware or OS-level functions
* **Performance-critical applications** where manual memory management is more efficient
* **Legacy codebases** that were originally written in C or C++

This means that to work with unmanaged code in .NET, you’ll often use:

* **P/Invoke (Platform Invocation Services)**. This allows C# to call native C/C++ functions
* **COM Interop.** This enables communication between .NET and older Windows applications

**Why does this matter?**

Most of the time, as a C# developer, you’ll be working with managed code - and that’s a good thing. It saves time, prevents memory issues, and keeps applications secure.

However, understanding unmanaged code is useful when you need to integrate with older systems, optimize performance, or interact with low-level system components

**Why do interviewers ask this?**

Interviewers want to see if you:

* Understand how the CLR manages memory and execution
* Know the risks and benefits of using unmanaged code
* Are familiar with P/Invoke and COM Interop, even if you don’t use them daily

### 6. What is garbage collection in .NET, and how does it work?

Managing memory efficiently is one of the biggest challenges in programming.

In languages like C++, developers must manually allocate and free memory, which can lead to memory leaks, security issues, and crashes if done incorrectly. .NET solves this problem with garbage collection (GC), which automatically frees memory used by objects that are no longer needed.

This makes applications more reliable and easier to manage, but it also means developers need to understand how garbage collection works to avoid performance issues.

**How garbage collection works**

The Common Language Runtime (CLR) includes a Garbage Collector (GC) that runs automatically when needed. It follows a three-step process:

1. **Marking.** The GC scans memory to identify which objects are still in use
2. **Sweeping.** It removes objects that are no longer needed, freeing up memory
3. **Compacting.** It reorganizes memory to prevent fragmentation and improve efficiency

This process happens without developer intervention, which reduces the chances of memory leaks but also means developers don’t have direct control over when garbage collection occurs.

**Does garbage collection affect performance?**

Yes, while garbage collection helps prevent memory issues, **it can temporarily pause execution when it runs**. If too many objects are created and discarded frequently, GC cycles can slow down application performance.

To optimize memory usage and reduce the impact of GC:

* **Avoid unnecessary object creation** as reusing objects can reduce memory allocations
* **Use structs instead of classes** for lightweight data types, since structs are stored on the stack instead of the heap
* **Minimize large object allocations,** as large objects trigger special GC behavior

In performance-critical applications, .NET provides tools like `GC.Collect()` , `Span<T>`, and `Memory<T>` to fine-tune memory management, but these should only be used when absolutely necessary.

**Why do interviewers ask this?**

Memory management is crucial for scalability and performance. Interviewers ask this question to see if you:

* Understand how .NET prevents memory leaks
* Know how garbage collection can impact application performance
* Can write efficient code that minimizes unnecessary memory allocations

### 7. What are value types and reference types in C#?

In C#, data is stored in memory as either **value types** or **reference types**, which affects performance and behavior when passing variables.

**Value types**

* Store their actual data directly in memory
* When assigned to a new variable, a copy of the value is made
* Modifying one variable does not affect the original

Common value types include:

Primitive types like `int`, `float`, `char`, and `bool`, Structs (`struct`) which are custom value types for lightweight objects, and Enums (`enum`) which are used for defining named constants.

**For example**

```csharp
int a = 10;
int b = a; // A copy of 'a' is stored in 'b'

b = 20;
Console.WriteLine(a); // Output: 10 (a remains unchanged)
```

**Reference types**

* Store a **reference (memory address)** to the actual data instead of storing the value directly
* When assigned to a new variable, both variables point to the same memory location, meaning changes to one object affect the other

Common reference types include:

Classes (`class`) which are used for complex objects, Arrays (`int[]`, `string[]`, etc.) which are collections of values, and Delegates and Interfaces. (Which are also stored as references).

**For example**

```csharp
class Person
{
    public string Name;
}

Person p1 = new Person();
p1.Name = "Alice";

Person p2 = p1; // Both 'p1' and 'p2' reference the same object in memory

p2.Name = "Bob";
Console.WriteLine(p1.Name); // Output: Bob (p1 is affected)
```

**Why do interviewers ask this?**

Choosing value types vs. reference types affects performance, memory usage, and how data behaves when passed around in code.

Interviewers ask this question to see if you understand how C# manages memory and how to avoid unintended side effects when modifying objects.

### 8. What are records in C#, and how do they differ from classes and structs?

Records are a special type that are designed for storing immutable data. Unlike classes, which are typically used for objects with behaviour and mutable state, records are optimised for representing data that shouldn't change after creation.

By default, records use value-based equality, meaning two record instances with the same data are considered equal, even if they are different objects in memory.

**For example**

```csharp
public record Person(string Name, int Age);

Person p1 = new Person("Alice", 30);
Person p2 = new Person("Alice", 30);

Console.WriteLine(p1 == p2); // Output: True
```

With a class, this comparison would return False because classes use reference-based equality by default.

Handy right?

Records also support a with expression for creating modified copies without changing the original:

```csharp
var updated = p1 with { Age = 31 };
Console.WriteLine(p1.Age);      // Output: 30 (unchanged)
Console.WriteLine(updated.Age); // Output: 31
```

This makes records particularly useful for DTOs (Data Transfer Objects), API responses, and domain value objects where immutability is important.

**How do records, classes, and structs compare?**

Each type serves a different purpose in C#, and choosing the right one depends on whether you need mutability, value equality, or lightweight data storage.

* A **class** is a reference type stored on the heap. It uses reference-based equality by default and is best for complex objects with behaviour and mutable state
* A **struct** is a value type stored on the stack. It uses value-based equality and is best for small, lightweight data that doesn't need inheritance
* A **record** is a reference type like a class, but uses value-based equality by default. It is designed for immutable data models where two instances with the same data should be considered equal

|  | **Equality** | **Mutability** | **Stored on** | **Best for** |
| --- | --- | --- | --- | --- |
| **Record** | Value-based | Immutable by default | Heap | Immutable data models |
| **Class** | Reference-based | Mutable | Heap | Complex objects with behaviour |
| **Struct** | Value-based | Mutable | Stack | Small, lightweight data |

**Why do interviewers ask this?**

Records are now a staple of modern C# development. Interviewers want to see if you understand what they are, when to use them, and how they differ from classes and structs — so you can make the right choice based on your specific use case.

### 9. What is the difference between an interface and an abstract class?

In C#, both **interfaces** and **abstract classes** are used to define reusable code structures, but they serve different purposes. Understanding their differences is key to designing flexible, maintainable applications.

**Interface**

* Defines a contract that a class must follow
* Only contains method signatures (no implementations)
* A class can implement multiple interfaces

**For example**

```csharp
interface IAnimal
{
    void MakeSound(); // No implementation
}

class Dog : IAnimal
{
    public void MakeSound()
    {
        Console.WriteLine("Bark!");
    }
}
```

Here, `Dog` implements `IAnimal`, ensuring it provides a `MakeSound()` method.

**Abstract class**

* Can have both **abstract methods** (without implementation) and **concrete methods (**with implementation)
* Allows related classes to **share code** while enforcing some common behavior
* A class can inherit only one abstract class

**For example**

```csharp
abstract class Animal
{
    public abstract void MakeSound(); // Must be implemented by subclasses

    public void Sleep()
    {
        Console.WriteLine("Sleeping...");
    }
}

class Dog : Animal
{
    public override void MakeSound()
    {
        Console.WriteLine("Bark!");
    }
}
```

Here, `Dog` inherits from `Animal`, implementing `MakeSound()` while inheriting `Sleep()`.

**Key differences**

| **Method** | **Interface** | **Abstract Class** |
| --- | --- | --- |
| Method implementation | No method implementations (except default methods in C# 8+) | Can have both abstract and concrete methods |
| Multiple inheritance | A class can implement multiple interfaces | A class can inherit only one abstract class |
| Fields and properties | Cannot contain fields or constructors | Can have fields, properties, and constructors |
| Use case | Defines a contract that multiple classes can follow | Provides a base class with shared behavior |

**When to use what?**

Use an interface when enforcing a contract across multiple unrelated classes (e.g., `IComparable`, `IDisposable`). Or use an abstract class when defining shared behavior for related classes (e.g., `Animal`, `Vehicle`).

**Why do interviewers ask this?**

Interviewers want to see if you understand **object-oriented programming** principles and how to design reusable, maintainable code. Knowing when to use an interface or an abstract class demonstrates fundamental architectural decision-making skills.

### 10. What is a delegate in C#, and how is it used?

A **delegate** in C# is a type that represents a reference to a method. It allows methods to be passed as arguments, making it a key feature for event handling, callbacks, and functional programming.

Think of it as a function pointer, but type-safe and object-oriented.

**How delegates work**

A delegate acts as a wrapper around a method, allowing you to store and invoke it dynamically. Instead of calling a method directly, you assign it to a delegate and call the delegate instead.

**For example**

```csharp
using System;

delegate void MessageDelegate(string message); // Declaring a delegate

class Program
{
    static void PrintMessage(string msg) // Method that matches the delegate signature
    {
        Console.WriteLine(msg);
    }

    static void Main()
    {
        MessageDelegate del = PrintMessage; // Assign method to delegate
        del("Hello, delegates!"); // Invoke the delegate
    }
}
```

**Output:**

```text
Hello, delegates!
```

Here, `MessageDelegate` is a delegate type that points to the `PrintMessage` method. When `del("Hello, delegates!")` is called, it internally calls `PrintMessage`.

**Multicast delegates (calling multiple methods)**

Delegates can also store multiple method references, meaning you can assign more than one method to the same delegate.

```csharp
void Method1(string msg) => Console.WriteLine("Method1: " + msg);
void Method2(string msg) => Console.WriteLine("Method2: " + msg);

MessageDelegate del = Method1;
del += Method2; // Adding another method

del("Hello!");
```

**Output:**

```text
Method1: Hello!
Method2: Hello!
```

Here, the delegate calls both methods in sequence.

**Func, Action, and Predicate Delegates**

C# also provides built-in generic delegates to make working with delegates easier:

`Func<T>` returns a value. For example: `Func<int, int, int> add = (x, y) => x + y`.

`Action<T>` takes parameters but returns void. For example: `Action<string> print = Console.WriteLine`

While `Predicate<T>` returns a `bool`. For example: `Predicate<int> isEven = x => x % 2 == 0`

**Why do interviewers ask this?**

Delegates are crucial in **event-driven programming** (e.g., UI event handling) and **functional programming** (e.g., passing behavior as parameters).

Interviewers want to see if you understand how method references work in C# and how they improve code flexibility.

### 11. What is the difference between async and await in C#?

Modern applications often need to perform long-running operations like API calls, database queries, or file I/O. If these tasks block execution, the application can freeze, making it unresponsive.

This is where `async` and `await` come in -

**What does async do?**

The `async` keyword tells C# that a method will contain asynchronous operations. However, marking a method `async` alone doesn’t make it run asynchronously. It simply allows the method to use `await` inside it.

**For example**

```csharp
public async Task<string> GetDataAsync()
{
    await Task.Delay(2000); // Simulating a delay (e.g., waiting for a web request)
    return "Data received";
}
```

This method returns a `Task<string>`, meaning it will complete in the future rather than immediately returning a value.

**What does await do?**

The `await` keyword is where the real magic happens. It pauses execution of the method until the awaited task completes, but without blocking the thread.

**For example**

```csharp
public async Task ShowData()
{
    string data = await GetDataAsync(); // Waits for the method to complete
    Console.WriteLine(data);
}
```

Without await, the method would continue executing immediately, likely leading to unintended behavior (such as trying to use data that hasn’t been retrieved yet).

**Key differences between async and await**

`async` marks a method as asynchronous but does not make it run in the background. While `await` pauses execution until the awaited task completes, keeping the application responsive.

**Why does this matter?**

Imagine writing an application that fetches weather data from an API. If the request takes three seconds and the application freezes during that time, the user might think it’s broken.

But by using `async` and `await`, you can fetch the data without blocking the UI thread, making for a much better experience.

**Why do interviewers ask this?**

Interviewers want to see if you understand how `async` and `await` work together.

They also want to see if you know how to use them **to prevent blocking operations,** and can write **responsive and efficient** C# applications.

## Intermediate .NET Interview Questions

### 12. What is dependency injection in .NET, and why is it used?

In a real-world application, classes often need to use other classes.

**For example**

An `OrderService` class might need a `PaymentService` to process payments. The question is though, who should be responsible for creating that dependency?

Well, if `OrderService` creates an instance of `PaymentService` inside its own code, it becomes tightly coupled, which means it's harder to replace, test, or modify in the future. This is where dependency injection (DI) comes in.

Dependency injection is a design pattern that provides dependencies from the outside, rather than letting a class create them itself.

This makes the system:

* **More flexible** – You can swap out implementations without modifying the class
* **Easier to test** – You can replace dependencies with mock versions in unit tests
* **Loosely coupled** – Classes depend on **interfaces** rather than concrete implementations

**For example**

Without dependency injection (tightly coupled)

```csharp
public class OrderService
{
    private PaymentService _paymentService = new PaymentService(); // Hardcoded dependency

    public void ProcessOrder()
    {
        _paymentService.ProcessPayment();
    }
}
```

Here, `OrderService` directly creates `PaymentService`, meaning if we ever want to change the way payments are processed, we’d have to modify `OrderService`. This tight coupling makes the application harder to maintain and test.

**For example**

With dependency injection (loosely coupled):

```csharp
public class OrderService
{
    private readonly IPaymentService _paymentService;

    public OrderService(IPaymentService paymentService) // Injecting dependency
    {
        _paymentService = paymentService;
    }

    public void ProcessOrder()
    {
        _paymentService.ProcessPayment();
    }
}
```

Now, `OrderService` doesn’t create `PaymentService` itself. Instead it receives it in the constructor from the outside. This makes it easy to switch to a different payment provider without modifying `OrderService`.

This is especially useful in large applications where dependencies might change over time. Instead of manually updating every class that creates instances of a dependency, DI allows dependencies to be configured in one place.

**How does ASP.NET Core handle DI?**

ASP.NET Core has built-in dependency injection, so you don’t have to manage dependencies manually. You simply register services in `Program.cs`:

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IPaymentService, PaymentService>(); // Registering dependency
var app = builder.Build();
```

Now, whenever `IPaymentService` is needed, .NET automatically provides an instance of `PaymentService`.

**Why do interviewers ask this?**

Interviewers want to see if you:

* Understand **why DI improves maintainability and testability**
* Know how to **implement DI using constructor injection**
* Are familiar with **how ASP.NET Core handles dependency injection**

Because most modern .NET applications rely on DI, knowing how to use it is a must-have skill for C# developers.

### 13. What are generics in C#?

In C#, we often write code that works with different data types. Without generics, we’d need to create separate methods or classes for each data type, leading to **code duplication** and **maintenance issues**.

Generics solve this by allowing us to write **reusable, type-safe code** that works with any data type.

**Why use generics?**

* **Code reusability** – One generic method/class can handle multiple data types
* **Type safety** – Prevents runtime errors by enforcing type checks at compile time
* **Performance** – Avoids boxing/unboxing, reducing memory overhead

**How do generics work?**

Instead of writing multiple versions of the same method for different types:

```csharp
public void Print(int value) { Console.WriteLine(value); }
public void Print(string value) { Console.WriteLine(value); }
```

We can define a single generic method:

```csharp
public void Print<T>(T value) { Console.WriteLine(value); }
```

This works with any type, making the code more flexible and maintainable.

**Generics in collections**

Generics are widely used in collections like `List<T>`:

```csharp
List<int> numbers = new List<int>(); // Type-safe
numbers.Add(5);  // Only allows ints
```

Without generics, older collections like `ArrayList` allowed mixed types, which could lead to runtime errors and slower program execution.

**Why do interviewers ask this?**

Generics are a core feature of C#. Interviewers want to see if you understand:

* How generics **improve code reuse**
* How they **prevent runtime errors** through type safety
* How to use them in **real-world scenarios** (e.g., collections, methods, and interfaces)

Knowing when and how to use generics makes you a better C# developer, especially when working with frameworks like ASP.NET Core, LINQ, and Entity Framework.

### 14. What is LINQ, and how does it work?

LINQ (Language Integrated Query) is a C# feature that simplifies data queries across different sources like collections, databases, and XML. Instead of writing loops and conditions manually, LINQ allows you to filter, sort, and transform data using a **more readable, functional, SQL-like syntax**.

Without LINQ, querying data often involves writing complex loops and conditions.

**For example**

Filtering even numbers from a list manually might look like this:

```csharp
List<int> numbers = new() { 1, 2, 3, 4, 5 };
List<int> evenNumbers = new();

foreach (var number in numbers)
{
    if (number % 2 == 0)
        evenNumbers.Add(number);
}
```

With LINQ, the same logic is **simpler and more expressive**:

```csharp
var evenNumbers = numbers.Where(n => n % 2 == 0).ToList();
```

Instead of iterating manually (imperative programming), LINQ applies the condition (functional programming) **to the collection** and returns the filtered results.

**How does LINQ work?**

LINQ provides a consistent query language across multiple data sources:

**LINQ to Objects:**

Queries in-memory collections like `List<T>` and `Array`

**LINQ to Entities:**

Queries databases using Entity Framework.

**LINQ to XML:**

Reads and manipulates XML documents.

It also supports common operations like filtering (`Where`), projection (`Select`), sorting (`OrderBy`), and grouping (`GroupBy`).

**Deferred Execution vs. Immediate Execution**

One key LINQ feature is **deferred execution**. Queries are not executed immediately but only when the data is actually needed.

```csharp
var query = numbers.Where(n => n > 2); // No filtering happens yet
var result = query.ToList(); // Now the filtering runs
```

This allows LINQ to **optimize execution**, especially when working with databases, reducing unnecessary processing.

**Why do interviewers ask this?**

Interviewers ask about LINQ to see if you understand how to query data efficiently and optimize performance. They want to know if you can avoid common pitfalls like excessive database queries and recognize when to use deferred execution for better efficiency.

### 15. What is the difference between IEnumerable, IQueryable, and List in C#?

In C#, `IEnumerable<T>`, `IQueryable<T>`, and `List<T>` are used to work with collections, but they behave differently in terms of execution, performance, and memory usage.

Choosing the right one can mean the difference between an optimized query and a performance bottleneck.

**What is `IEnumerable<T>`?**

`IEnumerable<T>` is best for iterating over in-memory collections. It does not modify how data is retrieved. It provides a way to loop through it one item at a time.

**For example**

If you use `IEnumerable<T>` with Entity Framework, filtering happens after data is loaded into memory:

```csharp
IEnumerable<int> nums = dbContext.Numbers.Where(n => n > 10); // Filters after loading data
```

This means the **entire dataset** is loaded first, and only then does filtering occur, making it inefficient for large datasets.

**What is `IQueryable<T>`?**

`IQueryable<T>` is used when querying databases because it allows filtering, sorting, and aggregation before data is loaded.

With `IQueryable<T>`, the filtering happens directly in the database:

```csharp
IQueryable<int> numsQuery = dbContext.Numbers.Where(n => n > 10); // Filters at the database level
```

Since the filtering is done at the database level, only the necessary data is retrieved, making it far more efficient for large datasets.

**What is `List<T>`?**

A `List<T>` is a concrete collection that stores all its data in memory. Unlike `IEnumerable<T>`, it allows fast indexing and modification.

**For example**

```csharp
List<int> numbers = new List<int> { 1, 2, 3, 4, 5 };
Console.WriteLine(numbers[2]); // Fast access to index 2
```

However, since `List<T>` loads all data at once, it’s best suited for small datasets where you need quick access to elements.

**When should you use each?**

Use `IEnumerable<T>` for in-memory collections where performance isn’t a concern. Otherwise use `IQueryable<T>` for database queries, ensuring filtering and sorting happen before data is retrieved.

Finally, use `List<T>` when you need fast indexing and modification, but keep in mind that it loads everything into memory

**Why do interviewers ask this?**

Interviewers ask this question to see if you understand how LINQ queries execute and how to choose the right type for performance optimization. They want to know if you recognize when in-memory operations are inefficient and how `IQueryable<T>` can improve database performance.

### 16. What are extension methods in C#?

Sometimes, you need to add functionality to an existing type but don’t have access to modify its source code.

In C#, extension methods allow you to add new methods to existing types without changing their original definition. They behave like instance methods but are actually static methods defined in a separate static class.

An extension method must be declared in a static class, and the first parameter must use the `this` keyword followed by the type being extended. This allows the method to appear as if it belongs to that type.

**For example**

Adding a `ToTitleCase()` method to strings:

```csharp
public static class StringExtensions
{
    public static string ToTitleCase(this string input)
    {
        return System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(input);
    }
}

// Usage:
string name = "hello world";
Console.WriteLine(name.ToTitleCase()); // Output: Hello World
```

Here, `ToTitleCase()` extends the functionality of the `string` class without modifying it directly.

Extension methods are widely used in LINQ, where methods like `Where()`, `Select()`, and `OrderBy()` extend `IEnumerable<T>`. They are also frequently used in ASP.NET Core for configuring middleware, services, and dependency injection.

They are useful when you want to enhance built-in .NET types or existing classes without modifying their source code. Instead of creating utility methods that require explicit method calls, extension methods provide a cleaner and more natural way to extend functionality.

**Why do interviewers ask this?**

Interviewers ask about extension methods to see if you understand how they work, why they are useful, and when they should be used. They also want to know if you recognize how LINQ and ASP.NET Core rely on them internally to provide fluent, readable syntax.

### 17. What is reflection in C#?

Reflection in C# allows a program to inspect and manipulate types, methods, and properties at runtime. It’s the .NET variant of metaprogramming. It’s useful when you need to work with objects dynamically without knowing their exact types at compile time.

**Common use cases of reflection**

* **Metadata inspection** – Getting information about assemblies, types, and members
* **Dynamic method invocation** – Calling methods without hardcoding their names
* **Creating objects at runtime** – Instantiating types dynamically
* **Serialization frameworks** – Used in JSON and XML serialization
* **Dependency injection and testing frameworks** – Used for automatic object creation

**For example**

Retrieving metadata about a type:

```csharp
Type type = typeof(string);
Console.WriteLine(type.FullName); // Outputs: System.String
```

Or when dynamically invoking a method using reflection:

```csharp
MethodInfo method = typeof(Console).GetMethod("WriteLine", new[] { typeof(string) });
method.Invoke(null, new object[] { "Hello, Reflection!" });
```

This finds the `WriteLine(string)` method in the `Console` class and invokes it dynamically.

**Performance considerations**

Reflection is slower than direct method calls because:

* It bypasses compile-time optimizations
* It uses late binding, which incurs additional overhead

Reflection should be used carefully to avoid performance issues, especially in high-frequency operations.

It's also worth understanding that Reflection has limited support in Native AOT compiled .NET applications. This is because Native AOT requires everything to be known at compile time; so dynamic reflection capabilities are restricted.

**Why do interviewers ask this?**

Interviewers want to see if you:

* Understand how C# **interacts with metadata dynamically**
* Know **when to use reflection** (e.g., for frameworks and testing) and **when to avoid it** due to performance concerns
* Can **apply reflection effectively** without overusing it in performance-critical code

### 18. What is boxing and unboxing in C#?

Boxing happens when a value type, such as an `int` or `double`, is converted into an object and stored on the heap. This allows value types to be used in places where an object is required, such as collections that store objects rather than primitives.

**For example**

```csharp
int num = 10;
object boxed = num; // Boxing (value → object)
```

Here, `num` is copied from the stack to the heap, and `boxed` now holds a reference to that value.

Unboxing is the reverse process - it extracts a value type from an object, converting it back to its original type. This requires explicit casting and retrieves the value from the heap back into a value type variable.

**For example**

```csharp
int unboxed = (int)boxed; // Unboxing (object → value)
```

If the object does not actually contain the expected type, an `InvalidCastException` will be thrown.

Boxing and unboxing introduce performance overhead because boxing moves data from the stack to the heap, increasing memory usage, while unboxing requires explicit casting, which adds extra processing time.

Frequent boxing can also lead to excessive garbage collection, slowing down performance.

To avoid unnecessary boxing and unboxing, generic collections should be used instead of non-generic collections like `ArrayList`, which store items as objects and require boxing. Keeping value types in their native form whenever possible also reduces unnecessary allocations.

**Why do interviewers ask this?**

Interviewers ask about boxing and unboxing to see if you understand how C# manages memory and performance. They want to know if you recognize the impact of excessive boxing and unboxing and how to use generics to prevent unnecessary conversions.

### 19. What is middleware in ASP.NET Core?

In ASP.NET Core, middleware is a set of components that process HTTP requests and responses as they pass through the application. Every request that enters an ASP.NET Core application goes through a middleware pipeline before reaching the final destination, such as a controller or an endpoint.

Middleware components can perform tasks like logging, authentication, authorization, exception handling, and request modification. Each component has the option to either process the request or pass it along to the next middleware in the pipeline.

**How does middleware work?**

Middleware is executed in the order it is registered in the `Program.cs` file. Each middleware can perform its task and then decide whether to pass the request further or terminate it early.

**For example**

Logging middleware might record request details before passing control to the next middleware:

```csharp
app.Use(async (context, next) =>
{
    Console.WriteLine($"Request: {context.Request.Path}");
    await next(); // Passes control to the next middleware
});
```

Here, `await next()` ensures that the request continues to the next middleware in the pipeline.

**How is middleware configured in ASP.NET Core?**

Middleware is registered in `Program.cs` using built-in or custom components.

Some common middleware includes:

`UseRouting()` for handling route mapping `UseAuthentication()` for user authentication `UseAuthorization()` for access control `UseExceptionHandler()` for centralized error handling

**For example**

This pipeline ensures proper routing and authentication before requests reach the controller:

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.Run();
```

The order of middleware matters because each component can modify the request or response before passing it further. Placing middleware incorrectly can lead to unexpected behavior.

**Why do interviewers ask this?**

Interviewers ask about middleware to see if you understand how the request pipeline works in ASP.NET Core. They want to know if you can properly configure middleware for authentication, logging, error handling, and request processing in an ASP.NET Core web application.

### 20. What are Minimal APIs in ASP.NET Core?

Minimal APIs are a simplified way to build HTTP APIs in ASP.NET Core without the overhead of the traditional controller-based MVC pattern. Introduced in .NET 6, they allow you to define endpoints directly in `Program.cs` with much less boilerplate code.

**For example**

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/products", () => new[] { "Product1", "Product2" });

app.Run();
```

**When should you use Minimal APIs over controllers?**

* Use **Minimal APIs** for lightweight services, microservices, or simple CRUD APIs where you want fast startup and minimal overhead
* Use **controllers** for larger applications where you need more structure, filters, and separation of concerns

Minimal APIs also support dependency injection, middleware, authentication, and model binding, so they are not just for simple use cases. They have become the default approach in many modern ASP.NET Core templates and are fully compatible with Native AOT compilation, which we cover in the Advanced section.

**Why do interviewers ask this?**

Minimal APIs are now a standard part of ASP.NET Core development, so interviewers want to see if you understand when to use them over the traditional controller pattern and whether you are familiar with modern ASP.NET Core conventions.

### 21. What is the difference between finalize and dispose in C#?

In C#, both `Finalize` and `Dispose` are used for cleaning up unmanaged resources like file handles, database connections, or network sockets. However, they work differently in terms of when and how they release resources.

`Dispose` is part of the `IDisposable` interface and allows manual resource cleanup. It should be called explicitly when you are done using an object.

```csharp
public class ResourceHandler : IDisposable
{
    public void Dispose()
    {
        Console.WriteLine("Dispose called - resources freed.");
        GC.SuppressFinalize(this);
    }
}

// Usage:
using (var handler = new ResourceHandler())
{
    // Use the resource
} // Dispose() is automatically called here
```

By calling `Dispose()`, developers ensure that resources are freed as soon as they are no longer needed, rather than waiting for garbage collection.

`Finalize`, on the other hand, is called implicitly by the garbage collector before an object is destroyed. It is defined using a `destructor`:

```csharp
class ResourceHandler
{
    ~ResourceHandler()
    {
        Console.WriteLine("Finalizer called by GC.");
    }
}
```

Because Finalize runs automatically, it should only be used as a backup cleanup method in case Dispose was not called. However, finalizers introduce performance overhead because the garbage collector must process them before reclaiming memory.

Objects that use `Dispose` should also call `GC.SuppressFinalize(this)` to prevent the garbage collector from running `Finalize` unnecessarily.

**Why do interviewers ask this?**

Interviewers ask about `Finalize` and `Dispose` to see if you understand how C# manages unmanaged resources. They want to know if you recognize the importance of calling `Dispose()` for deterministic cleanup and how to avoid unnecessary finalization overhead in garbage collection.

### 22. What are async streams, and how do they work?

async streams in C# allow asynchronous iteration over data sequences, making it easier to handle large datasets, real-time data processing, and streaming responses without blocking execution. They are useful when working with data that arrives gradually, such as reading from a database, consuming an API, or processing files.

Normally, an `IEnumerable<T>` collection loads all elements at once before iteration begins. With async streams, an `IAsyncEnumerable<T>` allows data to be fetched piece by piece, preventing memory overload and keeping the application responsive.

**How do async streams work?**

An async stream is defined using `IAsyncEnumerable<T>` and the `yield return` statement inside an `async` method.

```csharp
async IAsyncEnumerable<int> GenerateNumbers()
{
    for (int i = 1; i <= 5; i++)
    {
        await Task.Delay(1000); // Simulating delay
        yield return i;
    }
}
```

Instead of returning all values at once, this method yields each value asynchronously as it becomes available.

**For example**

To consume an async stream, use `await foreach`, which waits for each value without blocking execution.

```csharp
await foreach (var number in GenerateNumbers())
{
    Console.WriteLine(number);
}
```

This ensures that the application remains responsive while waiting for new data.

**Why use async streams?**

async streams are beneficial when working with large datasets or slow data sources, such as:

* Streaming data from an API without waiting for the full response
* Reading large files line by line without loading them entirely into memory
* Fetching paginated database records asynchronously to improve performance

**Why do interviewers ask this?**

Interviewers ask about async streams to see if you understand how to process large datasets efficiently. They want to know if you can implement `IAsyncEnumerable<T>`, use `await foreach`, and recognize when async streams improve performance compared to traditional collections.

## Advanced .NET Interview Questions

### 23. What are microservices, and how does .NET support them?

Microservices are an architectural approach where an application is built as a collection of small, independent services that communicate over a network. Each service is responsible for a specific capability, such as authentication, payments, or order processing, and can be developed, deployed, and scaled independently.

Compared to monolithic applications, microservices improve scalability and fault isolation, but they also introduce additional complexity around networking, deployment, and observability.

.NET provides strong support for building microservices through a combination of frameworks, tooling, and cloud-native integrations:

* **ASP.NET Core** is commonly used to build lightweight, high-performance APIs that act as individual microservices.
* **Docker** allows each microservice to run in its own container, ensuring consistency across environments.
* **Kubernetes** manages container orchestration, handling service discovery, scaling, deployment, and resiliency.
* **gRPC** enables efficient, high-performance communication between services using a binary protocol.
* **Message brokers** such as RabbitMQ, Azure Service Bus, and Kafka support event-driven communication between services.

Modern .NET also includes **.NET Aspire**, which provides higher-level tooling for building, configuring, and running distributed applications. Aspire helps manage service discovery, configuration, and observability, reducing the setup overhead that traditionally comes with microservices.

**For example**

A microservice built using ASP.NET Core might expose a REST API:

```csharp
[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    [HttpGet]
    public IEnumerable<string> Get() => new[] { "Product1", "Product2" };
}
```

Each microservice can be deployed and scaled independently based on demand.

**Why do interviewers ask this?**

Interviewers ask this question to see if you understand both the **benefits and tradeoffs** of microservices.

They want to know if you can design distributed systems using modern .NET tools, choose appropriate communication patterns, and understand how containers, orchestration, and cloud-native tooling fit into real-world architectures.

### 24. What are design patterns in .NET?

Design patterns are reusable solutions to common software design problems. Instead of reinventing solutions for recurring issues, developers use established design patterns to create more structured, maintainable, and scalable applications.

These patterns help improve code organization, reduce complexity, and make it easier to modify or extend functionality.

Design patterns in .NET follow standard object-oriented principles and are divided into three main categories:

**Creational Patterns for handling object creation efficiently**

* **Singleton** ensures only one instance of a class exists throughout an application.
* **Factory Method** provides a way to create objects without specifying their concrete type.
* **Builder** constructs complex objects step by step, improving code readability.

**For example**

Here we can see the Singleton pattern:

```csharp
public class Singleton
{
    private static readonly Singleton _instance = new Singleton();
    private Singleton() { }
    public static Singleton Instance => _instance;
}
```

This ensures that only one instance of `Singleton` can exist.

**Structural Patterns for organizing relationships between objects**

* **Adapter** allows incompatible interfaces to work together
* **Decorator** adds behavior dynamically to an object without modifying its structure
* **Facade** provides a simplified interface to a more complex system

**For example**

Here we can see the Adapter pattern:

```csharp
public interface ITarget
{
    void Request();
}

public class Adaptee
{
    public void SpecificRequest() => Console.WriteLine("Called SpecificRequest");
}

public class Adapter : ITarget
{
    private readonly Adaptee _adaptee;
    public Adapter(Adaptee adaptee) { _adaptee = adaptee; }
    public void Request() => _adaptee.SpecificRequest();
}
```

Here, `Adapter` bridges the gap between `Adaptee` and `ITarget`, allowing incompatible interfaces to communicate.

**Behavioral Patterns for managing object interactions**

* **Observer** enables one-to-many dependency, where changes in one object update dependent objects (publish/subscribe)
* **Strategy** allows selecting an algorithm dynamically at runtime
* **Command** encapsulates requests as objects, allowing deferred execution

**For example**

Here you can see the Strategy pattern:

```csharp
public interface IStrategy
{
    void Execute();
}

public class ConcreteStrategyA : IStrategy
{
    public void Execute() => Console.WriteLine("Executing Strategy A");
}

public class Context
{
    private IStrategy _strategy;
    public Context(IStrategy strategy) { _strategy = strategy; }
    public void ExecuteStrategy() => _strategy.Execute();
}
```

Here, the strategy can be swapped dynamically, improving flexibility.

**Why do interviewers ask this?**

Interviewers ask about design patterns to see if you can write maintainable, scalable code using established best practices. They want to know if you understand when and how to use patterns like Singleton, Factory, Adapter, and Strategy to improve code structure and flexibility.

### 25. What is the difference between Task and Thread in C#?

**What is a Thread?**

A `Thread` is like an independent worker because it runs its own execution flow separate from the main program.

That means if you need fine-grained control over execution, such as manual thread management, synchronization, or priority adjustments, using `Thread` directly might be necessary.

**For example**

Here’s how you create and start a thread in C#:

```csharp
Thread thread = new Thread(() => Console.WriteLine("Running in a thread"));
thread.Start();
```

Now, while this works, manually creating and managing multiple threads can be inefficient. This is because each thread consumes system resources, and handling synchronization manually can lead to race conditions or deadlocks if not carefully managed.

**What is a Task?**

A `Task` is a more flexible and efficient way to handle concurrency in C#.

Unlike `Thread` though, a `Task` automatically uses the thread pool, reducing overhead when dealing with multiple operations. It integrates seamlessly with `async` and `await`, making it the preferred choice for short-lived, scalable asynchronous operations.

**For example**

When creating a `Task`:

```csharp
Task.Run(() => Console.WriteLine("Running in a task"));
```

Here, the Task Parallel Library assigns the operation to an available thread pool thread, rather than creating a new thread manually.

**When should you use each?**

Use `Threads` when you need long-running, dedicated background operations that require direct control. Or use `Tasks` when dealing with asynchronous operations, such as I/O-bound workloads (file operations, database queries, web requests)

**Why do interviewers ask this?**

Interviewers ask about the difference between `Task` and `Thread` to see if you understand how C# handles concurrency and parallelism.

This is because they want to know if you can choose the right approach for performance and scalability i.e. using `Task` for asynchronous operations and avoiding unnecessary manual thread management.

### 26. How do you optimize performance in a .NET application?

Performance optimization in .NET ensures that applications run efficiently by reducing resource consumption, improving execution speed, and maintaining scalability.

Optimizing performance involves managing memory effectively, reducing database overhead, and leveraging asynchronous programming.

**Optimize memory usage**

Excessive object creation can trigger frequent garbage collection, slowing down an application.

To minimize this you can use `struct` instead of `class` for small, frequently used data types, as structs are stored on the stack rather than the heap. These reduce unnecessary allocations and object instantiations.

Or you can use `Span<T>` and `Memory<T>` for handling large data sets efficiently without additional allocations

**Use asynchronous programming**

Blocking operations can degrade performance, especially in web applications. Using `async` and `await` allows tasks like database queries and API calls to run in the background without blocking the main thread.

**For example**

An asynchronous database query:

```csharp
public async Task<User> GetUserAsync(int id)
{
    return await dbContext.Users.FindAsync(id);
}
```

This keeps the application responsive while waiting for the query to complete.

**Optimize database queries**

Database interactions are often a performance bottleneck.

So to improve efficiency you can use `AsNoTracking()` in Entity Framework for read-only queries to avoid unnecessary change tracking. You can also fetch only required columns instead of retrieving entire objects, and use `indexes` to speed up query execution

**For example**

Here you can see an optimized query:

```csharp
var names = dbContext.Users.Select(u => u.Name).ToList();
```

This retrieves only the `Name` field instead of loading full user objects.

**Implement caching**

Caching reduces redundant database queries and improves response times. Using `MemoryCache` or `HybridCache` (newly introduced in .NET 9) for in-memory caching or Redis for distributed caching can speed up frequently accessed operations.

```csharp
var cache = new MemoryCache(new MemoryCacheOptions());
cache.Set("key", expensiveDatabaseQueryResult, TimeSpan.FromMinutes(10));
```

This stores the result for 10 minutes, preventing repeated database queries.

**Minimize LINQ Overhead**

LINQ is powerful but can introduce performance overhead. When working with small in-memory collections, using `foreach` instead of LINQ can reduce unnecessary processing.

This avoids the additional overhead of `Where()` and `Select()` when filtering small collections.

**Why do interviewers ask this?**

Interviewers ask about performance optimization to see if you can identify bottlenecks and apply the right techniques to improve execution speed.

They want to know if you understand how to optimize memory usage, database interactions, and asynchronous processing to build scalable, high-performance .NET applications.

### 27. What is the role of `Span<T>` and `Memory<T>` in .NET?

Handling large amounts of data efficiently is crucial for high-performance applications. In .NET, `Span<T>` and `Memory<T>` are designed to work with contiguous memory blocks while avoiding unnecessary allocations and reducing garbage collection overhead.

**What is `Span<T>`?**

`Span<T>` is a stack-allocated type that represents a contiguous block of memory. It is lightweight and does not allocate memory on the heap, making it ideal for high-performance scenarios like processing arrays, buffers, and slices of data.

Unlike traditional arrays or lists, `Span<T>` can reference a portion of an existing array without copying data, making operations more efficient.

**For example**

Here we can see `Span<T>` slicing an array:

```csharp
int[] numbers = { 1, 2, 3, 4, 5 };
Span<int> span = numbers.AsSpan(1, 3); // References {2, 3, 4}
```

Here, `span` does not create a new array but instead references a portion of `numbers`, reducing memory usage.

Since `Span<T>` lives on the stack, it cannot be used in asynchronous methods, because stack memory is not preserved across `await` calls. This is why for `async` operations, `Memory<T>` is used instead.

**What is `Memory<T>`?**

`Memory<T>` provides similar functionality to `Span<T>` but supports heap allocation and can be used in asynchronous methods. It enables memory-efficient data manipulation while allowing the referenced memory to be stored on the heap rather than the stack.

**For example**

```csharp
Memory<int> memory = new int[] { 1, 2, 3, 4, 5 };
Memory<int> slice = memory.Slice(1, 3); // References {2, 3, 4}
```

This behaves similarly to `Span<T>` but can be stored for later use and passed across async boundaries.

**When should you use `Span<T>` vs. `Memory<T>`?**

Use `Span<T>` for synchronous operations that require low memory overhead and fast access. Or use `Memory<T>` when working with asynchronous code where data needs to persist beyond a single method scope.

**Why do interviewers ask this?**

Interviewers ask about `Span<T>` and `Memory<T>` to see if you understand modern memory management techniques in .NET. They want to know if you can optimize performance by reducing allocations and improving efficiency when working with large datasets or performance-critical applications.

### 28. What is a Native AOT compilation in .NET?

Native AOT (Ahead-of-Time) compilation is a way to compile a .NET application into a self-contained native executable before it runs, rather than relying on the Just-In-Time (JIT) compiler to translate code at runtime.

This is the opposite of how .NET traditionally works. Normally, code is compiled to CIL and then the JIT compiler translates it to machine code at runtime. With Native AOT, that translation happens at build time instead.

The main benefits are:

* **Faster startup time.** Since code is already compiled to native machine code, there is no JIT warmup time
* **Lower memory usage.** No JIT compiler infrastructure is needed at runtime
* **Smaller deployment size.** Applications can be packaged as a single native executable
* **Better performance predictability.** No runtime compilation spikes

**For example**

```xml
<!-- In your .csproj file, enabling Native AOT is as simple as: -->
<PropertyGroup>
    <PublishAot>true</PublishAot>
</PropertyGroup>
```

**What are the tradeoffs?**

Native AOT comes with some important limitations. Because everything must be known at compile time, dynamic features like reflection are only partially supported. This can cause issues with libraries that rely heavily on runtime type inspection, such as some serialisation frameworks.

It is best suited for:

* Microservices and cloud-native applications where fast startup and low memory usage matter
* Serverless functions where cold start time is critical
* Command-line tools and lightweight APIs

**Why do interviewers ask this?**

Native AOT has become an increasingly important topic as .NET has pushed further into cloud-native and microservices development. Interviewers want to see if you understand the tradeoffs between JIT and AOT compilation and can identify the right scenarios to use each approach.

### 29. How does authentication and authorization work in .NET?

In .NET, authentication and authorization are used to control user access to different parts of an application. Authentication verifies a user's identity, while authorization determines what the user is allowed to do.

**Authentication: Verifying the user’s identity**

Authentication is the process of determining who the user is. .NET supports multiple authentication methods, including JWT (JSON Web Tokens), OAuth, OpenID Connect, and cookie-based authentication.

**For example**

Imagine we’re configuring JWT authentication in `Program.cs`:

```csharp
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://your-identity-provider.com";
        options.Audience = "your-api";
    });
```

Here, the application validates JWT tokens issued by an external identity provider before allowing access to protected resources.

**Authorization: Controlling access**

Once a user is authenticated, authorization determines what they can do. .NET provides role-based authorization (RBAC) and policy-based authorization to restrict access based on user roles or custom conditions.

**For example**

For role-based authorization, you can restrict access to specific roles using the `[Authorize]` attribute:

```csharp
[Authorize(Roles = "Admin")]
public IActionResult SecureEndpoint() => Ok("Only admins can access this.");
```

This ensures that only users with the Admin role can access the `SecureEndpoint` method.

**For example**

For more granular control, policy-based authorization allows defining custom authorization rules:

```csharp
services.AddAuthorization(options =>
{
    options.AddPolicy("MustBeOver18", policy =>
        policy.RequireClaim("Age", "18+"));
});
```

This policy requires users to have an `Age` claim of `18+` to access certain resources.

**How Authentication and Authorization work together**

1. A user logs in, and the authentication system verifies their identity
2. If valid, the system issues an authentication token (e.g., JWT)
3. The user attempts to access a protected resource
4. The authorization system checks if they have permission based on roles or policies

If either authentication or authorization fails, access is denied.

**Why do interviewers ask this?**

Interviewers ask about authentication and authorization to see if you understand how to secure applications in .NET. They want to know if you can implement authentication providers like JWT and configure authorization rules to protect sensitive resources.

### 30. What are value tasks in C#?

In C#, `ValueTask<T>` is an alternative to `Task<T>` designed to reduce memory allocations and improve performance in high-throughput asynchronous applications. It is particularly useful when a result may already be available and does not require creating a new task object.

**How does `ValueTask<T>` work?**

A `Task<T>` always creates an object on the heap, even if the operation completes synchronously. In contrast, `ValueTask<T>` can avoid unnecessary allocations when the result is immediately available.

**For example**

When using `Task<T>`:

```csharp
public async Task<int> GetValueAsync()
{
    return await Task.FromResult(42); // Always allocates memory
}
```

This creates a new `Task<int>` even though the result is already known.

**For example**

Now, using `ValueTask<T>`:

```csharp
public ValueTask<int> GetValueAsync()
{
    return new ValueTask<int>(42); // No extra allocation
}
```

This avoids heap allocation when the value is already available. However, if the method needs to perform an actual asynchronous operation, it can still return a `ValueTask<T>` that awaits a `Task<T>`.

**When should you use `ValueTask<T>` instead of `Task<T>`?**

Use `ValueTask<T>` when a result is often available immediately, reducing the need for heap allocations. Otherwise use `Task<T>` for long-running async operations that always require background execution

**Sidenote:**

`ValueTask<T>` is useful in performance-critical applications, such as database caching or low-latency services, but it should not be overused. However, unlike `Task<T>`, a `ValueTask<T>` should not be awaited multiple times, as it does not guarantee the same behavior on repeated awaits.

**Why do interviewers ask this?**

Interviewers ask about `ValueTask<T>` to see if you understand how to optimize asynchronous programming in C#. They want to know if you can use it correctly to improve performance while avoiding unnecessary memory allocations.

### 31. How does async/await work under the hood?

In C#, `async/await` transforms asynchronous methods into state machines that handle execution flow automatically.

While it makes asynchronous code easier to read and write, the compiler generates additional logic behind the scenes to track method progress and resume execution when awaited tasks complete.

**How does the compiler transform async methods?**

When you define an `async` method, the compiler does not execute it immediately. Instead, it generates a state machine that keeps track of execution progress. This splits the method into multiple parts, pausing execution at `await`.

This then registers a continuation that tells the method where to resume when the awaited task completes.

**For example**

Consider this simple `async` method:

```csharp
public async Task<int> FetchDataAsync()
{
    await Task.Delay(1000);
    return 42;
}
```

At compile time, C# transforms this into something similar to:

```csharp
public Task<int> FetchDataAsync()
{
    var stateMachine = new FetchDataStateMachine();
    stateMachine.MoveNext(); // Starts execution
    return stateMachine.Task;
}
```

The state machine runs the method step by step, pausing at `await Task.Delay(1000)`, returning control to the caller, and resuming execution when the task completes.

**Does async/await create new threads?**

No, `async/await` does not create new threads by itself. Instead, it schedules tasks asynchronously and resumes execution when ready.

This means that `Task.Run()` can be used to run tasks on background threads when needed, but `async` methods themselves do not automatically spawn new threads.

**What happens when you use await?**

When execution reaches an `await` statement, the following happens:

1. Execution pauses and returns control to the caller
2. The remaining method logic is saved as a continuation
3. When the awaited task completes, the continuation is scheduled to run

**For example**

In UI applications, if the `SynchronizationContext` is present (like in ASP.NET or WPF), the method resumes execution on the original context (e.g., the UI thread). Otherwise, it runs on a thread pool thread.

**Common pitfalls and performance concerns**

`async/await` simplifies asynchronous programming, but improper usage can lead to performance issues.

Blocking calls such as `.Result`, or `.Wait()` force async methods to run synchronously, potentially causing deadlocks. While excessive task creation can unnecessarily wrap synchronous code in `Task.Run()` can cause extra thread switching.

Finally, failing to use `ConfigureAwait(false)` in libraries can cause unnecessary thread context switches, slowing execution

**Why do interviewers ask this?**

Interviewers ask about how `async/await` works under the hood to see if you understand how C# manages asynchronous execution.

They also want to know if you can explain state machines, continuations, and if you understand why `async/await` does not create new threads but instead schedules tasks efficiently.

### 32. What are some best practices for working with Entity Framework Core?

Entity Framework Core (EF Core) is a powerful object-relational mapper (ORM) that simplifies database access in .NET applications.

However, inefficient use can lead to performance bottlenecks, security risks, and maintainability issues. Following best practices ensures that applications run efficiently and scale well.

**Use AsNoTracking() for Read-Only Queries**

By default, EF Core tracks changes to entities, which adds overhead. For read-only queries, `AsNoTracking()` improves performance by disabling change tracking.

```csharp
var users = dbContext.Users.AsNoTracking().ToList();
```

This is especially useful for reporting or data retrieval scenarios where tracking changes is unnecessary.

**Optimize Queries with Projection**

Fetching only required fields instead of entire entities reduces data transfer and improves performance.

```csharp
var names = dbContext.Users.Select(u => u.Name).ToList();
```

Instead of retrieving full user objects, this query loads only the `Name` field, reducing memory usage.

**Avoid Lazy Loading in Performance-Sensitive Applications**

Lazy loading automatically fetches related entities when accessed, but it can lead to the N+1 query problem, causing multiple small queries instead of a single optimized one.

Use eager loading (`Include()`) or explicit loading when needed.

```csharp
var users = dbContext.Users.Include(u => u.Orders).ToList();
```

This fetches users and their related orders in one query rather than multiple.

**Use Transactions for Multiple Operations**

When modifying multiple records, transactions ensure data consistency and prevent partial updates.

```csharp
using var transaction = dbContext.Database.BeginTransaction();
try
{
    dbContext.Users.Add(new User { Name = "John" });
    dbContext.SaveChanges();
    transaction.Commit();
}
catch
{
    transaction.Rollback();
}
```

Transactions help maintain data integrity in cases where multiple database operations depend on each other.

**Leverage Connection Pooling and Indexing**

Using a connection pool reduces the overhead of repeatedly opening and closing database connections. Proper indexing improves query performance by speeding up lookups.

```csharp
services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connectionString, sqlOptions =>
        sqlOptions.EnableRetryOnFailure()));
```

Here, `EnableRetryOnFailure()` helps manage transient failures in cloud-based databases.

**Why do interviewers ask this?**

Interviewers ask about EF Core best practices to see if you understand common pitfalls and how to optimize database queries. They want to know if you can balance performance, security, and maintainability when working with relational databases.
