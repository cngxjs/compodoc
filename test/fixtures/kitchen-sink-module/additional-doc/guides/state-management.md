# State Management Guide

The application uses a simple store pattern based on RxJS `BehaviorSubject`.

## TodoStore API

### Methods Summary

| Method | Parameters | Returns | Description |
|-|-|-|-|
| `getAll()` | — | `Todo[]` | Get all todos |
| `getById(id)` | `id: string` | `Todo \| undefined` | Find a single todo |
| `add(todo)` | `todo: Todo` | `Todo` | Add a new todo |
| `update(id, changes)` | `id: string, changes: Partial<Todo>` | `Todo \| undefined` | Update a todo |
| `remove(id)` | `id: string` | `boolean` | Remove a todo |
| `filter(filter)` | `filter: TodoFilter` | `Todo[]` | Filter todos |
| `sort(sort)` | `sort: TodoSort` | `Todo[]` | Sort todos |
| `getStats()` | — | `TodoStats` | Get statistics |
| `batchUpdate(ids, changes)` | `ids: string[], changes: Partial<Todo>` | `BatchResult` | Batch update |

### Observables

| Observable | Type | Description |
|-|-|-|
| `todos$` | `Observable<Todo[]>` | Stream of all todos |
| `count$` | `Observable<number>` | Stream of todo count |

## Usage Examples

### Basic CRUD

```typescript
@Component({...})
export class TodoPageComponent implements OnInit {
    constructor(private store: TodoStore) {}

    ngOnInit() {
        // Add
        this.store.add({
            id: 'todo-1',
            title: 'Buy groceries',
            completed: false,
            priority: TodoPriority.Medium,
            tags: ['shopping'],
        });

        // Update
        this.store.update('todo-1', { completed: true });

        // Remove
        this.store.remove('todo-1');
    }
}
```

### Filtering & Sorting

```typescript
// Filter by priority
const highPriority = this.store.filter({
    priority: TodoPriority.High,
    completed: false,
});

// Sort by due date
const sorted = this.store.sort({
    field: 'dueDate',
    direction: 'asc',
});
```

### Reactive Subscriptions

```typescript
this.store.todos$.pipe(
    map(todos => todos.filter(t => !t.completed)),
    takeUntilDestroyed(),
).subscribe(remaining => {
    this.remainingCount = remaining.length;
});
```

## Persistence

The store automatically persists to `localStorage` under the key `kitchen-sink-todos`.

### Data Format

```json
[
    {
        "id": "abc-123",
        "title": "Example todo",
        "completed": false,
        "priority": "medium",
        "tags": ["work"],
        "dueDate": "2024-12-31T00:00:00.000Z"
    }
]
```

## Performance Considerations

- The store creates a **new array** on every mutation (immutability)
- Use `filter()` for derived views instead of storing filtered arrays
- `batchUpdate()` emits only **once** after all changes are applied
