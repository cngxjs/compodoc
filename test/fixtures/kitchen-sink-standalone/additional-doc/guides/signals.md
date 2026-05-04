# Signals & Reactivity

Angular signals provide fine-grained reactivity without RxJS.

## Signal Types

| API | Purpose | Example |
|-|-|-|
| `signal()` | Writable state | `signal(0)` |
| `computed()` | Derived state | `computed(() => count() * 2)` |
| `effect()` | Side effects | `effect(() => console.log(count()))` |
| `linkedSignal()` | Reset on source change | `linkedSignal(() => source())` |
| `input()` | Component input | `input<string>('')` |
| `input.required()` | Required input | `input.required<string>()` |
| `output()` | Component output | `output<MouseEvent>()` |
| `model()` | Two-way binding | `model(false)` |
| `model.required()` | Required two-way | `model.required<number>()` |
| `viewChild()` | View query | `viewChild<ElementRef>('ref')` |
| `viewChildren()` | View query list | `viewChildren<ElementRef>('ref')` |
| `contentChild()` | Content query | `contentChild<TemplateRef>('slot')` |
| `contentChildren()` | Content query list | `contentChildren<TemplateRef>('slot')` |

## Writable Signals

```typescript
const count = signal(0);

// Read
console.log(count()); // 0

// Set
count.set(5);

// Update
count.update(c => c + 1);
```

## Computed Signals

```typescript
const firstName = signal('John');
const lastName = signal('Doe');
const fullName = computed(() => `${firstName()} ${lastName()}`);
```

> Computed signals are lazy and cached — they only recompute when their dependencies change.

## Effects

```typescript
effect(() => {
    // Runs whenever any signal read inside changes
    document.title = `Count: ${count()}`;
});
```

## LinkedSignal

Resets to a new value whenever its source changes:

```typescript
const source = signal('initial');
const linked = linkedSignal(() => source());

source.set('updated'); // linked() resets to 'updated'
```

## Signal Inputs vs Decorator Inputs

| Feature | `@Input()` | `input()` |
|-|-|-|
| Reactive | No | Yes |
| Required | `@Input({ required: true })` | `input.required()` |
| Transform | `@Input({ transform })` | `input({ transform })` |
| Alias | `@Input('alias')` | `input({ alias: 'alias' })` |
| Default | `@Input() x = 'default'` | `input('default')` |
| Type safety | Manual | Inferred |
