# Contributing Guide

Thank you for your interest in contributing to the Room Service App!

## Development Setup

1. Fork the repository
2. Clone your fork
3. Follow the [Development Setup](../README.md#development-setup-without-docker)
4. Create a branch: `git checkout -b feature/my-feature`

## Code Style

### JavaScript/React

- Use functional components
- Use hooks (useState, useEffect, etc.)
- Destructure props
- Use semantic HTML

Example:
```jsx
export default function MyComponent({ title, onClick }) {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={onClick}>
      {title}: {count}
    </button>
  );
}
```

### CSS/Styling

- Use inline styles (current pattern)
- Follow existing style object pattern
- Use consistent color palette

## Commit Messages

Follow conventional commits:

```
feat: add breakfast menu category
fix: resolve cart persistence issue
docs: update API documentation
refactor: simplify checkout flow
test: add order validation tests
```

## Pull Request Process

1. Update documentation for any new features
2. Add translations for new UI text
3. Ensure menu.json is synchronized (client and server)
4. Test both English and Spanish versions
5. Submit PR with clear description

## Testing

### Manual Testing Checklist

- [ ] Menu displays correctly in both languages
- [ ] Items can be added to cart
- [ ] Cart persists on refresh
- [ ] Currency toggle works
- [ ] Checkout flow completes
- [ ] Order appears in database

### Test Data

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`

## Questions?

Open an issue for discussion before major changes.
