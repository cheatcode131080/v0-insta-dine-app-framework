# Supabase Edge Functions

## create-order

Creates a new order from the customer QR menu experience.

### Deployment

```bash
supabase functions deploy create-order
```

### Testing Locally

```bash
supabase functions serve create-order
```

### Request Format

```json
{
  "company_code": "restaurant-slug",
  "table_id": "uuid",
  "items": [
    {
      "menu_item_id": "uuid",
      "title": "Item Name",
      "description": "Item description",
      "image_url": "https://...",
      "qty": 2,
      "notes": "No onions"
    }
  ],
  "customer_note": "Optional order-level note"
}
```

### Response Format

```json
{
  "order_id": "uuid",
  "created_at": "2025-01-01T12:00:00Z"
}
```

### Error Responses

- 400: Missing fields, invalid data, or abuse protection triggered
- 404: Invalid company code or table
- 500: Server error
