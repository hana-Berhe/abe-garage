-- BE-002: faster dashboard and order lists (money taken by paid date; orders by status, newest first).
ALTER TABLE orders
  ADD KEY ix_orders_paid_at (paid_at),
  ADD KEY ix_orders_status_created (status, created_at);
